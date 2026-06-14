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
- Kralovehradecky kraj road-maintenance site uses WordPress REST API at `<https://uskhk.eu/wp-json/wp/v2/>`.
- Vysocina KSUSV site uses Vismo/Webhouse, not WordPress. Useful RSS: `<https://www.ksusv.cz/rss/>`.
- Vysocina map of roadworks is linked from the KSUSV "Silnicni stavby na Vysocine" page.

## Known caveats

- APDOS mixes road reconstructions, repairs, bridges, intersections, D35 feeder/navezove-trasy work, new bypasses and RSD projects.
- APDOS dates are not normalized; completion dates appear as `YYYY`, `MM/YYYY`, `DD.MM.YYYY`, and variants with spaces.
- Some APDOS rows use placeholder coordinates around `50.0, 14.7`; do not treat those as real locations.
- Year assignment currently uses completion year (`TerminRealizaceDo`). For "roads reconstructed in year X", consider also an `active_years` interpretation for multi-year projects.
