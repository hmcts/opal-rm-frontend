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
