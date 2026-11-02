# Initial Release Checklist

This checklist is the release gate for Day 1. Items must be checked only after the work has actually been completed and verified.

## Implementation
- [ ] Application create, read, update, and delete flows work.
- [ ] Evidence create, read, update, and delete flows work.
- [ ] Evidence status transitions are validated.
- [ ] Search works across the documented fields.
- [ ] JSON export preserves all required data.
- [ ] Browser-local persistence survives reloads.

## Quality
- [ ] Automated tests pass in a clean environment.
- [ ] Production build succeeds.
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
