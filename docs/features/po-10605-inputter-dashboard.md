# PO-10605 inputter dashboard

The Cases landing page now offers **Create cases** at
`/cases/draft/create-and-manage/tabs#in-review`. **Create a case** starts the existing
`/cases/create-casefile/case-type` journey with cleared local form and review state.
The dashboard and persisted shells require the existing `release-1c-rm-create-case-files`
flag, an active authenticated user, and permission **21** (Create and Manage Draft Casefiles)
in maintenance Business Unit **44**. Permission in another business unit does not grant access.

PO-10605 follows the approved design amendment to AC2 and AC6: Approved contains only PUBLISHED.
PUBLISHING_PENDING remains outside all four inputter tabs until publication completes.
Account numbers are read-only; checker work, persisted details, amendment, resubmission and the
cross-user rejected list remain future-ticket work. No new release flag or dependency is introduced.

## Lists and publication

| Tab       | Exact status filter     | Date filter                  | Default sort                   |
| --------- | ----------------------- | ---------------------------- | ------------------------------ |
| In review | `SUBMITTED,RESUBMITTED` | None                         | Created ascending              |
| Rejected  | `REJECTED`              | None                         | Rejected status date ascending |
| Approved  | `PUBLISHED`             | Status date, past seven days | Approval timestamp ascending   |
| Deleted   | `DELETED`               | Status date, past seven days | Deleted status date ascending  |

Approved and Deleted use the shared `DateService.getDateRange(7, 0)` date range
through `casefile_status_from_date` and `casefile_status_to_date`. The publication
status date defines inclusion; `validated_date` supplies the Approved display and
sort timestamp. They are different fields and may represent different days.
Pending publication cases deliberately remain absent until their status becomes PUBLISHED.

GET `/opal-maintenance-service/draft-casefiles` is scoped to BU 44 and the current
BU-specific string user ID in `submitted_by`. A separate rejected badge request
uses `casefile_status=REJECTED&restrict=counts` outside the Rejected tab. On Rejected,
the badge derives from the list response count. Counts do not expose other users'
personal summaries. List and badge failures and Retry actions remain independent;
malformed list payloads show an error instead of a false empty result.

Pagination and every displayed column's two-way sorting are local. Pages contain
25 rows; pagination appears above 25 results. No server page or sort parameters
are invented. Account comparisons support numeric values, missing values sort last,
and draft IDs settle ties. Published respondent/applicant/minor account numbers
are plain text in their original sequence; null, absent or blank values display an em dash.

## Return routes and protected shells

Dashboard metadata (`tab`, `page`, `sort`, `direction`) travels in internal URLs and
in memory; personal summaries are never persisted in browser storage. Returning
reloads current rows, retains selection and clamps pages when the collection shrinks.
Changing identity or losing permission clears dashboard state.

| Destination  | Route                                                        | Current behaviour                |
| ------------ | ------------------------------------------------------------ | -------------------------------- |
| Case details | `/cases/create-casefile/check-case-details/:draftCasefileId` | Protected two-thirds-width shell |
| Amendment    | `/cases/create-casefile/task-list/:draftCasefileId`          | Protected two-thirds-width shell |
| All rejected | `/cases/draft/create-and-manage/rejections`                  | Protected full-width shell       |

Links open in the same browser tab. The shells focus their heading, provide Back
with dashboard metadata, and do not issue singular case GETs, hydrate a creation
form, mutate casefiles or offer account actions. IDs must be canonical positive safe decimal integers, without signs or leading zeros;
malformed IDs display safe recovery copy. A full journey LLD update is not applicable
because persisted details, amendment and the cross-user rejected list are incomplete
placeholder destinations.

Case Type Cancel asks before leaving a dirty draft. Dismiss preserves selections;
accept discards local creation state and returns to the originating dashboard selection
(or default In review for direct creation). Review cancellation offers Go back and
confirmed discard with the same return boundary. Retrying failed cancellation navigation
does not repeat discard. Creation resets preserve dashboard metadata. Browser history
cannot recover the discarded form.

Submission confirmation's **See your cases in review** resets In review to page 1 and
Created ascending. **Create a new case** starts directly at empty Case Type with the
existing failure recovery behaviour. Confirmation does not replay submission.

## Verification boundaries

Functional and accessibility features use synthetic HTTP summaries and identity data
with the established login flow. They assert scoped requests, independent Retry, native
keyboard navigation, focus, same-tab returns, permission denial and read-only publication.
Axe and 320 CSS-pixel reflow are partial accessibility evidence. Screen-reader announcements,
native browser Leave/Cancel outside Cypress's shared unload suppression, deployed provider
scopes/date semantics and actual publication snapshots require recorded environment/manual
verification. Existing release-off selection verifies protected routes with the app configured
disabled; the selection script itself does not change the flag.

The Jira epic remains unconfirmed and is not inferred from adjacent stories. Required
metadata validation must be rerun with the confirmed epic before the ticket is represented
as complete. CI, external Sonar Quality Gate, reviewer approval, QA, deployment, flag
activation and ticket closure require their own evidence.
