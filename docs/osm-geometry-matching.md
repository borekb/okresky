# OSM Geometry Matching

Last updated: 2026-06-14

`scripts/fetch-osm-road-geometries.mjs` enriches point-based road candidates with OpenStreetMap road geometries.

## Method

1. Read driving-segment candidates from `src/data/roads.json`.
2. Extract the road reference from `road` or `title`, e.g. `II/298` -> OSM `ref=298`, `III/29810` -> `ref=29810`.
3. Query Overpass for `highway` ways with matching `ref` inside the current candidate bounding box.
4. For each candidate, choose same-ref OSM ways nearest to the source point and keep nearby way fragments up to a bounded total length.
5. Write:
   - raw Overpass response: `resources/raw/osm/overpass-road-ways-2026-06-14.json`
   - processed geometries: `resources/processed/osm-road-geometries.json`
   - app data: `src/data/road-geometries.json`

## Caveats

- The current sources do not provide exact roadwork polylines for most rows, only source points or article-level locations.
- The current match is more precise than synthetic display segments because it follows real OSM road geometry, but it is still inferred from road reference and proximity.
- Some APDOS titles contain multiple road numbers or generic road classes; these need manual review or endpoint parsing.
- Multi-ref regional rows currently match against the first extracted road reference; exact multi-road extents need a later matcher improvement.
- Exact project extents will require either source geometry from an official portal, reliable staničení, or endpoint-to-endpoint routing along the matched OSM road graph.

## 2026-06-14 Backfill Run

After adding `resources/processed/regional-road-backfill-2026-06-14.json`, the generated geometry set matched 179 of 201 driving-segment candidates. All 40 newly added backfill rows received OSM geometry matches after adjusting several approximate source points against the local Overpass raw dump. The remaining 22 unmatched rows are older candidates from previous data imports.

After the later coverage-density audit, the dataset has 216 driving-segment geometry candidates and 194 OSM matches. All 6 audit-added rows matched OSM geometry; III/28038 Sekerice - Hlusicky required moving the approximate source point onto the OSM `ref=28038` corridor before matching.
