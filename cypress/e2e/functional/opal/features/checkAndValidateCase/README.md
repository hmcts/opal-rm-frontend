# PO-10626 concurrency and recovery QA

The two feature files expand to eight functional and six accessibility examples. Every example creates an independent
synthetic draft through the existing live creation journey. Scenario retries are disabled. PATCH/PUT monitors count
all browser attempts, including attempts after the injected fault. Lost-response examples forward the request and
interrupt only a real HTTP 200 response; fresh authenticated GETs independently verify the saved aggregate, quoted
ETag, original ID, actor and complete timeline delta. Definite-failure examples return one controlled HTTP 400 before
backend dispatch and require a corrected, explicit live retry. Conflict examples advance the real resource through
an independent authenticated request while the browser retains its earlier ETag.

## Runtime prerequisites

- FE at `TEST_URL`, with persisted checker review, deletion and rejected-case amendment foundations. The test-only
  detail interface allows this QA branch to compile before those production deliveries are integrated; it does not
  supply their routes or product behavior. The inspected combined foundation was FE PR #472.
- Real Maintenance POST/GET/PATCH/PUT support and the enabled `release-1c-rm-create-case-files` release flag. See the
  main E2E guide for creation reference-data prerequisites. HTTP errors or unavailable screens fail the test.
- Existing synthetic inputter `opal-test@dev.platform.hmcts.net`: ACTIVE, Maintenance BU 44 permission 21.
- Existing synthetic checker `opal-test-10@dev.platform.hmcts.net`: ACTIVE, Maintenance BU 44 permission 22, with a
  different BU user ID. These defaults come from User Service seed migrations, including V1_68. Each example verifies
  actual runtime permissions and distinct IDs; it does not create users or change access. Optional Cypress variables
  `PO10626_INPUTTER_EMAIL` and `PO10626_CHECKER_EMAIL` select other already-provisioned synthetic users.

## Local development before lifecycle support is delivered

Only the newly owned PO-10626 receipts may defer cleanup. Explicit `PO10626_DEFER_CLEANUP=true` is accepted only for
localhost, 127.0.0.1 or IPv6 loopback. It retains data and outstanding ID/marker receipts in
`functional-output/draft-casefile-cleanup/`. When producer evidence is unavailable, the run also writes an
`acceptance: incomplete` record under `functional-output/po10626/`. A green development run is partial evidence;
it does not prove lifecycle cleanup or absence of duplicate publication requests.

The standard runner resets output directories. Preserve outstanding cleanup receipts and reports in an ignored
local evidence directory before another run. Use the retained ID and exact marker with the agreed owned cleanup
service once available; never delete shared data or reset lifecycle states to bypass ownership checks. This workflow
does not enable deferral for existing scenarios or discard their failed cleanup receipts.

```bash
TEST_URL=http://localhost:5000 \
TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626 and not @skip' \
CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626 and not @skip' \
corepack yarn test:functional:serial --browser=chrome \
  --spec 'cypress/e2e/functional/opal/features/checkAndValidateCase/DraftCasefileConcurrency.feature,cypress/e2e/functional/opal/features/checkAndValidateCase/DraftCasefileConcurrencyAccessibility.feature' \
  --env PO10626_DEFER_CLEANUP=true
```

Add `dryRun=true` to the comma-separated `--env` value for discovery only. Discovery verifies all fourteen examples
and their bindings; it does not execute their browser actions.

## Final acceptance integration

Jonathan owns lifecycle cleanup and publication evidence in Maintenance. Supply the delivered, authenticated evidence
URI in `PO10626_PUBLICATION_EVIDENCE_PATH`, containing `{id}` under `/opal-maintenance-service/testing-support/`.
The adapter sends the exact `Test-Run-Reference` and currently expects this **proposed consumer shape**, which must be
reconciled with the delivered provider contract:

```json
{
  "draft_casefile_id": 123,
  "test_run_reference": "E2E-0123456789abcdef",
  "accepted_publication_requests": 0,
  "recording_started_before_approval": true,
  "complete": true
}
```

The count represents accepted producer sends, independently of consumer redelivery. Both identity fields must match
the receipt; counts must be nonnegative safe integers. Missing, incomplete, late or mismatched evidence fails rather
than becoming zero. Approval requires a delta of exactly one through completed recovery; other actions require zero.
No support URI is assumed to exist and no successful evidence response is fabricated.

Run the same selection with `PO10626_DEFER_CLEANUP=false` and the delivered evidence URI configured. Teardown restores
the recorded inputter session and calls the existing ID-scoped DELETE with the marker. Only HTTP 204 clears a receipt;
a failure retains it and fails acceptance. Final acceptance requires all fourteen executed examples, real publication
evidence, successful owned lifecycle cleanup, and the unaffected live creation/cleanup regression. Product foundation
defects remain failures for their owners to resolve; these tests do not replace production behavior.

## Support verification

```bash
node --test scripts/draft-casefile-cleanup.test.mjs
corepack yarn test:component:leaf --browser=chrome --spec 'cypress/component/checkAndValidateCase/concurrency-support.cy.ts,cypress/component/checkAndValidateCase/cleanup-policy.cy.ts'
corepack yarn exec tsc -p e2e.tsconfig.json --noEmit
corepack yarn exec tsc -p cypress/tsconfig.json --noEmit
corepack yarn lint:cypress
corepack yarn exec opal-cypress-check-new-tests-jira-metadata --component-root cypress/component/checkAndValidateCase --feature-root cypress/e2e/functional/opal/features/checkAndValidateCase
corepack yarn check:cypress:test-metadata
corepack yarn find:duplicate:scenarios
```

Helper regressions cover forwarding before interruption, observing later requests, refusing to call an upstream
rejection a committed loss, explicit retry, lossless versions, evidence validation, scoped cleanup deferral, receipt
persistence and owner restoration before deletion. They are controlled support tests, not backend acceptance proof.

Accessibility examples use the shared Axe binding without new exemptions and native keyboard recovery controls.
The deletion functional example additionally uses native Tab/Enter and scans its recovery destination. These checks
are partial accessibility evidence. Full keyboard traversal, visible focus, screen-reader announcements and
magnification still need specialist assurance. The existing suite suppresses native beforeunload dialogs; the
amendment test checks the actual application discard confirmation and cannot establish native browser dialog behavior.
