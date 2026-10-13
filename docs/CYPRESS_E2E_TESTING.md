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

Release-specific functional and accessibility scenarios live under `features/releaseFlags`. Their Jira story, epic and
test identifiers are intentionally unassigned pending confirmed ticket metadata. A Cucumber dry run proves scenario
selection and step binding only; it is not evidence of a completed browser journey or deployed authentication.

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

Inject account values through the existing secret/environment configuration. Never log or commit them, and do not
create users or change roles as a test side effect.

| Environment variable           | Purpose                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| `TEST_URL`                     | Frontend browser target                                     |
| `OPAL_TEST_USER_EMAIL`         | Existing authorised account; mapped to `CYPRESS_TEST_EMAIL` |
| `OPAL_TEST_USER_PASSWORD`      | Authorised SSO password; mapped to `CYPRESS_TEST_PASSWORD`  |
| `OPAL_RM_DENIED_USER_EMAIL`    | Existing denied account; mapped to `RM_DENIED_USER_EMAIL`   |
| `OPAL_RM_DENIED_USER_PASSWORD` | Denied SSO password; mapped to `RM_DENIED_USER_PASSWORD`    |

Passwords are required for Microsoft SSO. Local/PR sign-in retains the passwordless stub while user-state permission
and reference-data checks use live services. Authentication sessions are cached by role; each scenario still owns a
new draft. Country and Central Authority lookups may be cached within a journey, so replay must not await another
request. The raw `/api/user-state` response uses `domains.maintenance`.

Run the individual capture and retention outcome with:

```bash
corepack yarn test:functional:serial --browser=chrome --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/IndividualCaseParties.feature'
```

The scenario requires live Country ordering, both party statuses Provided, reopened field values, and zero draft
creation POSTs. Keyboard interactions and Axe scans provide partial accessibility evidence; specialist WCAG 2.2 AA
assurance remains separate. Positive order-details scenarios must supply a valid Date order made: the QA ticket's
required-versus-optional wording differs from current product validation, which this test work does not change.

## Shared casefile permission coverage

`CasefilePermissions.feature` runs exactly five unique protected routes with the release enabled. Each example first
checks the authorised user's live ACTIVE Maintenance state and BU 44 permission 21, then opens the released case-type
page. It switches to a distinct secret-injected denied account and checks live ACTIVE status, Maintenance domain and
absence of permission 21 for BU 44 before attempting direct task navigation. Another BU permission is not required;
an existing user with another BU membership is acceptable when BU 44 permission 21 is absent. The tests use actual
route guards without role changes, injected store state or mocked denial responses.

Require `release-1c-rm-create-case-files=true` for all anonymous LaunchDarkly test contexts, rather than a percentage
rollout. The positive entry check prevents a release-off failure from masquerading as permission rejection. The
existing release-off features remain separate because they exercise a different denial cause.

Shared respondent and Central Authority Examples carry both `@JIRA-STORY:PO-10275` and `@JIRA-STORY:PO-10276`, so
selection by either party ticket includes both shared routes. Individual and organisation applicant Examples carry
the corresponding party ticket; Order Details carries `@JIRA-STORY:PO-10277`. The outline carries epic PO-6506.

```bash
corepack yarn test:functional:serial --browser=chrome --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/CasefilePermissions.feature'
```
