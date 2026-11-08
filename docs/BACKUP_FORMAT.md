# Backup Format and Compatibility

## Export envelope

New exports use a JSON object with these top-level fields:

- `schemaVersion`: integer identifying the backup contract (currently `2`).
- `exportedAt`: ISO-8601 UTC timestamp for when the snapshot was created.
- `applications`: application records.
- `evidence`: evidence records.

The browser downloads a snapshot only after the user selects **Export report**. The application does not upload the generated file.

## Compatibility rules

- Version 2 exports preserve application pipeline stage, follow-up date, evidence status, contribution, and context.
- Earlier exports without `schemaVersion` remain importable. Missing stage and follow-up fields are normalized to `saved` and an empty date.
- Unknown explicit schema versions are rejected instead of being guessed or silently rewritten.
- Matching IDs are updated; unrelated local records remain in place.
- The import is transactional: validation or write failure rolls back the import rather than leaving a partial merge.

## Import validation

The import path checks:
- Required fields and allowed application stages/evidence statuses.
- HTTP(S)-only optional URLs.
- Calendar-valid optional dates and ISO timestamps.
- Unique IDs and valid evidence-to-application references.
- Bounded text/URL lengths and a combined maximum of 10,000 imported records.
- A supported explicit schema version.

## Recovery guidance

Keep periodic JSON exports somewhere outside the browser profile. Clearing site data or losing the browser profile can permanently remove local IndexedDB records. Before importing a backup into a workspace that already contains records, understand that records with matching IDs are overwritten by the backup; unrelated IDs are retained.
