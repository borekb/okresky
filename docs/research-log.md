# Research Log

## 2026-06-14

Initial project research and structure setup.

Created directories:

- `docs/`
- `resources/raw/`
- `resources/processed/`

Downloaded and archived:

- Pardubicky APDOS JSON to `resources/raw/apdos/data-pardubice-2026-06-14.json`
- Vysocina KSUSV RSS and selected HTML planning pages to `resources/raw/ksusv/`
- Kralovehradecky US KHK WordPress search results to `resources/raw/uskhk/`

Key findings:

- Pardubicky kraj has a strong machine-readable source: the public map at <https://doprava.pardubickykraj.cz/> loads <https://apdos.roadmedia.cz/json/data-pardubice.json>.
- The APDOS JSON has 332 records in `oprava`. After filtering to completed, non-`Komunikace = D35`, completion year 2020+, the first candidate TSV has 238 rows plus header.
- Candidate counts by completion year in the first Pardubicky TSV:
  - 2021: 39
  - 2022: 22
  - 2023: 68
  - 2024: 62
  - 2025: 47
- No 2020 completion-year candidates were produced by the first filter. Several projects started in 2020 and completed in 2021, so a later `active_years` view is needed.
- Kralovehradecky US KHK exposes a WordPress REST API. Search for `rekonstrukce silnice` returns directly useful posts from 2023-2025.
- Vysocina KSUSV has yearly district-level road and bridge planning articles and a linked map application. It is not as clean as APDOS; parsing will probably need HTML extraction and/or ArcGIS Experience Builder inspection.

Open questions:

- Should the catalog year mean completion year, start year, or any year during which the project was active? Current processed APDOS file uses completion year.
- Should bridge-only works be included? They are often road reconstructions in practice but need a separate classification.
- Should lower-class "navezove trasy" repaired due to D35 construction remain in scope? Current assumption: yes, if the repaired road is II/III and the motorway itself is not the catalog item.

Expanded the app dataset beyond Pardubicky APDOS with a first curated batch for the user's requested areas around Havlickuv Brod / Chotebor, Kutna Hora / Zruc / Sazava, and north of Pardubice through Hradec Kralove toward Jaromer / Nachod / Orlicke hory.

Added `resources/processed/regional-road-additions.json` with 17 road-segment rows:

- 8 Kralovehradecky kraj rows from `uskhk.eu` WordPress posts
- 5 Vysocina rows from the KSUSV 2025 Havlickuv Brod district plan
- 4 Stredocesky kraj rows from `ksus.cz` WordPress posts

Updated `scripts/build-road-data.mjs` so `src/data/roads.json` is generated from the APDOS TSV plus the regional additions file. Re-ran `scripts/fetch-osm-road-geometries.mjs`; after fixing the Overpass ref regex to match leading-zero road refs like `III/0311`, all 17 newly added rows received OSM geometry matches.

Important caveat: Vysocina additions are sourced from a 2025 planning article, so their `status` explicitly says completion still needs verification. Bridge-only and intersection-only Stredocesky items were skipped.

After reviewing the map density, confirmed that the first regional expansion was not a complete year-by-year download. Pardubicky kraj is dense because APDOS is a broad machine-readable export, while KHK/Vysocina/Stredocesky were only seeded from selected posts.

Performed a broader backfill for the requested areas:

- Downloaded the complete KHK WordPress post archive for 2020-2025 into `resources/raw/uskhk/posts-2020-2025-page1.json`
- Downloaded the complete KSUS Stredocesky WordPress post archive for 2020-2025 into `resources/raw/ksus-stredocesky/posts-2020-2025-page1.json` through `page4.json`
- Downloaded KSUSV fulltext result pages and district plans for Havlickuv Brod and Zdar nad Sazavou for 2021-2025
- Added `resources/processed/regional-road-backfill-2026-06-14.json` with 40 additional road-segment rows
- Updated `scripts/build-road-data.mjs` to append multiple regional processed files

The app dataset now contains 295 roads total. The backfill added more coverage around Hradec Kralove / Jaromer / Nachod / Orlicke hory, Kolin / Kutna Hora / Zruc / Sazava / Vlasim, and Havlickuv Brod / Chotebor / Zdar nad Sazavou. All 40 new backfill rows received OSM geometry matches after adjusting a few approximate source points against the local Overpass raw dump.

Backfill caveat: KSUSV yearly district pages are planning sources, not completion reports, so those rows intentionally keep `status` values like `Plan 2024, overit dokonceni`. The dataset still should not be read as complete coverage for all regions/years; it is a much broader candidate set than the first seed, but not equivalent to Pardubicky APDOS.

Targeted follow-up for the suspiciously empty Kutna Hora / Caslav area found that the broad Stredocesky 2020-2025 archive had missed local and 2026 articles. Downloaded targeted KSUS WP searches for `Kutna Hora`, `Caslav`, `Kutnohorsku`, and `Caslavsku` under `resources/raw/ksus-stredocesky/kutna-hora-caslav/`. Added 9 more rows: III/3368 Trebetin - Tasice, III/33828 Bratcice - Pribyslavice, two III/33825 Tupadly area rows, III/33718 Kluky, III/33827 Potehy - Bratcice, III/33723 Drobovice, III/12537/III/12532 Sobocice - Zasmuky, and III/12523 Vlkova. All 9 received OSM geometry matches. Skipped the planned Caslav railway-overpass/prelozka items because they are new connector/bridge projects, not reconstructed driving segments.

Ran a coverage sanity audit against the map screenshot, focusing on sparse-looking areas northwest of Hradec Kralove, around Sazava / Zruc, and west toward Kolin / Nymburk. Downloaded targeted official WP API searches into `resources/raw/uskhk/coverage-audit-2026-06-14/` and `resources/raw/ksus-stredocesky/coverage-audit-2026-06-14/`. Added 6 more road-segment candidates: III/28038 Sekerice - Hlusicky, II/280 Liban - Kopidlno, III/27215 Zdetin, III/1084 Jevany, II/126 D1 - Kutna Hora / Zruc second stage, and II/125 Lounovice pod Blanikem - Kamberk. All 6 received OSM geometry matches after correcting the Sekerice source point against the downloaded OSM ways. Rataje / Sazava results were mostly 106 responses, bridge/propustek items, or zklidneni/study material and were not added as reconstructed driving segments.
