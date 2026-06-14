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
