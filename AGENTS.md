# Repository instructions

OPAL RM Frontend is an Angular SSR application with a Node server that proxies internal OPAL APIs.

Use Yarn 4 through Corepack. Treat `.nvmrc` and `package.json#packageManager` as the authoritative Node and Yarn versions.

## Before making changes

- Read the ticket and its Acceptance Criteria when the task is ticketed.
- Inspect `git status` and preserve unrelated existing changes.
- Create or reuse a dedicated branch following `docs/CONTRIBUTING.md`.
- Read the guidance applicable to the task:
  - Implementation standards: `docs/REPO_GUIDELINES.md`
  - Branches, commits, PRs, and evidence: `docs/CONTRIBUTING.md`
  - Cypress component tests: `docs/CYPRESS_COMPONENT_TESTING.md`
  - Cypress E2E and accessibility tests: `docs/CYPRESS_E2E_TESTING.md`

## Always

- Keep changes focused on the Acceptance Criteria and preserve existing behaviour unless the ticket requires a change.
- Follow established patterns in nearby maintained code.
- Avoid unrelated refactoring, speculative abstractions, broad shared providers, and unnecessary dependencies.
- Never add secrets, credentials, tokens, or PII to code, logs, comments, screenshots, fixtures, or tests.
- Use direct imports; do not introduce barrel exports or imports.
- Use GOV.UK and HMCTS design-system patterns for UI changes.
- Ensure changed UI meets WCAG 2.2 AA expectations and is keyboard usable.
- Add or update relevant tests for changed behaviour, validation, state, and error or empty states.
- Update supporting documentation when behaviour, configuration, integrations, or workflows change.
- Do not change dependency or lock files unless the task requires a dependency change.

## Commands

Run checks proportionate to the changed area.

- Install dependencies: `yarn`
- Start locally: `yarn start`
- Check formatting: `yarn prettier`
- Run Angular linting: `yarn lint:ng`
- Run unit tests once: `yarn test`
- Produce unit-test coverage: `yarn test:coverage`
- Create a production bundle: `yarn build`

Use the Cypress commands and workflows in the applicable Cypress guide.

## Task-specific workflows

When the corresponding skill is available:

- Existing extracted TDIA context: use `opal-ticket-context`.
- Saved TDIA source requiring extraction: use `opal-ticket-tdia`.
- Frontend code review: use `opal-frontend-review-guidelines`.
- Angular and Vitest tests: use `opal-frontend-vitest-guard`.
- Cypress component tests or review: use `opal-frontend-component-tests` or `opal-frontend-component-test-review`.
- Cypress E2E tests or review: use `opal-frontend-e2e-tests` or `opal-frontend-e2e-test-review`.
- Completed journey or feature LLD updates: use `opal-flow-lld`.

Supporting repository documents remain authoritative when a named skill is unavailable.

## Verification and handoff

- Review the final diff for correctness, scope, security, accessibility, and unintended changes.
- Run proportionate automated checks and report the exact commands and results.
- Report checks that were not run and explain why.
- Record required configuration, feature flags, manual testing, limitations, and follow-up work.
- Treat reviewer approval, QA sign-off, CI, deployment, environment verification, feature-flag activation, and ticket closure as pending unless direct evidence confirms them.
- Do not represent pending or unverified work as complete.
