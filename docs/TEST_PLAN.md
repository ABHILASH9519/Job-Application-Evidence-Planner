# Test Plan and Verification Report

This document distinguishes current branch CI verification from an earlier manual production walkthrough.

## Current automated verification

Successful GitHub Actions verification run: **42017725845** on commit `aefb5760815918790895d2c0ec90342f9ee59f66`.

| Check | Result |
| --- | --- |
| `npm ci` | Passed using the committed npm lockfile |
| `npm audit --audit-level=moderate` | Passed; zero reported vulnerabilities |
| `npm test` | 23 tests passed across 3 files |
| TypeScript and Vite production build | Passed |
| Playwright Chromium E2E | 8 tests passed |

The unit/integration tests cover application and evidence CRUD, stage and status validation, date validation, linked evidence preservation, search, report export, backup merge, legacy backup compatibility, duplicate IDs, unsafe URLs, dangling application references, IndexedDB migration, bounded input fields, and atomic backup import behavior.

The browser suite covers:
- Create an application, select a pipeline stage, and verify it in the application list.
- Create evidence linked to an application and mark it completed.
- Filter evidence by completion status.
- Search applications and clear the search.
- Export a JSON report.
- Reload the workspace and verify IndexedDB persistence.
- Import a versioned backup and verify the application/evidence relationship.
- Reject an unsupported backup schema without creating records.
- Delete an application and verify its linked evidence is preserved as general evidence.

## Previously recorded production browser walkthrough

A separate manual/scripted walkthrough was previously performed against a READY Vercel production deployment using Playwright 1.64.1 and Chromium 156. That deployment predates the current PR changes and is not evidence that the current PR head is deployed.

The recorded walkthrough covered:
- Load the deployed application and render the empty workspace.
- Create and edit an application; set its pipeline stage and an overdue follow-up date.
- Create and edit linked evidence; mark it completed.
- Filter applications by stage and verify evidence readiness.
- Search for evidence and verify the related-application selector still lists all applications.
- Verify the overdue reminder appears on the overview.
- Export the report and parse the downloaded JSON.
- Reload and verify IndexedDB persistence.
- Import the report into a fresh browser context and verify the application/evidence relationship.
- Merge into a non-empty workspace without deleting an unrelated local application.
- Confirm delete dialogs and delete evidence/application records.
- Check a 390px mobile viewport for horizontal overflow.
- Observe browser requests; no third-party or external application-data requests were made.

## Privacy and data handling

- No account or application backend is required.
- Application and evidence records are stored in browser IndexedDB.
- The deployed app serves static frontend assets; records are not sent to an application API.
- Export happens only after the user's explicit action.
- Data does not automatically sync across browsers or devices.

## Known limitations and pending hardening

- Firefox and WebKit/Safari browser coverage is not yet in CI.
- Real Android/iOS device testing remains outstanding.
- Keyboard-only, screen-reader, and formal accessibility-audit coverage remains outstanding.
- No cross-device synchronization, login/account system, recruiter email integration, push notifications, or background reminders.
- Follow-up reminders are displayed when the user opens the workspace.
- Browser site-data clearing can remove IndexedDB records; users should export JSON backups periodically.
- The current PR has not been merged or redeployed to production.

## Release gate

The current PR branch passed dependency installation, dependency audit, all 23 unit/integration tests, the production build, and all 8 committed Chromium browser tests in GitHub Actions run **42017725845**. Cross-browser and formal accessibility checks remain pending, and production deployment must be verified after merge.
