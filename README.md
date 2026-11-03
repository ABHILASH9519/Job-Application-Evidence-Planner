# Job Application Evidence Planner

A privacy-first workspace for organizing job applications and mapping role requirements to concrete evidence from projects, internships, coursework, and professional experience.

## Why this exists

A strong application is easier to prepare when each role requirement is connected to specific, verifiable evidence. This project is intended to help applicants track opportunities, identify evidence gaps, and prepare consistent application material without losing the context behind each claim.

## Current capabilities

- Track applications by company, role, job URL, application date, pipeline stage, follow-up date, next step, and notes.
- Move opportunities through Saved, Applied, Assessment, Interview, Offer, and Rejected stages.
- See overdue follow-ups and per-application completed-evidence readiness.
- Capture role requirements and connect each one to a project, experience, or evidence link.
- Record the applicant's contribution and relevant limitations or context.
- Track evidence progress as planned, in progress, or completed.
- Search and review application and evidence records.
- Export a structured application evidence report as JSON.
- Import a JSON backup by merging records; matching IDs are updated and unrelated local records are preserved.

## Privacy and data handling

The initial product direction is local-first: application and evidence records should remain in the user's browser unless an explicitly documented export or future sync feature is used. Do not add analytics, external AI processing, or third-party data transfer without clear user consent and documentation.

## Project status

The Day 1 application is implemented and deployed. The production browser walkthrough passed against the live Vercel site, including CRUD, pipeline stages, overdue follow-ups, evidence readiness, JSON export/import, local persistence, merge behavior, privacy checks, and a 390px mobile viewport. GitHub Actions passed 12 automated tests, TypeScript checks, the Vite production build, dependency installation, and a blocking npm audit with zero known vulnerabilities on the commit `ba7e1f1`. The workflow uses `npm install`; a complete npm lockfile is not included, so transitive dependency resolution is not fully reproducible.

| Area | Status |
| --- | --- |
| Product scope | Documented |
| Initial architecture | Documented |
| Application implementation | CRUD, search, pipeline stages, follow-ups, evidence readiness, export/import, and IndexedDB persistence verified in production browser walkthrough |
| Automated tests | 12 tests passed in GitHub Actions on commit `54fffc0` (10 data-layer, 2 UI smoke) |
| Production build | `tsc -b` and Vite 8 production build passed in GitHub Actions on commit `54fffc0` |
| CI validation | Dependency installation, tests, production build, and `npm audit --audit-level=moderate` passed; zero known vulnerabilities; 12 tests passed on commit `ba7e1f1` |
| Deployment | Vercel production deployment READY; public URL returns HTTP 200 |

## Project documentation

- [Product requirements](docs/PRODUCT_SPEC.md)
- [Initial architecture](docs/ARCHITECTURE.md)
- [Data model](docs/DATA_MODEL.md)
- [Test plan](docs/TEST_PLAN.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)
- [Contribution guidelines](CONTRIBUTING.md)

## Development

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Run the automated test suite and production build:

```bash
npm test
npm run build
```

The application uses React, TypeScript, Vite, Dexie/IndexedDB, and Vitest. Application records stay in the current browser's IndexedDB; they are not synced between browsers or devices and there is no account, backend, email reminder, or push notification service. Follow-up reminders are shown when the workspace is opened. Export a JSON backup periodically; importing a backup merges records by ID, updates matching IDs, and preserves unrelated local records. Clearing browser site data can still remove locally stored records.

## Contributing

Keep changes focused and verifiable. Each commit should represent a meaningful product, documentation, test, or maintenance change. Do not create empty or cosmetic commits to inflate activity metrics.
