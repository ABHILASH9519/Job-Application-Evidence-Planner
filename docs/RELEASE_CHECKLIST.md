# Initial Release Checklist

This checklist distinguishes verified Day 1 functionality from outstanding repository and platform hardening. Items are checked only after the work has actually been completed and verified.

## Implementation
- [x] Application create, read, update, and delete flows work (repository tests and production browser walkthrough).
- [x] Evidence create, read, update, and delete flows work (repository tests and production browser walkthrough).
- [x] Evidence status transitions are validated.
- [x] Application pipeline stages are validated and can be updated.
- [x] Follow-up dates are saved and overdue dates are highlighted.
- [x] Per-application evidence readiness reflects completed versus mapped evidence.
- [x] Search works across the documented fields.
- [x] JSON export preserves all required data; import/export and merge behavior were verified.
- [x] Browser-local persistence survives reloads.

## Quality
- [x] Automated data-layer and schema migration tests pass in GitHub Actions (14 tests across 3 files, run `41694236806` on commit `0ec4211446a600a57a13af274afe5fe43f9c303e`).
- [x] Production build succeeds (`tsc -b` and `vite build`, GitHub Actions run `41694236806`).
- [x] UI component and search-filter regression tests pass in jsdom (3 tests, GitHub Actions run `41694236806`).
- [x] Production browser walkthrough passed on the latest recorded Vercel build, including the evidence-search regression and a 390px mobile viewport (Playwright, Chromium 156; manual/scripted walkthrough, not a committed CI suite).
- [x] Source review confirms the initial app stores user records in IndexedDB and has no application API or analytics integration.
- [x] `npm audit --audit-level=moderate` reports zero known vulnerabilities on GitHub Actions run `41694236806`.
- [ ] Commit an npm lockfile and switch CI to `npm ci` for reproducible dependency installation.
- [ ] Commit the Playwright end-to-end suite and run it in GitHub Actions.
- [ ] Complete Firefox/Safari, real Android/iOS, keyboard-only, screen-reader, and formal accessibility checks.

## Repository and delivery
- [x] Application source is committed.
- [ ] Dependency lockfile is committed; current CI still uses `npm install`.
- [x] CI runs dependency installation, a blocking `npm audit --audit-level=moderate`, tests, and production build; run `41694236806` passed.
- [x] README setup instructions match the actual scripts.
- [x] Known limitations are documented (browser-local data, no cross-device sync or push notifications, manual backups).
- [x] Production deployment is READY at https://job-application-evidence-planner.vercel.app/ (previously verified HTTP 200).

## Backup and restore
- [x] Exported report from populated browser workspace and parsed the JSON.
- [x] Imported the report into a fresh browser context and verified application/evidence records and their association.
- [x] Imported into a non-empty workspace and verified unrelated local records remain intact.
- [x] Automated tests verify malformed files, unsafe URLs, duplicate IDs, and dangling links are rejected.

## Completion rule

The Day 1 functional scope is implemented and its recorded automated and browser checks passed. Do not mark the remaining hardening items complete until the lockfile, committed browser suite, and cross-platform/accessibility checks have actually been completed.
