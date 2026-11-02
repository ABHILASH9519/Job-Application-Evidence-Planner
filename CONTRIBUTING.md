# Contributing

Thanks for helping improve Job Application Evidence Planner.

## Principles

- Keep the product local-first and privacy-conscious.
- Preserve the applicant's own wording and context.
- Never fabricate achievements, metrics, qualifications, or evidence.
- Prefer small changes that can be tested and reviewed.
- Keep documentation aligned with behavior that actually exists.

## Change workflow

1. Read the product requirements and architecture notes in `docs/`.
2. Make one focused change at a time.
3. Add or update tests for behavior changes.
4. Run the relevant test and build commands before reporting success.
5. Update documentation when behavior, data fields, or privacy boundaries change.
6. Use a commit message that describes the actual change.

## Commit quality

Good commits represent a meaningful feature, fix, test, refactor, or documentation improvement. Do not create empty commits, duplicate content, or cosmetic changes solely to increase the commit count.

## Privacy-sensitive changes

Any proposal to add accounts, remote storage, analytics, telemetry, third-party APIs, or AI processing must explain:
- What data leaves the browser.
- Why the transfer is necessary.
- Which service receives the data.
- How consent, retention, deletion, and access control work.

Do not introduce such behavior as an undocumented side effect.
