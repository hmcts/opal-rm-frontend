# Cypress E2E Testing

Use this guide when writing or updating Cypress E2E tests and Cucumber feature files in opal-rm-frontend.

For Draft Casefile concurrency, response-loss recovery and lifecycle support requirements, see the
[PO-10626 suite guide](../cypress/e2e/functional/opal/features/checkAndValidateCase/README.md).

## Draft Casefile concurrency and recovery QA (PO-10626)

Use the PO-10611 frontend foundation with current master dependencies (`8cf1f9e6`, common UI `0.0.116`). Build this checkout with independent
dependencies from its inherited immutable lockfile, run an isolated local port such as `TEST_URL=http://localhost:5100`,
and verify the frontend process directory. Ambiguous and definite-failure cases still require retained context.
Conflict cases exercise the actual shared concurrency page, Cases navigation, actor dashboard, saved-status tab and
owned row before a fresh GET and complete rendered winner check. The scoped response-loss fault rejects Fetch
delivery after an independently observed real HTTP 200; it does not model every socket failure.

The [suite guide](../cypress/e2e/functional/opal/features/checkAndValidateCase/README.md) records the exact discovery,
live and support commands. Its inventory retains **12 examples (7 functional + 5 accessibility)**; the current
executable selection is **11 (6 functional + 5 accessibility)**. The retained AC1 approval row alone carries
`@skip @PO10626RequiresPublishedCleanup`. An 11-example pass does not complete AC1 or PO-10626. The default runner
excludes `@skip`; inventory-only discovery uses `omitFiltered=false` to expose the row as pending. The installed
preprocessor skips `@skip` regardless of tag selection; its default `omitFiltered=true` hides that row. Expect 12
inventoried cases: 11 dry-run passes and one pending approval. Parsed Gherkin also retains all 12 names/rows/tags.
Both tag environment variables and the lowercase
`--env tags=...` override must agree so inherited selection cannot hide cases.

The lost-response resubmission functional/accessibility pair was removed following frontend developer feedback
on 29 October 2026. Back currently re-enters the REJECTED-only amendment route after the case becomes RESUBMITTED;
changing that navigation is outside the agreed scope. The original committed-PUT response-loss recovery Acceptance
Criterion therefore has no automated evidence in this pack. Definite-failure retry and stale-conflict resubmission
coverage remain; see the suite guide's agreed recovery coverage for the removed assertions.

Each example uses normal API creation with live environment-valid reference data and existing ACTIVE Maintenance
users: inputter permission 21 and a distinct checker permission 22 in BU 44. Setup does not create users, alter
permissions or provide backend-owned fields. The case-creation UI regression instructions below remain required.
Enable the create-casefile release and Maintenance testing support separately. Verify the actual compatible
`codex/PO-10626-publication-support` build (reviewed at `215b577`) and its DB/BE dependencies, persisted
review/deletion/amendment routes and owner/marker cleanup. These dependencies can run locally before merging to
master. This support contract has no observation migration, publication-evidence route or evidence-response schema.

Normal authenticated GET/re-entry proves original ID, opaque ETag, lifecycle, complete saved aggregate/snapshot and
one corresponding timeline event with the prior history retained. Browser application/wire request counts prove
no automatic replay through completed recovery and accessibility checks; explicit retry requires two deliberate
activations. The final `the completed recovery has not replayed the case change` step repeats the count checks.
No owner-session switch for a publication journal remains. Mutation receipts contain only owned ID/marker,
journey/fault, counts and opaque versions in `functional-output/po10626/`; never persist participant names, cookies,
request bodies or snapshots there.

Producer invocation, broker acceptance/redelivery and a published graph need their separately labelled backend
and opt-in dedicated-broker evidence. Normal GET/timeline and browser counts cannot establish producer send counts.
The original AC1 no-duplicate-publication requirement remains unmet until the acceptance owner confirms the
proposed allocation in the [suite guide](../cypress/e2e/functional/opal/features/checkAndValidateCase/README.md#recovery-evidence-and-publication-boundaries)
or separately scoped broker-observation capability is delivered. This cutover does not waive that requirement.

The existing single cleanup hook persists each receipt, restores its recorded latest submitter and sends the
ID-scoped DELETE with the exact marker; only 204 clears it. Non-204/transport failure retains the receipt and fails
the run. No body, If-Match, cleanup GET or `ignore_missing` query is used. The updated backend supports eligible
unlinked lifecycle states, approved pending drafts and exclusive published graphs. Verify actual graph read/delete
capability and the latest-submitter/BU permission rules. Published cleanup's concurrent-writer risk is accepted by
the backend operating contract; additional table-wide locks are not prerequisites. DELETE does not establish
broker settlement. Complete saved-state assertions before cleanup. Required-cleanup fixtures do not use the existing
localhost-only `PO10626_DEFER_CLEANUP` capability.

Approval retains `@skip @PO10626RequiresPublishedCleanup` until the actual deployed consumer/cleanup contract and a
full owned approval/recovery/cleanup run are verified, with publication evidence allocated separately as above.
The consumer and pending/published cleanup are delivered on the support branch; their source delivery alone does
not satisfy this verification gate. `PUBLISHING_FAILED` cleanup eligibility does not authorise forcing that state.
Preserve failed receipts and raw outputs before runner resets. Controlled support checks and discovery establish
helper behaviour and selection/bindings respectively; live acceptance remains separate. All existing recovery,
Axe and native keyboard checks remain, with no additional accessibility exemptions.

Full inventory discovery (no browser actions or approval fixture creation):

```bash
TEST_URL=http://localhost:5100 \
TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626' \
CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626' \
corepack yarn test:functional:leaf --browser=chrome \
  --spec 'cypress/e2e/functional/opal/features/checkAndValidateCase/DraftCasefileConcurrency.feature,cypress/e2e/functional/opal/features/checkAndValidateCase/DraftCasefileConcurrencyAccessibility.feature' \
  --env 'dryRun=true,omitFiltered=false,tags=@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10626'
```

## Required References

Read this guide's Feature Layout and Tags, Accessibility Coverage, Step Definitions, Actions, Flows, and Selectors,
and execution sections together with [AGENTS.md](../AGENTS.md), [REPO_GUIDELINES.md](REPO_GUIDELINES.md),
[SONAR.md](SONAR.md), and [CONTRIBUTING.md](CONTRIBUTING.md). Apply the installed
`opal-frontend-e2e-tests` skill and its references when available; repository-contained rules remain authoritative.

## Feature Layout and Tags

- Preferred home is `cypress/e2e/functional/opal`.
- Feature files live under capability folders (for example, `features/manualAccountCreation/**`, `features/fineAccountEnquiry/**`).
- Tag scenarios with `@functional`, `@smoke`, and Jira IDs so suites can target subsets.
- Keep legacy suites in `cypress/e2e/Old_functional_E2E_Tests`; new scenarios should follow the `opal` layout.

## Accessibility Coverage

- Accessibility specs live alongside features and should navigate to each page, inject `axe-core`, run scans, and assert no violations.
- When a new page or view is added to a feature, add or update its accessibility spec.

## Step Definitions

- Step definitions in `cypress/support/step_definitions/**` must be thin shims.
- Each Given, When, Then should delegate to a single Action or Flow method.
- Shared DB or setup logic belongs in `databaseSteps` or `support/utils`, not in steps.

## Actions, Flows, and Selectors

- Actions in `cypress/e2e/functional/opal/actions/**` wrap interactions, API stubs, and navigation using selectors from `cypress/shared/selectors/**`.
- Make the business outcome visible through an explicit `Then` step delegating to an expectation method. An action
  may wait for navigation or readiness, but should not be the only place that proves the scenario's outcome.
  When separating an existing action from its assertions, preserve the assertions and migrate every functional and
  accessibility caller. A page heading alone must not replace record identity, mode, permission, or no-write checks.
- Flows in `cypress/e2e/functional/opal/flows/**` compose actions into business journeys exposed to steps. Component
  specs retain the direct script/helper style described in [CYPRESS_COMPONENT_TESTING.md](CYPRESS_COMPONENT_TESTING.md).
- Selectors are centralized. Add hooks in Angular templates and document them in `cypress/shared/selectors/**`. Avoid positional CSS.

### Shared fixtures and request setup

- Put reusable response builders and scenario data under the capability's `mocks/**`, and shared request wiring under
  `setup/**` or `intercept/**`. Actions should import these directly rather than importing another feature's Action
  module solely to reuse its fixtures or stubs. Do not introduce barrel exports.
- Extract only genuinely shared contracts. Preserve endpoint/method matching, query handling, aliases, and response
  semantics; leave scenario-specific selected-record behaviour with its owner. Keep business assertions in explicit
  expectation methods and mutable scenario data independent.
- Controlled reference responses prove frontend behaviour against those contracts. They do not establish deployed
  provider behaviour, live authentication, or permissions. Preserve the scenario's existing live/controlled boundary.

## Reusing feature-file steps

Apply this sequence when adding or modifying steps; existing unrelated features do not need a rewrite.
Component specs retain their direct script/helper style.

1. Search the step catalogue/source, Flows and Actions for the process and its synonyms. Start with the shared
   [authentication](../cypress/support/step_definitions/auth.steps.ts),
   [accessibility](../cypress/support/step_definitions/accessibility/accessibility.steps.ts) and
   [common assertions](../cypress/support/step_definitions/common.steps.ts).
2. Reuse an existing phrase when its preconditions, interaction and observable outcome match. Common heading, text
   and URL phrases already accept business values; do not add a feature-specific equivalent. Preserve business
   assertions that also check retained data, permissions, store state or API requests.
3. Parameterise varying business values with constrained expressions or validated DataTables. Reject unknown choices
   and columns rather than silently ignoring them. Keep scenario-specific input visible when it matters to the AC.
4. Share an existing Action/Flow when similar steps have different business intent. Add a phrase only for a different
   responsibility or outcome. Keep reuse local to the capability until multiple maintained capabilities need it.
5. Keep one delegate per binding. Flows own business orchestration and table interpretation; Actions own UI, network
   and confirmation details. Keep selectors out of Gherkin and do not infer page context from an available element.
   When changing a shared common assertion, move its existing body unchanged into a CommonActions method, retaining
   its logging, match strictness, selector and timeout; leave untouched assertions alone.
6. Before removing a binding, migrate every caller and check for undefined or ambiguous matches across the loaded
   registry. Cucumber matches text across Given/When/Then, so changing a keyword does not prevent ambiguity. Preserve
   scenario names, tags, Examples rows, Zephyr identity and independent setup.
7. Run browser journeys for every affected caller group and compare expanded scenario names, counts and tags before
   and after. Keep live and controlled data sources and keyboard interactions intact. Fewer bindings do not mean
   fewer tests or faster execution. Discovery/dry runs prove selection and binding only.

The [Minor Creditor bindings](../cypress/support/step_definitions/createDraftCasefile/minor-creditor.steps.ts) use
`/^I cancel minor creditor details and (accept|decline) the warning$/` for both existing feature phrases. The single
binding delegates to `MinorCreditorFlow.cancelDetailsWithDecision(decision)`, which rejects unsupported choices and
calls `cancelDetails(decision === 'accept')`. Retain the warning-text and downstream route/data-retention assertions.
Clean Cancel without edits and native `beforeunload` suppression have different contracts and remain separate.

`I cancel minor creditor removal` is the canonical wording for the former equivalent return/cancel bindings. Every
functional and accessibility caller uses that phrase; an alias is needed only for an identified external consumer.
The live reviewed-creditor removal journey remains distinct because it uses keyboard activation, checks heading
focus and observes live data. Do not replace it with the controlled mouse-click journey.

For changes to these bindings, run the Minor Creditor functional/accessibility pair before and after, then run
create-casefile/release-on, release-off and smoke discovery to check the shared registry. Run actual affected journeys
against their existing configured prerequisites; do not replace unavailable live data with mocks. Also run
`corepack yarn lint:cypress`, `corepack yarn exec tsc --project e2e.tsconfig.json --noEmit`,
`corepack yarn check:cypress:test-metadata` and `corepack yarn find:duplicate:scenarios`. Search for removed phrases
across all `cypress` callers. The duplicate-scenario scan supplements discovery and does not prove expression
unambiguity. If shared authentication, accessibility or common bindings change, inventory and execute every affected
functional, accessibility and smoke caller group. Preserve raw evidence before a runner resets its outputs.

### Keeping regression growth proportionate

Use component tests for exhaustive form-state rendering and validation, and retain E2E
coverage for complete journeys and meaningful integration boundaries. Before removing an
apparently duplicated scenario, map its assertions, data source, tags and external identity
to retained coverage. Mocked responses and live-service evidence are different contracts.

Reuse existing Steps, Flows and Actions, while giving each scenario independent mutable
state. Use focused spec/Story selections for development feedback without reducing required
full regressions. Report expanded examples, failures, retries, missing cases and wall time;
a successful runner exit alone does not prove a complete passing suite.

Apply [test-maintenance evidence](CONTRIBUTING.md#test-maintenance-evidence) to shared fixture/step changes and runtime
claims, including failed or incomplete parallel attempts and the final executed selection.

## Running a Feature

Run a single feature file with:

```
yarn cypress run --browser chrome --spec 'cypress/e2e/functional/opal/features/manualAccountCreation/populateAndSubmit/PopulateAndSubmit.feature'
```

## Handling Real Product Bugs

- When a feature fails because of a real product bug, do not patch application behavior just to green the test.
- Skip or xfail the test if unavoidable and report the underlying issue in the task update.

## Unsaved changes and native leave-site dialogs

Journeys can register `beforeunload` listeners while data is unsaved. Browser reloads,
Cypress test isolation and navigation between specs can consequently open a native **Leave site?**
dialog and block a headless worker until the pipeline times out. A passing login worker does not
mean the other parallel workers completed.

`cypress/support/e2e.ts` installs a shared capture listener through `window:before:load`, before
application listeners are registered. It stops `beforeunload` propagation on every application window
so application listeners cannot cancel unloading during E2E runs. This applies across journeys to
reloads and scenario/spec transitions, including cleanup after a failing scenario. It is E2E support
code, not a production change; it also prevents other application unload listeners from running.
Keep this behaviour out of component support so guard tests can exercise the real listeners.

Do not use `window:confirm` to handle this native browser dialog. For application route-guard confirmations,
register a `cy.once('window:confirm', handler)` inside a queued `cy.then(...)` before clicking Cancel. This matches
the `opal-frontend` cancellation actions. The Creditor action leaves the application's `window.confirm` intact,
checks the received warning, and returns the requested boolean. An assertion after the click also requires the
warning to have been received, so an uncalled handler cannot silently pass. Keep the route and retained-edit
assertions so an incorrect outcome fails. Its handler is consumed by the next confirmation or removed by Cypress
at test end.
Cypress automatically handles these confirmations, so this does not prove native browser modal rendering or
Studio replay. Clean Cancel paths must still assert that no confirmation occurs.
Setting `window.onbeforeunload = null` alone does not remove Angular listeners registered with `addEventListener`.

Cypress 15.21.1 still relies on `unload` to clear its window listeners between page loads. Chromium's
[unload deprecation](https://developer.chrome.com/docs/web-platform/deprecating-unload) can prevent that cleanup:
later pages open the native confirmation while the test's `window:confirm` handler is never called. This was
reproduced in Chrome 155 interactive mode. `setupBrowserLaunch` merges `DeprecateUnload` into Chromium's existing
`--disable-features` argument so Cypress can install its handlers after navigation. It applies to both open and
run modes and preserves the other launch flags. This is a compatibility setting for Cypress-launched browsers;
the application guard and confirmation implementation are unchanged. Fully close and relaunch the Cypress
browser after changing this setting; rerunning the spec in an existing browser does not apply launch flags.
Reassess this setting when upgrading to a Cypress version that no longer depends on `unload`.

E2E refresh scenarios prove the resulting navigation and state reset with the native prompt suppressed.
They do not prove browser Leave/Cancel behaviour. Retain unit/component coverage of the actual guard
and verify native dialog behaviour separately in a browser without this E2E helper. Do not claim a
Cucumber dry run, or one passing parallel worker, as evidence of a completed functional suite.

## Screenshots and keyboard focus

In Cypress 15.21.1 open mode, restoring the runner after a screenshot can refocus the selected feature in the spec
sidebar. A screenshot immediately before a native keyboard action or focus assertion can therefore interfere with
the interaction being tested.

When this runner behaviour is confirmed, restrict documentary screenshots to run mode using
`!Cypress.config('isInteractive')`. Keep native keyboard actions, focus assertions and business outcome checks
enabled in both modes. Retain screenshots required for layout or accessibility evidence, and verify that their
placement does not interrupt subsequent keyboard checks.

## RM create-casefiles release selection

The `release-1c-rm-create-case-files` flag gates the Cases dashboard and the complete create-casefile journey.
Smoke tests follow the sibling frontend pattern: sign-in must reach an available dashboard before checking sign-out.
They therefore require this release to be enabled. Dedicated flag-off functional scenarios use authentication without
a dashboard assertion and verify Access Denied. Tagged CNP and nightly runs skip smoke tests.

- `@R1CRmCreateCaseFiles` identifies scenarios requiring the flag to be enabled, including existing create-casefile
  functional and accessibility features.
- `@R1CRmCreateCaseFilesOff` identifies scenarios requiring the flag to be disabled.
- Default Cypress, CNP and nightly selections exclude `@skip` and `@R1CRmCreateCaseFilesOff`. The default functional
  suite therefore requires the release to be enabled. Explicit tag selections override this default; tagged pipeline
  runs retain the existing behaviour of skipping smoke tests.

Run the matching suite against an environment already configured for that flag state:

```bash
corepack yarn test:functional:rm-create-case-files
corepack yarn test:functional:rm-create-case-files-off
corepack yarn test:smoke
```

The live submission scenario below carries `@retries(0)`, which overrides the run configuration for that scenario:
each execution creates one synthetic submitted record, records its ID in memory for cleanup and must never be retried automatically.

Cypress maps the existing uppercase `TAGS` contract to the lowercase `tags` setting required by Cucumber v26 before
registering the preprocessor. An explicit lowercase `tags` value takes precedence.

The release scripts set both `TAGS` and `CYPRESS_TAGS` to avoid inheriting an incompatible pipeline tag expression.
They do not change LaunchDarkly or application configuration. For local override testing, start the app with
`FEATURE_FLAGS_OVERRIDE=true` and `RELEASE_1C_RM_CREATE_CASE_FILES_ENABLED=true` or `false`. For deployed runs, configure
LaunchDarkly separately. Do not run enabled and disabled functional selections against the same unchanged flag state.

CNP supports the existing `run_tag:@R1CRmCreateCaseFiles` and `run_tag:@R1CRmCreateCaseFilesOff` labels. Nightly supports
the equivalent `TAGS` parameter. No new release selector or automatic flag mutation is introduced.

Release-specific functional and accessibility scenarios live under `features/releaseFlags`. Their confirmed Jira
metadata is `@JIRA-STORY:PO-10606` and `@JIRA-EPIC:PO-10817`, restored from the existing same-scenario assignment in
commit `417cdd022a555cb0713ab26aa128f65e2222826c`. Separately assigned Jira Test identifiers remain unclaimed.
A Cucumber dry run proves scenario selection and step binding only; it is not evidence of a completed browser
journey or deployed authentication.

## Live create-casefile QA prerequisites

Live QA scenarios observe HTTP requests without replacing responses. Each scenario starts an independent casefile,
uses synthetic entered data, reopens pages to prove local retention, and stops before submission, except for the
single live submission scenario described below. Missing accounts,
reference data or release configuration must fail clearly; do not skip or substitute mocks for a failed prerequisite.

| Prerequisite        | Required configuration                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------- |
| Release             | `release-1c-rm-create-case-files=true`                                                       |
| Authorised account  | ACTIVE; Maintenance domain; `CREATE_MANAGE_DRAFT_CASEFILES` / API permission ID 21 for BU 44 |
| Denied account      | ACTIVE; Maintenance domain; no permission 21 for BU 44; distinct from authorised account     |
| Countries           | Active dataset containing United Kingdom and at least two other distinct Country names       |
| Applications        | At least one active record with `application_group=Create Casefile`                          |
| Central Authorities | At least two active BU 44 records with `central_authority=true`                              |

The selected features authenticate through the shared `I am authenticated with email {string}` binding, using the
existing provisioned synthetic usernames `opal-test@dev.platform.hmcts.net` (creator) and
`opal-test-4@dev.platform.hmcts.net` (denied user), as the Fines suites do. Sessions are cached by the supplied username.
Both users are already provisioned by User Service. Each scenario still owns a new draft; do not create users or
change permissions as a test side effect.

Local/PR sign-in uses the passwordless stub and requires only the username supplied by the feature. No separate
role-account environment variables are required. The live User Service must provide ACTIVE Maintenance membership
and the BU 44 permission state above. The explicit permission preflight reads the actual `/api/user-state` response
(`domains.maintenance`) after shared authentication. This preflight verifies existing access and never provisions or
changes it; authentication or existing-access failures fail setup.

If shared login stalls or reaches `/account-created`, inspect the actual `/api/user-state` status and safe diagnostic
details before attributing the failure to provisioning. Check the configured local User Service and required cache
dependencies, including Redis, as applicable; a dependency failure can prevent user-state resolution. Do not change
accounts, permissions, guards, or authentication stubs to make the run pass. Record and correct the evidenced local
prerequisite, then rerun the affected selection. Keep credentials, tokens, and user data out of diagnostic reports.

| Environment variable      | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `TEST_URL`                | Frontend browser target                                         |
| `OPAL_TEST_USER_EMAIL`    | Existing global test email mapping used by other suite callers  |
| `OPAL_TEST_USER_PASSWORD` | Existing shared SSO password, mapped to `CYPRESS_TEST_PASSWORD` |

Microsoft SSO retains the existing shared password environment configuration. Full browser SSO remains unverified
by the local passwordless runs. Other suites may still require the existing global email/password mappings.
Country and Central Authority lookups may be cached within a journey, so replay must not await another request.

### Start, navigate and live submission (PO-10273)

PO-10273 reuses the maintained Individual and Organisation party, Central Authority, Order Details, Check Case Details,
shared permission and accessibility owners. Existing scenarios prove supported starts, locally retained progress,
ordered task unlocking and task-list accessibility. Only the REMO Out (CMS) start-only scenario and the live full
submission scenario are new; the permission outline adds the journey-entry and task-list examples.

`CheckCaseDetails.feature` contains exactly one live full submission scenario. It completes one synthetic draft using
the existing live party, Order Details and MAT/Applicant creditor flows, then supplies the mandatory payment tasks.
It observes the real create POST, requires HTTP 201 with a positive safe-integer ID and status `SUBMITTED`, and checks
submission confirmation, focus and the single create request. Create a new case then proves journey clearing.
Per the developer clarification confirmed on 21 October 2026, displaying the generated Draft Casefile ID in the
confirmation panel belongs to future work outside PO-10273. The saved ticket export still lists that display check;
this agreed scope change supersedes it for this branch. Backend receipt-ID validation and early capture for cleanup
remain required. Other scenarios in that feature retain controlled submission responses.

The live scenario records the observed ID before later assertions and attempts cleanup after passing and failing
scenarios. No cleanup runs until creation has actually been observed. This QA change has no `src` delta. Keep the
scenario-level `@retries(0)` to avoid replaying a real submission after an assertion or cleanup failure; the remaining
scenarios use the shared retry configuration.

Discovery proves binding and selection only. Live execution must verify confirmation, cleared journey state and
successful authenticated cleanup against the actual target services.

```bash
TEST_URL=http://localhost:5000 \
TAGS='@JIRA-STORY:PO-10273 and not @skip' CYPRESS_TAGS='@JIRA-STORY:PO-10273 and not @skip' \
corepack yarn test:functional:serial --browser=chrome \
  --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/IndividualCaseParties.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrganisationCaseParties.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CentralAuthorityDetails.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrderDetails.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CheckCaseDetails.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CasefilePermissions.feature,cypress/e2e/functional/opal/features/createDraftCasefile/IndividualCasePartiesAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrderDetailsAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CheckCaseDetailsAccessibility.feature'
```

Cleanup uses the Maintenance contract documented in `docs/DRAFT_CASEFILE_TEST_CLEANUP.md` in
`opal-maintenance-service`. The implementation is now merged into Maintenance `master` (merge `d3123e7`, PR 302). The live scenario creates a fresh marker matching
`^E2E-[0-9a-f]{16}$`, using a random 16-digit suffix so the field's uppercasing preserves the exact marker. It
enters it through Central Authority's REMO Reference field, saves/reopens it, and checks the real
POST payload contains the same value at `casefile.respondent_account.remo_reference`. No POST response is substituted.
The response listener records the positive safe-integer ID and exact marker synchronously before later assertions.
Controlled receipt IDs are never registered.

`cypress/support/draftCasefiles.ts` installs one `afterEach` through the shared E2E support file. It runs locally and
in deployed CI, including after assertion failures. Before any deletion, every captured ID/marker and frontend target
is written to `functional-output/draft-casefile-cleanup/`. Cleanup sends
`DELETE /opal-maintenance-service/testing-support/draft-casefiles/{id}` with `Test-Run-Reference` through the existing
authenticated frontend proxy/session. There is no new token handling, cleanup identity configuration, BU parameter,
body, GET lookup, ETag or If-Match. The backend checks permission 21 in the stored BU and original submitter identity,
exact persisted marker, unvalidated SUBMITTED status and absence of account links.

Only 204 succeeds (including already absent), removing that receipt from the outstanding collection and ledger.
Non-204 responses are collected across targets and fail the hook; 404 means unavailable/disabled, not successful
cleanup. Requests have a 15-second timeout, no redirects or automatic retries, and no request logging. A transport
failure fails the hook immediately; all receipts have already been written for a separately authorised retry.
CNP's existing `afterAlways` hooks archive `functional-output/**` in dev and staging. Preserve local reports before
another runner invocation resets output. Browser/process termination before teardown can still lose an in-memory
receipt, and a lost POST response cannot be recovered through this endpoint. No automatic recovery is claimed.

Enable `opal-maintenance-service.java.environment.TESTING_SUPPORT_ENDPOINTS_ENABLED=true` in frontend-owned dev and
staging deployments used by E2E. Base values explicitly set it false; keep production false. This single shared flag
has no application environment allowlist. Backend-owned overlays do not configure the frontend subchart. Remove
obsolete `DRAFT_CASEFILE_CLEANUP_*` and `OPAL_DEPLOYMENT_ENVIRONMENT` overrides; no such settings are needed here.
Standalone Maintenance Compose enables the flag, and shared Docker inherits `.env.shared`.

Maintenance cleanup is merged into `master`, so the frontend PR no longer needs the temporary
`enable_keep_helm` / `enable_opal_maintenance_service:pr-302` image selection labels. Use the normal deployment image
and verify that the actual deployed build contains the merged implementation. A local source merge or a mutable
`latest` tag alone does not prove the deployed image's contents. Frontend-owned dev/staging subchart enablement is
still required; production must remain disabled.

The normal CNP selection uses `cypress/e2e/functional/opal/**/*.feature` and
`not @skip and not @R1CRmCreateCaseFilesOff`, so it includes the PO-10273 live scenario and its shared cleanup hook.
`run_tag:` and `test_*` labels can narrow selection; inspect them before treating a green run as evidence. Backend
Gradle CI does not execute Cypress. Confirm the scenario in the frontend functional report, along with authenticated
permission 21, reference-data lookups and the enabled create-casefile release in the actual target environment.

The receipt collection uses Cypress env because module-local state is not shared between independently bundled
support and feature files. Cleanup leaves Accept unrestricted: success has no body, and backend errors use
`application/problem+json`. Verify cleanup through the live submission scenario and retain its outcome in the PR's
test evidence.

Cleanup failure regressions run in the existing Cypress component suite at
`cypress/component/createDraftCasefile/draft-casefile-cleanup.cy.ts`. The spec installs the real `afterEach` hook,
uses the real Cypress command queue and receipt files, and controls only the DELETE request boundary. It covers
non-204 failures (400, 401, 403, 404, 409, 500 and 503) mixed with a successful deletion, plus transport failure on
the first request and after a 204. Assertions require hook failure, preservation of every outstanding ID/marker in
memory and on disk, and persistence of all targets before the first request. Only successful receipts may be cleared.
An assertion after cleanup requires the expected failure to have occurred, so silently accepting a failed deletion
fails the regression test. Synthetic fixture ledgers are reset between tests and cleared after verification.
This is controlled helper coverage; the live submission scenario remains the authenticated integration check.

```bash
corepack yarn exec cypress run --component --browser chrome \
  --spec cypress/component/createDraftCasefile/draft-casefile-cleanup.cy.ts
```

Run the individual capture and retention outcome with:

```bash
corepack yarn test:functional:serial --browser=chrome --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/IndividualCaseParties.feature'
```

The scenario requires live Country ordering, both party statuses Provided, reopened field values, and zero draft
creation POSTs. Keyboard interactions and Axe scans provide partial accessibility evidence; specialist WCAG 2.2 AA
assurance remains separate. Positive order-details scenarios must supply a valid Date order made: the QA ticket's
required-versus-optional wording differs from current product validation, which this test work does not change.

## Shared casefile permission coverage

`CasefilePermissions.feature` runs exactly nineteen unique protected routes with the release enabled. Each example first
checks the authorised user's live ACTIVE Maintenance state and BU 44 `CREATE_MANAGE_DRAFT_CASEFILES` / API permission
ID 21, then opens the released case-type page. It explicitly authenticates the provisioned denied username and checks
live ACTIVE status, Maintenance domain and absence of permission 21 for BU 44 before attempting direct task navigation.
Another BU permission is not required; an existing user with another BU membership is acceptable when BU 44 permission
21 is absent. The tests use actual route guards without role changes, injected store state or mocked denial responses.

Require `release-1c-rm-create-case-files=true` for all anonymous LaunchDarkly test contexts, rather than a percentage
rollout. The positive entry check prevents a release-off failure from masquerading as permission rejection. The
existing release-off features remain separate because they exercise a different denial cause.

Shared respondent and Central Authority Examples carry both `@JIRA-STORY:PO-10275` and `@JIRA-STORY:PO-10276`, so
selection by either party ticket includes both shared routes. Individual and organisation applicant Examples carry
the corresponding party ticket; Order Details carries `@JIRA-STORY:PO-10277`, and the four Order Term routes carry
`@JIRA-STORY:PO-10278`. Minor Creditor details, summary and removal carry `@JIRA-STORY:PO-10280`.
The Order Term creditor route carries `@JIRA-STORY:PO-10279`.
Journey entry and task list carry `@JIRA-STORY:PO-10273`.
Interest and Indexation and Managing Payments carry `@JIRA-STORY:PO-10281`.
The outline carries epic PO-6506.

```bash
corepack yarn test:functional:serial --browser=chrome --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/CasefilePermissions.feature'
```

## Review and submission QA (PO-10283)

The PO-10283 selection extends the existing live scenario and adds controlled comments, optional omission and
rejection/retry coverage. Each scenario owns an independent browser-created local draft.
The rejection is an intercepted HTTP 400, followed by an explicitly requested controlled success; it does not prove a
live service failure or persistence rollback.

The existing live scenario observes the real HTTP 201 receipt, requires a positive generated ID and `SUBMITTED` status,
and proves state clearing and blocked re-entry to submitted forms. It retains
PO-10273 ownership and disables automatic scenario retries. Cleanup records only observed live IDs and their saved
test-run markers, then uses the Maintenance contract described above. Before running it, verify the selected backend
image contains that implementation, test support is enabled in the target environment and the release is enabled.
A client 204 alone does not establish the backend's transactional semantics.

The user has deferred generated-ID display and cases-in-review onward navigation to future work. These are outside
this branch's agreed QA scope. The backend receipt ID is still validated and captured before assertions for cleanup.
When the onward route is agreed, add native keyboard activation and assert an independently specified page outcome.
Automated Axe and keyboard checks are partial accessibility evidence.

Use the configured `TEST_URL`; the examples below use the local frontend on port 5000.
Discover the four selected review scenarios (the retained live scenario plus three controlled scenarios) without
browser execution:

```bash
TEST_URL=http://localhost:5000 TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10283 and not @skip' CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10283 and not @skip' corepack yarn test:functional:serial --browser=chrome --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/CheckCaseDetails.feature' --env dryRun=true
```

Run only the three controlled scenarios by excluding the live scenario's PO-10273 tag. Record actual results rather
than claiming browser acceptance from discovery:

```bash
TEST_URL=http://localhost:5000 TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10283 and not @JIRA-STORY:PO-10273 and not @skip' CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10283 and not @JIRA-STORY:PO-10273 and not @skip' corepack yarn test:functional:serial --browser=chrome --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/CheckCaseDetails.feature'
```

Run the sole live submission scenario only after the runtime prerequisites above are evidenced. Expect one live create
POST, a valid backend receipt, blocked re-entry and a 204 cleanup for its ID and exact marker:

```bash
TEST_URL=http://localhost:5000 TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10283 and @JIRA-STORY:PO-10273 and not @skip' CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10283 and @JIRA-STORY:PO-10273 and not @skip' corepack yarn test:functional:serial --browser=chrome --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/CheckCaseDetails.feature'
```

The final focused selection combines functional review, accessibility and permission coverage. It includes the live
scenario, so keep this as discovery until the runtime prerequisites are met:

```bash
TEST_URL=http://localhost:5000 TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10283 and not @skip' CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10283 and not @skip' corepack yarn test:functional:serial --browser=chrome --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/CheckCaseDetails.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CheckCaseDetailsAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CasefilePermissions.feature' --env dryRun=true
```

### Local verification, 21 October 2026

After merging the latest PO-10273, focused discovery selected all eight PO-10283 examples. Actual Chrome execution
using the normal CNP tag expression passed all 30 affected examples: nine review/submission, two accessibility and
nineteen permission examples, with no retries, pending or skipped cases. The accessibility examples completed ten Axe
scans. The live scenario received HTTP 201 and its authenticated cleanup completed with HTTP 204; the receipt ledger
was empty afterwards, and a read-only database query confirmed draft 15 was absent and no draft casefiles remained.

```bash
TEST_URL=http://localhost:5000 TAGS='not @skip and not @R1CRmCreateCaseFilesOff' CYPRESS_TAGS='not @skip and not @R1CRmCreateCaseFilesOff' corepack yarn test:functional:serial --browser=chrome --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/CheckCaseDetails.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CheckCaseDetailsAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CasefilePermissions.feature'
```

Also passed: `corepack yarn prettier`, `corepack yarn lint:cypress`, `corepack yarn lint:ng`,
`corepack yarn tsc -p e2e.tsconfig.json --noEmit`, `corepack yarn check:cypress:test-metadata`,
`corepack yarn find:duplicate:scenarios`, and `corepack yarn test` (1,854 tests).
The merge preserved the child branch's scenario names, tags and Examples rows. The default CNP functional glob and tag
expression select these features and the shared support hook. Deployed CI execution and QA sign-off remain unverified.
For a deployed run, enable the create-casefile release, provision the documented accounts/reference data and enable
Maintenance test support in dev/staging; expect the same submission, permission denial and cleanup outcomes.

Production build, component tests, new-code coverage and UI screenshots were not repeated: this QA change alters no
application source, UI or dependencies, and Sonar measures `src/`. No coverage exclusions were added. Automated Axe
and keyboard results do not replace human assistive-technology verification of the comments, review, error and
confirmation pages. The intercepted rejection proves frontend retention/retry, not a live backend rejection.

## Integrated live QA selection and evidence

For PO-10275, PO-10276 and PO-10277, select both tag variables explicitly so a pipeline filter cannot remove the
permission examples. The enabled release must apply to every test context. This focused selection expands to 15
scenarios: two mandatory-party outcomes, two authority outcomes, one order outcome, five permission routes and five
accessibility outcomes. The retained REMO Out authority examples carry PO-9804 and are outside this QA selection.

```bash
TAGS='@R1CRmCreateCaseFiles and (@JIRA-STORY:PO-10275 or @JIRA-STORY:PO-10276 or @JIRA-STORY:PO-10277) and not @skip' \
CYPRESS_TAGS='@R1CRmCreateCaseFiles and (@JIRA-STORY:PO-10275 or @JIRA-STORY:PO-10276 or @JIRA-STORY:PO-10277) and not @skip' \
corepack yarn test:functional:serial --browser=chrome --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/IndividualCaseParties.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrganisationCaseParties.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CentralAuthorityDetails.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrderDetails.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CasefilePermissions.feature,cypress/e2e/functional/opal/features/createDraftCasefile/IndividualCasePartiesAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrganisationCasePartiesAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CentralAuthorityDetailsAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrderDetailsAccessibility.feature'
```

Run affected existing Order Details and Central Authority functional/accessibility features with both `TAGS` and
`CYPRESS_TAGS` set to `@R1CRmCreateCaseFiles and not @skip`, then run
`corepack yarn test:smoke:serial --browser=chrome` to check existing login callers. Preserve each run's generated
reports before the next runner invocation resets its output. Inspect and redact account identifiers, credentials,
tokens and personal information before retaining or sharing reports or screenshots. Record the actual expanded
scenario count, command exit code, browser version and safe environment alias; zero tests or skipped denial examples
are failed verification. Local passwordless authentication and live local APIs do not prove deployed SSO behavior.

Axe and the scenario keyboard interactions provide partial accessibility evidence. Specialist follow-up should verify
keyboard-only navigation and visible focus across every page, screen-reader announcements and accessible names on
expanded controls, and magnification behavior, using the same enabled release and provisioned authorised account.
Required metadata checks still apply to the full configured scope; missing confirmed Jira identifiers must be resolved
from authoritative ticket context rather than guessed or excluded.

## Order Terms QA (PO-10278)

The representative MAT dataset is a prerequisite for this bounded QA pack. The active Order Term list must include
MAT; its detail must supply a title and a nonempty JSON parameter array. Require mandatory `amount` with a supported
money/decimal type permitting 10, 20 and 25, and inherited `frequency` (Monthly from saved Order Details). Optional
`expiry`/`expiry_date` and `arrears` are supported. The observed MAT also requires `Creditor` and `Respondent`
(`text-60`), `Payment` (`menu-radio`, including `Payable through the Court`) and `Commencement` (`date`). When present,
the tests complete these fields with synthetic labels, the observed Court option and 01/01/2026 after checking the
metadata bounds. Replay verifies their retained values before an amount-only amendment. Unknown fields fail the
bounded fixture guard. This is a test-data contract, not a restriction on product Results.
The tests compare prompts and rendered controls with the observed metadata without using the production mapper.
The Major Creditor lookup must return HTTP 200 with a `refData` array scoped to active BU 44 non-Central-Authority
records. An empty array is valid for these Applicant creditor journeys. These scenarios use real reference data and
independent drafts; they observe that no draft-casefile POST occurs and stop before submission.

Select nine expanded scenarios: four Order Term outcomes, one accessibility journey and four permission routes
(summary, selection, MAT input and removal). Existing mocked regressions retain scenario-local setup.

```bash
TEST_URL=http://localhost:5000 \
TAGS='@JIRA-STORY:PO-10278 and not @skip' CYPRESS_TAGS='@JIRA-STORY:PO-10278 and not @skip' \
corepack yarn test:functional:serial --browser=chrome --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/OrderTerms.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrderTermsSummary.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrderTermsAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CasefilePermissions.feature'
```

Use the configured frontend target for `TEST_URL`; localhost is the local execution example. To include affected
original regressions, run the same specs with both tag variables set to `@R1CRmCreateCaseFiles and not @skip`.
Preserve reports before the next runner resets output. Axe scans cover selection, input, summary, removal,
cancellation and removal success, alongside keyboard activation of continuation/removal controls. These are partial
accessibility evidence; specialist screen-reader, focus and magnification assurance remains separate.

## Minor Creditor QA (PO-10280)

The live scenarios reuse the Order Terms prerequisites above. Each scenario creates its own draft and Minor Creditor
through the real UI, checks the complete visible Country ordering against the observed active Country names, and
asserts that no draft-casefile POST occurs. Functional coverage uses bank type None for both Individual and Organisation.
Change, confirmed removal and abandoned removal are exercised from the locally saved Minor Creditor review page.
Final acceptance separately proves the expected Minor name is associated with its stable Order Term card. These
scenarios cover the review actions currently provided by the product; accepted Order Term cards expose term actions.
Removal checks the success banner, absence from Minor choices and fresh blank details on reopening.

Select eleven expanded examples: six functional outcomes, two accessibility journeys and three permission routes:

```bash
TEST_URL=http://localhost:5000 \
TAGS='@JIRA-STORY:PO-10280 and not @skip' CYPRESS_TAGS='@JIRA-STORY:PO-10280 and not @skip' \
corepack yarn test:functional:serial --browser=chrome --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/MinorCreditor.feature,cypress/e2e/functional/opal/features/createDraftCasefile/MinorCreditorAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CasefilePermissions.feature'
```

Use the configured frontend target for `TEST_URL`. Run the same three specs with both tag variables set to
`@R1CRmCreateCaseFiles and not @skip` for the retained non-UK bank, pending review, cancellation and removal regressions.
Preserve generated reports before each run and clear only generated report outputs if stale XML is retained.
Both identity accessibility journeys reopen the real details page and scan UK, non-UK and None conditional bank
controls, review, removal confirmation, abandoned removal and removal success. Keyboard activation uses focused
controls, with native Enter for anchors. Axe and these interactions provide partial accessibility evidence.
Specialist follow-up must check full keyboard traversal and visible focus, screen-reader names and announcements,
and magnification using the enabled release and provisioned creator; expect reachable controls, correctly announced
state and no lost content. No further Axe exemptions are introduced.

## Order Term creditor QA (PO-10279)

PO-10279 follows the implemented Order Term creditor choices: Applicant,
active BU 44 non-Central-Authority Major Creditor, and an existing Minor Creditor
on the same order. The approved draft's Central-Authority-as-creditor scenario
was superseded by the user's 14 October 2026 scope clarification. Central
Authorities remain covered by their separate existing task; this pack does not
claim that stale scenario passed, skip it as a defect, or change product behavior.

Applicant and Minor Creditor journeys observe the real Major lookup and accept an empty `refData` array while
retaining the HTTP status, query and returned-record scope assertions. Only `Retain a sample Major Creditor by its
identity` and `applicant and Major Creditor selection states are accessible` supply a scenario-local controlled Major
response through `a sample Major Creditor is available for selection`. They reuse the existing synthetic BU 44,
active, non-Central-Authority fixture; authentication, permissions and other reference-data requests remain live.
These two scenarios prove frontend selection, identity retention, replay and accessibility with supplied reference
data. A passing run does not prove the live Major Creditor endpoint supplies selectable records. Live Major Creditor
integration remains pending suitable reference data in each target environment; the DEV-only seed does not provision
staging. Remove the controlled setup when restoring that live integration coverage.

Major selection and replay use the supplied response's observed ID and name. Same-order Minor reuse captures the actual
radio value and checks both term cards plus exactly one retained option. Each scenario owns a new
draft and stops before submission. Existing mocked validation, cancellation, reload and removal
regressions retain isolated setup. Accessibility scans cover initial Applicant, revealed Major,
checked reused Minor and retained summary states, with keyboard Continue activation; these are
partial accessibility evidence and require the separate specialist assurance described above.

Select seven expanded examples: four functional outcomes, two accessibility journeys and one permission route:

```bash
TEST_URL=http://localhost:5000 \
TAGS='@JIRA-STORY:PO-10279 and not @skip' CYPRESS_TAGS='@JIRA-STORY:PO-10279 and not @skip' \
corepack yarn test:functional:serial --browser=chrome \
  --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/Creditor.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CreditorAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CasefilePermissions.feature'
```

Repeat those specs with both tag variables set to `@R1CRmCreateCaseFiles and not @skip` for affected regressions.

## Integrated Order Terms and creditor QA

Select PO-10278, PO-10279 and PO-10280 together using both tag variables. This selection expands to exactly 27
examples; the eleven permission routes tagged to other QA stories are outside this selection. The complete shared
permission outline has nineteen unique routes, including the two journey routes for PO-10273 and the two payment
routes for PO-10281.

| QA story | Functional | Accessibility | Permission | Total |
| -------- | ---------: | ------------: | ---------: | ----: |
| PO-10278 |          4 |             1 |          4 |     9 |
| PO-10279 |          4 |             2 |          1 |     7 |
| PO-10280 |          6 |             2 |          3 |    11 |
| Total    |         14 |             5 |          8 |    27 |

Use the configured frontend target in `TEST_URL`; localhost below is the local execution example. The enabled release,
provisioned creator/denied accounts, Countries, active Create Casefile application and representative MAT metadata
are prerequisites. Applicant and Minor journeys permit an empty live Major lookup; only the two Major-selection
scenarios use the controlled response described above. Do not change users, permissions, reference data or flags as a
test side effect. Each scenario owns an independent draft and stops before submission. Missing prerequisites fail
explicitly. The superseded Central Authority scenario belongs to the separate implemented authority task;
it is neither claimed as passing creditor coverage nor skipped as a product defect.

First run discovery to verify selection and bindings, then remove `--env dryRun=true` for actual browser evidence:

```bash
TEST_URL=http://localhost:5000 TAGS='@R1CRmCreateCaseFiles and (@JIRA-STORY:PO-10278 or @JIRA-STORY:PO-10279 or @JIRA-STORY:PO-10280) and not @skip' CYPRESS_TAGS='@R1CRmCreateCaseFiles and (@JIRA-STORY:PO-10278 or @JIRA-STORY:PO-10279 or @JIRA-STORY:PO-10280) and not @skip' corepack yarn test:functional:serial --browser=chrome --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/OrderTerms.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrderTermsSummary.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrderTermsAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/MinorCreditor.feature,cypress/e2e/functional/opal/features/createDraftCasefile/MinorCreditorAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/Creditor.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CreditorAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CasefilePermissions.feature' --env dryRun=true
```

A dry run does not execute browser steps. Require 27 actual passing examples with zero failed, pending or skipped
examples, including eight denied-account routes. Record the command, exit code, expanded counts, browser version,
safe environment alias and tested commit. Real-service QA observes HTTP traffic without replies/static responses;
existing mocked regressions keep their scenario-local setup and original implementation-story tags.

Preserve every report before the runner resets output. Use separate directory creation and copy commands:

```bash
mkdir -p docs/superpowers/plans/2026-10-14-order-terms-creditors-evidence/qa-reports
cp -R functional-output/. docs/superpowers/plans/2026-10-14-order-terms-creditors-evidence/qa-reports/
```

Keep raw outputs local and ignored. Inspect and redact account identifiers, credentials, tokens, payloads and personal
information before retaining or sharing evidence. Remove unreviewed HTML/image attachments from a shareable copy;
never commit raw reports or screenshots. If old XML survives a runner reset, preserve the run first and clear only
its generated Chrome reports before the next run. No Jira or Zephyr publication is part of this workflow.

Run the full changed-capability/prerequisite regression selection, then preserve its reports before smoke:

```bash
TEST_URL=http://localhost:5000 TAGS='@R1CRmCreateCaseFiles and not @skip' CYPRESS_TAGS='@R1CRmCreateCaseFiles and not @skip' corepack yarn test:functional:serial --browser=chrome --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/OrderTerms.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrderTermsInput.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrderTermsInputAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrderTermsSummary.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrderTermsSummaryAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrderTermsAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/Creditor.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CreditorAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/MinorCreditor.feature,cypress/e2e/functional/opal/features/createDraftCasefile/MinorCreditorAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrderDetails.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrderDetailsAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/IndividualCaseParties.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CasefilePermissions.feature'
TEST_URL=http://localhost:5000 corepack yarn test:smoke:serial --browser=chrome
```

Smoke writes its reports to `smoke-output/`. The component runner resets both `functional-output/` and
`smoke-output/`, so preserve smoke reports before starting the component pre-flight:

```bash
mkdir -p docs/superpowers/plans/2026-10-14-order-terms-creditors-evidence/smoke-reports
cp -R smoke-output/. docs/superpowers/plans/2026-10-14-order-terms-creditors-evidence/smoke-reports/
```

This regression includes retained Order Term input/summary validation, failure, cancellation and reload cases,
Minor Creditor bank/review/removal cases, creditor choices, Order Details, mandatory parties and all fifteen permission
routes. Complete the local pre-flight in [SONAR.md](SONAR.md), E2E TypeScript, the full configured Jira metadata policy
and duplicate-scenario scan. A passing createDraftCasefile-only metadata check supplements the full policy result;
missing authoritative Jira identifiers in other configured features remain an unmet required check. Do not invent
identifiers or add exclusions to produce a pass.

Creditor changes/removals cover locally saved review state; acceptance into a stable Order Term and same-order reuse
are separate positive outcomes. Shared-creditor deletion semantics and a post-acceptance creditor card action are
outside this pack. Axe scans and browser keyboard/focus assertions provide partial accessibility evidence. Specialist
follow-up must cover keyboard-only navigation and visible focus across these pages, screen-reader announcements and
accessible names on summary actions/notices, and magnification. Local passwordless execution does not establish
deployed SSO behavior. Keep CI, external security/Sonar checks, reviewer approval, specialist QA and deployment pending
until direct evidence confirms them.

## Capture payment arrangements QA (PO-10281)

`Payments.feature` covers four independent interest/indexation combinations (Yes/RPI, No/CPI, Yes/Other and No/None)
and both court/direct payment arrangements. Each example starts a fresh browser-led draft with live mandatory-party
and Order Details setup, then saves and reopens the payment tasks to verify their actual selected controls and Provided
statuses. Payment-management examples replay both tasks to prove neither local save overwrites the other task.
No Draft Casefile creation POST is permitted. The examples stop before submission and do not test payment collection.

Other indexation is a selection only, with no additional details input. This follows the functional write-up and
existing implementation, as agreed for PO-10281; the TDIA's conditional Other-details wording remains a documentation
follow-up. Field-level validation remains owned by the existing payment component specs.

`PaymentsAccessibility.feature` scans both payment pages before selection, after keyboard selection and after local
save/reopen. Keyboard assertions cover radio activation, native Tab movement and primary-action activation.
These are partial accessibility results; specialist screen-reader, visible-focus and magnification checks remain
necessary for full WCAG 2.2 AA assurance.

The shared permission outline adds `interest-and-indexation` and `managing-payments`, tagged PO-10281. It retains the
live authorised-entry and denied-user preflights. Enable `release-1c-rm-create-case-files` for all test contexts and
provision the live user, Country and Maintenance Application prerequisites above. These payment scenarios do not
require Results, Major Creditors or Central Authorities. They do not replace live responses or mutate permissions.

Run ten expanded examples: six functional outcomes, two accessibility journeys and two permission routes:

```bash
TEST_URL=http://localhost:5000 TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10281 and not @skip' CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10281 and not @skip' corepack yarn test:functional:serial --browser=chrome --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/Payments.feature,cypress/e2e/functional/opal/features/createDraftCasefile/PaymentsAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CasefilePermissions.feature'
```

Use the configured frontend target in `TEST_URL`; localhost is the local example. Run those specs with both tag
variables set to `@R1CRmCreateCaseFiles and not @skip` to include all fifteen shared permission routes. Also run
`OrderDetails.feature`, `OrderDetailsAccessibility.feature`, `CheckCaseDetails.feature` and
`CheckCaseDetailsAccessibility.feature` for the reused prerequisite and payment-to-review integration regressions,
then the smoke suite and required local pre-flight. Preserve reports before the runner resets its output directory.

## Draft Casefile cancellation QA (PO-10284)

`CancelCaseCreation.feature` covers returning to review with the accepted draft retained, confirming cancellation
without a draft submission, starting a fresh journey and preventing browser history from recovering the discarded
case. Each positive scenario owns a complete local draft. `CancelCaseCreationAccessibility.feature` scans the
cancellation page and fresh destination; Axe provides partial accessibility evidence.

The permission scenario reuses the shared live permission preflight: first verify ACTIVE Maintenance membership,
BU 44 permission 21 and released entry with the authorised account, then authenticate the provisioned denied account
and verify ACTIVE Maintenance membership without BU 44 permission 21. Direct cancellation navigation must reach
`/access-denied` with no cancellation controls or case creation entry. `/account-created` is a setup failure requiring
the user-state diagnosis above, and a disabled release must fail the authorised entry check rather than count as
permission rejection.

Run with the enabled release and provisioned accounts described above:

```bash
TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10284 and not @skip' \
CYPRESS_TAGS='@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10284 and not @skip' \
corepack yarn test:functional:serial --browser=chrome --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/CancelCaseCreation.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CancelCaseCreationAccessibility.feature'
```

Require four passing browser scenarios with none skipped or pending. A dry run checks selection and step bindings
only. Preserve and sanitise generated reports before another runner invocation resets output. Specialist follow-up
must verify native browser Leave/Cancel behaviour, full keyboard traversal, screen-reader announcements and
magnification with the same enabled release and provisioned accounts.

## PO-10628 live inputter monitoring

The [monitoring suite guide](../cypress/e2e/functional/opal/features/checkAndValidateCase/README.md#po-10628-live-inputter-monitoring)
contains the AC1–AC6 mapping, exact commands, real prerequisites and external specialist checks for the enabled
`InputterCasefileMonitoring.feature` and adjacent accessibility feature: **16 examples (11 functional + 5
accessibility), zero skipped/pending**, with fresh scenario-owned fixtures. All three selectors must agree:
`TAGS`, `CYPRESS_TAGS` and `--env tags=@R1CRmCreateCaseFiles and @JIRA-STORY:PO-10628`.

This pack observes real list/count/detail responses without replacing them. Actual persisted lifecycle dates anchor
D+7/D+8 consultations with **AUT Date only**; ordinary timers/server/database clocks stay real. All rejected includes
own and second-inputter BU work with no submitter/date restriction. Real PUBLISHED snapshots must provide every
respondent/applicant/two minor-creditor number as exact read-only text; stable pending must expose none. Native
keyboard/focus checks and shared strict Axe cover populated/empty tabs, pagination, All rejected/amendment return,
published rows and denied destination. Full amendment resubmission belongs to PO-10623.

The 23 October inspection of a runtime with migrations only through1.34 and no publication implementation is
historical. Use a compatible `codex/PO-10626-publication-support` build and its DB/BE dependencies locally, then
verify actual list/detail/decision permissions and ETags, testing support, create-casefile release, provisioned
primary/checker/second-inputter/denied identities, reference data, publication and pending/published owner/marker
cleanup. Neither this monitoring pack nor the updated PO-10626 pack requires an observation migration or
publication-evidence route. Backend calendar semantics and stable-pending configuration still require verification.

`PO10628_SECOND_INPUTTER_EMAIL` must explicitly select an existing independent permission21 actor. Externally verified
boolean guards `PO10628_PUBLICATION_CLEANUP_VERIFIED` and `PO10628_STABLE_PENDING_VERIFIED` never self-enable in live
steps and do not establish acceptance. Publication guards apply only to approval/pending/published fixtures; ordinary submitted/rejected/deleted/empty/
permission examples remain independently runnable after verification of their own runtime prerequisites and
execution authorisation. Missing runtime capabilities fail visibly; no skip, fake-success or cleanup bypass is permitted. Empty setup fails on existing personal work without altering it. Port5100 belongs to the
isolated checkout; leave the existing port5000 instance untouched.

For safe discovery use the suite's exact command with `dryRun=true` and its ignored discovery config explicitly
setting `e2e.baseUrl=null` (CLI null overrides retained the configured URL here); this executes no
browser journey or fixture mutation and provides **no live acceptance evidence**. The separate
`inputter-monitoring-journey-support.cy.ts` checks calendar/assertion helper boundaries with controlled DOM and
snapshots. Keep its results separate from live acceptance and retain raw logs/receipts. Until real execution plus
all remaining Definition of Done checks pass, report **Not Agent Complete**. Screen-reader and magnification checks
need the specialist setup and expected results documented in the suite guide.

A historical read-only capability split found ordinary POST/list/detail/PATCH/PUT plus enabled testing support,
but only SUBMITTED cleanup on that older runtime. The updated support branch supplies eligible lifecycle and
exclusive published cleanup; verify its actual deployment before executing those fixtures. The suite's `@PO10628SubmittedOnly` tag selects exactly **4 enabled examples**
(SUBMITTED boundary row, functional denial, accessibility empty and accessibility denial), preserving16overall.
Use the suite guide's exact three matching tag selectors and command after final review, actual authentication/
reference-data/submitted-cleanup preflight and explicit live authorisation. Add `dryRun=true` and baseUrl null for
discovery only. A four-example pass cannot complete the other12 examples; no REJECTED/DELETED/RESUBMITTED or
approval fixtures may be created until their own real cleanup capabilities are verified.

## PO-10624 independent checker deletion QA

The [deletion suite guide](../cypress/e2e/functional/opal/features/checkAndValidateCase/README.md#po-10624-independent-checker-deletion)
records the runtime prerequisites and evidence contract for **nine independent examples: five functional and four
broad accessibility**. All remain enabled with scenario retries disabled. Each creates a fresh normal-API
SUBMITTED fixture using distinct ACTIVE inputter permission 21 and checker permission 22 identities in
Maintenance BU 44. Require `release-1c-rm-create-case-files`, Maintenance testing-support enablement, the actual
compiled backend revision/running services and compatible persisted deletion/list/detail/cleanup contracts.
Publication and its consumer are not deletion prerequisites.

The updated support branch supplies eligible DELETED cleanup; the earlier inspected runtime supported SUBMITTED
only. Verify the actual compatible build's owner/marker DELETE before the four successful/retry transition examples
execute. Never self-enable the maintained **boolean**
`PO10625_LIFECYCLE_CLEANUP_VERIFIED` guard; it runs before transition-capable creation and immediately before each
DELETED dispatch, including retry. Exactly five nontransition examples carry `@PO10624SubmittedOnly`.

Full live selection after runtime and cleanup preflight:

```bash
TAGS='@JIRA-STORY:PO-10624 and not @skip' CYPRESS_TAGS='@JIRA-STORY:PO-10624 and not @skip' \
yarn test:functional:leaf --browser=chrome --spec 'cypress/e2e/functional/opal/features/checkAndValidateCase/CheckerDeletesCasefile*.feature' \
--env 'tags=@JIRA-STORY:PO-10624 and not @skip'
```

Use the verified frontend `TEST_URL`. Add `and @PO10624SubmittedOnly` to **TAGS, CYPRESS_TAGS and lowercase tags**
for the five-example safe selection. For discovery only, use the same command with `--config '{"baseUrl":null}'`
and prepend `dryRun=true,omitFiltered=true,` to the `--env` value. The installed v26 preprocessor supports
`dryRun=true`; `cucumberOnlyMissingSteps` does not provide this evidence. Require full **9 (5+4)** and subset
**5 (3+2)** discovery, with no undefined/ambiguous/skipped/pending examples.

Strict shared Axe scans and native Enter/Tab cover all meaningful visited states and actual pagination pages;
scan failure must propagate. Persisted GET, provider/DOM collections and retained read-only detail remain mandatory
business outcomes. The one-shot definite failure is an HTTP 400 before provider dispatch followed by an explicit
real UI retry using the same monitor and original ETag; it does not prove uncertain-delivery recovery. The visible
251-character validation contract remains strict. The inspected native frontend textarea's `maxlength=250`
currently prevents that input: record **frontend GAP008**, preserve the normal typing/readback failure, and do not
force/seed/bypass the control, accept truncation or assume a backend cause or accepted waiver.

Controlled support and discovery are not passing live deletion. Parent-owned evidence and the delivery report/PR
must record measured results, interruptions, unrun guarded examples and actual marker-owned cleanup receipts.
These reusable instructions make no live-pass claim. Draft handoff does not require publication or an approval-state
check; failed applicable checks still mean Not Agent Complete.
