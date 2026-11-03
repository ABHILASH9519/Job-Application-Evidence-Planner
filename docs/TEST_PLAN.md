# Test Plan and Verification Report

This document records the checks actually performed for the Day 1 release.

## Automated verification

Latest verified commit: `949359c358d5106b8d239ac36f2088eb184f6c43` (GitHub Actions run `41693771287`, success).

GitHub Actions completed successfully with:
- `npm install` — completed (dependencies are exact-pinned directly in `package.json`; there is no committed lockfile).
- `npm audit --audit-level=moderate` — zero known vulnerabilities.
- `npm test` — 14 tests passed across 3 test files (10 repository/data-layer tests, 3 UI component tests, and 1 IndexedDB migration test) on run `41693771287`.
- `npm run build` — TypeScript project check and Vite production build passed.

The repository tests cover application and evidence CRUD, stage and status validation, date validation, linked evidence preservation, search, report export, backup merge, legacy backup compatibility, duplicate IDs, unsafe URLs, dangling application references, and IndexedDB v1-to-v2 migration with preservation of linked evidence. UI tests cover initial rendering, opening the application form, and keeping application choices available while evidence search filters the lists.

## Production browser walkthrough

Performed against the latest READY Vercel production deployment using Playwright 1.64.1 and Chromium 156.

**PASS** One end-to-end workflow passed, covering:
- Load the deployed application and render the empty workspace.
- Create and edit an application; set its pipeline stage and an overdue follow-up date.
- Create and edit linked evidence; mark it completed.
- Filter applications by stage and verify evidence readiness.\n- Search for evidence with a term that does not match the employer and verify the related-application selector still lists all applications.
- Verify the overdue reminder appears on the overview.
- Export the report and parse the downloaded JSON, including stage and evidence status.
- Reload and verify IndexedDB persistence.
- Import the report into a fresh browser context and verify the application/evidence relationship.
- Merge into a non-empty workspace without deleting an unrelated local application.
- Confirm delete dialogs and delete evidence/application records.
- Check the 390px mobile viewport for horizontal overflow.
- Observe browser requests during the workflow; no third-party or external application-data requests were made.

## Privacy and data handling

- No account or application backend is required.
- Application and evidence records are stored in browser IndexedDB.
- The deployed app serves static frontend assets; records are not sent to an application API.
- Export happens only after the user's explicit action.
- Data does not automatically sync across browsers or devices.

## Known limitations

- No cross-device synchronization, login/account system, recruiter email integration, push notifications, or background reminders.
- Follow-up reminders are displayed when the user opens the workspace.
- Browser site-data clearing can remove IndexedDB records; users should export JSON backups periodically.
- Manual browser verification was performed on desktop and a 390px mobile viewport, not on every browser/device combination.

## Release gate

Automated checks, production build, security audit, and the production browser walkthrough passed. The Day 1 release is ready for use within the limitations listed above.
