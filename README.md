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

The current implementation includes pipeline stages, follow-up dates with overdue reminders on the overview, stage filtering, and per-application evidence readiness. GitHub Actions verified 12 automated tests (10 repository/data tests and 2 UI smoke tests), the TypeScript check, the Vite production build, and a zero-vulnerability npm audit passed on commit `93be0b1`. A reproducible npm lockfile is now committed; the CI workflow uses `npm ci` and a blocking dependency audit.

This repository is being built incrementally. Product and architecture decisions are documented before the application implementation is marked complete.

| Area | Status |
| --- | --- |
| Product scope | Documented |
| Initial architecture | Documented |
| Application implementation | Local CRUD, search, pipeline stages, follow-up dates, evidence readiness, JSON export and merge-based import committed; runtime validation pending |
| Automated tests | 12 tests passed in GitHub Actions on commit `93be0b1` (10 data-layer, 2 UI smoke); rerun after lockfile/CI update |
| Production build | `tsc -b` and Vite 8 production build passed in GitHub Actions on commit `93be0b1`; rerun after lockfile/CI update |
| CI validation | Tests, production build, and zero-vulnerability audit passed; reproducible `npm ci` workflow is committed and awaiting its run |
| Deployment | Not configured |

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
npm ci
npm run dev
```

Run the automated test suite and production build:

```bash
npm test
npm run build
```

The application uses React, TypeScript, Vite, Dexie/IndexedDB, and Vitest. The initial release stores data in the current browser. Export a JSON backup periodically; importing a backup merges records by ID, updates matching IDs, and preserves unrelated local records. Clearing browser site data can still remove locally stored records.

## Contributing

Keep changes focused and verifiable. Each commit should represent a meaningful product, documentation, test, or maintenance change. Do not create empty or cosmetic commits to inflate activity metrics.
