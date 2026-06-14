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
- Expanded archived searches:
  - `resources/raw/uskhk/posts-rekonstrukce-silnice-page1-2026-06-14.json`
  - `resources/raw/uskhk/posts-oprava-silnice-page1-2026-06-14.json`
- Complete 2020-2025 post archive:
  - `resources/raw/uskhk/posts-2020-2025-page1.json`
- Coverage-audit searches from the map-density review:
  - `resources/raw/uskhk/coverage-audit-2026-06-14/search-sekerice.json`
  - `resources/raw/uskhk/coverage-audit-2026-06-14/search-jicin.json`
  - `resources/raw/uskhk/coverage-audit-2026-06-14/search-horice.json`
  - `resources/raw/uskhk/coverage-audit-2026-06-14/search-bydzov.json`

Useful query examples:

- <https://uskhk.eu/wp-json/wp/v2/search?search=rekonstrukce%20silnice&per_page=20>
- <https://uskhk.eu/wp-json/wp/v2/posts?search=rekonstrukce%20silnice&per_page=20&_fields=id,date,link,title,excerpt>

The search immediately found road reconstruction posts from 2023-2025, for example II/327 Zabedov - Novy Bydzov, II/304 Ceska Skalice, and multiple III-class reconstructions near Hradec Kralove.

Rows added to the app dataset in the first KHK expansion:

- II/304 Ceska Skalice, ul. Zelena
- III/28510 Velichovky - Roznov
- III/3253 Sveti
- III/32436 Stezery - Briza
- III/32112 Skuhrov nad Belou
- III/30324 Broumov - Sonov, II. etapa
- III/30122 Zdar nad Metuji
- III/3049 Cerveny Kostelec - Ceska Skalice

Rows added in the 2020-2025 archive backfill include II/327 Zabedov - Novy Bydzov, III/29923 Choustnikovo Hradiste, III/32329 Libcany, III/3089 Smirice, II/299 Librantice - Librice, III/29913 Lochenice, and other north/east-of-Pardubice candidates.

The coverage audit added III/28038 Sekerice - Hlusicky and II/280 Liban - Kopidlno, which fill part of the sparse Jicin / Novy Bydzov side of the map.

Next step: review KHK archive rows that are still excluded because they look like prelozky, bridge/propustek works, or generic posts, and verify whether any should be reclassified as useful driving segments.

## Vysocina

Primary source:

- Site: <https://www.ksusv.cz/>
- RSS: <https://www.ksusv.cz/rss/>
- Archived RSS: `resources/raw/ksusv/rss-2026-06-14.xml`
- Latest archived RSS refresh: `resources/raw/ksusv/rss-2026-06-14-latest.xml`
- Full RSS refresh used for backfill discovery: `resources/raw/ksusv/rss-full-2026-06-14.xml`
- Roadworks map page archive: `resources/raw/ksusv/silnicni-stavby-na-vysocine-2026.html`
- Experience Builder shell archive: `resources/raw/ksusv/experiencebuilder-2026-06-14.html`
- 2025 plan archives:
  - `resources/raw/ksusv/plan-2025-havlickuv-brod.html`
  - `resources/raw/ksusv/plan-2025-jihlava.html`
- Backfill fulltext archives:
  - `resources/raw/ksusv/search-havlickuv-brod-opravy.html`
  - `resources/raw/ksusv/search-zdar-opravy.html`
- Havlickuv Brod plan archives used for backfill:
  - `resources/raw/ksusv/plan-havlickuv-brod-2021-id2568.html`
  - `resources/raw/ksusv/plan-havlickuv-brod-2022-id2674.html`
  - `resources/raw/ksusv/plan-havlickuv-brod-2023-id2757.html`
  - `resources/raw/ksusv/plan-havlickuv-brod-2024-id2850.html`
  - `resources/raw/ksusv/plan-havlickuv-brod-2025-id2921.html`
- Zdar nad Sazavou plan archives used for backfill:
  - `resources/raw/ksusv/plan-zdar-nad-sazavou-2021-id2572.html`
  - `resources/raw/ksusv/plan-zdar-nad-sazavou-2022-id2682.html`
  - `resources/raw/ksusv/plan-zdar-nad-sazavou-2023-id2761.html`
  - `resources/raw/ksusv/plan-zdar-nad-sazavou-2024-id2859.html`
  - `resources/raw/ksusv/plan-zdar-nad-sazavou-2025-id2925.html`

Useful URLs found:

- Silnicni stavby na Vysocine 2026: <https://www.ksusv.cz/silnicni-stavby-na-vysocine-2026/d-2457>
- Linked map: <https://maps.kr-vysocina.cz/ksusv1/apps/experiencebuilder/experience/?id=68224eb52c224df5a6f410aebddcb522>

Notes:

- The site uses Vismo/Webhouse, not WordPress.
- RSS lists yearly district planning articles, including 2024, 2025, and 2026 planned road and bridge repairs.
- Pages are HTML articles with embedded lists, not clean structured JSON.
- The first Havlickuv Brod / Chotebor expansion uses the 2025 district plan article and should be treated as "planned in 2025" until completion is verified from later sources.

Rows added to the app dataset in the first Vysocina expansion:

- II/345 Sobinov - Zdirec nad Doubravou
- II/350 Stoky - Smilov
- II/351 Chotebor - Ceska Bela
- III/3489 Lipa prutah
- Rozsochatec reconstruction completion candidate

The backfill adds further plan-derived rows for Havlickuv Brod / Chotebor / Ledec nad Sazavou and Zdar nad Sazavou / Zdar Hills, including II/130 Cihost - Prosicka, II/344 Chotebor - Libice nad Doubravou, II/346 Stepanov - Habry, II/357 Dalecin - Uncin, II/388 Bohdalov - Brezi nad Oslavou, II/353 Zdar nad Sazavou / Borovnice - Javorek, II/350 Svetnov - Kocanda, II/354 Petrovice - Hlinne, and II/352 Sazava - I/19.

Coverage caveat: these are official yearly planning articles. They are valuable for candidate discovery and map visualization, but completion still needs later verification from completion posts, procurement closeout, or another official source.

## Stredocesky kraj / KSUS

Primary source:

- Site: <https://ksus.cz/>
- WordPress REST API: <https://ksus.cz/wp-json/wp/v2/>
- Archived broad searches:
  - `resources/raw/ksus-stredocesky/posts-oprava-silnice-2026-06-14.json`
  - `resources/raw/ksus-stredocesky/posts-rekonstrukce-silnice-2026-06-14.json`
- Complete 2020-2025 post archive:
  - `resources/raw/ksus-stredocesky/posts-2020-2025-page1.json`
  - `resources/raw/ksus-stredocesky/posts-2020-2025-page2.json`
  - `resources/raw/ksus-stredocesky/posts-2020-2025-page3.json`
  - `resources/raw/ksus-stredocesky/posts-2020-2025-page4.json`
- Targeted Kutna Hora / Caslav searches:
  - `resources/raw/ksus-stredocesky/kutna-hora-caslav/search-kutna-hora.json`
  - `resources/raw/ksus-stredocesky/kutna-hora-caslav/search-caslav.json`
  - `resources/raw/ksus-stredocesky/kutna-hora-caslav/search-kutnohorsku.json`
  - `resources/raw/ksus-stredocesky/kutna-hora-caslav/search-caslavsku.json`
- Coverage-audit searches from the map-density review:
  - `resources/raw/ksus-stredocesky/coverage-audit-2026-06-14/search-rataje.json`
  - `resources/raw/ksus-stredocesky/coverage-audit-2026-06-14/search-sazava.json`
  - `resources/raw/ksus-stredocesky/coverage-audit-2026-06-14/search-jevany.json`
  - `resources/raw/ksus-stredocesky/coverage-audit-2026-06-14/search-zdetin.json`
- Archived individual posts:
  - `resources/raw/ksus-stredocesky/post-5542-ii126-2026-06-14.json`
  - `resources/raw/ksus-stredocesky/post-5590-ii106-chrast-2026-06-14.json`
  - `resources/raw/ksus-stredocesky/post-5621-iii0311-0312-2026-06-14.json`
  - `resources/raw/ksus-stredocesky/post-5645-ii335-stribrna-skalice-2026-06-14.json`

Rows added to the app dataset in the first Sazava / Kutna Hora / Zruc expansion:

- II/126 - Propojeni D1 se silnici I/2, 1. etapa
- II/106 hranice okresu Benesov - Chrast nad Sazavou
- III/0311 and III/0312 Pysely - Zajecice - Senohraby
- II/335 Stribrna Skalice prutah

Notes:

- The 2026 II/126 Zruc / Soutice / Zelivka stage is now included as a current long-running candidate, with status requiring later completion verification.
- II/110 Sazava bridge posts were intentionally skipped because the current driving-focused dataset excludes bridge-only works.
- The archive backfill added further useful candidates, including III/32912 Pnov-Predhradi - Sokolec, III/3399 and III/33914 Vlastejovice - Pavlovice, III/6031 Senohraby prutah, II/113 Divisov - Vlasim, II/329 Planany - Radim, III/11437 Bystrice - Nesvacily, and multiple II/112 reconstruction segments around Struharov / Domasin / Zdislavice.
- A targeted Kutna Hora / Caslav follow-up found useful 2026 candidates that the broad 2020-2025 archive missed: III/3368 Trebetin - Tasice, several Caslav airbase-area III-class repairs, Sobočice - Zasmuky, and Vlkova. Planned Caslav railway-overpass/prelozka items were skipped as out of the current driving-segment scope.
- The coverage audit added III/27215 Zdetin, III/1084 Jevany, II/126 D1 - Kutna Hora / Zruc second stage, and II/125 Lounovice pod Blanikem - Kamberk. II/126 and II/125 are current long-running 2026+ projects, so they are useful map candidates but need later completion verification.

## RSD / roads I. class

RSD is needed for roads I. class and for excluding actual motorway/freeway projects.

Known useful entry points:

- RSD site: <https://www.rsd.cz/>
- RSD geoportal road network map linked by SUSPk: <https://geoportal.rsd.cz/apps/silnicni_a_dalnicni_sit_cr_verejna/>

Next step: identify whether RSD has a public "stavby" JSON/API or use official project leaflets/pages for roads I. class around Pardubice, Hradec Kralove, Chrudim, Vysoke Myto, Svitavy, Kolin, Havlickuv Brod, and Jihlava.

## Still to inspect

- Jihomoravsky kraj / SUS JMK for the northern edge around Boskovice, Blansko, Tišnov.
- Olomoucky kraj / SSOK for Mohelnice, Zabreh, Litovel, Sumperk edge cases.
- Municipal sources only when a local road or city through-road is in scope.
