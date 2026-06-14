import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const inputPath = 'resources/processed/pardubicky-kraj-apdos-candidates.tsv';
const regionalAdditionPaths = [
  'resources/processed/regional-road-additions.json',
  'resources/processed/regional-road-backfill-2026-06-14.json',
];
const outputPath = 'src/data/roads.json';

const text = readFileSync(inputPath, 'utf8').trim();
const [headerLine, ...lines] = text.split(/\r?\n/);
const headers = headerLine.split('\t');

const numberFormat = /[^\d,.-]/g;

function value(record, key) {
  return record[key]?.trim() ?? '';
}

function parseMoney(raw) {
  const normalized = raw.replace(/\u00a0/g, ' ').replace(numberFormat, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function classifyKind(title) {
  const lower = title.toLocaleLowerCase('cs-CZ');

  if (lower.includes('most')) return 'bridge';
  if (lower.includes('křiž') || lower.includes('okružní')) return 'intersection';
  if (lower.includes('opěrná zeď') || lower.includes('sesuv') || lower.includes('propust')) return 'structure';
  if (lower.includes('přelož') || lower.includes('obchvat') || lower.includes('napojení')) return 'connector';
  if (lower.includes('modernizace') || lower.includes('rekonstrukce')) return 'reconstruction';
  if (lower.includes('oprava') || lower.includes('obnova') || lower.includes('sanace')) return 'repair';

  return 'other';
}

function isDrivingSegment(title, kind) {
  const lower = title.toLocaleLowerCase('cs-CZ');

  if (['bridge', 'connector', 'intersection', 'structure'].includes(kind)) return false;
  if (lower.includes('zastávka') || lower.includes('bus záliv')) return false;
  if (lower.includes('opěrná zeď') || lower.includes('propustek')) return false;

  return true;
}

function classifyRoad(record) {
  const title = value(record, 'title');
  const road = value(record, 'road_class_or_number');
  const source = `${road} ${title}`;

  if (/\bI\/\d+/.test(source)) return 'I';
  if (/\bII\/\d+/.test(source)) return 'II';
  if (/\bIII\/\d+/.test(source) || road.includes('III.')) return 'III';

  return 'other';
}

function isPlaceholderLocation(lat, lon) {
  return lat === 50 && lon === 14.7;
}

function slug(text, index) {
  const base = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72);

  return `${base || 'silnice'}-${String(index + 1).padStart(3, '0')}`;
}

const apdosRoads = lines.map((line, index) => {
  const columns = line.split('\t');
  const record = Object.fromEntries(headers.map((header, columnIndex) => [header, columns[columnIndex] ?? '']));
  const lat = Number(value(record, 'lat'));
  const lon = Number(value(record, 'lon'));
  const title = value(record, 'title')
    .replaceAll('\\t', ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const costExVat = parseMoney(value(record, 'cost_ex_vat'));
  const totalCost = parseMoney(value(record, 'total_cost'));
  const kind = classifyKind(title);

  return {
    id: slug(title, index),
    completionYear: Number(value(record, 'completion_year')),
    title,
    road: value(record, 'road_class_or_number'),
    roadClass: classifyRoad(record),
    status: value(record, 'status'),
    realizationFrom: value(record, 'realization_from'),
    realizationTo: value(record, 'realization_to'),
    lat,
    lon,
    locationQuality: isPlaceholderLocation(lat, lon) ? 'placeholder' : 'source',
    costExVat,
    totalCost,
    kind,
    drivingSegment: isDrivingSegment(title, kind),
    motorwayContext: /\bD35\b/.test(title),
    sourceDataset: value(record, 'source_dataset'),
    sourceUrl: value(record, 'source_url'),
  };
});

const availableRegionalAdditionPaths = regionalAdditionPaths.filter((path) => existsSync(path));
const regionalRoads = availableRegionalAdditionPaths.flatMap((path) => {
  const data = JSON.parse(readFileSync(path, 'utf8'));
  return data.roads ?? [];
});
const roads = [...apdosRoads, ...regionalRoads];
const years = [...new Set(roads.map((road) => road.completionYear))].sort();
const output = {
  generatedAt: new Date().toISOString(),
  source:
    availableRegionalAdditionPaths.length > 0 ? [inputPath, ...availableRegionalAdditionPaths].join(' + ') : inputPath,
  roads,
  summary: {
    total: roads.length,
    mapped: roads.filter((road) => road.locationQuality === 'source').length,
    placeholderLocation: roads.filter((road) => road.locationQuality === 'placeholder').length,
    years,
  },
};

writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${roads.length} roads to ${outputPath}`);
