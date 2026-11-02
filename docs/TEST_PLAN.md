# Test Plan

This plan defines the minimum checks required before calling the initial release usable. It is a checklist, not a report of tests already run.

## Data-layer tests

- Create an application and verify generated identity and stored fields.
- Read an application by identifier.
- Update application fields and verify the updated timestamp behavior.
- Delete an application and verify the documented evidence relationship policy.
- Create evidence with each supported status.
- Reject unsupported evidence status values.
- Update contribution and context without losing other fields.
- Delete an evidence item.
- Verify search behavior for company, role, requirement, and evidence title.

## Persistence tests

- Create records, close/reopen the database connection, and verify records remain.
- Verify the database can be initialized when no prior data exists.
- Verify schema upgrades preserve existing records when a version change is introduced.

## Export tests

- Export an application with multiple evidence items.
- Verify all supported statuses are preserved exactly.
- Verify contribution, context, URLs, and dates are present when supplied.
- Verify empty collections export as valid JSON.
- Verify exported JSON can be parsed by a standard JSON parser.

## UI smoke tests

- Create, edit, search, and delete an application.
- Create, edit, search, and delete evidence.
- Change evidence status and confirm the visible state updates.
- Check empty states, required-field validation, and invalid URL handling.
- Reload the page and verify saved records remain.
- Test a narrow mobile viewport and a desktop viewport.
- Confirm destructive actions are clear and deliberate.

## Privacy checks

- Confirm the initial application does not require an account.
- Confirm application data is not sent to an application backend.
- Confirm there are no analytics or external AI requests.
- Confirm export only occurs after an explicit user action.

## Release gate

Do not mark the project complete until automated tests pass, a production build succeeds, and the UI smoke tests above have been performed. Record actual commands, outcomes, and any known failures in the README or a release note.
