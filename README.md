# Job Application Evidence Planner

A privacy-first workspace for organizing job applications and mapping role requirements to concrete evidence from projects, internships, coursework, and professional experience.

## Why this exists

A strong application is easier to prepare when each role requirement is connected to specific, verifiable evidence. This project is intended to help applicants track opportunities, identify evidence gaps, and prepare consistent application material without losing the context behind each claim.

## Planned capabilities

- Track applications by company, role, job URL, application date, next step, and notes.
- Capture role requirements and connect each one to a project, experience, or evidence link.
- Record the applicant's contribution and relevant limitations or context.
- Track evidence progress as planned, in progress, or completed.
- Search and review application and evidence records.
- Export a structured application evidence report as JSON.

## Privacy and data handling

The initial product direction is local-first: application and evidence records should remain in the user's browser unless an explicitly documented export or future sync feature is used. Do not add analytics, external AI processing, or third-party data transfer without clear user consent and documentation.

## Project status

This repository is being built incrementally. Product and architecture decisions are documented before the application implementation is marked complete.

| Area | Status |
| --- | --- |
| Product scope | Documented |
| Initial architecture | Documented |
| Application implementation | Pending source upload and validation |
| Automated tests | Pending execution |
| CI validation | Pending execution |
| Deployment | Not configured |

## Development (planned)

The initial implementation scaffold uses React, TypeScript, Vite, Dexie/IndexedDB, and Vitest. Once the source files are available in the repository, install dependencies and run the package scripts defined in `package.json`.

## Contributing

Keep changes focused and verifiable. Each commit should represent a meaningful product, documentation, test, or maintenance change. Do not create empty or cosmetic commits to inflate activity metrics.
