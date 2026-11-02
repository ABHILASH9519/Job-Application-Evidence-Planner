# Initial Architecture

## Architecture direction

The first release is designed as a browser-based, local-first application.

```text
User
 |
 v
React UI
 |
 v
Application data layer
 |
 v
IndexedDB (via Dexie)
 |
 +----> JSON export initiated by the user
```

## Proposed technology

- React for the user interface.
- TypeScript for application types and safer data handling.
- Vite for local development and production builds.
- Dexie over IndexedDB for browser-local persistence.
- Vitest and fake-indexeddb for automated data-layer tests.
- GitHub Actions for repeatable build and test checks.

These are the intended initial technologies; their presence in this document does not imply that builds or tests have already passed.

## Data boundaries

- Application records and evidence records are stored in the browser's IndexedDB.
- No server-side database is required for the initial local-first release.
- JSON export is an explicit user action.
- No analytics, external AI API, or background synchronization is part of the initial scope.
- Future remote storage would require a separate design covering authentication, authorization, encryption, retention, deletion, and user consent.

## Data integrity principles

- Use stable record identifiers.
- Keep evidence status values constrained to the documented set.
- Preserve applicant-authored contribution and limitation notes.
- Do not infer or invent achievements from a job description.
- Exports should include enough context to interpret each evidence item independently.

## Quality strategy

1. Unit-test data-layer operations.
2. Test persistence with an IndexedDB-compatible test environment.
3. Test export serialization, including status and context fields.
4. Run a production build in CI.
5. Perform a manual browser smoke test before declaring the release usable.

## Known limitations

This is an initial architecture record, not proof of a completed implementation. The application source, dependency installation, test execution, build verification, and browser testing must be completed and recorded separately.
