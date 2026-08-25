# Cypress Component Testing

Use this guide when writing or updating Cypress component specs in `opal-rm-frontend`.

## Start from the required behaviour

- Read the ticket, its Acceptance Criteria, and any approved design or implementation plan before choosing scenarios.
- Inspect the current component, store, routing contracts, shared selectors, component support file, and nearest maintained specs.
- Treat plan code as illustrative unless an exact interface, string, route, or value is part of the approved contract. Reconcile examples with the current code before using them.
- Test observable component responsibilities at this layer. Keep pure store transitions and route-table configuration in focused Vitest specs, and keep multi-page journeys, permissions, and deployed integration in routed integration or E2E tests unless the component-test plan explicitly owns them.
- Do not invent production placeholders, permissions, APIs, feature flags, or business values to make a planned test compile.

## Structure and setup helpers

- Keep specs under `cypress/component/**`, grouped by feature area.
- Reuse the nearest maintained setup helper when it accurately represents the feature boundary.
- For a new feature area without a suitable helper, create one targeted helper under the feature's `setup/` folder rather than repeating `mount(...)` in specs.
- Mount the smallest real parent component that coordinates the behaviour under test. Use the real feature store when store interaction is part of the component contract.
- Allow the helper to seed valid initial state when rehydration is in scope, and expose repeatedly asserted fixtures, stores, or spies through named Cypress aliases.
- Stub only boundaries that are intentionally outside the component test. A router spy is appropriate when asserting a navigation request; use a real router-outlet setup when route rendering, guards, resolvers, or destination rendering are the behaviour under test.
- Do not add a production destination placeholder merely to make a component test navigate.
- Keep scenario data and assertions in the spec. Setup helpers own mounting, providers, representative document-shell setup, initial state, and reusable aliases.

## Spec style and naming

- Write component specs as readable executable scripts using `cy.get(...)`, shared selectors, and focused local assertion helpers.
- Do not introduce a POM, Action, or Flow layer solely for a component spec. Reuse an existing one only when it already fits and materially improves the test.
- Give every test an Acceptance-Criteria-led name in the form `AC1. should ...`.
- When one test proves more than one criterion, use a clear combined prefix such as `AC1, AC3. should ...`.
- Keep each test focused on one coherent behaviour. Group genuinely different behavioural branches with nested `describe(...)` blocks when that improves readability.

Example:

```ts
it('AC3. should save the valid selection and request onward navigation', { tags: buildTags() }, () => {
  setupExampleComponent();

  cy.get(ExampleSelectors.option).check();
  cy.get(ExampleSelectors.continueButton).click();

  assertStoredSelection({ option: 'Example' });
  cy.get('@routerNavigate').should('have.been.calledWith', [nextPagePath], {});
});
```

## Jira tags

- Every `it(...)` must own its tag configuration. Do not rely only on tags attached to `describe(...)`.
- Define stable Story and Epic tags once and include them through a local `buildTags(...)` helper.
- Pass scenario-specific metadata, such as `@JIRA-TEST-KEY`, into `buildTags(...)` when the Jira test key exists. Do not invent a test key or placeholder.
- Preserve any established release or Jira-label tags required by the feature area.

```ts
const STORY_TAG = '@JIRA-STORY:PO-1234';
const EPIC_TAG = '@JIRA-EPIC:PO-1000';
const buildTags = (...tags: string[]): string[] => [...tags, STORY_TAG, EPIC_TAG];

it('AC1. should render the approved choices', { tags: buildTags('@JIRA-TEST-KEY:PO-5678') }, () => {
  // Test steps
});
```

## Selectors and hooks

- Use central selector modules under `cypress/shared/selectors/**` so component and future E2E coverage can share stable hooks.
- Prefer existing semantic application IDs or data attributes. If a stable hook is missing, add it to the Angular component first and then expose it through the relevant selector module.
- Prefer additive selector changes. Do not casually rename selectors shared by other specs.
- Avoid positional selectors, DOM-depth selectors, duplicated raw selector strings, and selectors coupled to incidental styling.
- Import controlled values and types from production constants so setup data does not drift. Assert exact user-facing copy when that copy is part of the Acceptance Criteria.

## Routing and store assertions

- Import route segments from the production routing constants under `src/app/**`; do not duplicate route fragments in Cypress-only constants.
- Compose an expected full path locally when the component contract is the complete URL. A small reusable path helper is appropriate when several scenarios use the same composition.
- Keep router creation or stubbing in the setup helper and navigation assertions in the spec.
- When a test says that data is saved, assert the real store state rather than inferring success only from navigation.
- Assert relevant lifecycle effects when they are part of the behaviour, such as dirty-state clearing, saved-state flags, stale conditional values being removed, or valid state being rehydrated.

## Mocks and intercepts

- Keep reusable API fixtures beside the feature under `mocks/**` and reusable intercept wiring under `intercept/**` or `setup/**`.
- Keep intercept helpers focused on request wiring and canned responses. Put request-body, header, call-count, prohibited-request, and navigation assertions in the spec.
- A one-off intercept used by one scenario may remain in that spec when extracting it would hide the behaviour being asserted.
- Narrow negative network assertions to the prohibited endpoint and method. Do not use a catch-all intercept that also captures Cypress, reporting, asset, or unrelated application traffic.
- Reuse existing state, store, and API mocks where they represent the scenario accurately. Clone mutable mocks so one test cannot contaminate another.

## Scenario coverage

Choose applicable scenarios from the approved behaviour rather than applying this list mechanically:

- initial rendering, exact controlled choices, and absence of unintended defaults;
- conditional controls appearing, becoming required, and leaving the keyboard sequence when inapplicable;
- materially different valid branches, including removal of stale conditional data;
- exact inline and summary errors, error-summary focus, and links focusing the associated field;
- rendered behaviour plus store and boundary effects, including rehydration, navigation, and absence of a prohibited request;
- Cancel or secondary navigation when owned by the component;
- keyboard focus order using keyboard events rather than only calling `.focus()` on each control;
- representative Axe scans in valid and validation-error states when accessibility evidence is in scope; and
- viewport or reflow checks at the exact approved boundaries.

A 320 CSS-pixel viewport used as evidence for 400% zoom/reflow must not be reported as general mobile support. Axe and viewport checks are partial evidence; they do not prove complete WCAG 2.2 AA or responsive compliance.

## Running and verifying tests

Use Yarn 4 through Corepack and the versions declared by the repository.

Run a single component spec directly with the Cypress executable:

```bash
corepack yarn exec cypress run --browser chrome --component --spec 'cypress/component/<feature>/<spec>.cy.ts'
```

Run the Cypress TypeScript lint and the full or parallel component suite as required by the scope:

```bash
corepack yarn lint:cypress
corepack yarn test:component
corepack yarn test:component:parallel
```

Run the repository's current Jira metadata policy for new or changed component tests. Run broader component and unit coverage when shared support, setup helpers, selectors, stores, or application behaviour changed.

Before handoff:

- map each applicable Acceptance Criterion to its test evidence;
- report the exact commands and results;
- distinguish component evidence from unit, E2E, manual, and external verification;
- report warnings, blocked dependencies, and checks not run; and
- apply `docs/FRONTEND_DEFINITION_OF_DONE.md` without claiming human review, QA, CI, deployment, or WCAG completion unless verified.

## Real product defects

- If a component test exposes a real product defect, do not change application behaviour merely to force the test to pass.
- Record the failing scenario and evidence, then fix the product only when that change is within the requested ticket scope.
- Do not report the work as agent-complete while a required test is skipped, pending, or failing.
