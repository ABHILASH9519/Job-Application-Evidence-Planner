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
- Export a structured JSON report and merge backups without deleting unrelated local records.

## Privacy and data handling

Application and evidence records are stored in the current browser's IndexedDB. The application does not require an account or application backend. It does not automatically sync records to another browser or device. Export is an explicit user action. Do not add analytics, external AI processing, or third-party data transfer without clear user consent and documentation.

## Project status

The Day 1 application is implemented and deployed at https://job-application-evidence-planner.vercel.app/. The production browser walkthrough passed on the latest Vercel build for application/evidence CRUD, pipeline stages, overdue follow-ups, evidence readiness, JSON export/import, local persistence, backup merge, deletion confirmation, privacy request checks, mobile overflow, and the evidence-search/application-selector regression.

GitHub Actions run `41693771287` passed on commit `949359c358d5106b8d239ac36f2088eb184f6c43`: 14 tests across 3 files, TypeScript checks, Vite production build, dependency installation, and `npm audit --audit-level=moderate` with zero known vulnerabilities.

| Area | Verified status |
| --- | --- |
| Application/evidence CRUD | Passed in repository tests and production browser walkthrough |
| Pipeline stages and follow-up dates | Passed in repository tests and production browser walkthrough |
| Evidence readiness | Passed in production browser walkthrough |
| Backup export/import/merge | Passed in repository tests and production browser walkthrough |
| Browser-local persistence | Passed in production browser walkthrough |
| Production build and dependency audit | Passed in GitHub Actions run `41693771287` |
| Production deployment | Vercel deployment READY; public URL returned HTTP 200 |

There is no committed npm lockfile. Direct dependencies are pinned in `package.json`, but transitive dependency resolution is not fully reproducible.

## Project documentation

- [Product requirements](docs/PRODUCT_SPEC.md)
- [Implemented architecture](docs/ARCHITECTURE.md)
- [Data model](docs/DATA_MODEL.md)
- [Test plan and verification report](docs/TEST_PLAN.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)
- [Contribution guidelines](CONTRIBUTING.md)

## Development

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Run automated tests and the production build:

```bash
npm test
npm run build
```

Follow-up reminders are displayed when the workspace is opened; there are no email reminders, push notifications, or background notifications. Browser site-data clearing can remove locally stored records, so export JSON backups periodically.

## Contributing

Keep changes focused and verifiable. Each commit should represent a meaningful product, documentation, test, or maintenance change. Do not create empty or cosmetic commits to inflate activity metrics.
