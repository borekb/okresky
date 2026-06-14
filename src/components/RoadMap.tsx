import { useEffect, useMemo, useRef, useState } from 'react';

import type { Road } from '@/routes/index';

type MapLibreModule = typeof import('maplibre-gl');
type MapLibreMap = import('maplibre-gl').Map;
type GeoJSONSource = import('maplibre-gl').GeoJSONSource;
type MapLayerMouseEvent = import('maplibre-gl').MapLayerMouseEvent;
type StyleSpecification = import('maplibre-gl').StyleSpecification;

const PARDUBICE: [number, number] = [50.0343, 15.7812];
const ROAD_SOURCE_ID = 'roads';
const ROAD_OUTLINE_LAYER_ID = 'road-outlines';
const ROAD_SOLID_LAYER_ID = 'road-segments';
const ROAD_DASHED_LAYER_ID = 'road-segments-estimated';
const INTERACTIVE_ROAD_LAYERS = [ROAD_SOLID_LAYER_ID, ROAD_DASHED_LAYER_ID] as const;

const RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#dbe2da',
      },
    },
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
};

interface RoadGeometry {
  source: string;
  quality: string;
  osmRef: string;
  wayIds: number[];
  nearestDistanceMeters: number;
  lengthMeters: number;
  geometry: [number, number][][];
}

interface RoadFeatureProperties {
  color: string;
  completionYear: number;
  hasGeometry: boolean;
  road: string;
  roadId: string;
  selected: boolean;
  title: string;
}

interface RoadFeature {
  type: 'Feature';
  properties: RoadFeatureProperties;
  geometry:
    | {
        type: 'LineString';
        coordinates: [number, number][];
      }
    | {
        type: 'MultiLineString';
        coordinates: [number, number][][];
      };
}

interface RoadFeatureCollection {
  type: 'FeatureCollection';
  features: RoadFeature[];
}

export function RoadMap({
  roads,
  roadGeometries,
  yearRange,
  selectedRoadId,
  onSelectRoad,
}: {
  roads: Road[];
  roadGeometries: Record<string, RoadGeometry>;
  yearRange: { min: number; max: number };
  selectedRoadId: string | null;
  onSelectRoad: (roadId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const maplibreRef = useRef<MapLibreModule | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectRoadRef = useRef(onSelectRoad);
  const previousSelectedRoadIdRef = useRef<string | null>(selectedRoadId);
  const [mapReady, setMapReady] = useState(false);

  const roadFeatureCollection = useMemo(
    () => buildRoadFeatureCollection(roads, roadGeometries, yearRange, selectedRoadId),
    [roads, roadGeometries, selectedRoadId, yearRange],
  );

  useEffect(() => {
    onSelectRoadRef.current = onSelectRoad;
  }, [onSelectRoad]);

  useEffect(() => {
    let disposed = false;

    async function setupMap() {
      if (!containerRef.current || mapRef.current) return;

      const maplibregl = await import('maplibre-gl');
      if (disposed || !containerRef.current) return;

      maplibreRef.current = maplibregl;

      const map = new maplibregl.Map({
        attributionControl: false,
        center: [PARDUBICE[1], PARDUBICE[0]],
        container: containerRef.current,
        maxZoom: 19,
        style: RASTER_STYLE,
        zoom: 8,
      });

      map.scrollZoom.setZoomRate(1 / 25);
      map.scrollZoom.setWheelZoomRate(1 / 300);
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

      const handleRoadClick = (event: MapLayerMouseEvent) => {
        const roadId = event.features?.[0]?.properties?.roadId;
        if (typeof roadId === 'string') {
          onSelectRoadRef.current(roadId);
        }
      };
      const handleRoadMouseEnter = () => {
        map.getCanvas().style.cursor = 'pointer';
      };
      const handleRoadMouseLeave = () => {
        map.getCanvas().style.cursor = '';
      };

      map.on('load', () => {
        if (disposed) return;

        addRoadLayers(map, roadFeatureCollection);

        for (const layerId of INTERACTIVE_ROAD_LAYERS) {
          map.on('click', layerId, handleRoadClick);
          map.on('mouseenter', layerId, handleRoadMouseEnter);
          map.on('mouseleave', layerId, handleRoadMouseLeave);
        }

        fitRoads(maplibregl, map, roadFeatureCollection);
        setMapReady(true);
      });

      mapRef.current = map;
    }

    setupMap();

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const source = map.getSource(ROAD_SOURCE_ID);
    if (!source) return;

    (source as GeoJSONSource).setData(roadFeatureCollection);
  }, [mapReady, roadFeatureCollection]);

  useEffect(() => {
    const maplibregl = maplibreRef.current;
    const map = mapRef.current;
    if (!mapReady || !maplibregl || !map) return;

    const previousSelectedRoadId = previousSelectedRoadIdRef.current;
    previousSelectedRoadIdRef.current = selectedRoadId;
    if (selectedRoadId) return;

    fitRoads(maplibregl, map, roadFeatureCollection, { animate: Boolean(previousSelectedRoadId) });
  }, [mapReady, roadFeatureCollection, selectedRoadId]);

  useEffect(() => {
    const maplibregl = maplibreRef.current;
    const map = mapRef.current;
    if (!mapReady || !maplibregl || !map || !selectedRoadId) return;

    const selectedFeature = roadFeatureCollection.features.find((feature) => feature.properties.roadId === selectedRoadId);
    if (!selectedFeature) return;

    flyToRoad(maplibregl, map, selectedFeature);
  }, [mapReady, roadFeatureCollection, selectedRoadId]);

  return <div ref={containerRef} className="map-canvas" aria-label="Mapa rekonstruovaných silnic" />;
}

function addRoadLayers(map: MapLibreMap, data: RoadFeatureCollection) {
  map.addSource(ROAD_SOURCE_ID, {
    type: 'geojson',
    data,
  });

  map.addLayer({
    id: ROAD_OUTLINE_LAYER_ID,
    type: 'line',
    source: ROAD_SOURCE_ID,
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': ['case', ['boolean', ['get', 'selected'], false], '#0f172a', '#ffffff'],
      'line-opacity': ['case', ['boolean', ['get', 'selected'], false], 0.92, 0.82],
      'line-width': ['case', ['boolean', ['get', 'selected'], false], 12, 9],
    },
  });

  map.addLayer({
    id: ROAD_SOLID_LAYER_ID,
    type: 'line',
    source: ROAD_SOURCE_ID,
    filter: ['==', ['get', 'hasGeometry'], true],
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': ['get', 'color'],
      'line-opacity': ['case', ['boolean', ['get', 'selected'], false], 1, 0.86],
      'line-width': ['case', ['boolean', ['get', 'selected'], false], 7, 5],
    },
  });

  map.addLayer({
    id: ROAD_DASHED_LAYER_ID,
    type: 'line',
    source: ROAD_SOURCE_ID,
    filter: ['==', ['get', 'hasGeometry'], false],
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': ['get', 'color'],
      'line-dasharray': [1.2, 1.6],
      'line-opacity': ['case', ['boolean', ['get', 'selected'], false], 1, 0.86],
      'line-width': ['case', ['boolean', ['get', 'selected'], false], 7, 5],
    },
  });
}

function buildRoadFeatureCollection(
  roads: Road[],
  roadGeometries: Record<string, RoadGeometry>,
  yearRange: { min: number; max: number },
  selectedRoadId: string | null,
): RoadFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: roads.map((road) => {
      const roadGeometry = roadGeometries[road.id];
      const paths = roadGeometry?.geometry ?? [estimatedSegmentPath(road)];
      const coordinates = paths.map((path) => path.map(([lat, lon]) => [lon, lat] as [number, number]));

      return {
        type: 'Feature',
        properties: {
          color: yearColor(road.completionYear, yearRange),
          completionYear: road.completionYear,
          hasGeometry: Boolean(roadGeometry),
          road: road.road,
          roadId: road.id,
          selected: road.id === selectedRoadId,
          title: road.title,
        },
        geometry:
          coordinates.length === 1
            ? {
                type: 'LineString',
                coordinates: coordinates[0] ?? [],
              }
            : {
                type: 'MultiLineString',
                coordinates,
              },
      };
    }),
  };
}

function fitRoads(
  maplibregl: MapLibreModule,
  map: MapLibreMap,
  roadFeatures: RoadFeatureCollection,
  options: { animate?: boolean } = {},
) {
  const bounds = roadBounds(maplibregl, roadFeatures.features);
  if (!bounds) {
    if (options.animate) {
      map.easeTo({ center: [PARDUBICE[1], PARDUBICE[0]], duration: 650, zoom: 8 });
    } else {
      map.jumpTo({ center: [PARDUBICE[1], PARDUBICE[0]], zoom: 8 });
    }
    return;
  }

  map.fitBounds(bounds, {
    animate: options.animate ?? false,
    duration: options.animate ? 650 : 0,
    maxZoom: roadFeatures.features.length === 1 ? 12 : 11,
    padding: 72,
  });
}

function flyToRoad(maplibregl: MapLibreModule, map: MapLibreMap, road: RoadFeature) {
  const bounds = roadBounds(maplibregl, [road]);
  if (!bounds) return;

  map.fitBounds(bounds, {
    duration: 900,
    easing: (progress) => progress,
    maxZoom: 13.5,
    padding: {
      bottom: 150,
      left: 72,
      right: 72,
      top: 72,
    },
  });
}

function roadBounds(maplibregl: MapLibreModule, features: RoadFeature[]) {
  const coordinates = features.flatMap((feature) => featureCoordinates(feature));
  if (coordinates.length === 0) return null;

  return coordinates.reduce(
    (bounds, coordinate) => bounds.extend(coordinate),
    new maplibregl.LngLatBounds(coordinates[0], coordinates[0]),
  );
}

function featureCoordinates(feature: RoadFeature): [number, number][] {
  if (feature.geometry.type === 'LineString') return feature.geometry.coordinates;

  return feature.geometry.coordinates.flat();
}

function estimatedSegmentPath(road: Road): [[number, number], [number, number]] {
  const bearing = ((hashString(road.id) % 120) - 60) * (Math.PI / 180);
  const lengthKm = road.completionYear >= 2024 ? 2.2 : 1.7;
  const halfLat = (Math.cos(bearing) * lengthKm) / 111 / 2;
  const halfLon = (Math.sin(bearing) * lengthKm) / (111 * Math.cos((road.lat * Math.PI) / 180)) / 2;

  return [
    [road.lat - halfLat, road.lon - halfLon],
    [road.lat + halfLat, road.lon + halfLon],
  ];
}

function hashString(value: string) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash;
}

function yearColor(year: number, range: { min: number; max: number }) {
  const span = Math.max(1, range.max - range.min);
  const recency = (year - range.min) / span;
  const oldColor = [120, 129, 126];
  const newColor = [22, 163, 74];
  const rgb = oldColor.map((oldChannel, index) =>
    Math.round(oldChannel + ((newColor[index] ?? oldChannel) - oldChannel) * recency),
  );

  return `rgb(${rgb.join(' ')})`;
}
