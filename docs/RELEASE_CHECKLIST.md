# Release Checklist

This checklist separates current PR verification from the remaining production and cross-platform release steps.

## Implementation
- [x] Application create, read, update, and delete flows.
- [x] Evidence create, read, update, and delete flows.
- [x] Evidence status transitions and readiness-status filtering.
- [x] Application pipeline stages and stage filtering.
- [x] Follow-up dates and overdue reminders.
- [x] Per-application evidence readiness.
- [x] Search across application and evidence records.
- [x] JSON export, versioned import, and merge behavior.
- [x] Browser-local IndexedDB persistence.
- [x] Preserve linked evidence when an application is deleted.

## Quality
- [x] 23 unit/integration tests pass in GitHub Actions run `42017725845`.
- [x] TypeScript checks and production build pass in GitHub Actions run `42017725845`.
- [x] 8 Chromium Playwright end-to-end tests pass in GitHub Actions run `42017725845`.
- [x] `npm audit --audit-level=moderate` reports zero vulnerabilities in GitHub Actions run `42017725845`.
- [x] Import validation rejects unsupported schemas, duplicate IDs, unsafe URLs, oversized data, and dangling relationships.
- [ ] Complete Firefox/WebKit (including Safari) browser coverage.
- [ ] Complete real Android/iOS device testing.
- [ ] Complete keyboard-only, screen-reader, and formal accessibility checks.

## Repository and delivery
- [x] Application source and documentation are committed.
- [x] `package-lock.json` is committed.
- [x] CI uses `npm ci`, dependency audit, unit/integration tests, production build, and Playwright Chromium E2E.
- [x] README and test documentation reflect current scripts and verification results.
- [ ] Merge PR #2 into `main` after review and explicit approval.
- [ ] Verify a fresh production deployment from the merged commit.
- [ ] Re-run the production smoke test against that exact deployment.

## Backup and restore
- [x] Exported report format is documented and versioned.
- [x] Browser test imports a populated backup and verifies the application/evidence relationship.
- [x] Repository tests verify atomic import behavior when linked records are invalid.
- [x] Repository tests verify merge does not delete unrelated local records.
- [x] Browser test rejects unsupported schema versions without creating records.
- [x] Browser test confirms evidence is preserved and unlinked when its application is deleted.

## Completion rule

The current PR branch has passed its automated CI gate (23 unit/integration tests, production build, dependency audit, and 8 Chromium E2E tests). Do not describe the project as fully released until PR #2 is reviewed and merged, the merged commit is deployed, and the production deployment is smoke-tested. Cross-browser and accessibility items remain outstanding.
