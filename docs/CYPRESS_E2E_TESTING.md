# Cypress E2E Testing

Use this guide when writing or updating Cypress E2E tests and Cucumber feature files in opal-rm-frontend.

## Required References

- For any E2E scenario creation or update, read `references/E2E_New_Feature_Codex_Optimized_Instructions.md` and follow it as the governing ruleset.
- Keep `references/E2E_Refactor_Codex_Optimized_Instructions.md` as legacy reference material; consult it only when explicitly requested or when refactoring older features that need its legacy guidance.

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

Do not use `window:confirm` to handle this native browser dialog. Use `cy.once('window:confirm', ...)`
for application route-guard confirmations, asserting the expected message and chosen response.
Those confirmations remain enabled. Setting `window.onbeforeunload = null` alone does not remove
Angular listeners registered with `addEventListener`.

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

Release-specific functional and accessibility scenarios live under `features/releaseFlags`. The maintained create-casefile
release scenarios carry confirmed `@JIRA-STORY:PO-10606` and `@JIRA-EPIC:PO-10817` metadata; test identifiers remain unassigned.
A Cucumber dry run proves scenario selection and step binding only; it is not evidence of a completed browser journey
or deployed authentication.

## RM checker dashboard journeys

`CheckerDashboard.feature` and `CheckerDashboardAccessibility.feature` cover Review cases entry, permission-22/BU-44
scope, own-work exclusion for checker and dual roles, queue filters, fresh return and page clamping, explicit list/count
recovery, protected review/view shells, pending response ordering and accessible states. `CheckerDashboardFlagOff.feature`
checks direct URLs for checker and dual roles when the release is disabled. These scenarios use PO-10606/PO-10817 metadata.
The HTTP user-state and case summaries are synthetic; authentication uses the maintained non-personal test account.
The tests do not establish backend permission-22 enforcement or deployed provider compatibility. Inactive users follow
the maintained account guard to `User account created` before checker guards; the journey asserts no checker consultation
or persisted-case traffic. Other missing checker identities/permissions are denied through Access Denied.

For local authenticated journeys, build the SSR application with the declared Node runtime and Corepack Yarn, then start
its Node server with the matching release override. Complete component tests before this SSR build: the Angular
component builder can emit development bundles into the shared `dist` path. Run no build or component emission while
SSR journeys are running; if bundles change, rebuild browser and server together and restart your owned SSR process.
`yarn start` runs the browser development server and does not provide
the authentication/proxy routes required here. The direct built-server form allows an explicit local port:

```bash
corepack yarn build:ssr
FEATURE_FLAGS_OVERRIDE=true RELEASE_1C_RM_CREATE_CASE_FILES_ENABLED=true PORT=5200 node dist/opal-rm-frontend/server/main.js
```

With compatible local User and Maintenance services and the maintained test account configured, run in a separate shell:

```bash
TEST_URL=http://localhost:5200 TAGS='@JIRA-STORY:PO-10606 and @R1CRmCreateCaseFiles and not @skip' CYPRESS_TAGS='@JIRA-STORY:PO-10606 and @R1CRmCreateCaseFiles and not @skip' corepack yarn test:functional:tags --browser chrome --serial --reset
```

Stop only the application process you started, restart it with `RELEASE_1C_RM_CREATE_CASE_FILES_ENABLED=false`, then run:

```bash
TEST_URL=http://localhost:5200 TAGS='@JIRA-STORY:PO-10606 and @R1CRmCreateCaseFilesOff and not @skip' CYPRESS_TAGS='@JIRA-STORY:PO-10606 and @R1CRmCreateCaseFilesOff and not @skip' corepack yarn test:functional:tags --browser chrome --serial --reset
```

Run the package release regression scripts above against their matching process states. The enabled regression includes
`InputterDashboard.feature` and `InputterDashboardAccessibility.feature`, which protect the shared table/navigation flow.
Functional runs preserve prior outputs by default. Use `--reset` for a fresh report, and preserve screenshot/report copies
before resetting `functional-output`; otherwise historical XML can be merged into a later report.
Native Enter evidence uses the maintained Chromium helper, so these dashboard keyboard journeys require `--browser chrome`. No action/flow changes flags.
