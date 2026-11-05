# Job Application Evidence Planner

A privacy-first workspace for organizing job applications and mapping role requirements to concrete evidence from projects, internships, coursework, and professional experience.

## Current capabilities

- Track applications by company, role, job URL, application date, pipeline stage, follow-up date, next step, and notes.
- Move opportunities through Saved, Applied, Assessment, Interview, Offer, and Rejected stages.
- See overdue follow-ups, application pipeline distribution, and evidence completion/linkage analytics.
- Capture role requirements and connect each one to a project, experience, or evidence link.
- Record the applicant's contribution and relevant limitations or context.
- Track evidence progress as planned, in progress, or completed.
- Search and review application and evidence records.
- Filter opportunities by pipeline stage and evidence by readiness status.
- Sort applications by update time, company, follow-up date, or pipeline stage; sort evidence by update time, requirement, or status.
- Export a structured JSON report and merge backups without deleting unrelated local records.
- Export application and evidence rows as spreadsheet-compatible CSV with formula-injection mitigation.
- Download a spreadsheet-friendly CSV export with linked-application context and formula-injection mitigation.

## Privacy and data handling

Application and evidence records are stored in the current browser's IndexedDB. The application does not require an account or application backend. It does not automatically sync records to another browser or device. Export is an explicit user action. Do not add analytics, external AI processing, or third-party data transfer without clear user consent and documentation.

## Project status

The current PR branch contains the Day 1 application, repository hardening, backup validation, evidence status filtering, CSV export, sorting, cross-browser Playwright coverage, and dashboard analytics. The baseline implementation passed GitHub Actions run **42017725845**; subsequent changes are being re-verified on the current PR head.

- `npm ci`, moderate-level dependency audit, unit/integration tests, and the production build passed on the baseline CI run.
- The latest three-browser run passed dependency installation, audit, unit/integration tests, and production build, but exposed stale Playwright selectors in keyboard-navigation and JSON-export tests.
- Those selectors have been corrected; dashboard analytics and focused unit/E2E tests have since been added. The latest CI result is pending.

PR #2 is still open and has not been merged. The [existing production deployment](https://job-application-evidence-planner.vercel.app/) may still serve an earlier release; do not treat it as the deployment of the current PR head until a fresh deployment is verified.

| Area | Current status |
| --- | --- |
| Application/evidence CRUD and pipeline stages | Implemented; unit and browser tests pass |
| Follow-up reminders and evidence readiness | Implemented; tested |
| Search and application-stage filtering | Implemented; tested |
| Application and evidence sorting | Implemented; sorting E2E coverage added |
| Pipeline distribution and evidence readiness analytics | Implemented; unit and browser regression tests added |
| Evidence readiness-status filtering | Implemented; browser test passes |
| JSON export/import and backup merge validation | Implemented; repository and browser tests pass |
| CSV export for spreadsheet analysis | Implemented; serialization and download tests added |
| IndexedDB persistence and linked-evidence preservation | Implemented; browser tests pass |
| Reproducible dependency installation | `package-lock.json` committed; CI uses `npm ci` |
| Baseline dependency audit, unit/integration tests, production build | Passed in GitHub Actions run `42017725845`; current head re-verification pending |
| Three-browser Playwright suite | Current head verification pending after fixing stale test selectors |
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
