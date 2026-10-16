# Cypress E2E Testing

Use this guide when writing or updating Cypress E2E tests and Cucumber feature files in opal-rm-frontend.

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
- Flows in `cypress/e2e/functional/opal/flows/**` compose actions into business journeys and are the verbs exposed to steps and component specs.
- Selectors are centralized. Add hooks in Angular templates and document them in `cypress/shared/selectors/**`. Avoid positional CSS.

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
uses synthetic entered data, reopens pages to prove local retention, and stops before submission. Missing accounts,
reference data or release configuration must fail clearly; do not skip or substitute mocks for a failed prerequisite.

| Prerequisite        | Required configuration                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Release             | `release-1c-rm-create-case-files=true`                                                   |
| Authorised account  | ACTIVE; Maintenance domain; permission 21 for BU 44                                      |
| Denied account      | ACTIVE; Maintenance domain; no permission 21 for BU 44; distinct from authorised account |
| Countries           | Active dataset containing United Kingdom and at least two other distinct Country names   |
| Applications        | At least one active record with `application_group=Create Casefile`                      |
| Central Authorities | At least two active BU 44 records with `central_authority=true`                          |

The selected features authenticate through the shared `I am authenticated with email {string}` binding, using the
existing provisioned synthetic usernames `opal-test@dev.platform.hmcts.net` (creator) and
`opal-test-4@dev.platform.hmcts.net` (denied user), as the Fines suites do. Sessions are cached by the supplied username.
Each scenario still owns a new draft. Provision these users through the existing User Service data; do not create
users or change permissions as a test side effect.

Local/PR sign-in uses the passwordless stub and requires only the username supplied by the feature. No separate
role-account environment variables are required. The live User Service must provide ACTIVE Maintenance membership
and the BU 44 permission state above. The explicit permission preflight reads the actual `/api/user-state` response
(`domains.maintenance`) after shared authentication; failures in authentication or domain provisioning fail setup.

| Environment variable      | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `TEST_URL`                | Frontend browser target                                         |
| `OPAL_TEST_USER_EMAIL`    | Existing global test email mapping used by other suite callers  |
| `OPAL_TEST_USER_PASSWORD` | Existing shared SSO password, mapped to `CYPRESS_TEST_PASSWORD` |

Microsoft SSO retains the existing shared password environment configuration. Full browser SSO remains unverified
by the local passwordless runs. Other suites may still require the existing global email/password mappings.
Country and Central Authority lookups may be cached within a journey, so replay must not await another request.

Run the individual capture and retention outcome with:

```bash
corepack yarn test:functional:serial --browser=chrome --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/IndividualCaseParties.feature'
```

The scenario requires live Country ordering, both party statuses Provided, reopened field values, and zero draft
creation POSTs. Keyboard interactions and Axe scans provide partial accessibility evidence; specialist WCAG 2.2 AA
assurance remains separate. Positive order-details scenarios must supply a valid Date order made: the QA ticket's
required-versus-optional wording differs from current product validation, which this test work does not change.

## Shared casefile permission coverage

`CasefilePermissions.feature` runs exactly fifteen unique protected routes with the release enabled. Each example first
checks the authorised user's live ACTIVE Maintenance state and BU 44 permission 21, then opens the released case-type
page. It explicitly authenticates the provisioned denied username and checks live ACTIVE status, Maintenance domain and
absence of permission 21 for BU 44 before attempting direct task navigation. Another BU permission is not required;
an existing user with another BU membership is acceptable when BU 44 permission 21 is absent. The tests use actual
route guards without role changes, injected store state or mocked denial responses.

Require `release-1c-rm-create-case-files=true` for all anonymous LaunchDarkly test contexts, rather than a percentage
rollout. The positive entry check prevents a release-off failure from masquerading as permission rejection. The
existing release-off features remain separate because they exercise a different denial cause.

Shared respondent and Central Authority Examples carry both `@JIRA-STORY:PO-10275` and `@JIRA-STORY:PO-10276`, so
selection by either party ticket includes both shared routes. Individual and organisation applicant Examples carry
the corresponding party ticket; Order Details carries `@JIRA-STORY:PO-10277`, and the four Order Term routes carry
`@JIRA-STORY:PO-10278`. Minor Creditor details, summary and removal carry `@JIRA-STORY:PO-10280`.
The Order Term creditor route carries `@JIRA-STORY:PO-10279`.
Interest and Indexation and Managing Payments carry `@JIRA-STORY:PO-10281`.
The outline carries epic PO-6506.

```bash
corepack yarn test:functional:serial --browser=chrome --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/CasefilePermissions.feature'
```

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
examples; the original five permission routes retain their original story tags and are outside this selection.
The complete shared permission outline has fifteen unique routes, including the two payment routes for PO-10281.

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
