# Initial Release Checklist

This checklist is the release gate for Day 1. Items must be checked only after the work has actually been completed and verified.

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
- [x] Automated data-layer tests pass in a clean GitHub Actions environment (12 tests, commit `54fffc0`).
- [x] Production build succeeds (`tsc -b` and `vite build`, commit `54fffc0`).
- [x] UI component smoke tests pass in jsdom (2 tests, commit `54fffc0`).
- [x] Production browser walkthrough passed on desktop and a 390px mobile viewport (Playwright, Chromium 156).
- [x] Empty, invalid, and destructive-action states are covered by UI/repository checks and confirmed destructive-action dialogs.
- [x] Source review confirms the initial app stores user records in IndexedDB and has no application API or analytics integration.
- [x] `npm audit --audit-level=moderate` reports zero known vulnerabilities on latest successful CI run on commit `ba7e1f1`.

## Repository and delivery
- [x] Application source is committed. No npm lockfile is included; transitive dependency versions may change on future installs.
- [x] CI uses `npm install`, a blocking `npm audit --audit-level=moderate`, tests, and production build; latest successful run on commit `ba7e1f1`.
- [x] README setup instructions match the actual scripts.
- [x] Known limitations are documented (browser-local data, no cross-device sync or push notifications, manual backups).
- [x] Production deployment is READY at https://job-application-evidence-planner.vercel.app/ (HTTP 200).

## Completion rule

Day 1 is complete only when all required implementation and quality checks are verified. Documentation-only progress does not satisfy this release gate.

## Backup and restore
- [x] Exported report from populated browser workspace and parsed the JSON.
- [x] Imported the report into a fresh browser context and verified application/evidence records and their association.
- [x] Imported into a non-empty workspace and verified unrelated local records remain intact.
- [x] Automated tests verify malformed files, unsafe URLs, duplicate IDs, and dangling links are rejected.
