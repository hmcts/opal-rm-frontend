# Repository instructions

OPAL RM Frontend is an Angular SSR application with a Node server that proxies internal OPAL APIs.

Use Yarn 4 through Corepack. Treat `.nvmrc` and `package.json#packageManager` as the authoritative Node and Yarn versions.

## CRITICAL: Master protection and branch upstream safety

- Never push, merge, or commit directly to `master`.
- Never run a plain `git push` or use an IDE or GUI "Sync Changes" operation.
- Before any pull or push, verify the current branch and its upstream with
  `git branch --show-current` and `git rev-parse --abbrev-ref '@{upstream}'`.
- If a feature branch tracks `origin/master`, stop immediately. Do not pull,
  push, or sync until the upstream configuration is corrected.
- Create feature and stacked branches with `--no-track`.
- A pull-request base does not require the local branch to track that base
  branch.
- Push only when explicitly requested, using a fully specified destination
  whose branch name matches the local branch.
- Never push a feature branch to `refs/heads/master`.

## Before making changes

- Read the ticket and its Acceptance Criteria when the task is ticketed.
- Inspect `git status` and preserve unrelated existing changes.
- Create or reuse a dedicated branch following [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).
- Route implementation and unit testing to [docs/REPO_GUIDELINES.md](docs/REPO_GUIDELINES.md), component testing to
  [docs/CYPRESS_COMPONENT_TESTING.md](docs/CYPRESS_COMPONENT_TESTING.md), E2E and accessibility testing to
  [docs/CYPRESS_E2E_TESTING.md](docs/CYPRESS_E2E_TESTING.md), contribution work to
  [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md), and review work to
  [docs/CODE_REVIEW_GUIDELINES.md](docs/CODE_REVIEW_GUIDELINES.md).

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
- Treat Superpowers design and implementation-plan artifacts as local-only. Keep them under ignored `docs/superpowers/` paths. Never stage, force-add, commit, or relocate them into a tracked path to bypass ignore rules unless the user explicitly requests it.

## Commands

Run checks proportionate to the changed area.

- Install dependencies: `yarn`
- Start locally: `yarn start`
- Check formatting: `yarn prettier`
- Run Angular linting: `yarn lint:ng`
- Run unit tests once: `yarn test`
- Produce unit-test coverage: `yarn test:coverage`
- Create a production bundle: `yarn build`

Use the Cypress commands and workflows in the applicable
[component](docs/CYPRESS_COMPONENT_TESTING.md) or [E2E and accessibility](docs/CYPRESS_E2E_TESTING.md) guide.

## Code review rules

- For code reviews, read and apply [docs/CODE_REVIEW_GUIDELINES.md](docs/CODE_REVIEW_GUIDELINES.md) and
  [docs/REPO_GUIDELINES.md](docs/REPO_GUIDELINES.md).
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

## Definition of Done

Before handoff, use the repository's authoritative
[Frontend Definition of Done](docs/FRONTEND_DEFINITION_OF_DONE.md). Every applicable agent-executable criterion must
pass, every item marked **Not applicable** must have a recorded reason, and agent-executable work must not be
deferred to a human. If an applicable criterion remains unmet, report **Not Agent Complete** with the unmet
criterion and required remediation; do not claim the work is ready for human review.
