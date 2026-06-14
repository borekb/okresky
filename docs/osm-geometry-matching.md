# OSM Geometry Matching

Last updated: 2026-06-14

`scripts/fetch-osm-road-geometries.mjs` enriches APDOS point candidates with OpenStreetMap road geometries.

## Method

1. Read driving-segment candidates from `src/data/roads.json`.
2. Extract the road reference from `road` or `title`, e.g. `II/298` -> OSM `ref=298`, `III/29810` -> `ref=29810`.
3. Query Overpass for `highway` ways with matching `ref` inside the current candidate bounding box.
4. For each candidate, choose same-ref OSM ways nearest to the APDOS point and keep nearby way fragments up to a bounded total length.
5. Write:
   - raw Overpass response: `resources/raw/osm/overpass-road-ways-2026-06-14.json`
   - processed geometries: `resources/processed/osm-road-geometries.json`
   - app data: `src/data/road-geometries.json`

## Caveats

- APDOS does not provide exact roadwork polylines for `oprava` rows, only source points.
- The current match is more precise than synthetic display segments because it follows real OSM road geometry, but it is still inferred from road reference and proximity.
- Some APDOS titles contain multiple road numbers or generic road classes; these need manual review or endpoint parsing.
- Exact project extents will require either source geometry from an official portal, reliable staničení, or endpoint-to-endpoint routing along the matched OSM road graph.
