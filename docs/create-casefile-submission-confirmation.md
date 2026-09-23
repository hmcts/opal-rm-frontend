# Create casefile submission confirmation

[PO-9819](https://hmcts.atlassian.net/browse/PO-9819), part of epic PO-6506, completes the temporary frontend submission journey.

Submission is an in-memory frontend mock in `OpalMaintenanceService.submitCasefile()`.
It does not create or save a backend case. `CasesCreateCasefileCompletionService` retains only the
result; it does not submit, generate identifiers or make API calls.
An eligible Submit action generates one transient `draft_casefile_id`, clears the whole draft and
review context, then navigates to `/cases/create-casefile/submission-confirmation`. The identifier
is never rendered, announced, logged or included in a URL.

Both “Create a new case” and “See your cases in review” currently start an empty case-type page.
Entering that page or leaving the journey clears completion state. A reload, new tab or direct
confirmation URL without completion state redirects to case-type. Browser Back cannot restore
an accepted draft. A failed confirmation navigation retains the result and retries navigation
only; it never submits a second time or restores case data.

The confirmation uses the shared GOV.UK panel with one heading, “You’ve submitted this case for
review”, followed by “Next steps” and the two links. Initial focus moves to the heading; the
heading is not a normal Tab stop. Primary navigation remains hidden throughout the journey.

Existing authentication and account guards remain in place. New Business Unit-scoped casefile
permission checks, action visibility and submission-time authorisation are explicitly deferred
by the requester to a later delivery. This change does not establish the numeric permission or
Business Unit mapping and does not claim PAC1–PAC3 coverage.

There is no new feature flag, persistence, API contract, dependency or configuration in this delivery.
Future API integration must define the real response type, failure/idempotency behaviour and
In Review destination while retaining reset-after-success semantics. The later permissions
work must apply the confirmed Maintenance Business Unit contract to entry visibility, direct
route access and submission.
