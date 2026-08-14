# Repository Guidelines

This document is the authoritative source for implementation standards in `opal-rm-frontend`.

## Project structure

- Keep Angular features, shared services, and colocated unit specs under `src/app`.
- Keep feature-specific UI state with the feature that owns it.
- Use `src/assets` for static assets and `src/styles.scss` for global styling; register new bundled assets in `angular.json` where required.
- Keep deployment and infrastructure logic under `infrastructure/` and `charts/`.
- Keep SSR and Node server concerns in the existing server entry points and follow nearby route and middleware patterns.
- Match existing file, class, function, route, and test naming. Do not introduce new abbreviations without an established precedent.

## Toolchain and commands

Use Corepack and Yarn 4. Treat `.nvmrc` and the `packageManager` field in `package.json` as the authoritative Node and Yarn versions.

- Install dependencies: `yarn`
- Start the Angular development server: `yarn start`
- Check formatting: `yarn prettier`
- Fix formatting on touched files when needed: `yarn prettier:fix`
- Run Angular linting: `yarn lint:ng`
- Run Vitest unit tests once: `yarn test`
- Run unit tests in watch mode: `yarn test:watch`
- Produce unit-test coverage: `yarn test:coverage`
- Create a production bundle: `yarn build`

Use the applicable Cypress guide for component, smoke, functional E2E, and accessibility test commands. Do not treat a command that only prints a message as validation evidence.

## Formatting and naming

- Follow `.editorconfig`: UTF-8, spaces, two-space indentation, and trimmed trailing whitespace.
- Follow `.prettierrc`: 120-character line width, single quotes, and semicolons.
- Use `app`-prefixed kebab-case Angular component selectors and `app`-prefixed camelCase directive selectors.
- Order TypeScript members consistently with nearby maintained code.
- Use direct imports. Do not add barrel exports or imports.

## Angular and TypeScript

- Follow the Angular version installed by the repository and patterns used in nearby maintained code; do not target unreleased or uninstalled framework features.
- Prefer standalone components, routes, and providers. Do not introduce an `NgModule` unless an existing integration requires one.
- Use modern template control flow such as `@if`, `@for`, and `@switch`.
- Use signals for appropriate local state and `computed()` for derived state; keep transformations pure and predictable.
- Use signal inputs and outputs where they fit the existing component API.
- Use reactive forms for non-trivial forms and keep validation logic out of templates.
- Keep templates declarative and free from heavy business logic or expensive expressions.
- Keep components and services focused on one clear responsibility.
- Keep strict typing. Avoid `any`; use a precise type or `unknown` with narrowing.
- Use `inject()` and component or directive `host` metadata where consistent with nearby code.
- Preserve SSR safety: do not access browser-only globals without the repository's established platform guards.

## Maintainability

- Keep changes focused on the ticket Acceptance Criteria.
- Preserve existing behaviour unless the ticket requires a change.
- Avoid unrelated refactoring, speculative abstractions, duplicated logic, and unnecessary dependencies.
- Do not introduce broad shared providers or shared state when a feature-scoped implementation is sufficient.
- Keep routes modular and integration boundaries explicit.
- Prefer existing shared components and utilities over bespoke replacements.
- Explain any unavoidable increase in complexity, dependency footprint, or public API surface in the PR.

## Design system and content

- Use GOV.UK Design System patterns as the baseline for frontend flows.
- Use HMCTS or Ministry of Justice patterns where an established component or pattern exists.
- Prefer repository and shared-library components over bespoke markup and styling.
- Use GOV.UK typography, spacing tokens, colour, and content conventions.
- Add bespoke styling only when no suitable established pattern exists.
- Keep content concise, user-centred, and consistent with the GOV.UK style guide.

## Accessibility

Changed UI must meet WCAG 2.2 AA expectations.

- Give form controls and buttons visible labels or appropriate accessible names.
- Give informative images meaningful `alt` text and decorative images empty alternative text.
- Use semantic HTML first and ARIA only when native semantics are insufficient.
- Ensure interactions work with keyboard navigation and retain a visible focus state.
- Preserve logical focus order and move focus deliberately when a flow requires it.
- Associate validation errors with their controls and make error summaries useful to screen-reader and keyboard users.
- Handle loading, empty, error, and validation states clearly.
- Retain sufficient colour contrast and do not rely on colour alone to communicate meaning.

## Testing

- Add or update tests for changed logic, validation, state handling, error paths, empty states, and regression-prone behaviour.
- Use the most focused test level that proves the behaviour: Vitest unit, Cypress component, smoke, or functional E2E.
- Name unit specs `*.spec.ts` and colocate them with their source.
- Keep Angular `TestBed` setup focused and mock HTTP or store dependencies at clear boundaries.
- Add route or integration coverage for changed server behaviour where feasible.
- Keep existing relevant tests passing.
- Document manual scenarios when automated coverage does not execute the changed behaviour.
- Treat tests as living documentation; assert observable behaviour rather than implementation details.
- Follow the dedicated Cypress documents and skills for Cypress-specific structure, selectors, metadata, accessibility, and execution.

## Frontend security

- Never add secrets, credentials, tokens, or PII to code, logs, comments, screenshots, fixtures, or tests.
- Keep untrusted data out of HTML, URL, and style injection sinks.
- Avoid `bypassSecurityTrust*`, `[innerHTML]`, `[srcdoc]`, unsafe URLs, and unsafe dynamic styles.
- When one of these mechanisms is unavoidable, scope it narrowly, validate or sanitise the input, add relevant tests, and document the justification and mitigating controls in the PR.
- Do not weaken authentication, authorisation, route guards, security headers, or dependency controls without explicit ticket scope and review evidence.
- Document any suppressed or accepted CVE with its identifier, rationale, and mitigating controls.

## Documentation and delivery

- Update the README or supporting documentation when behaviour, configuration, commands, integration points, or workflows change.
- Update an LLD only when the complete journey or feature is ready and an LLD update is required.
- Identify required configuration and feature flags in the implementation handoff and PR.
