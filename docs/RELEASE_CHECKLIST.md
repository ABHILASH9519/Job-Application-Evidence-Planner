# Initial Release Checklist

This checklist is the release gate for Day 1. Items must be checked only after the work has actually been completed and verified.

## Implementation
- [ ] Application create, read, update, and delete flows work.
- [ ] Evidence create, read, update, and delete flows work.
- [ ] Evidence status transitions are validated.
- [ ] Application pipeline stages are validated and can be updated.
- [ ] Follow-up dates are saved and overdue dates are highlighted.
- [ ] Per-application evidence readiness reflects completed versus mapped evidence.
- [ ] Search works across the documented fields.
- [ ] JSON export preserves all required data.
- [ ] Browser-local persistence survives reloads.

## Quality
- [x] Automated data-layer tests pass in a clean GitHub Actions environment (10 tests, commit `d7f00a6`).
- [x] Production build succeeds (`tsc -b` and `vite build`, commit `d7f00a6`).
- [ ] UI smoke tests pass on desktop and mobile-sized viewports.
- [ ] Empty, invalid, and destructive-action states are handled.
- [ ] No unexpected network transmission of personal application data occurs.

## Repository and delivery
- [ ] Source and lockfile are committed.
- [ ] CI installs dependencies reproducibly and runs tests and build.
- [ ] README setup instructions match the actual scripts.
- [ ] Known limitations are documented.
- [ ] Release artifact or deployment is available, if deployment is in scope.

## Completion rule

Day 1 is complete only when all required implementation and quality checks are verified. Documentation-only progress does not satisfy this release gate.

## Backup and restore
- [ ] Export a report from a populated browser workspace and confirm the JSON can be parsed.
- [ ] Import that report into a fresh workspace and verify all records and links are restored.
- [ ] Import a report into a non-empty workspace and verify unrelated records remain intact.
- [ ] Verify malformed files, unsafe URLs, duplicate IDs, and dangling links are rejected.
