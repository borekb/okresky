import { createFileRoute } from '@tanstack/react-router';
import { CalendarDays, ExternalLink, Filter, MapPinned, RouteIcon, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { RoadMap } from '@/components/RoadMap';
import rawRoadGeometries from '@/data/road-geometries.json';
import rawRoadData from '@/data/roads.json';

export type RoadKind = 'bridge' | 'connector' | 'intersection' | 'other' | 'reconstruction' | 'repair' | 'structure';
export type RoadClass = 'I' | 'II' | 'III' | 'other';
type AreaPresetId = 'all' | 'orlicke-hory' | 'zelezne-hory';

export interface Road {
  id: string;
  completionYear: number;
  title: string;
  road: string;
  roadClass: RoadClass;
  status: string;
  realizationFrom: string;
  realizationTo: string;
  lat: number;
  lon: number;
  locationQuality: 'source' | 'placeholder';
  costExVat: number | null;
  totalCost: number | null;
  kind: RoadKind;
  drivingSegment: boolean;
  motorwayContext: boolean;
  sourceDataset: string;
  sourceUrl: string;
}

interface RoadData {
  generatedAt: string;
  source: string;
  roads: Road[];
  summary: {
    total: number;
    mapped: number;
    placeholderLocation: number;
    years: number[];
  };
}

interface RoadGeometryData {
  summary: {
    candidates: number;
    matched: number;
    unmatched: number;
  };
  roads: Record<
    string,
    {
      source: string;
      quality: string;
      osmRef: string;
      wayIds: number[];
      nearestDistanceMeters: number;
      lengthMeters: number;
      geometry: [number, number][][];
    }
  >;
}

const roadData = rawRoadData as RoadData;
const roadGeometries = rawRoadGeometries as unknown as RoadGeometryData;

const KIND_LABELS: Record<RoadKind, string> = {
  bridge: 'Mosty',
  connector: 'Napojení',
  intersection: 'Křižovatky',
  other: 'Ostatní',
  reconstruction: 'Modernizace',
  repair: 'Opravy',
  structure: 'Konstrukce',
};

const ROAD_CLASS_LABELS: Record<RoadClass | 'all', string> = {
  I: 'I. třída',
  II: 'II. třída',
  III: 'III. třída',
  all: 'Vše',
  other: 'Ostatní',
};

const AREA_PRESETS: Array<{
  id: AreaPresetId;
  label: string;
  polygon: Array<[number, number]> | null;
}> = [
  {
    id: 'all',
    label: 'Vše',
    polygon: null,
  },
  {
    id: 'zelezne-hory',
    label: 'Železné hory',
    polygon: [
      [49.64, 15.44],
      [49.65, 15.72],
      [49.77, 16.02],
      [49.88, 16.04],
      [49.98, 15.88],
      [50.03, 15.52],
      [49.92, 15.43],
    ],
  },
  {
    id: 'orlicke-hory',
    label: 'Orlické hory',
    polygon: [
      [50.0, 16.2],
      [49.94, 16.38],
      [49.98, 16.68],
      [50.13, 16.76],
      [50.32, 16.58],
      [50.35, 16.27],
      [50.12, 16.15],
    ],
  },
];

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const [areaPreset, setAreaPreset] = useState<AreaPresetId>('all');
  const [year, setYear] = useState<number | 'all'>('all');
  const [roadClass, setRoadClass] = useState<RoadClass | 'all'>('all');
  const [query, setQuery] = useState('');
  const [includeMotorwayContext, setIncludeMotorwayContext] = useState(true);
  const [showNonSegments, setShowNonSegments] = useState(false);
  const [selectedRoadId, setSelectedRoadId] = useState<string | null>(null);

  const years = roadData.summary.years;
  const segmentYears = roadData.roads.filter((road) => road.drivingSegment).map((road) => road.completionYear);
  const yearRange = {
    min: Math.min(...segmentYears),
    max: Math.max(...segmentYears),
  };
  const normalizedQuery = query.trim().toLocaleLowerCase('cs-CZ');

  const filteredRoads = useMemo(() => {
    const areaPolygon = AREA_PRESETS.find((preset) => preset.id === areaPreset)?.polygon ?? null;

    return roadData.roads.filter((road) => {
      if (!showNonSegments && !road.drivingSegment) return false;
      if (areaPolygon && !pointInPolygon([road.lat, road.lon], areaPolygon)) return false;
      if (year !== 'all' && road.completionYear !== year) return false;
      if (roadClass !== 'all' && road.roadClass !== roadClass) return false;
      if (!includeMotorwayContext && road.motorwayContext) return false;
      if (normalizedQuery.length > 0) {
        const haystack = `${road.title} ${road.road} ${road.realizationFrom} ${road.realizationTo}`.toLocaleLowerCase(
          'cs-CZ',
        );
        if (!haystack.includes(normalizedQuery)) return false;
      }

      return true;
    });
  }, [areaPreset, includeMotorwayContext, normalizedQuery, roadClass, showNonSegments, year]);

  const mappedRoads = filteredRoads.filter((road) => road.locationQuality === 'source');
  const osmMatchedRoads = filteredRoads.filter((road) => roadGeometries.roads[road.id]);
  const selectedRoad = selectedRoadId ? (filteredRoads.find((road) => road.id === selectedRoadId) ?? null) : null;
  const toggleSelectedRoad = (roadId: string) => {
    setSelectedRoadId((currentRoadId) => (currentRoadId === roadId ? null : roadId));
  };

  useEffect(() => {
    if (selectedRoadId && !filteredRoads.some((road) => road.id === selectedRoadId)) {
      setSelectedRoadId(null);
    }
  }, [filteredRoads, selectedRoadId]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <header className="brand">
          <div className="brand-mark">
            <RouteIcon size={20} aria-hidden />
          </div>
          <div>
            <p className="eyebrow">Okresky</p>
            <h1>Rekonstruované silnice</h1>
          </div>
        </header>

        <section className="toolbar" aria-label="Filtry">
          <label className="search-field">
            <Search size={16} aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Hledat silnici, obec, číslo..."
            />
          </label>

          <div className="area-tabs" role="group" aria-label="Oblast">
            {AREA_PRESETS.map((preset) => (
              <button
                key={preset.id}
                aria-pressed={preset.id === areaPreset}
                className={preset.id === areaPreset ? 'area-chip selected' : 'area-chip'}
                type="button"
                onClick={() => setAreaPreset(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="control-row">
            <label>
              <CalendarDays size={15} aria-hidden />
              Rok
              <select value={year} onChange={(event) => setYear(event.target.value === 'all' ? 'all' : Number(event.target.value))}>
                <option value="all">Všechny roky</option>
                {years.map((yearValue) => (
                  <option key={yearValue} value={yearValue}>
                    {yearValue}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <Filter size={15} aria-hidden />
              Třída
              <select value={roadClass} onChange={(event) => setRoadClass(event.target.value as RoadClass | 'all')}>
                {(['all', 'I', 'II', 'III', 'other'] as const).map((option) => (
                  <option key={option} value={option}>
                    {ROAD_CLASS_LABELS[option]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="kind-tabs" role="group" aria-label="Typ stavby">
            <span className="legend-chip latest">Nejnovější</span>
            <span className="legend-chip mid">Starší</span>
            <span className="legend-chip old">Nejstarší</span>
          </div>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={includeMotorwayContext}
              onChange={(event) => setIncludeMotorwayContext(event.target.checked)}
            />
            Včetně návazných oprav u D35
          </label>
          <label className="toggle-row muted-toggle">
            <input
              type="checkbox"
              checked={showNonSegments}
              onChange={(event) => setShowNonSegments(event.target.checked)}
            />
            Zobrazit i mosty, křižovatky a napojení
          </label>
        </section>

        <section className="stats" aria-label="Souhrn">
          <Metric icon={MapPinned} label="Úseky" value={filteredRoads.length.toLocaleString('cs-CZ')} />
          <Metric icon={RouteIcon} label="OSM" value={osmMatchedRoads.length.toLocaleString('cs-CZ')} />
          <Metric icon={CalendarDays} label="Roky" value={formatYearSpan(filteredRoads)} />
        </section>

        <section className="road-list" aria-label="Seznam silnic">
          {filteredRoads.length > 0 ? (
            filteredRoads.map((road) => (
              <button
                key={road.id}
                className={road.id === selectedRoadId ? 'road-item selected' : 'road-item'}
                type="button"
                onClick={() => toggleSelectedRoad(road.id)}
              >
                <span className="year-pill" style={{ background: yearColor(road.completionYear, yearRange) }}>
                  {road.completionYear}
                </span>
                <span className="road-item-body">
                  <strong>{road.title}</strong>
                  <span>
                    {road.road} · {KIND_LABELS[road.kind]} ·{' '}
                    {road.locationQuality === 'source' ? 'ověřená poloha' : 'neověřená poloha'}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <p className="empty-list">Pro zadané filtry tu zatím není žádný úsek.</p>
          )}
        </section>
      </aside>

      <section className="map-region">
        <RoadMap
          roads={mappedRoads}
          roadGeometries={roadGeometries.roads}
          yearRange={yearRange}
          selectedRoadId={selectedRoadId}
          onSelectRoad={toggleSelectedRoad}
        />

        {selectedRoad && (
          <article className="detail-panel" aria-label="Detail vybrané silnice">
            <div>
              <p className="eyebrow">{selectedRoad.completionYear}</p>
              <h2>{selectedRoad.title}</h2>
              <p>
                {selectedRoad.road} · {KIND_LABELS[selectedRoad.kind]} · {formatDates(selectedRoad)}
              </p>
            </div>
            <div className="detail-actions">
              <span>{roadGeometries.roads[selectedRoad.id] ? 'OSM úsek' : 'Odhad úseku'}</span>
              <a href={selectedRoad.sourceUrl} target="_blank" rel="noreferrer">
                Zdroj <ExternalLink size={14} aria-hidden />
              </a>
              <button
                className="detail-close"
                type="button"
                onClick={() => setSelectedRoadId(null)}
                aria-label="Zavřít detail silnice"
                title="Zavřít detail"
              >
                <X size={16} aria-hidden />
              </button>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;
  label: string;
  value: string;
}) {
  return (
    <div className="metric">
      <Icon size={16} aria-hidden />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatDates(road: Road) {
  return [road.realizationFrom, road.realizationTo].filter(Boolean).join(' - ') || road.status;
}

function formatYearSpan(roads: Road[]) {
  if (roads.length === 0) return '-';

  const years = roads.map((road) => road.completionYear);
  const min = Math.min(...years);
  const max = Math.max(...years);

  return min === max ? String(min) : `${min}-${max}`;
}

function pointInPolygon(point: [number, number], polygon: Array<[number, number]>) {
  const [lat, lon] = point;
  let inside = false;

  for (let currentIndex = 0, previousIndex = polygon.length - 1; currentIndex < polygon.length; previousIndex = currentIndex++) {
    const [currentLat, currentLon] = polygon[currentIndex]!;
    const [previousLat, previousLon] = polygon[previousIndex]!;
    const crossesLongitude = currentLon > lon !== previousLon > lon;

    if (!crossesLongitude) continue;

    const edgeLat = ((previousLat - currentLat) * (lon - currentLon)) / (previousLon - currentLon) + currentLat;

    if (lat < edgeLat) {
      inside = !inside;
    }
  }

  return inside;
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
