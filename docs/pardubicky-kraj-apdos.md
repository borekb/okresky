# Pardubicky Kraj APDOS Notes

Source snapshot: `resources/raw/apdos/data-pardubice-2026-06-14.json`

Source endpoint: <https://apdos.roadmedia.cz/json/data-pardubice.json>

Derived candidate table: `resources/processed/pardubicky-kraj-apdos-candidates.tsv`

## Extraction used

The first derived table includes rows from `.oprava[]` where:

- `Stav == "Dokončeno"`
- `Komunikace != "D35"`
- `TerminRealizaceDo` contains a year from 2020 onward

The first extracted year is based on completion year, not active-year overlap.

## Candidate counts

Rows in `resources/processed/pardubicky-kraj-apdos-candidates.tsv`: 238 candidates plus header.

Completion-year counts:

| Year | Candidates |
| --- | ---: |
| 2021 | 39 |
| 2022 | 22 |
| 2023 | 68 |
| 2024 | 62 |
| 2025 | 47 |

No 2020 completion-year rows appeared in this first extraction. This does not mean no work happened in 2020; many rows started in 2020 and finished in 2021.

## Notable examples to classify later

Examples of likely in-scope road reconstructions or repairs:

| Completion | Candidate |
| --- | --- |
| 2021 | Modernizace silnice II/343 Vršov - Trhová Kamenice |
| 2021 | Modernizace silnice II/360 Polička - Korouhev - hranice kraje |
| 2021 | Rekonstrukce silnice II/211 Lázně Bohdaneč, průtah I. a II. etapa |
| 2022 | Modernizace silnice II/337 Seč - Třemošnice |
| 2022 | Modernizace silnice II/343 Hlinsko I. etapa - průtah |
| 2023 | Modernizace silnice II/322 Kojice |
| 2023 | Modernizace silnice II/360 Ústí nad Orlicí - Litomyšl |
| 2024 | Modernizace silnice II/312 Choceň - České Libchavy |
| 2024 | Rekonstrukce silnice II/310 Letohrad - Žamberk, Lukavice - průtah |
| 2025 | Modernizace silnice II/337 Třemošnice - hranice Pk |

Examples needing scope review:

- Rows starting with `D35 Opatovice - Časy, ... oprava návozových tras`: usually lower-class roads, but motorway-related.
- Rows named `Propojení silnice D35 a I/35 ...` or `Napojení ... na D35`: likely new build or connector work.
- Bridge-only rows: useful but should be classified separately.
- RSD rows on roads I. class: keep only if they are roads I. class and not actual motorway projects.

## Data-quality issues

- Dates appear as `YYYY`, `MM/YYYY`, `DD.MM.YYYY`, `D. M. YYYY`, and mixed forms.
- Some candidate coordinates are placeholders (`50.0`, `14.7`).
- `Komunikace` sometimes contains a road number and sometimes a generic value such as `Silnice III. třídy`.
- `CenaBezDPH` and `CelkoveNaklady` mix formatted strings, plain numbers, blanks, and currency suffixes.
- `Stav` can lag behind reality or contract execution. For III/33742 around Březinka / Nový Dvůr, APDOS still showed preparation-like rows, while the SUSPk E-ZAK contract page showed fulfillment ended on 2025-07-01 for the Hošťalovice / Březinka segment.
- SUSPk E-ZAK is a necessary cross-check for Pardubicky rows that appear missing, stale, or current-but-not-closed in APDOS.

## Next steps

1. Add a parser that normalizes dates and produces `completion_year` plus `active_years`.
2. Add a classifier for `project_kind` and `scope_status`.
3. Extract road numbers from `Nazev` when `Komunikace` is generic.
4. Mark placeholder coordinates and later geocode/map-match candidate routes.
5. Compare APDOS candidates with SUSPk pages, public procurement records, and regional press releases for confirmation.
