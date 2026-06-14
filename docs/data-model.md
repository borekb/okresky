# Candidate Data Model

This project should separate raw source records from normalized catalog rows.

## Raw source record

Keep downloaded data unchanged in `resources/raw/<source>/`. A raw source record can have inconsistent field names, date formats, and geometry quality.

## Candidate row

A candidate row is a parsed but not fully verified roadwork item.

Suggested fields:

- `id`: stable internal id, e.g. `apdos-pardubice-189`
- `source`: source short name
- `source_url`: URL of the page/API/file where the item came from
- `source_record_id`: id from the upstream system, if available
- `title`: original title
- `road_number`: normalized road number, e.g. `II/322`
- `road_class`: `I`, `II`, `III`, `local`, `unknown`
- `project_kind`: `reconstruction`, `surface_repair`, `bridge`, `intersection`, `bypass_new_build`, `maintenance`, `unknown`
- `status`: original or normalized status
- `start_date_raw`
- `end_date_raw`
- `start_year`
- `completion_year`
- `active_years`: list or range for multi-year projects
- `lat`
- `lon`
- `geometry_source`: `source_point`, `source_line`, `geocoded`, `manual`, `unknown`
- `location_quality`: `exact`, `approximate`, `placeholder`, `unknown`
- `cost_ex_vat`
- `cost_total`
- `motorway_context`: true if the row is related to D35/D11/D1 etc. but the repaired road itself is lower class
- `scope_status`: `in_scope`, `probably_in_scope`, `out_of_scope`, `needs_review`
- `notes`

## Year semantics

Use `completion_year` for the first year-by-year catalog, because many official records state when the project ended. Add `active_years` later so multi-year works can appear in every year they affected.

Example: a road reconstructed from 08/2020 to 07/2021 has `completion_year = 2021`, but `active_years = [2020, 2021]`.

## Classification rules

- Exclude actual motorway rows such as `Komunikace = D35`.
- Keep roads I. class unless they are clearly motorway/freeway projects.
- Keep roads II/III even when title mentions D35, if the work is on a lower-class road.
- Mark bridge-only works as `bridge` rather than dropping them.
- Mark rows with coordinates around `50.0, 14.7` as `placeholder`; these are not usable map positions.
