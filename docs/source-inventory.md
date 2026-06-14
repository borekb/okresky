# Source Inventory

Last updated: 2026-06-14

## Core scope

Catalog reconstructed or substantially repaired non-motorway roads around Pardubice, approximately 100-150 km radius, from 2020 onward. Primary focus is roads I., II. and III. class.

## Pardubicky kraj

Primary machine-readable source:

- Map page: <https://doprava.pardubickykraj.cz/>
- Data endpoint discovered in the embedded app bundle: <https://apdos.roadmedia.cz/json/data-pardubice.json>
- Archived raw file: `resources/raw/apdos/data-pardubice-2026-06-14.json`
- Derived candidate table: `resources/processed/pardubicky-kraj-apdos-candidates.tsv`

The JSON has top-level keys `kraj`, `silnice`, `zeleznice`, and `oprava`. The useful candidate records are in `oprava`.

Important fields seen in `oprava`:

- `Nazev`
- `Stav`
- `Komunikace`
- `TerminRealizaceOd`
- `TerminRealizaceDo`
- `GPSLatitude`
- `GPSLongitude`
- `CenaBezDPH`
- `CelkoveNaklady`
- `Popis`
- `spolufinancoval`

Notes:

- The app labels the map as "Dopravni stavby Pardubickeho kraje" and says it is updated monthly.
- The data includes many useful roads II/III, but also D35, RSD roads I. class, bridge work, intersections, and feeder roads. Keep rows as candidates until classified.
- Rows where `Komunikace = D35` are excluded from the first candidate TSV; rows whose title mentions D35 but whose road is II/III are kept for review.

## Kralovehradecky kraj

Primary source:

- Site: <https://uskhk.eu/>
- WordPress REST API: <https://uskhk.eu/wp-json/wp/v2/>
- Archived search: `resources/raw/uskhk/search-rekonstrukce-silnice-2026-06-14.json`
- Archived posts: `resources/raw/uskhk/posts-rekonstrukce-silnice-2026-06-14.json`

Useful query examples:

- <https://uskhk.eu/wp-json/wp/v2/search?search=rekonstrukce%20silnice&per_page=20>
- <https://uskhk.eu/wp-json/wp/v2/posts?search=rekonstrukce%20silnice&per_page=20&_fields=id,date,link,title,excerpt>

The search immediately found road reconstruction posts from 2023-2025, for example II/327 Zabedov - Novy Bydzov, II/304 Ceska Skalice, and multiple III-class reconstructions near Hradec Kralove.

Next step: pull all matching posts since 2020, then parse title/excerpt/body into candidate rows and geocode or map-match them.

## Vysocina

Primary source:

- Site: <https://www.ksusv.cz/>
- RSS: <https://www.ksusv.cz/rss/>
- Archived RSS: `resources/raw/ksusv/rss-2026-06-14.xml`
- Roadworks map page archive: `resources/raw/ksusv/silnicni-stavby-na-vysocine-2026.html`
- 2025 plan archives:
  - `resources/raw/ksusv/plan-2025-havlickuv-brod.html`
  - `resources/raw/ksusv/plan-2025-jihlava.html`

Useful URLs found:

- Silnicni stavby na Vysocine 2026: <https://www.ksusv.cz/silnicni-stavby-na-vysocine-2026/d-2457>
- Linked map: <https://maps.kr-vysocina.cz/ksusv1/apps/experiencebuilder/experience/?id=68224eb52c224df5a6f410aebddcb522>

Notes:

- The site uses Vismo/Webhouse, not WordPress.
- RSS lists yearly district planning articles, including 2024, 2025, and 2026 planned road and bridge repairs.
- Pages are HTML articles with embedded lists, not clean structured JSON.

## RSD / roads I. class

RSD is needed for roads I. class and for excluding actual motorway/freeway projects.

Known useful entry points:

- RSD site: <https://www.rsd.cz/>
- RSD geoportal road network map linked by SUSPk: <https://geoportal.rsd.cz/apps/silnicni_a_dalnicni_sit_cr_verejna/>

Next step: identify whether RSD has a public "stavby" JSON/API or use official project leaflets/pages for roads I. class around Pardubice, Hradec Kralove, Chrudim, Vysoke Myto, Svitavy, Kolin, Havlickuv Brod, and Jihlava.

## Still to inspect

- Stredocesky kraj / KSUS Stredoceskeho kraje.
- Jihomoravsky kraj / SUS JMK for the northern edge around Boskovice, Blansko, Tišnov.
- Olomoucky kraj / SSOK for Mohelnice, Zabreh, Litovel, Sumperk edge cases.
- Municipal sources only when a local road or city through-road is in scope.
