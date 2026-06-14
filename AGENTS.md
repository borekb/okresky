# Project Agent Notes

## Project goal

Build a catalog of Czech roads reconstructed or substantially repaired from roughly 2020 onward, focused on roads within about 100-150 km of Pardubice.

Scope includes roads I., II. and III. class, plus lower local roads only when they are clearly relevant. Exclude actual motorway/freeway projects. If a lower-class road was repaired because of motorway construction, keep it as a candidate but mark the motorway context for later review.

## Working conventions

- Keep research notes in `docs/`.
- Keep downloaded source material in `resources/raw/<source>/`.
- Keep derived tables in `resources/processed/`.
- Do not stage, commit, or push unless the user explicitly asks.
- Prefer machine-readable sources first, then official regional pages, then press releases and project pages.
- Treat extracted rows as candidates until they are classified as one of: reconstruction, surface repair, bridge/structure, intersection, bypass/new construction, or out of scope.

## Current useful sources

- Pardubicky kraj APDOS map: static JSON at `<https://apdos.roadmedia.cz/json/data-pardubice.json>`.
- Pardubicky kraj map page: `<https://doprava.pardubickykraj.cz/>`.
- Pardubicky kraj SUSPk E-ZAK profile: `<https://ezak.suspk.cz/>`. Use it to verify APDOS rows that look stale or missing; it exposes contract display pages, public documents, contract close-out state, and paid amounts.
- Kralovehradecky kraj road-maintenance site uses WordPress REST API at `<https://uskhk.eu/wp-json/wp/v2/>`.
- Vysocina KSUSV site uses Vismo/Webhouse, not WordPress. Useful RSS: `<https://www.ksusv.cz/rss/>`.
- Vysocina map of roadworks is linked from the KSUSV "Silnicni stavby na Vysocine" page.
- Regional additions outside Pardubicky APDOS currently live in `resources/processed/regional-road-additions.json`, `resources/processed/regional-road-backfill-2026-06-14.json`, and `resources/processed/suspk-ezak-additions-2026-06-15.json`; `scripts/build-road-data.mjs` appends all configured processed regional files.
- KSUS Stredocesky kraj is WordPress-based at `<https://ksus.cz/wp-json/wp/v2/>`; use it for Kutna Hora / Zruc / Sazava candidates.

## Known caveats

- APDOS mixes road reconstructions, repairs, bridges, intersections, D35 feeder/navezove-trasy work, new bypasses and RSD projects.
- APDOS state can be stale or misleading. For example, the III/33742 Hošťalovice / Březinka / Nový Dvůr segment looked like preparation in APDOS, while SUSPk E-ZAK showed contract fulfillment ended on 2025-07-01.
- APDOS dates are not normalized; completion dates appear as `YYYY`, `MM/YYYY`, `DD.MM.YYYY`, and variants with spaces.
- Some APDOS rows use placeholder coordinates around `50.0, 14.7`; do not treat those as real locations.
- Year assignment currently uses completion year (`TerminRealizaceDo`). For "roads reconstructed in year X", consider also an `active_years` interpretation for multi-year projects.
- Some Vysocina additions are from planning articles, not completion reports. Keep their `status` caveat until a later source verifies completion.
- The 2026-06-14 regional backfill added 40 rows and all of those received OSM geometry matches, but the KSUSV rows are still planning-source candidates.
