import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const roadsPath = 'src/data/roads.json';
const rawPath = 'resources/raw/osm/overpass-road-ways-2026-06-14.json';
const outputPath = 'src/data/road-geometries.json';
const processedPath = 'resources/processed/osm-road-geometries.json';

const overpassUrl = 'https://overpass-api.de/api/interpreter';
const maxMatchDistanceMeters = 1800;
const nearbyWayDistanceMeters = 3000;
const maxGeometryLengthMeters = 18000;

const roadsData = JSON.parse(readFileSync(roadsPath, 'utf8'));
const candidates = roadsData.roads
  .filter((road) => road.drivingSegment && road.locationQuality === 'source')
  .map((road) => ({
    ...road,
    osmRef: extractRoadRef(road),
  }))
  .filter((road) => road.osmRef);

if (candidates.length === 0) {
  throw new Error('No source-located driving segment candidates found.');
}

const refs = [...new Set(candidates.map((road) => road.osmRef))].sort(compareNumericStrings);
const bbox = paddedBbox(candidates, 0.12);
const overpassQuery = buildOverpassQuery(bbox, refs);

mkdirSync('resources/raw/osm', { recursive: true });
mkdirSync('resources/processed', { recursive: true });

console.log(`Fetching OSM ways for ${refs.length} refs in bbox ${bbox.join(', ')}`);
const response = await fetch(overpassUrl, {
  method: 'POST',
  headers: {
    'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
    'user-agent': 'okresky geometry matcher (local research script)',
  },
  body: new URLSearchParams({ data: overpassQuery }),
});

if (!response.ok) {
  throw new Error(`Overpass request failed: ${response.status} ${response.statusText}\n${await response.text()}`);
}

const overpassData = await response.json();
writeFileSync(rawPath, `${JSON.stringify(overpassData, null, 2)}\n`);

const waysByRef = indexWaysByRef(overpassData.elements ?? []);
const geometries = {};
const unmatched = [];

for (const road of candidates) {
  const ways = waysByRef.get(road.osmRef) ?? [];
  const matches = ways
    .map((way) => ({
      way,
      distanceMeters: distanceToLineMeters([road.lat, road.lon], way.geometry),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  const nearest = matches[0];
  if (!nearest || nearest.distanceMeters > maxMatchDistanceMeters) {
    unmatched.push({
      id: road.id,
      title: road.title,
      osmRef: road.osmRef,
      nearestDistanceMeters: nearest ? Math.round(nearest.distanceMeters) : null,
    });
    continue;
  }

  const nearby = matches.filter((match) => match.distanceMeters <= nearbyWayDistanceMeters);
  const selected = selectNearbyWays(nearby);
  const geometry = selected.map(({ way }) => way.geometry.map((point) => [roundCoord(point[0]), roundCoord(point[1])]));
  const lengthMeters = selected.reduce((sum, match) => sum + lineLengthMeters(match.way.geometry), 0);

  geometries[road.id] = {
    source: 'openstreetmap-overpass',
    quality: 'matched_ref_near_source_point',
    osmRef: road.osmRef,
    wayIds: selected.map((match) => match.way.id),
    nearestDistanceMeters: Math.round(nearest.distanceMeters),
    lengthMeters: Math.round(lengthMeters),
    geometry,
  };
}

const output = {
  generatedAt: new Date().toISOString(),
  source: 'OpenStreetMap Overpass API',
  overpassUrl,
  rawPath,
  assumptions: {
    maxMatchDistanceMeters,
    nearbyWayDistanceMeters,
    maxGeometryLengthMeters,
    note: 'Matched by normalized OSM road ref and source point. This is more precise than synthetic display segments, but not yet manually verified project extents.',
  },
  summary: {
    candidates: candidates.length,
    refs: refs.length,
    matched: Object.keys(geometries).length,
    unmatched: unmatched.length,
  },
  roads: geometries,
  unmatched,
};

writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
writeFileSync(processedPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Matched ${output.summary.matched}/${output.summary.candidates} road geometries.`);
console.log(`Wrote ${outputPath} and ${processedPath}`);

function buildOverpassQuery([south, west, north, east], refs) {
  const refPattern = `(^|;| |/)(0*(${refs.map(escapeRegex).join('|')}))(;| |$)`;

  return `
[out:json][timeout:180];
(
  way(${south},${west},${north},${east})["highway"]["ref"~"${refPattern}"];
);
out geom;
`;
}

function extractRoadRef(road) {
  const source = `${road.road} ${road.title}`;
  const matches = [...source.matchAll(/\bI{1,3}\/?\s*(\d{1,5})\b/g)];
  const preferred = matches.find((match) => match[1])?.[1];

  if (!preferred) return null;
  return normalizeRef(preferred);
}

function normalizeRef(value) {
  return String(Number(value.replace(/^0+/, '') || '0'));
}

function indexWaysByRef(elements) {
  const index = new Map();

  for (const element of elements) {
    if (element.type !== 'way' || !Array.isArray(element.geometry) || !element.tags?.ref) continue;

    const way = {
      id: element.id,
      tags: element.tags,
      geometry: element.geometry.map((point) => [point.lat, point.lon]),
    };

    for (const ref of splitRefs(element.tags.ref)) {
      const normalized = normalizeRef(ref);
      const ways = index.get(normalized) ?? [];
      ways.push(way);
      index.set(normalized, ways);
    }
  }

  return index;
}

function splitRefs(raw) {
  return raw
    .split(/[;,]/)
    .map((part) => part.trim().match(/(\d{1,5})/)?.[1])
    .filter(Boolean);
}

function selectNearbyWays(matches) {
  const selected = [];
  let lengthMeters = 0;

  for (const match of matches) {
    const wayLength = lineLengthMeters(match.way.geometry);
    if (selected.length > 0 && lengthMeters + wayLength > maxGeometryLengthMeters) continue;
    selected.push(match);
    lengthMeters += wayLength;
  }

  return selected.length > 0 ? selected : matches.slice(0, 1);
}

function paddedBbox(roads, padding) {
  const lats = roads.map((road) => road.lat);
  const lons = roads.map((road) => road.lon);

  return [
    roundCoord(Math.min(...lats) - padding),
    roundCoord(Math.min(...lons) - padding),
    roundCoord(Math.max(...lats) + padding),
    roundCoord(Math.max(...lons) + padding),
  ];
}

function distanceToLineMeters(point, line) {
  let min = Number.POSITIVE_INFINITY;

  for (let index = 1; index < line.length; index += 1) {
    min = Math.min(min, distanceToSegmentMeters(point, line[index - 1], line[index]));
  }

  return min;
}

function distanceToSegmentMeters(point, start, end) {
  const originLat = point[0];
  const [px, py] = project(point, originLat);
  const [ax, ay] = project(start, originLat);
  const [bx, by] = project(end, originLat);
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) return Math.hypot(px - ax, py - ay);

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  const closestX = ax + t * dx;
  const closestY = ay + t * dy;

  return Math.hypot(px - closestX, py - closestY);
}

function lineLengthMeters(line) {
  let length = 0;
  for (let index = 1; index < line.length; index += 1) {
    length += distanceMeters(line[index - 1], line[index]);
  }

  return length;
}

function distanceMeters(a, b) {
  const originLat = (a[0] + b[0]) / 2;
  const [ax, ay] = project(a, originLat);
  const [bx, by] = project(b, originLat);

  return Math.hypot(ax - bx, ay - by);
}

function project([lat, lon], originLat) {
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLon = 111_320 * Math.cos((originLat * Math.PI) / 180);

  return [lon * metersPerDegreeLon, lat * metersPerDegreeLat];
}

function compareNumericStrings(a, b) {
  return Number(a) - Number(b);
}

function roundCoord(value) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
