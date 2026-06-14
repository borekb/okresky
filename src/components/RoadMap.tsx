import { useEffect, useRef } from 'react';

import type { Road } from '@/routes/index';

type LeafletModule = typeof import('leaflet');
type LeafletMap = import('leaflet').Map;
type LayerGroup = import('leaflet').LayerGroup;

const PARDUBICE: [number, number] = [50.0343, 15.7812];

const KIND_COLORS: Record<Road['kind'], string> = {
  bridge: '#7c3aed',
  connector: '#0f766e',
  intersection: '#d97706',
  other: '#64748b',
  reconstruction: '#2563eb',
  repair: '#dc2626',
  structure: '#9333ea',
};

export function RoadMap({
  roads,
  selectedRoadId,
  onSelectRoad,
}: {
  roads: Road[];
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
      renderMarkers(L, markerLayerRef.current, roads, selectedRoadId, onSelectRoad);
      fitRoads(L, map, roads);
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

    renderMarkers(L, layer, roads, selectedRoadId, onSelectRoad);
  }, [roads, selectedRoadId, onSelectRoad]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    fitRoads(L, map, roads);
  }, [roads]);

  return <div ref={containerRef} className="map-canvas" aria-label="Mapa rekonstruovaných silnic" />;
}

function renderMarkers(
  L: LeafletModule,
  layer: LayerGroup,
  roads: Road[],
  selectedRoadId: string | null,
  onSelectRoad: (roadId: string) => void,
) {
  layer.clearLayers();

  for (const road of roads) {
    const selected = road.id === selectedRoadId;
    const color = KIND_COLORS[road.kind];

    const marker = L.circleMarker([road.lat, road.lon], {
      radius: selected ? 9 : 6,
      color: selected ? '#111827' : '#ffffff',
      fillColor: color,
      fillOpacity: selected ? 0.95 : 0.78,
      opacity: 1,
      weight: selected ? 3 : 2,
    });

    marker.bindPopup(popupHtml(road), {
      closeButton: false,
      className: 'road-popup',
      maxWidth: 320,
    });
    marker.bindTooltip(road.title, {
      direction: 'top',
      offset: [0, -8],
      opacity: 0.92,
    });
    marker.on('click', () => onSelectRoad(road.id));
    marker.addTo(layer);
  }
}

function fitRoads(L: LeafletModule, map: LeafletMap, roads: Road[]) {
  if (roads.length === 0) {
    map.setView(PARDUBICE, 8);
    return;
  }

  const bounds = L.latLngBounds(roads.map((road) => [road.lat, road.lon]));
  map.fitBounds(bounds.pad(0.18), {
    animate: false,
    maxZoom: roads.length === 1 ? 12 : 11,
  });
}

function popupHtml(road: Road) {
  const dates = [road.realizationFrom, road.realizationTo].filter(Boolean).join(' - ');
  const cost = road.totalCost ?? road.costExVat;

  return `
    <div class="road-popup-content">
      <strong>${escapeHtml(road.title)}</strong>
      <span>${escapeHtml(road.road)} · ${road.completionYear}</span>
      ${dates ? `<span>${escapeHtml(dates)}</span>` : ''}
      ${cost ? `<span>${formatCurrency(cost)}</span>` : ''}
    </div>
  `;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('cs-CZ', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'CZK',
  }).format(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
