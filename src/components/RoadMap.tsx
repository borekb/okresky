import { useEffect, useRef } from 'react';

import type { Road } from '@/routes/index';

type LeafletModule = typeof import('leaflet');
type LeafletMap = import('leaflet').Map;
type LayerGroup = import('leaflet').LayerGroup;

const PARDUBICE: [number, number] = [50.0343, 15.7812];

interface RoadGeometry {
  source: string;
  quality: string;
  osmRef: string;
  wayIds: number[];
  nearestDistanceMeters: number;
  lengthMeters: number;
  geometry: [number, number][][];
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
  const leafletRef = useRef<LeafletModule | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);

  useEffect(() => {
    let disposed = false;

    async function setupMap() {
      if (!containerRef.current || mapRef.current) return;

      const L = await import('leaflet');
      if (disposed || !containerRef.current) return;

      leafletRef.current = L;

      const map = L.map(containerRef.current, {
        attributionControl: false,
        preferCanvas: true,
        zoomControl: false,
      }).setView(PARDUBICE, 8);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.control
        .attribution({ position: 'bottomleft', prefix: false })
        .addAttribution('&copy; OpenStreetMap')
        .addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      markerLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      renderSegments(L, markerLayerRef.current, roads, roadGeometries, yearRange, selectedRoadId, onSelectRoad);
      fitRoads(L, map, roads, roadGeometries);
    }

    setupMap();

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const layer = markerLayerRef.current;
    const map = mapRef.current;
    if (!L || !layer || !map) return;

    renderSegments(L, layer, roads, roadGeometries, yearRange, selectedRoadId, onSelectRoad);
  }, [roads, roadGeometries, yearRange, selectedRoadId, onSelectRoad]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    fitRoads(L, map, roads, roadGeometries);
  }, [roads, roadGeometries]);

  return <div ref={containerRef} className="map-canvas" aria-label="Mapa rekonstruovaných silnic" />;
}

function renderSegments(
  L: LeafletModule,
  layer: LayerGroup,
  roads: Road[],
  roadGeometries: Record<string, RoadGeometry>,
  yearRange: { min: number; max: number },
  selectedRoadId: string | null,
  onSelectRoad: (roadId: string) => void,
) {
  layer.clearLayers();

  for (const road of roads) {
    const selected = road.id === selectedRoadId;
    const color = yearColor(road.completionYear, yearRange);
    const roadGeometry = roadGeometries[road.id];
    const paths = roadGeometry?.geometry ?? [estimatedSegmentPath(road)];
    const outline = L.polyline(paths, {
      color: selected ? '#0f172a' : '#ffffff',
      opacity: selected ? 0.92 : 0.82,
      weight: selected ? 12 : 9,
      lineCap: 'round',
      lineJoin: 'round',
    });
    const segment = L.polyline(paths, {
      color,
      opacity: selected ? 1 : 0.86,
      weight: selected ? 7 : 5,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: roadGeometry ? undefined : '6 8',
    });

    segment.bindPopup(popupHtml(road, roadGeometry), {
      closeButton: false,
      className: 'road-popup',
      maxWidth: 320,
    });
    segment.bindTooltip(road.title, {
      direction: 'top',
      offset: [0, -8],
      opacity: 0.92,
    });
    segment.on('click', () => onSelectRoad(road.id));
    outline.on('click', () => onSelectRoad(road.id));
    outline.addTo(layer);
    segment.addTo(layer);
  }
}

function fitRoads(L: LeafletModule, map: LeafletMap, roads: Road[], roadGeometries: Record<string, RoadGeometry>) {
  if (roads.length === 0) {
    map.setView(PARDUBICE, 8);
    return;
  }

  const points = roads.flatMap((road) => roadBoundsPoints(road, roadGeometries[road.id]));
  const bounds = L.latLngBounds(points);
  map.fitBounds(bounds.pad(0.18), {
    animate: false,
    maxZoom: roads.length === 1 ? 12 : 11,
  });
}

function popupHtml(road: Road, geometry: RoadGeometry | undefined) {
  const dates = [road.realizationFrom, road.realizationTo].filter(Boolean).join(' - ');

  return `
    <div class="road-popup-content">
      <strong>${escapeHtml(road.title)}</strong>
      <span>${escapeHtml(road.road)} · ${road.completionYear}</span>
      ${dates ? `<span>${escapeHtml(dates)}</span>` : ''}
      <span>${geometry ? `OSM ref ${escapeHtml(geometry.osmRef)} · ${geometry.lengthMeters} m` : 'Odhad z APDOS bodu'}</span>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function roadBoundsPoints(road: Road, geometry: RoadGeometry | undefined) {
  if (!geometry) return [[road.lat, road.lon] as [number, number]];

  return geometry.geometry.flat();
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
