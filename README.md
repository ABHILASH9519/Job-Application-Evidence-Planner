# Job Application Evidence Planner

A privacy-first workspace for organizing job applications and mapping role requirements to concrete evidence from projects, internships, coursework, and professional experience.

## Current capabilities

- Track applications by company, role, job URL, application date, pipeline stage, follow-up date, next step, and notes.
- Move opportunities through Saved, Applied, Assessment, Interview, Offer, and Rejected stages.
- See overdue follow-ups and per-application completed-evidence readiness.
- Capture role requirements and connect each one to a project, experience, or evidence link.
- Record the applicant's contribution and relevant limitations or context.
- Track evidence progress as planned, in progress, or completed.
- Search and review application and evidence records.
- Filter opportunities by pipeline stage and evidence by readiness status.
- Export a structured JSON report and merge backups without deleting unrelated local records.
- Export application and evidence rows as spreadsheet-compatible CSV with formula-injection mitigation.
- Download a spreadsheet-friendly CSV export with linked-application context and formula-injection mitigation.

## Privacy and data handling

Application and evidence records are stored in the current browser's IndexedDB. The application does not require an account or application backend. It does not automatically sync records to another browser or device. Export is an explicit user action. Do not add analytics, external AI processing, or third-party data transfer without clear user consent and documentation.

## Project status

The current PR branch contains the Day 1 application, repository hardening, backup validation, evidence status filtering, and committed browser tests. The feature implementation was verified by successful GitHub Actions run **42017725845** on commit **aefb5760815918790895d2c0ec90342f9ee59f66**:

- `npm ci` using the committed `package-lock.json`.
- `npm audit --audit-level=moderate` with zero reported vulnerabilities.
- 31 unit/integration tests across 4 test files.
- TypeScript checks and the Vite production build.
- 10 Playwright end-to-end tests on Chromium (including CSV download, keyboard navigation, and mobile viewport checks).

PR #2 is still open and has not been merged. The [existing production deployment](https://job-application-evidence-planner.vercel.app/) may still serve an earlier release; do not treat it as the deployment of the current PR head until a fresh deployment is verified.

| Area | Current status |
| --- | --- |
| Application/evidence CRUD and pipeline stages | Implemented; unit and browser tests pass |
| Follow-up reminders and evidence readiness | Implemented; tested |
| Search and application-stage filtering | Implemented; tested |
| Evidence readiness-status filtering | Implemented; browser test passes |
| JSON export/import and backup merge validation | Implemented; repository and browser tests pass |
| CSV export for spreadsheet analysis | Implemented; serialization and download tests added |
| IndexedDB persistence and linked-evidence preservation | Implemented; browser tests pass |
| Reproducible dependency installation | `package-lock.json` committed; CI uses `npm ci` |
| Dependency audit, 23 unit/integration tests, production build | Passed in GitHub Actions run `42017725845` |
| Chromium browser E2E | 8/8 passed in GitHub Actions run `42017725845` |
| Current PR merge and production deployment | Pending; PR #2 has not been merged |

**Remaining release hardening:** Firefox/WebKit coverage, real Android/iOS device checks, keyboard-only and screen-reader testing, and a formal accessibility audit. The application remains browser-local: records do not sync across devices, and there are no email, push, or background reminders. Export JSON backups periodically because clearing browser site data can remove IndexedDB records.
## Project documentation

- [Product requirements](docs/PRODUCT_SPEC.md)
- [Implemented architecture](docs/ARCHITECTURE.md)
- [Data model](docs/DATA_MODEL.md)
- [Backup format and compatibility](docs/BACKUP_FORMAT.md)
- [CSV export format and safety](docs/CSV_EXPORT.md)
- [Test plan and verification report](docs/TEST_PLAN.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)
- [Contribution guidelines](CONTRIBUTING.md)

## Development

Requirements: Node.js 20 or newer and npm.

```bash
npm ci
npm run dev
```

Run automated tests, the production build, browser tests, and the dependency audit:

```bash
npm test
npm run build
npm run test:e2e
npm audit --audit-level=moderate
```

Follow-up reminders are displayed when the workspace is opened; there are no email reminders, push notifications, or background notifications. Browser site-data clearing can remove locally stored records, so export JSON backups periodically.

## Contributing

Keep changes focused and verifiable. Each commit should represent a meaningful product, documentation, test, or maintenance change. Do not create empty or cosmetic commits to inflate activity metrics.
