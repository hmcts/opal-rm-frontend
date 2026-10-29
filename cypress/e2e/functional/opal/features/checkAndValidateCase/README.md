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

### Real prerequisites and historical runtime evidence

The 23 October 2026 inspection found an incompatible local Maintenance runtime with an unverified revision,
migrations only through V1_34/1.34 and no publication consumer/repository. No live PO-10628 fixture or approval was
executed against it. This is historical evidence, not the contract of the updated support branch. Use a compatible
`codex/PO-10626-publication-support` build and its DB/BE dependencies locally before master merge; verify the actual
running build. Discovery and controlled support passes remain separate from live acceptance, which is **Not Agent
Complete** until real acceptance and applicable repository/external gates pass.

Before live execution, an operator must verify:

- The exact deployed compatible Maintenance build and the frontend checkout/process on isolated port 5100; leave
  the existing frontend on port 5000 untouched. Verify release `release-1c-rm-create-case-files=true` separately.
- Actual list/count/detail POST/GET/PATCH behavior, authoritative quoted ETags, full persisted dates/timeline and
  BU44 permission enforcement. Enable existing `TESTING_SUPPORT_ENDPOINTS_ENABLED` and owner/marker DELETE cleanup.
  Neither this pack nor the updated PO-10626 pack requires an observation migration or publication-evidence route.
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
identities and cleanup; they do not require publication readiness. The historical follow-up runtime accepted only
SUBMITTED cleanup. The updated backend accepts eligible unlinked lifecycle states, approved pending drafts and
exclusive published graphs as described above. Verify that contract on the actual running build before creating
transitioned fixtures. Approval guards apply only to PUBLISHED/PUBLISHING_PENDING scenarios, including populated
lifecycle scenarios; the guards do not establish runtime compatibility.

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
live execution. The updated support branch supplies eligible lifecycle and exclusive published cleanup; verify
that build's actual owner/marker DELETE before enabling these guards. Missing prerequisites remain an unrun or
failed journey, never a passing acceptance result. Preserve required cleanup receipts on failure.

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
checker, fresh ETags and receipt-owned marker cleanup. The historical inspected runtime cleaned up Submitted only;
the updated support branch supplies eligible Rejected/Deleted cleanup. Verify the actual running build before
these window fixtures execute. The switch itself is not evidence and must never self-enable in live setup. Empty scenarios create no data, require the existing checker actor and fail on
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
`PO10628_PUBLICATION_CLEANUP_VERIFIED` on an older Submitted-only-cleanup runtime. Its full selection has 14
guarded examples it cannot support. With the updated support build, independently verify lifecycle and published
cleanup before supplying true. Neither selector grants compatibility; the narrower selections remain useful for
separating prerequisite failures from runner diagnosis.

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

## PO-10624 independent checker deletion

`CheckerDeletesCasefile.feature` retains five functional examples and
`CheckerDeletesCasefileAccessibility.feature` adds four independent broad accessibility journeys: successful
retained deletion, blank/over-limit correction, cancellation, and definite failure with explicit retry. Exactly
**nine examples** remain enabled, with no skipped or pending scenarios and no scenario retries. Every example
creates its own synthetic SUBMITTED case through the maintained normal API fixture. The checker must differ from
the owning inputter and have actual Maintenance BU 44 permission 22; the ACTIVE inputter needs permission 21 in
BU 44. The maintained fixture defaults to `opal-test@dev.platform.hmcts.net` and
`opal-test-10@dev.platform.hmcts.net`; `PO10626_INPUTTER_EMAIL` and `PO10626_CHECKER_EMAIL` select other already
provisioned independent users. Setup verifies real permissions and environment-valid reference data. It does not
grant access or manufacture saved outcomes.

Feature steps state confirmation, cancellation, linked validation, unchanged saved state and retained Deleted
outcomes explicitly. The functional success reason is exactly 250 characters; over-limit validation types 251.
The accessibility validation fixture follows blank → 251 → corrected 250 → Cancel, with the canonical accessibility
step at visible checkpoints and strict intermediate scans before departure. Each independent Given resets its Flow
state. `CheckerDeletionFlow` owns retry and broad accessibility sequencing; Actions own native controls, linked
focus, scans, transport/receipt decoding and saved-state assertions. Validation-only activation never waits for a
PATCH receipt. Successful confirmation and each explicit retry activation still check lifecycle cleanup; retry
arms one definite-failure monitor and preserves that same monitor, reason and original ETag for both attempts.
The final outcome assertion reads persisted evidence without initiating another mutation.

Enable `release-1c-rm-create-case-files` in the frontend and
`TESTING_SUPPORT_ENDPOINTS_ENABLED=true` in the actual Maintenance runtime. Before execution, verify the frontend
process/build belongs to this checkout and record the actual compiled backend revision and running services.
Require compatible real POST/GET/PATCH/list/detail routes, opaque ETags, permission enforcement, retained deletion,
exact Deleted history and marker-owned cleanup; a source checkout or an issue's status does not establish the
compiled runtime contract. Deletion does **not** require publication, a publication consumer or publication
evidence registration.

The updated support branch supplies eligible DELETED lifecycle cleanup; the earlier inspected runtime supported
SUBMITTED only. Verify the actual compatible build's owner/marker DELETE before the four transition-capable
examples (functional success/retry and accessibility success/retry) execute.
`PO10625_LIFECYCLE_CLEANUP_VERIFIED` must be **boolean true** only after that verification. The maintained guard
runs before any transition-capable fixture creation and immediately before each DELETED dispatch, including the
explicit retry. Never self-enable the switch, reset lifecycle state, delete unrelated cases, or treat a switch as
evidence of cleanup. Retain failed owned receipts; every executed example requires actual successful marker-owned
cleanup. The five `@PO10624SubmittedOnly` examples create only SUBMITTED records: three functional
(cancel, blank, over-limit) and two accessibility (validation, cancel). This selection is a cleanup-compatible
subset, not an acceptance waiver or a claim that those journeys pass.

Success requires the exact owned `You have deleted {respondentName}’s case.` banner and To review destination,
a fresh actual GET proving retained DELETED state, advanced ETag, all saved casefile/snapshot/validation fields and
prior history, and exactly one new Deleted event with the exact independent checker and typed reason. It also
requires absence from the actual To review provider collection and every DOM page, inclusion in both actual
Deleted provider and paginated DOM results, and retained read-only detail without decision controls. Cancellation
and validation require zero application/wire PATCH and a fresh unchanged aggregate/ETag/history, plus the same
saved review and actual To review inclusion. Definite failure uses the maintained **one-shot HTTP 400 before
provider dispatch**. It proves that definite-rejection boundary only; the explicit real UI retry retains the same
monitor, reason and original opaque ETag and requires one acknowledged provider success. It does not model an
uncertain outcome or claim that every HTTP 400 originates from the provider.

Accessibility journeys use native focused Cases/queue/owned-row/delete navigation, normal keyboard text entry,
native Tab from the reason through the real decision/cancel controls, native Enter and linked error-summary focus.
The shared strict `accessibilityActions.checkAccessibilityOnly()` scanner has no added exemptions. Scans cover
entry/review, empty and filled warning, exact blank and 251-character validation errors, corrected 250-character
input, cancelled review, definite error with retained retry form, success confirmation, every visited outcome
pagination page and retained read-only detail. Scanner failure stops subsequent interaction; the same persisted
business assertions remain required. Automated Axe and keyboard checks provide partial accessibility evidence;
screen-reader and magnification assessment remains a separate human/specialist check.

The required errors are exactly `Enter reason` and `Reason must be 250 characters or fewer`. The strict over-limit
journeys type **251 visible characters** and require the complete readback before checking the error and correcting
to 250. The inspected frontend's native textarea currently has `maxlength=250`, preventing that 251-character
input through normal typing. This is a **frontend baseline limitation (GAP008)**, not evidence of backend failure
and not an automatically accepted waiver. Preserve the strict test and report the actual failure; do not force
input, seed the value, bypass maxlength, accept truncation, patch the product, or silently remove the example.

Full live selection, only after actual runtime, independent-user and DELETED-cleanup preflight:

```bash
TAGS='@JIRA-STORY:PO-10624 and not @skip' CYPRESS_TAGS='@JIRA-STORY:PO-10624 and not @skip' \
yarn test:functional:leaf --browser=chrome --spec 'cypress/e2e/functional/opal/features/checkAndValidateCase/CheckerDeletesCasefile*.feature' \
--env 'tags=@JIRA-STORY:PO-10624 and not @skip'
```

Set `TEST_URL` to the verified live frontend URL. For the safe SUBMITTED-only selection, add
`and @PO10624SubmittedOnly` to **all three selectors**; expect exactly **five examples**:

```bash
TAGS='@JIRA-STORY:PO-10624 and not @skip and @PO10624SubmittedOnly' \
CYPRESS_TAGS='@JIRA-STORY:PO-10624 and not @skip and @PO10624SubmittedOnly' \
yarn test:functional:leaf --browser=chrome --spec 'cypress/e2e/functional/opal/features/checkAndValidateCase/CheckerDeletesCasefile*.feature' \
--env 'tags=@JIRA-STORY:PO-10624 and not @skip and @PO10624SubmittedOnly'
```

Discovery uses the installed v26 preprocessor's actual `dryRun=true` setting, a null base URL and matching
selectors. It runs no live fixture or browser actions; `cucumberOnlyMissingSteps` is not an effective discovery
control in this version:

```bash
TAGS='@JIRA-STORY:PO-10624 and not @skip' CYPRESS_TAGS='@JIRA-STORY:PO-10624 and not @skip' \
yarn test:functional:leaf --browser=chrome --config '{"baseUrl":null}' \
--spec 'cypress/e2e/functional/opal/features/checkAndValidateCase/CheckerDeletesCasefile*.feature' \
--env 'dryRun=true,omitFiltered=true,tags=@JIRA-STORY:PO-10624 and not @skip'
```

Repeat discovery with `and @PO10624SubmittedOnly` in all three selectors for five examples; full discovery requires
nine, with zero undefined/ambiguous/skipped/pending cases. Controlled support is:

```bash
yarn test:component:leaf --browser=chrome \
--spec 'cypress/component/checkAndValidateCase/checker-deletion-journey-support.cy.ts'
```

Controlled support verifies helper contracts and failure propagation. Discovery verifies names, tags, counts and
bindings. Neither is passing live deletion evidence. Preserve measured native execution counts, failures,
interruptions, unrun examples and exact owned cleanup receipts in parent-owned ignored evidence and the delivery
report/PR; keep these instructions reusable. Do not claim full acceptance or Agent Complete when an applicable
required check fails. Draft production and handoff do not require publication or a separate approval-state gate.

## PO-10623 owned rejected amendment

The `RejectedAmendment.feature` and `RejectedAmendmentAccessibility.feature` pair preserves its inherited
controlled examples and appends **12 independent live examples: six functional and six accessibility**. The
PO-10623 tag selects exactly those 12, with zero skips, pending cases or scenario retries. The six outcomes are
same-user correction/resubmission (AC1), cross-user resubmission/self-review prevention (AC1/AC3), definite failure
and explicit retry (AC2), stale correction/departure protection, foreign-BU denial and no-longer-Rejected denial
(AC4). Every accessibility counterpart adds AC5 and retains the same complete business outcome assertions.

Each example creates fresh data through normal POST, uses two minor creditors and unique synthetic names, and
requires an actual REJECTED prerequisite with the exact rejection marker/history. A is the immutable original
inputter (ACTIVE Maintenance BU44 permission21). Independent B rejects with actual permission22 in BU44; the
cross-user amender B also needs permission21 there. The original `owned` record and current `amender` remain
separate. Cleanup authority changes only after an independent saved GET establishes the actual latest submitter,
and the maintained cleanup receipt is persisted immediately before later outcome assertions. Do not create roles,
reuse ambient cases, relabel A, share fixtures between functional/accessibility examples, or mock live user,
reference, collection, detail or successful lifecycle responses.

Foreign-BU denial additionally requires an existing `PO10623_FOREIGN_BU_INPUTTER_EMAIL`: ACTIVE permission21 in
another Maintenance BU and no permission21 in BU44. Missing or incompatible users are fixture failures. A global
role denial does not prove this Business Unit boundary.

Before live work, verify the frontend checkout/build/process, enabled `release-1c-rm-create-case-files`, running
services and **actual compiled Maintenance backend artifact/revision**, normal POST/GET/list/detail/PUT routes,
lossless opaque ETags, real rejection/resubmission/409/permission behavior and marker-owned lifecycle cleanup.
A source checkout or ticket status does not establish these contracts. Testing support must be enabled in that
runtime. PO-10623 has no publication, publication-evidence registration, observation migration or publication
consumer dependency.

The earlier inspected runtime supported SUBMITTED cleanup only. The updated support branch supplies eligible
REJECTED/RESUBMITTED cleanup using the persisted latest submitter, including cross-user transfer. **Both boolean
guards stay false until that actual running contract is independently verified**: `PO10625_LIFECYCLE_CLEANUP_VERIFIED` covers REJECTED/RESUBMITTED lifecycle
cleanup and is checked before creation and immediately before every transition; additionally
`PO10623_TRANSFER_CLEANUP_VERIFIED` covers latest-submitter transfer cleanup and is checked before cross-user
creation and transition. Tests never self-enable either guard. A false guard is an expected unavailable-prerequisite
failure, never a passing live journey. Preserve any failed owned cleanup receipt and report unresolved ownership or
unreadable cleanup as outstanding evidence.

Success requires real UI PUT200, a matching complete independent GET, full aggregate preservation except respondent
forenames `Corrected`, preserved applicant/minor snapshots and null account identifiers, advanced ETag and exactly
one Resubmitted event with the actual amender/time. Both actual provider results and every DOM page must omit the
owned ID from its original Rejected collection and include it in inputter In review with corrected name/latest
actor. Require the exact owned `You have submitted {corrected respondent name}'s case for review.` banner at the
original personal `#rejected` or All rejected destination, dismissal focus and no replay. Cross-user B must be
excluded by the actual checker To review provider and every DOM page, and direct self-review must be read-only
without decision controls or PATCH. The saved aggregate remains unchanged.

Retry uses one **HTTP400 before provider dispatch**, followed by one explicit real PUT200 using the same monitor
and original ETag. This proves that definite failure boundary; it does not claim every400 is provider-generated.
Stale uses an actual competing complete PUT200 and actual UI PUT409; native Cancel retains the unsaved correction,
OK/Back reloads the unchanged winner without replay. The no-longer-Rejected denial first actually resubmits its own
REJECTED case. Both canonical denial entries expose no case/editor/task data, dispatch no POST/PUT/PATCH and retain
an independently authorised unchanged saved read.

Strict `accessibilityActions.checkAccessibilityOnly()` scans have **no exemptions** and run before departure from
every meaningful visited collection/page/sort, task/history, actual corrected respondent editor, review, definite
failure/409, Cancel return, confirmation/dismissal, In review, read-only self-review and denial state. Material
pages also assert horizontal reflow at1280 and320 CSS pixels and restore desktop width. Keyboard paths retain
native Tab and maintained native Enter on semantic focused controls; native GOV.UK opacity-zero inputs need enabled
controls and visible associated labels, not a CSS-visibility requirement. These scans and keyboard checks provide
partial WCAG2.2AA evidence. Screen-reader, zoom/magnification, focus appearance and native browser modal rendering
remain separate manual/specialist checks with the same verified services/users/cleanup setup.

Exact 12-example discovery, with no application actions or fixture creation:

```bash
TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10623 and not @skip' \
CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10623 and not @skip' \
corepack yarn test:functional:leaf --browser=chrome \
  --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/RejectedAmendment*.feature' \
  --config '{"baseUrl":null}' \
  --env 'dryRun=true,omitFiltered=true,tags=@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10623 and not @skip,PO10625_LIFECYCLE_CLEANUP_VERIFIED=false,PO10623_TRANSFER_CLEANUP_VERIFIED=false'
```

Exact live/guard selection (all12 are blocked before creation while lifecycle cleanup remains unverified):

```bash
TEST_URL=http://localhost:5100 \
TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10623 and not @skip' \
CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10623 and not @skip' \
corepack yarn test:functional:leaf --browser=chrome \
  --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/RejectedAmendment*.feature' \
  --env 'dryRun=false,omitFiltered=true,tags=@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10623 and not @skip,PO10625_LIFECYCLE_CLEANUP_VERIFIED=false,PO10623_TRANSFER_CLEANUP_VERIFIED=false'
```

After independent external verification, configure only the genuinely supported boolean capabilities and existing
actor addresses in the runner; do not copy a true flag from a controlled test as evidence. Retain exact commands,
compiled revisions, selected counts, guards, actual failures, cleanup outcomes and safe marker/ID-only evidence.
Never store names, case bodies, cookies, credentials or tokens in evidence. Controlled orchestration verification:

```bash
corepack yarn test:component:leaf --browser=chrome \
  --spec 'cypress/component/checkAndValidateCase/rejected-casefile-journey-support.cy.ts'
```

Discovery proves selection/bindings only. Controlled support proves scanner/keyboard/reflow/orchestration failure
sensitivity against synthetic boundaries. Neither is passing live acceptance or proof of deployed permissions,
cleanup compatibility or complete WCAG conformance. Run the preserved inherited caller regression separately.
