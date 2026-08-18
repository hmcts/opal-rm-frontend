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
- Do not force-add ignored files with `git add -f` or `git add --force` unless the user explicitly approves adding that specific file.

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

## Code review rules

- For code reviews, read and apply `docs/CODE_REVIEW_GUIDELINES.md` and `docs/REPO_GUIDELINES.md`.
- Report concrete defects introduced by the reviewed change and anchor each finding to the smallest relevant diff range.
- Base severity on actual user, security, accessibility, operational, or delivery impact.
- Treat implementation preferences as advisory unless they cause a demonstrable defect.

## Task-specific workflows

Use an available task-specific skill when its description matches the requested work.

Supporting repository documents remain authoritative when a relevant skill is unavailable.

## Verification and handoff

- Review the final diff for correctness, scope, security, accessibility, and unintended changes.
- Run proportionate automated checks and report the exact commands and results.
- Report checks that were not run and explain why.
- Record required configuration, feature flags, manual testing, limitations, and follow-up work.
- Treat reviewer approval, QA sign-off, CI, deployment, environment verification, feature-flag activation, and ticket closure as pending unless direct evidence confirms them.
- Do not represent pending or unverified work as complete.
