import { createFileRoute } from '@tanstack/react-router';
import { CalendarDays, ExternalLink, Filter, MapPinned, RouteIcon, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { RoadMap } from '@/components/RoadMap';
import rawRoadData from '@/data/roads.json';

export type RoadKind = 'bridge' | 'connector' | 'intersection' | 'other' | 'reconstruction' | 'repair' | 'structure';
export type RoadClass = 'I' | 'II' | 'III' | 'other';

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

const roadData = rawRoadData as RoadData;

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

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const [year, setYear] = useState<number | 'all'>('all');
  const [kind, setKind] = useState<RoadKind | 'all'>('all');
  const [roadClass, setRoadClass] = useState<RoadClass | 'all'>('all');
  const [query, setQuery] = useState('');
  const [includeMotorwayContext, setIncludeMotorwayContext] = useState(true);
  const [selectedRoadId, setSelectedRoadId] = useState<string | null>(null);

  const years = roadData.summary.years;
  const normalizedQuery = query.trim().toLocaleLowerCase('cs-CZ');

  const filteredRoads = useMemo(() => {
    return roadData.roads.filter((road) => {
      if (year !== 'all' && road.completionYear !== year) return false;
      if (kind !== 'all' && road.kind !== kind) return false;
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
  }, [includeMotorwayContext, kind, normalizedQuery, roadClass, year]);

  const mappedRoads = filteredRoads.filter((road) => road.locationQuality === 'source');
  const selectedRoad = filteredRoads.find((road) => road.id === selectedRoadId) ?? filteredRoads[0] ?? null;
  const totalCost = filteredRoads.reduce((sum, road) => sum + (road.totalCost ?? road.costExVat ?? 0), 0);

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
            <button className={kind === 'all' ? 'active' : ''} type="button" onClick={() => setKind('all')}>
              Vše
            </button>
            {Object.entries(KIND_LABELS).map(([value, label]) => (
              <button
                key={value}
                className={kind === value ? 'active' : ''}
                type="button"
                onClick={() => setKind(value as RoadKind)}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={includeMotorwayContext}
              onChange={(event) => setIncludeMotorwayContext(event.target.checked)}
            />
            Včetně návazných oprav u D35
          </label>
        </section>

        <section className="stats" aria-label="Souhrn">
          <Metric icon={MapPinned} label="Záznamy" value={filteredRoads.length.toLocaleString('cs-CZ')} />
          <Metric icon={RouteIcon} label="V mapě" value={mappedRoads.length.toLocaleString('cs-CZ')} />
          <Metric icon={CalendarDays} label="Náklady" value={formatShortCurrency(totalCost)} />
        </section>

        <section className="road-list" aria-label="Seznam silnic">
          {filteredRoads.map((road) => (
            <button
              key={road.id}
              className={road.id === selectedRoad?.id ? 'road-item selected' : 'road-item'}
              type="button"
              onClick={() => setSelectedRoadId(road.id)}
            >
              <span className={`year-pill kind-${road.kind}`}>{road.completionYear}</span>
              <span className="road-item-body">
                <strong>{road.title}</strong>
                <span>
                  {road.road} · {KIND_LABELS[road.kind]} ·{' '}
                  {road.locationQuality === 'source' ? 'ověřená poloha' : 'neověřená poloha'}
                </span>
              </span>
            </button>
          ))}
        </section>
      </aside>

      <section className="map-region">
        <RoadMap roads={mappedRoads} selectedRoadId={selectedRoad?.id ?? null} onSelectRoad={setSelectedRoadId} />

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
              <span>{formatCurrency(selectedRoad.totalCost ?? selectedRoad.costExVat)}</span>
              <a href={selectedRoad.sourceUrl} target="_blank" rel="noreferrer">
                Zdroj <ExternalLink size={14} aria-hidden />
              </a>
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

function formatCurrency(value: number | null) {
  if (!value) return 'Náklady neuvedeny';

  return new Intl.NumberFormat('cs-CZ', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'CZK',
  }).format(value);
}

function formatShortCurrency(value: number) {
  if (value <= 0) return 'neuvedeno';

  return `${new Intl.NumberFormat('cs-CZ', {
    maximumFractionDigits: 1,
  }).format(value / 1_000_000)} mil. Kč`;
}
