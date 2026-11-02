# Product Requirements — Job Application Evidence Planner

## Problem

Applicants often maintain job applications in one place and supporting evidence in another. This makes it difficult to see whether a role requirement is backed by a concrete project, internship, coursework item, or other experience, and whether the evidence is ready to be used.

## Primary user

A student, graduate, or early-career applicant preparing applications for multiple roles.

## Product goals

1. Keep application tracking and supporting evidence in one workspace.
2. Make the link between a job requirement and its supporting evidence explicit.
3. Preserve context about the applicant's actual contribution.
4. Make progress and evidence gaps easy to review.
5. Keep personal application data local by default.

## Core records

### Application

- Company
- Role title
- Job posting URL
- Application date
- Next action or follow-up step
- Notes

### Evidence item

- Related application or role requirement
- Requirement description
- Evidence title or project/experience reference
- Evidence URL, where available
- Applicant contribution
- Limitations or explanatory context
- Status: planned, in progress, or completed

## Core user workflows

### Add an application

The user records a company, role, job link, application date, and next step. The application should remain editable and searchable.

### Map a requirement to evidence

The user records a requirement from the role description and associates it with a relevant project, internship, coursework item, or other experience. The user can describe their own contribution and add limitations so the resulting evidence is not misleading.

### Review readiness

The user reviews the status of each evidence item and identifies requirements that still need supporting material.

### Export a report

The user can export a structured JSON snapshot of their application and evidence records. Exported data should preserve statuses and explanatory context.

## Non-goals for the initial release

- Automatically submitting job applications.
- Scraping job boards or collecting credentials.
- Generating fabricated achievements or metrics.
- Sending application data to external AI services.
- Multi-user collaboration or cloud synchronization.
- Ranking applicants or predicting hiring outcomes.

## Acceptance criteria

- Users can create, view, update, search, and delete application records.
- Users can create, view, update, search, and delete evidence records.
- Evidence status is preserved when records are exported.
- Empty states and invalid or missing input are handled clearly.
- Local data persistence works across browser reloads.
- Automated tests cover core data operations and export behavior.
- Documentation accurately describes implemented behavior and privacy boundaries.
