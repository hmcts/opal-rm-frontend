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
