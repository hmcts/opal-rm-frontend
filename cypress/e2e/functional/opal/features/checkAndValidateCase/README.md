# PO-10626 concurrency and recovery QA

The two feature files retain **12 examples: seven functional and five accessibility**. The current executable selection
is **11: six functional and five accessibility**. Each example creates its own synthetic submitted draft through
the normal authenticated Maintenance API, preserving browser time for the decision/amendment and recovery journey.
The case-creation journey regressions continue to use the real UI; this API setup does not replace their coverage.
Scenario retries remain disabled. PATCH/PUT monitors count all browser attempts, including attempts after the injected
fault. Lost-response examples withhold Fetch delivery only after a real upstream HTTP 200; independent authenticated GETs verify the
saved aggregate, quoted ETag, original ID, actor and complete timeline delta. Definite-failure examples return one
controlled HTTP 400 before dispatch and require an explicit live retry. Conflict examples advance the real resource
with an independent authenticated request while the browser retains its earlier ETag.

## Agreed recovery coverage

Following frontend developer feedback, the lost-response resubmission functional example and its accessibility
counterpart were removed on 29 October 2026. They required Back to recover the now-RESUBMITTED case through the
REJECTED-only amendment route; changing that application navigation is outside the agreed scope. This removes
automated evidence for committed PUT response-loss recovery (the original second Acceptance Criterion), including
its retained context, saved presentation and keyboard recovery assertions. It does not establish that recovery works.
Resubmission definite-failure/explicit-retry and stale-conflict examples remain in both feature files; checker
reject/delete lost-response examples also remain. Retained scenario titles, parameter values and Jira tags are
unchanged; generated accessibility example numbers shift after the removed row.

## PO-10611 frontend integration

Run this pack on the PO-10611 frontend foundation with the dependencies inherited from master `8cf1f9e6`,
including common UI `0.0.116` and common Cypress `0.0.5`. Recovery actions use the maintained checker and create-casefile route constants and assert
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

### Rejected amendment entry readiness

Recovery setup waits for the real saved-case GET, its distinct saved Order Term Result detail requests, and the
countries/application/major-creditor responses before checking the rendered Check case button. The Angular
resolver requires all these responses before creating the task list. Network waits use the existing request
response budget; the DOM timeout is unchanged. Every response must be HTTP200 and the owned case must still be
REJECTED. No response is stubbed, no retry or sleep is added, and unusable data still fails through the normal
route/render assertions.

## Runtime prerequisites

- FE at `TEST_URL` with persisted checker review, deletion and rejected-case amendment foundations. The test-only
  detail interface supplies no production routes or behavior. Missing product foundations fail the test.
- Real Maintenance POST/GET/PATCH/PUT and the dedicated testing-support cleanup DELETE. Use a compatible build of
  `codex/PO-10626-publication-support` (reviewed at `215b577`) and its DB/BE dependencies; they need not be merged
  into master for local execution. Verify the actual running build and enable `TESTING_SUPPORT_ENDPOINTS_ENABLED`
  and the existing `release-1c-rm-create-case-files` release separately. This support contract adds no observation
  migration, publication-evidence endpoint or evidence-response schema.
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

## Recovery evidence and publication boundaries

Normal authenticated GET/re-entry supplies the saved casefile, original ID, opaque ETag, lifecycle, snapshot and
complete timeline. The real PATCH/PUT response-drop and request monitors remain active through completed recovery
and every accessibility assertion. The final `the completed recovery has not replayed the case change` step checks
application and wire counts again: one attempted mutation, or two deliberate activations for explicit retry. The
preceding saved-outcome assertion requires exactly one matching lifecycle event and preserves the prior history;
stale cases require the complete unchanged winning aggregate. There are no publication-evidence registration/read
calls, journal interfaces or counter assertions.

| Fact | Evidence source and limit |
| --- | --- |
| No automatic browser replay after response loss, failure or conflict | Scoped application Fetch and wire request counts through recovery; explicit retry has its own expected count. |
| Persisted decision/resubmission, original ID/version, complete aggregate/snapshot and one corresponding timeline event | Real normal-API GET/re-entry and rendered saved-state assertions before cleanup. |
| One producer invocation and repeat/stale refusal | Separately labelled backend decision/transaction and enabled/disabled publisher integration tests; mocked publisher/JMS boundaries do not establish broker delivery. |
| Broker acceptance, settlement/redelivery and one persisted published graph | Separate opt-in real-broker/consumer integration execution on an agreed dedicated test queue. |
| No duplicate producer sends during this deployed UI journey | Unmet until the acceptance owner confirms the proposed evidence allocation or separately scoped broker-observation capability is delivered. Browser counts and GET/timeline state cannot establish this fact. |

The backend [test handoff](https://github.com/hmcts/opal-maintenance-service/blob/215b577/docs/TESTING.md#feqa-consumer-cutover-and-acceptance-evidence)
defines the proposed allocation. Removing the retired routes does not waive the original AC1 publication-request
requirement or complete live acceptance. Do not report exactly-once broker delivery from any of these checks.

Mutation receipts contain only the owned ID/marker, journey/fault, application/network counts and opaque versions
under `functional-output/po10626/`; no participant names, cookies, request bodies or casefile snapshots belong there.
Final request counts remain browser assertions, not producer-send receipts. The existing single cleanup hook
persists all receipts, restores the recorded latest submitter and sends
`DELETE /opal-maintenance-service/testing-support/draft-casefiles/{id}` with the exact `Test-Run-Reference` marker.
Only 204 clears a receipt; non-204 and transport failure retain receipts and fail the run. No body, If-Match,
preceding cleanup GET or `ignore_missing` query is used.

The updated support contract accepts eligible owned unlinked `SUBMITTED`, `REJECTED`, `RESUBMITTED`, `DELETED`,
`PUBLISHING_FAILED` and approved `PUBLISHING_PENDING` drafts, plus checked exclusive `PUBLISHED` graphs. Verify the
running service's permission-21/latest-submitter/marker rules and graph read/delete capability. Published cleanup
retains row locks and atomic rollback; concurrent graph-writer risk is accepted by the backend operating contract.
No table-wide locks or observation migration are prerequisites. Complete state/timeline assertions before cleanup;
DELETE does not establish queue settlement or undo external side effects.

## Pending AC1 approval

The lost-response approval row retains `@skip @PO10626RequiresPublishedCleanup` and all scenario metadata. The
consumer and pending/published cleanup are delivered on the support branch; the remaining gate is verification of
the actual deployed contract and a full owned approval/recovery/cleanup run, with separate publication evidence as
allocated above. A source checkout or issue status does not supply that evidence. An 11-example pass therefore does
not satisfy all of AC1 or complete PO-10626. Remove the pending tags only after those requirements are verified.
`PUBLISHING_FAILED` cleanup eligibility does not authorise deliberately forcing publication failure. Never broaden
deletion eligibility, reset lifecycle state or clear failed receipts to obtain a pass.

`PO10626_DEFER_CLEANUP` remains an existing helper capability for explicitly configured localhost-only deferred
receipts. These fixtures always require cleanup and do not use it. Preserve outstanding receipts and raw reports
in an ignored local directory before any runner resets outputs.

## Discovery and live execution

Full inventory includes the pending row; discovery executes no browser actions. The installed preprocessor always
skips `@skip`; `omitFiltered=false` exposes it as pending, giving **12 inventoried: 11 dry-run passes + 1 pending**.
Without that inventory-only override, the default `omitFiltered=true` hides the row even when the tag expression
includes it. The parsed Gherkin inventory retains all 12 expanded names/rows/tags:

```bash
TEST_URL=http://localhost:5100 \
TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626' \
CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626' \
corepack yarn test:functional:leaf --browser=chrome \
  --spec 'cypress/e2e/functional/opal/features/checkAndValidateCase/DraftCasefileConcurrency.feature,cypress/e2e/functional/opal/features/checkAndValidateCase/DraftCasefileConcurrencyAccessibility.feature' \
  --env 'dryRun=true,omitFiltered=false,tags=@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626'
```

Current executable discovery selects 11 examples:

```bash
TEST_URL=http://localhost:5100 \
TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626 and not @skip' \
CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626 and not @skip' \
corepack yarn test:functional:leaf --browser=chrome \
  --spec 'cypress/e2e/functional/opal/features/checkAndValidateCase/DraftCasefileConcurrency.feature,cypress/e2e/functional/opal/features/checkAndValidateCase/DraftCasefileConcurrencyAccessibility.feature' \
  --env 'dryRun=true,tags=@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626 and not @skip'
```

Actual browser execution uses the supported 11-case selection:

```bash
TEST_URL=http://localhost:5100 \
TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626 and not @skip' \
CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626 and not @skip' \
corepack yarn test:functional:leaf --browser=chrome \
  --spec 'cypress/e2e/functional/opal/features/checkAndValidateCase/DraftCasefileConcurrency.feature,cypress/e2e/functional/opal/features/checkAndValidateCase/DraftCasefileConcurrencyAccessibility.feature' \
  --env 'PO10626_DEFER_CLEANUP=false,tags=@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626 and not @skip'
```

The explicit lowercase `tags` value overrides any inherited Cucumber selection. Require complete saved-state and
final request-count assertions after recovery, all UI/Axe checks and successful owned cleanup for every executed example. Preserve
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
selected GET, unchanged winner and final no-replay request counts.

Controlled support regressions verify API fixture boundaries, all four journey preparations using only normal
APIs, forwarding before interruption, later requests, rejection handling, explicit retry, lossless versions,
receipt persistence and owner restoration before DELETE. Journal-specific helper cases are retired with their
removed API/schema; transport, retained-context, saved-state and cleanup checks remain. Cleanup covers 204, 400/401/403/404/409/500/503 and transport
failure before any deletion or after a 204. These helpers do not prove live backend behavior or browser ordering.

Accessibility examples retain shared Axe checks before and after native keyboard recovery, with only the shared
Fines `aria-allowed-attr` exemption.
The deletion functional example also uses native Tab/Enter and scans its recovery destination. These are partial
accessibility results. Full traversal, visible focus, screen-reader announcements and magnification need specialist
assurance. Native beforeunload dialogs remain suppressed by the existing suite; application discard-confirmation
coverage does not establish native browser dialog behavior. Keep CI, reviewer approval, QA, deployment and all
unexecuted acceptance evidence pending.
