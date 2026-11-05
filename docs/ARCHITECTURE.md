# Implemented Architecture

## Runtime architecture

The initial release is a browser-based, local-first React application.

```text
User
 |
 v
React + TypeScript UI
 |
 v
Application repository / validation layer
 |
 v
Dexie data access
 |
 v
Browser IndexedDB (schema version 2)
 |
 +----> Versioned JSON export initiated by the user
 +<---- JSON backup import with validation and merge semantics
```

## Implemented technology

- React 18 for the user interface.
- TypeScript for application and record types.
- Vite 8 for development and production builds.
- Dexie 4 over IndexedDB for browser-local persistence.
- Vitest, jsdom, and fake-indexeddb for automated tests.
- GitHub Actions for reproducible dependency installation, dependency audit, unit/integration tests, production build, and Playwright runs across Chromium, Firefox, and WebKit.
- Vercel for static frontend deployment.

## Data boundaries

- Application and evidence records are stored in the browser's IndexedDB.
- No application API or server-side database is required.
- JSON export is an explicit user action.
- Import validates record shapes, schema version, bounded field lengths, safe HTTP(S) URLs, ISO timestamps, unique IDs, allowed stage/status values, record-count limits, and linked application references before merging.
- Dashboard analytics are computed locally from IndexedDB records; no application data is sent to an analytics provider.
- Date-only follow-up scheduling uses calendar-date arithmetic to avoid daylight-saving and UTC boundary drift.
- No external AI API or background synchronization is part of this release.
- User data does not sync between browsers or devices.

## Data integrity

- Records use stable identifiers.
- Application stages and evidence statuses are constrained to documented sets.
- Follow-up dates can be snoozed or cleared without deleting the associated application.
- Active applications untouched for more than 14 days are surfaced as review candidates; terminal offer/rejected stages are excluded.
- Pipeline stages can be updated directly from application cards, with repository-level validation.
- Applicant-authored contribution and context notes are preserved.
- Deleting an application preserves its evidence records and removes their application link.
- Import updates matching IDs and preserves unrelated local records.
- Schema version 2 backfills older application records with the default `saved` stage and an empty follow-up date.

## Quality and delivery

- Repository tests cover CRUD, validation, search, export, backup merge, legacy backup import, and data integrity.
- UI smoke tests cover the initial workspace and opening the application form.
- A production browser walkthrough exercised end-to-end workflows, reload persistence, backup merge, delete confirmations, privacy requests, and a mobile viewport.
- GitHub Actions checks lockfile-based dependency installation, vulnerability audit, unit/integration tests, production build, and Playwright browser flows across Chromium, Firefox, and WebKit.

## Known limitations

- No account, authentication, cloud sync, or multi-device data sharing.
- No recruiter email integration, push notifications, or background reminders.
- Cross-browser automation does not replace real Android/iOS device testing or a formal screen-reader/accessibility audit.
- Browser site-data clearing can remove locally stored records.
- Manual browser walkthrough coverage is limited to Chromium desktop and a 390px mobile viewport; other browsers and real devices have not been exhaustively tested.
