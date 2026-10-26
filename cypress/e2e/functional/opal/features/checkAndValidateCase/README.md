# PO-10626 concurrency and recovery QA

The two feature files retain **14 examples: eight functional and six accessibility**. The current executable selection
is **13: seven functional and six accessibility**. Each example creates its own synthetic submitted draft through
the normal authenticated Maintenance API, preserving browser time for the decision/amendment and recovery journey.
The case-creation journey regressions continue to use the real UI; this API setup does not replace their coverage.
Scenario retries remain disabled. PATCH/PUT monitors count all browser attempts, including attempts after the injected
fault. Lost-response examples withhold Fetch delivery only after a real upstream HTTP 200; independent authenticated GETs verify the
saved aggregate, quoted ETag, original ID, actor and complete timeline delta. Definite-failure examples return one
controlled HTTP 400 before dispatch and require an explicit live retry. Conflict examples advance the real resource
with an independent authenticated request while the browser retains its earlier ETag.

## PO-10611 frontend integration

Run this pack on the `codex/PO-10611` frontend foundation (integration base `275011b2`), including its inherited
common UI `0.0.114`. Recovery actions use the maintained checker and create-casefile route constants and assert
the rendered Continue, Delete case, deletion heading and Submit for review controls. Keep retained-context,
no-replay and recovery assertions intact when the actual runtime fails them. Definite-failure and ambiguous examples still require retained editing context. Conflict examples assert the
actual shared concurrency-failure page and recover through Cases, the actor dashboard, the saved-status tab and
the exact owned respondent row. Recovery observes an HTTP 200 collection response for the target statuses
(`SUBMITTED,RESUBMITTED` for resubmission or `REJECTED` for checker recovery), excluding count requests. The
observer is registered before entering the dashboard so an initially active In review tab can use its initial list
response. Recovery then waits for the rendered table or empty-state hook; both are absent during list loading.
Once that destination/list is ready, the row locator resets to page one and traverses native pagination,
using native Enter for keyboard recovery. It returns the exact row without opening it and fails on invalid IDs,
absent owned rows or pagination that repeats or fails to advance. Only a fresh GET and full rendered winning aggregate/history satisfy recovery.

Use an isolated build from this checkout for local integration, for example `http://localhost:5100`. Verify its
process working directory and build SHA before execution. Install with `corepack yarn install --immutable` using
the inherited lockfile; a `node_modules` symlink to another checkout can load the wrong common UI contract.
Keep other local frontend instances running on their existing ports. Local passwordless configuration, approved
private AAD values and release overrides belong in the isolated process environment, never tracked files.

## Runtime prerequisites

- FE at `TEST_URL` with persisted checker review, deletion and rejected-case amendment foundations. The test-only
  detail interface supplies no production routes or behavior. Missing product foundations fail the test.
- Real Maintenance POST/GET/PATCH/PUT and testing-support publication/cleanup endpoints. Configure
  `TESTING_SUPPORT_ENDPOINTS_ENABLED=true` in the target Maintenance runtime, including migration V1_49 and the
  publication observation journal. The blocked draft backend PR must be verified in the actual runtime; do not assume
  it has merged. Enable the existing `release-1c-rm-create-case-files` release separately.
- Existing synthetic inputter `opal-test@dev.platform.hmcts.net`: ACTIVE, Maintenance BU 44 permission 21.
- Existing synthetic checker `opal-test-10@dev.platform.hmcts.net`: ACTIVE, Maintenance BU 44 permission 22, with a
  distinct BU user ID. Optional `PO10626_INPUTTER_EMAIL` and `PO10626_CHECKER_EMAIL` select other already-provisioned
  synthetic users. Setup verifies actual permissions and distinct IDs without creating users or changing access.
- Reference data valid for the target environment. Setup uses the existing active United Kingdom Country,
  Create Casefile Application and MAT metadata; do not copy integration-test IDs into a live environment.

The API seed explicitly supplies `restrict_personal_information: false` for both synthetic individuals, matching
the ordinary UI creation/amendment payload. Full aggregate equality remains required after the one forename
correction; the fixture is canonical before mutation rather than normalizing the saved result.

## Lost-response fault boundary

The fault forwards the real PATCH/PUT and records its HTTP 200 and ETag at the network boundary. A scoped,
one-shot Fetch wrapper then rejects that successful response before Angular receives it. It matches the exact
origin, resource ID and method, preserves other responses and errors, counts application dispatches separately
from network attempts, and restores its original Fetch owner at test end. This proves loss at Fetch response
delivery, not every possible socket failure. Closing the Chromium socket with `forceNetworkError` caused a wire
retry despite exactly one application Fetch call in the isolated live diagnostic, so socket destruction is not
used for this fault. No 503 or fabricated success substitutes for a committed upstream response.

## Owner-scoped publication evidence

The fixed authenticated route is
`/opal-maintenance-service/testing-support/draft-casefiles/{id}/publication-evidence`.
POST registers the observation before the tested mutation; GET reads it after recovery. Both send the exact
`Test-Run-Reference` marker and require the current inputter who owns the draft, with permission 21 in its stored BU.
Neither takes a caller-supplied URI or request body. An unregistered GET returns 409. Registration accepts 201 or
idempotent 200 and requires a complete zero-attempt baseline.

```json
{
  "observation_id": "12345678-1234-4234-8234-123456789abc",
  "registered_at": "2026-10-23T12:00:00Z",
  "send_attempt_count": 0,
  "acknowledged_send_count": 0,
  "uncertain_send_count": 0,
  "unfinished_send_count": 0,
  "evidence_complete": true
}
```

These seven fields describe producer sends, independently of consumer redelivery. Counts must be nonnegative safe
integers; attempts equal acknowledged plus uncertain plus unfinished sends, and complete evidence has neither
uncertain nor unfinished sends. Registration occurs in inputter setup, after any rejected prerequisite and before
switching to the checker or opening the browser journey. After every UI and Axe assertion, the final shared
`publication evidence confirms no duplicate case publication` step restores the inputter session and reads evidence.
Restoring `cy.session` navigates away, so no UI assertion may follow it. The observation identity/time must remain
unchanged; approval requires exactly one send attempt and acknowledgement, and all other journeys require zero.
Missing, malformed, incomplete or discontinuous evidence fails. There is no partial-success evidence mode.

Before cleanup, the final step writes only ID, exact marker and the safe before/after evidence fields to
`functional-output/po10626/publication-{marker}-{id}.json`. No names, cookies, payloads or casefile snapshots belong
in that file. The existing single cleanup hook restores the receipt's inputter and uses the exact marker with
`DELETE /opal-maintenance-service/testing-support/draft-casefiles/{id}`. All receipts are persisted before any request;
only 204 clears a receipt. Non-204 and transport failures retain receipts and fail acceptance. There is no body,
If-Match, preceding cleanup GET or `ignore_missing` query.

## Pending AC1 approval

The lost-response approval row remains under `@skip @PO10626RequiresPublishedCleanup`. The runner excludes `@skip`
by default; inventory explicitly includes it. The feature records the dependency verbatim:

```gherkin
# BE dependency: PO-10629 consumer and published-account cleanup are outstanding.
# Current DELETE rejects PUBLISHING_PENDING and PUBLISHED with 409.
# Retain this AC1 approval example; remove its pending tags only after the
# delivered cleanup contract and a full live approval/recovery run are verified.
```

The approval status assertion also records:

```ts
// BE dependency: successful approval can remain PUBLISHING_PENDING until the
// PO-10629 consumer is delivered. Producer evidence proves send attempts and
// acknowledgments, not account creation. Published lifecycle cleanup remains
// required before the pending approval example can satisfy full AC1 acceptance.
```

A 13-example pass does not satisfy all of AC1 or complete PO-10626. Remove those tags only after the delivered
cleanup contract and a full owned approval, recovery, evidence and cleanup run are verified. An issue being marked
done is insufficient. `PUBLISHING_FAILED` cleanup eligibility does not authorise deliberately forcing publication
failure. Never broaden deletion eligibility, reset lifecycle state or clear failed receipts to obtain a pass.

`PO10626_DEFER_CLEANUP` remains an existing helper capability for explicitly configured localhost-only deferred
receipts. These new fixtures always require cleanup and do not use it. It cannot provide acceptance evidence.
Preserve outstanding receipts and raw reports in an ignored local directory before any runner resets outputs.

## Discovery and live execution

Full inventory includes the pending row; discovery executes no browser actions. The installed preprocessor always
skips `@skip`; `omitFiltered=false` exposes it as pending, giving **14 inventoried: 13 dry-run passes + 1 pending**.
Without that inventory-only override, the default `omitFiltered=true` hides the row even when the tag expression
includes it. The parsed Gherkin inventory retains all 14 expanded names/rows/tags:

```bash
TEST_URL=http://localhost:5100 \
TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626' \
CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626' \
corepack yarn test:functional:leaf --browser=chrome \
  --spec 'cypress/e2e/functional/opal/features/checkAndValidateCase/DraftCasefileConcurrency.feature,cypress/e2e/functional/opal/features/checkAndValidateCase/DraftCasefileConcurrencyAccessibility.feature' \
  --env 'dryRun=true,omitFiltered=false,tags=@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626'
```

Current executable discovery selects 13 examples:

```bash
TEST_URL=http://localhost:5100 \
TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626 and not @skip' \
CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626 and not @skip' \
corepack yarn test:functional:leaf --browser=chrome \
  --spec 'cypress/e2e/functional/opal/features/checkAndValidateCase/DraftCasefileConcurrency.feature,cypress/e2e/functional/opal/features/checkAndValidateCase/DraftCasefileConcurrencyAccessibility.feature' \
  --env 'dryRun=true,tags=@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626 and not @skip'
```

Actual browser execution uses the supported 13-case selection:

```bash
TEST_URL=http://localhost:5100 \
TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626 and not @skip' \
CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626 and not @skip' \
corepack yarn test:functional:leaf --browser=chrome \
  --spec 'cypress/e2e/functional/opal/features/checkAndValidateCase/DraftCasefileConcurrency.feature,cypress/e2e/functional/opal/features/checkAndValidateCase/DraftCasefileConcurrencyAccessibility.feature' \
  --env 'PO10626_DEFER_CLEANUP=false,tags=@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626 and not @skip'
```

The explicit lowercase `tags` value overrides any inherited Cucumber selection. Require real registration before the
mutation, final evidence after all UI/Axe checks, and successful owned cleanup for every executed example. Preserve
raw outputs and compare expanded names/tags/counts. Run the unaffected live creation/cleanup regression separately;
its real UI instructions remain in the [main guide](../../../../../../docs/CYPRESS_E2E_TESTING.md):

```bash
TEST_URL=http://localhost:5100 \
TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10273 and not @skip' \
CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10273 and not @skip' \
corepack yarn test:functional:leaf --browser=chrome \
  --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/CheckCaseDetails.feature' \
  --env 'tags=@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10273 and not @skip'
```

## Support verification

```bash
corepack yarn test:component:leaf --browser=chrome --spec 'cypress/component/checkAndValidateCase/draft-casefile-table-support.cy.ts,cypress/component/checkAndValidateCase/api-fixture-support.cy.ts,cypress/component/checkAndValidateCase/concurrency-support.cy.ts,cypress/component/checkAndValidateCase/cleanup-policy.cy.ts,cypress/component/createDraftCasefile/draft-casefile-cleanup.cy.ts'
corepack yarn exec tsc -p e2e.tsconfig.json --noEmit
corepack yarn exec tsc -p cypress/tsconfig.json --noEmit
corepack yarn lint:cypress
corepack yarn exec opal-cypress-check-new-tests-jira-metadata --component-root cypress/component/checkAndValidateCase --feature-root cypress/e2e/functional/opal/features/checkAndValidateCase
corepack yarn check:cypress:test-metadata
corepack yarn find:duplicate:scenarios
```

Controlled table support proves later-page lookup, page-one reset, native keyboard pagination and fail-closed
handling against controlled DOM; it does not prove live conflict recovery. Live acceptance requires 26 independently
owned eligible records created through maintained normal API fixtures, retained cleanup receipts, and a recovery
target beyond page one. Run the conflict functional/accessibility cases and verify one stale UI attempt, one fresh
selected GET, unchanged winner and final publication evidence.

Controlled support regressions verify API fixture boundaries, registration/read contracts and failures, forwarding
before interruption, later requests, rejection handling, explicit retry, lossless versions, evidence validation,
receipt persistence and owner restoration before DELETE. Cleanup covers 204, 400/401/403/404/409/500/503 and transport
failure before any deletion or after a 204. These helpers do not prove live backend behavior or browser ordering.

Accessibility examples retain shared Axe checks before and after native keyboard recovery, with no new exemptions.
The deletion functional example also uses native Tab/Enter and scans its recovery destination. These are partial
accessibility results. Full traversal, visible focus, screen-reader announcements and magnification need specialist
assurance. Native beforeunload dialogs remain suppressed by the existing suite; application discard-confirmation
coverage does not establish native browser dialog behavior. Keep CI, reviewer approval, QA, deployment and all
unexecuted acceptance evidence pending.

## PO-10628 live inputter monitoring

`InputterCasefileMonitoring.feature` contains **11 enabled functional examples** (seven scenarios, including two
outlines expanded to four and two examples). `InputterCasefileMonitoringAccessibility.feature` contains **five
enabled broad accessibility scenarios**. All carry `@R1CRmCreateCaseFiles`, `@functional`,
`@JIRA-LABEL:create-draft-casefile`, `@JIRA-STORY:PO-10628`, `@JIRA-EPIC:PO-10817`, appropriate `@AC1`–`@AC6` tags
and `@retries(0)`. There are no pending/skip tags. Each scenario constructs fresh flow/actions/fixture state.

| AC  | Enabled examples and assertions                                                                                                                                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC1 | Own SUBMITTED, REJECTED, PUBLISHED and DELETED records appear only in their matching tabs. Four date-window examples consult at actual persisted lifecycle D+7 and D+8; only Approved/Deleted use inclusive calendar filters. In review/Rejected omit both dates.                                                                          |
| AC2 | Empty and populated personal Rejected both reach the real complete Business Unit rejection list. Empty setup requires genuinely zero personal rejections and leaves unrelated data alone.                                                                                                                                                  |
| AC3 | Own plus a provisioned second inputter's rejected IDs and owning actors are present. Exactly 26 owned personal rejected records exercise sort, next/previous and page retention. The selected other-owned ID receives a fresh real GET and reaches amendment; Back restores the actual captured own page/sort/visible IDs without a write. |
| AC4 | Actual PUBLISHED detail supplies positive IDs and all respondent/applicant/two minor-creditor numbers, rendered in creditor sequence as exact read-only text. Separate stable PUBLISHING_PENDING coverage requires null IDs/numbers and a visible row with only missing-number indicators.                                                 |
| AC5 | Successful authorised entry precedes an existing ACTIVE denied user's direct dashboard attempt; no counts, rows, collection GETs or writes are exposed.                                                                                                                                                                                    |
| AC6 | Five separate scenarios scan every visited meaningful page/state with the shared strict Axe step: populated tabs, genuinely empty tabs, pagination/All rejected/amendment/return, published multi-account row and actual denied destination. Native Enter and focus checks cover tabs, sorting, next/previous and Back links.              |

Setup uses `InputterMonitoringFixtureActions`, normal authenticated POST and fresh-ETag lifecycle changes with a
distinct checker. Every successfully created ID immediately has required owner/marker cleanup, including setup
failure. No shared fixture records, synthetic lifecycle dates, fabricated successful business responses, permission
changes, queue manipulation or unowned deletion are used. Other-inputter creation restores the primary inputter
before dashboard consultation. All rejected is BU-wide and has neither submitter nor date filters; assertions use
owned IDs and actor fields rather than assuming the shared BU contains only this scenario's work. Amendment entry
is covered here; complete resubmission belongs to PO-10623.

### Real prerequisites and current blocked acceptance

The inspected 23 October 2026 local Maintenance runtime is **incompatible**: exact revision is unverified, packaged
and installed migrations end at V1_34/1.34, no publication consumer/repository classes were found, and V1_49
observation tables/routes are absent. A healthy service and a configured queue do not establish publication or
cleanup. No live PO-10628 browser/API fixture mutation or approval was executed against that runtime. Future-facing
scenarios remain enabled; discovery and controlled support passes do not satisfy their acceptance. Delivery is
**Not Agent Complete** until real acceptance and outstanding repository/external gates pass.

Before live execution, an operator must verify:

- The exact deployed compatible Maintenance build and the frontend checkout/process on isolated port 5100; leave
  the existing frontend on port 5000 untouched. Verify release `release-1c-rm-create-case-files=true` separately.
- Actual list/count/detail POST/GET/PATCH behavior, authoritative quoted ETags, full persisted dates/timeline and
  BU44 permission enforcement. Enable existing `TESTING_SUPPORT_ENDPOINTS_ENABLED` and owner/marker DELETE cleanup.
  This monitoring pack does not call publication-observation endpoints; if running the adjacent PO-10626 pack,
  verify its V1_49 observation migration and fixed evidence route as documented above.
- A functioning real publication consumer, procedure and `rm-publish-draft-casefile-queue`, reaching PUBLISHED with
  complete generated IDs/numbers for one respondent, one applicant and two sequenced minor creditors. Independently
  verify existing ID/marker cleanup returns HTTP204 for pending/published graphs; HTTP409 is a failure.
- Existing synthetic ACTIVE Maintenance BU44 permission21 inputter and independent permission22 checker. Defaults
  remain `opal-test@dev.platform.hmcts.net` / `opal-test-10@dev.platform.hmcts.net`; established
  `PO10626_INPUTTER_EMAIL` / `PO10626_CHECKER_EMAIL` overrides select provisioned identities. Supply explicit
  `PO10628_SECOND_INPUTTER_EMAIL` for a different existing permission21 actor. The denied account defaults to the
  already provisioned `opal-test-4@dev.platform.hmcts.net` (`PO10628_DENIED_EMAIL` override); verify ACTIVE Maintenance
  membership and absence of BU44 permission21. Tests never grant permissions or create users.
- Live active unique UK CJS Country, Create Casefile application and compatible MAT Order Term metadata. Empty
  examples need genuinely empty own collections; pagination needs an empty personal Rejected baseline before its
  26 owned creates. Fail conflicting prerequisites without deleting unrelated data.
- The backend's inclusive calendar-date/timezone semantics agree with AUT local calendar consultation. Date-window
  examples read actual lifecycle timestamps and advance only AUT Date; timers and server/database clocks stay real.
- Independently verified nonproduction stable-pending configuration for the pending example; the test does not
  suspend services. A fast consumer reaching PUBLISHED fails that pending fixture.

Ordinary SUBMITTED/REJECTED/DELETED, empty and permission examples require only their own verified endpoints,
identities and cleanup; they do not require publication readiness. A later read-only capability check confirmed
ordinary POST/list/detail/PATCH/PUT routes and enabled testing support, but the running cleanup accepts **only
SUBMITTED**. Thus REJECTED/DELETED/RESUBMITTED fixtures also remain unsafe on this runtime, independently of publication. Approval guards apply only to scenarios creating
PUBLISHED/PUBLISHING_PENDING records (including the populated lifecycle scenarios). No live execution of any subset
is authorised until its actual runtime capability is verified.

Only after the corresponding operator preflights may external runner configuration supply boolean
`PO10628_PUBLICATION_CLEANUP_VERIFIED=true` and, for stable pending, `PO10628_STABLE_PENDING_VERIFIED=true`.
The steps never set these guards. Flags alone are not verification evidence. Missing capabilities are explicit
failures, with retained cleanup receipts; do not skip scenarios or manufacture success.

### Commands and evidence boundary

Use Node24.22.1 / Corepack Yarn4.18.1 and independently installed immutable dependencies. All three tag selectors
must match exactly. **Discovery only** executes no AUT or real fixture creation. In this installed Cypress version,
both wrapper and direct CLI `--config '{"baseUrl":null}'` attempts retained the configured URL and failed readiness
before any specs ran. Use a local ignored discovery config to set the testing-type baseUrl explicitly, preserving
the actual preprocessor, registry and reporting hooks:

```bash
mkdir -p docs/superpowers
cat > docs/superpowers/po10628-discovery.config.ts <<'CONFIG'
import config from '../../cypress.config';
if (!config.e2e || typeof config.e2e !== 'object') throw new Error('Expected existing E2E configuration');
config.e2e.baseUrl = null;
export default config;
CONFIG
```

```bash
TEST_URL=http://localhost:5100 \
TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10628' \
CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10628' \
corepack yarn exec cypress run --browser chrome --config-file docs/superpowers/po10628-discovery.config.ts \
  --spec 'cypress/e2e/functional/opal/features/checkAndValidateCase/InputterCasefileMonitoring.feature,cypress/e2e/functional/opal/features/checkAndValidateCase/InputterCasefileMonitoringAccessibility.feature' \
  --env 'dryRun=true,tags=@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10628'
```

This local config stays ignored; do not commit it. Discovery is no acceptance evidence. Use the maintained
wrapper for ordinary live runs, where its existing reporting/reset behavior remains applicable.

Expected discovery inventory is **16 examples (11 functional + 5 accessibility), zero skipped/pending**. For live
acceptance, after verified runtime and explicit execution authorisation, replace `corepack yarn exec cypress run
--browser chrome` with `corepack yarn test:functional:leaf --browser=chrome`, remove
`--config-file docs/superpowers/po10628-discovery.config.ts` and remove `dryRun=true,` from `--env`; retain all identical tag selectors. This invokes
real authentication, owned creation, decisions, publication polling, dashboard navigation, strict Axe and required
cleanup. Preserve raw outputs and failed receipts before any runner reset.

Controlled helper verification is separate:

```bash
corepack yarn exec cypress run --browser chrome --component \
  --spec 'cypress/component/checkAndValidateCase/inputter-monitoring-journey-support.cy.ts'
corepack yarn exec tsc -p e2e.tsconfig.json --noEmit
corepack yarn exec tsc -p cypress/tsconfig.json --noEmit
corepack yarn check:cypress:test-metadata
corepack yarn find:duplicate:scenarios
```

The helper spec checks literal DST/month/year/leap-day calendar expectations and that snapshot/DOM account
assertions reject missing, extra, reordered, pending or interactive numbers. Its DOM and snapshots are deliberately
controlled and cannot prove live publication or accessibility. Complete the full local frontend preflight in
`docs/SONAR.md`; external CI/Sonar/security/review/QA remain pending without direct evidence. Specialist screen-reader
announcement/order checks and magnification/reflow checks across populated, empty, paginated, published and denied
states remain pending on a compatible runtime; strict Axe is partial accessibility evidence and uses no exemptions.

### Pending specialist verification

| Check                    | Required setup                                                                                                                                         | Expected result                                                                                                                                                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screen reader            | Compatible live runtime and owned populated/empty/paginated/published/denied states, supported screen reader/browser combination, native keyboard only | Tab labels/current state and rejected count are announced meaningfully; sort direction and page changes are announced once; focus reaches the new heading or row after navigation; generated account numbers are read in respondent/applicant/creditor-sequence order and expose no link action; denied content reveals no counts or case data. |
| Magnification and reflow | Same owned states at 200% and 400% zoom plus 320 CSS-pixel viewport, keyboard only                                                                     | Headings, tabs, empty messages, return links, pagination and read-only account values remain readable and operable without clipping or lost focus; any table horizontal scrolling stays within its labelled region.                                                                                                                             |

These are pending human/specialist checks, not claimed outcomes. Every scenario must still complete its required
owner/marker cleanup; retain failed receipts if the runtime cannot return204.

### Submitted-only capability selection

`@PO10628SubmittedOnly` identifies exactly **four enabled examples**: the SUBMITTED D+7/D+8 outline row, functional
denial, accessibility genuinely empty tabs and accessibility denial. They create only SUBMITTED records or none;
they perform no decisions/amendment writes. The tag is attached only to the SUBMITTED Examples block and those
three scenarios; the overall inventory stays16. It is a selection tag, never a skip or acceptance waiver.

After final review, actual submitted cleanup/authentication/reference-data preflight and explicit live execution
authorisation, this subset can be attempted independently of transitioned/publication readiness. Exact selection:

```bash
TEST_URL=http://localhost:5100 \
TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10628 and @PO10628SubmittedOnly' \
CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10628 and @PO10628SubmittedOnly' \
corepack yarn test:functional:leaf --browser=chrome \
  --spec 'cypress/e2e/functional/opal/features/checkAndValidateCase/InputterCasefileMonitoring.feature,cypress/e2e/functional/opal/features/checkAndValidateCase/InputterCasefileMonitoringAccessibility.feature' \
  --env 'tags=@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10628 and @PO10628SubmittedOnly'
```

For **subset discovery only**, replace the wrapper with `corepack yarn exec cypress run --browser chrome`, add `--config-file docs/superpowers/po10628-discovery.config.ts` (created above) and add `dryRun=true,` before lowercase `tags=`;
expect **4 dry-run examples (2 functional + 2 accessibility)**, with no live evidence. The Task3 implementation agent
ran no live calls. A future four-example live pass cannot satisfy the remaining12 examples or complete PO-10628.

The All rejected accessibility journey uses accessibility-aware owned-row and amendment-location delegates. They
invoke the same maintained strict scanner as the shared accessibility step on the initial collection page and
every traversed page, after each ascending/descending sort, and after every search/return pagination transition
before leaving that state. Functional callers keep their read-only assertions without enabling these additional
scans. Controlled support dispatch checks prove state-by-state scanner invocation and stop-on-failure behavior;
they do not establish live Axe acceptance.

## PO-10625 independent checker decisions

The completed feature pair contains 22 examples: 13 functional and 9 accessibility. Its core decision coverage
comprises 10 functional examples: Submitted publication with two minor
creditors, Resubmitted approval, Submitted/Resubmitted rejection, Submitted/Resubmitted blank-reason validation,
self-review, permission denial, and stale approve/reject. `CheckerReviewDecisionsAccessibility.feature` contains
six independent broad journeys: publication, rejection, blank validation, self-review, denied permission, and
stale approval. These core decision examples carry `@R1CRmCreateCaseFiles`, `@JIRA-STORY:PO-10625`, `@JIRA-EPIC:PO-10817`,
`@JIRA-LABEL:create-draft-casefile`, `@AC1`, and `@retries(0)`; the accessibility examples also carry
`@accessibility`. The six checker outcome-window/empty examples below complete the 22-example inventory.
No example is skipped or pending.

Every Given creates fresh data with the exact E2E marker and required cleanup receipt. Positive fixtures require
independent ACTIVE BU 44 inputter permission 21 and checker permission 22 identities. The self-review negative
alone uses the same dual-role identity. Denied tests authenticate `PO10625_DENIED_EMAIL` (default provisioned
`opal-test-4@dev.platform.hmcts.net`), verify its actual user-state lacks BU 44 permission 22, require the actual
access-denied route and absence of case data, then restore the owner before independent GET and cleanup.

Before any rejection, approval or resubmission fixture creation, the operator must verify compatible lifecycle
cleanup and set **boolean** `PO10625_LIFECYCLE_CLEANUP_VERIFIED=true` in the live runner. This is a safety guard,
not evidence of delivered cleanup. Approval additionally requires the maintained
`PO10628_PUBLICATION_CLEANUP_VERIFIED=true` publication preflight. Never enable either switch automatically for
live execution. Current Submitted-only cleanup cannot support these transitions; a missing prerequisite is an
unrun or failed journey, never a passing acceptance result. Preserve required cleanup receipts on failure.

Queue list/count/detail and UI PATCH observations pass through real provider responses. Queue scope requires
BU 44, `not_submitted_by` the checker and exactly `SUBMITTED,RESUBMITTED`, without date filtering. The actual
owned row is found through real pagination, and its matching detail GET establishes the original opaque ETag.
A successful decision requires one UI dispatch, one PATCH, HTTP 200, an advanced ETag, exact additional checker
history and the maintained dashboard notice; the owned row must disappear from the provider collection and all
rendered To review pages. Rejection follows the owning inputter's real rejected row into its saved history.

Publication requires actual GET polling to **PUBLISHED**, complete respondent/applicant accounts and both minor
creditors. Every account ID and number must exist; all four numbers must match the exact inputter Approved row,
in persisted creditor sequence, as read-only text without links, inputs or buttons. `PUBLISHING_PENDING` is only
a receipt state, `PUBLISHING_FAILED` and polling timeout fail full acceptance. No publication observation endpoint
or manufactured completion is used. A stale UI decision competes with an actual API rejection bearing
`Synthetic winning concurrent decision`, then requires one original-ETag UI attempt, HTTP 409, the shared safe
conflict page and a fresh GET exactly equal to the winner.

Blank-reason validation requires `Enter reason for rejection`, the maintained native summary-link activation
focusing the reason textarea, its inline ARIA association, zero PATCH and a fresh unchanged aggregate/ETag/history.
The maintained shared summary uses an emitted field identity; its literal href is not an acceptance contract.
Accessibility validation corrects the reason without submitting. Accessibility journeys use the shared strict Axe
scanner with native Space to select checker decisions, Tab from Reject to the revealed reason and from that reason
to Continue, native Enter activation, heading and tab focus checks, and scans for every meaningful visited state including
pagination, success notices, inputter outcomes, conflict, read-only and denied states. These scans provide partial
automated accessibility evidence. The real Angular persisted-review component additionally proves native Space,
Tab through the conditional reason to Continue, and ArrowUp selecting Approve and removing the reason, with no
mutation. Helper dispatch checks support this evidence; they do not prove Angular rendering or live provider
behavior. Screen-reader use and full WCAG 2.2 AA assessment remain external checks.

Controlled support (synthetic boundaries, no live journey):

```bash
corepack yarn exec cypress run --component --browser chrome \
  --spec 'cypress/component/checkAndValidateCase/checker-review-journey-support.cy.ts,cypress/component/checkAndValidateCase/inputter-monitoring-journey-support.cy.ts'
```

Discovery only (22 examples: 13 functional + 9 accessibility; no browser actions or live fixtures):

```bash
TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10625' \
CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10625' \
corepack yarn exec cypress run --browser chrome --config '{"baseUrl":null}' \
  --spec 'cypress/e2e/functional/opal/features/checkAndValidateCase/CheckerReviewDecisions.feature,cypress/e2e/functional/opal/features/checkAndValidateCase/CheckerReviewDecisionsAccessibility.feature' \
  --env 'dryRun=true,omitFiltered=false,tags=@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10625'
```

Live, only after external runtime/cleanup preflight and parent-coordinated reviews, using the same exact selection:

```bash
TEST_URL=http://localhost:5100 \
TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10625' \
CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10625' \
corepack yarn test:functional:leaf --browser=chrome \
  --spec 'cypress/e2e/functional/opal/features/checkAndValidateCase/CheckerReviewDecisions.feature,cypress/e2e/functional/opal/features/checkAndValidateCase/CheckerReviewDecisionsAccessibility.feature' \
  --env 'tags=@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10625'
```

Controlled support establishes helper assertions and scanner dispatch. Discovery establishes inventory, metadata
and bindings. Neither establishes live authorization, real publication, provider persistence or cleanup success.
Do not report live AC1 acceptance until the full actual UI/API/publication/inputter/cleanup run succeeds.

### PO-10625 checker outcome windows and empty states (AC6, AC7)

The completed checker pair contains **22 expanded examples: 13 functional and 9 accessibility**, with no skipped or
pending scenarios. Task3 adds independent Rejected and Deleted calendar-window examples plus a genuinely empty
checker dashboard, and a separate accessibility example for each. Existing decision scenario identities remain unchanged.

| Added coverage                  | Business assertions                                                                                                                                                           | Accessibility states                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Rejected calendar window        | Owned ID present in real collection and every-page DOM at D0, D3, D7 and D8; exact BU44 / checker exclusion; no date query parameters                                         | Native Cases entry, initial focused heading, selected-tab focus and every consultation/pagination page   |
| Deleted calendar window         | Owned ID included D0/D3/D7 and excluded D8 in both actual collection and every-page DOM; exact inclusive from/to dates                                                        | Same independently owned journey and strict scans at every visited state                                 |
| Genuine empty checker dashboard | Four actual zero-row/zero-count list preflights, separate real Rejected/Failed zero count preflights, exact empty text, no rows/badges on all four tabs, no creation/deletion | Initial entry and each To review/Rejected/Deleted/Failed tab with native keyboard/focus and strict scans |

`CheckerDashboardWindowFlow` resets its Actions per Given/accessibility journey. The lifecycle safety guard
`PO10625_LIFECYCLE_CLEANUP_VERIFIED` must be **boolean true**, externally verified before **any** Rejected/Deleted
creation. Maintained normal API fixtures use distinct ACTIVE Maintenance BU44 permission21 inputter and permission22
checker, fresh ETags and receipt-owned marker cleanup. The inspected runtime cleans up Submitted only: **do not run
these window fixtures live until compatible lifecycle cleanup is verified**. The switch itself is not evidence and
must never self-enable in live setup. Empty scenarios create no data, require the existing checker actor and fail on
unrelated eligible work; they never delete it.

The actual persisted `casefile_status_date` anchors independent `monitoringCalendar` expectations. Each D0/D3/D7/D8
consultation installs `cy.clock(now, ['Date'])` in the AUT and restores it before the next consultation. Timers,
server/database clocks and stored timestamps remain real. Actual list/count responses pass through unchanged;
checker queries use `not_submitted_by` (never personal `submitted_by`). Calendar visits permit unrelated authorised
BU work and compare only the exact scenario-owned ID across real pagination. Native same-tab activation retains
focus without expecting a nonexistent new request; changing tabs waits for the fresh list and all outcome counts.
Initial routed entry requires heading focus; subsequent native tab selection requires selected-tab focus.

Controlled verification (no live acceptance):

```bash
corepack yarn exec cypress run --component --browser chrome \
  --spec 'cypress/component/checkAndValidateCase/checker-dashboard-window-support.cy.ts,cypress/component/checkAndValidateCase/checker-review-fixture-support.cy.ts,cypress/component/checkAndValidateCase/checker-review-journey-support.cy.ts'
```

For discovery only, retain the existing repository hooks and explicitly disable the base URL:

```bash
TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10625' \
CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10625' \
corepack yarn exec cypress run --browser chrome --config '{"baseUrl":null}' \
  --spec 'cypress/e2e/functional/opal/features/checkAndValidateCase/CheckerReviewDecisions.feature,cypress/e2e/functional/opal/features/checkAndValidateCase/CheckerReviewDecisionsAccessibility.feature' \
  --env 'dryRun=true,omitFiltered=false,tags=@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10625'
```

Require 13+9 discovered cases with zero undefined/ambiguous/skipped/pending bindings. Controlled helper checks and
dry discovery do not prove live AC6/AC7 acceptance. Parent review and authorised compatible-runtime execution remain
outstanding. Specialist checks should traverse all four outcome tabs with screen reader and magnification, verify
announcements and focus after native entry/tab/pagination changes, and confirm inclusive backend calendar timezone
semantics using an owned persisted outcome; expected visibility is exactly the table above. Strict Axe scans retain
the maintained exemption policy only and remain partial WCAG evidence.

### PO-10625 Submitted-only and self-review selections

The `@PO10625SubmittedOnly` selector covers exactly eight examples whose fixture setup creates at most
Submitted records or creates no data. Functional selections are Submitted blank-reason validation, self-review,
denied permission and genuine empty outcomes. Accessibility selections are validation, self-review, denied
permission and genuine empty outcomes. Resubmitted validation and every transition/publication/window fixture
remain outside this selector. `@PO10625Self` tags only the two self-review examples and is a subset of the eight.
All 22 examples remain enabled with their existing names, order, native example indices, business steps and guards.

| Selection                       | Exact tag expression                                                                            | Expanded examples                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------ |
| Full inventory                  | `@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10625`                                                | 22 (13 functional + 9 accessibility) |
| Submitted-only compatible setup | `@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10625 and @PO10625SubmittedOnly`                      | 8 (4 + 4)                            |
| Self-review diagnosis           | `@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10625 and @PO10625Self`                               | 2 (1 + 1)                            |
| Submitted-only excluding self   | `@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10625 and @PO10625SubmittedOnly and not @PO10625Self` | 6 (3 + 3)                            |

Use matching `TAGS`, `CYPRESS_TAGS` and lowercase `tags` for every selection. For discovery only, use the same
feature pair, a null E2E base URL and `dryRun=true,omitFiltered=true`; the last setting omits unselected examples
without reporting them as skipped or pending. For example, the six-example selection is:

```bash
TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10625 and @PO10625SubmittedOnly and not @PO10625Self' \
CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10625 and @PO10625SubmittedOnly and not @PO10625Self' \
corepack yarn exec cypress run --browser chrome --config '{"baseUrl":null}' \
  --spec 'cypress/e2e/functional/opal/features/checkAndValidateCase/CheckerReviewDecisions.feature,cypress/e2e/functional/opal/features/checkAndValidateCase/CheckerReviewDecisionsAccessibility.feature' \
  --env 'dryRun=true,omitFiltered=true,tags=@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10625 and @PO10625SubmittedOnly and not @PO10625Self,PO10625_LIFECYCLE_CLEANUP_VERIFIED=false,PO10628_PUBLICATION_CLEANUP_VERIFIED=false'
```

Live selections require parent-coordinated execution using the maintained live runner and real base URL, with
`dryRun` disabled. Retain **boolean false** for both `PO10625_LIFECYCLE_CLEANUP_VERIFIED` and
`PO10628_PUBLICATION_CLEANUP_VERIFIED` on the current Submitted-only-cleanup runtime. Neither selector grants
cleanup compatibility or authorises a transition. The full selection therefore has 14 unavailable guarded
examples on that runtime; the narrower selections separate prerequisite failures from runner diagnosis.

Compatible setup does not mean every selected example currently passes. Real empty-checker preflight found two
unrelated eligible cases: both no-create empty examples legitimately fail their zero-count requirement. Preserve
that unrelated work; do not delete it, filter it away, change the assertion or manufacture empty responses.
The parent-owned six-example AC6 run recorded six failures: four intended pre-create guard failures and the two
actual nonempty preflight failures. Those results are not successful AC6/AC7 acceptance.

Two all-22 live attempts stopped at self-review after its business assertions were green, when the maintained
Cucumber `test-step-finished` task timed out and subsequent step/teardown completion failed. Exact owner/marker
cleanup of the affected records 25 and 27 each returned 204; all owned receipts were resolved. These are failed
live runs, not passing self-review evidence. No application assertion defect was established. A same-actor
session/navigation interaction is an unproven hypothesis; retain the runner diagnosis and raw failure logs.
Run the six-example selection separately before any parent-authorised self-only diagnosis, and use
`DEBUG=cypress-cucumber-preprocessor` for that narrow diagnostic run. Do not alter authentication, observations,
assertions, guards, Cucumber hooks, cleanup or timeouts to turn the failure into a pass. Selector discovery proves
only metadata and bindings; real publication, lifecycle cleanup and full live acceptance remain outstanding.
