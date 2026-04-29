# Cypress Runner And Pipeline Parity Design

## Context

`opal-rm-frontend` and `opal-frontend` both use Angular, Yarn 4, Cypress component tests, Cypress Cucumber E2E tests, Zephyr reporting, and Jenkins pipeline stages. The two repositories have drifted in how Cypress is installed, invoked, reported, and documented.

`opal-rm-frontend` currently has a local `.yarnrc.yml` change that enables Yarn lifecycle scripts. This matches `opal-frontend` and should allow the Cypress binary to be installed during dependency installation, removing the need for the temporary `test:cypress:ensure-binary` command.

The main goal is to make Cypress runner and pipeline usage in `opal-rm-frontend` match `opal-frontend`. The secondary goal is to bring over the metadata and tagging capability needed for future Jira, Epic, and Zephyr ticket workflows without forcing placeholder metadata onto the existing RM starter tests.

## Goals

- Use the same Cypress command names in both frontend repositories.
- Route component, smoke, functional, browser-specific, legacy, full functional, and Zephyr Cypress runs through the unified `scripts/run-test-suite.js` model.
- Remove RM-specific Cypress command names, especially `test:opalComponent`.
- Remove the temporary Cypress binary verification command from runner scripts.
- Align Jenkins component test stages and published artifact paths with `opal-frontend`.
- Bring across future-ready Cypress metadata tooling for Jira story, Jira epic, and Zephyr POT tag maintenance.
- Keep the current RM Cypress tests unchanged unless runner parity requires an import or support-file adjustment.

## Non-Goals

- Do not add real or placeholder Jira, Epic, or POT tags to the existing RM tests in this migration.
- Do not migrate `opal-frontend` account evidence capture tasks or screenshot relocation tasks.
- Do not refactor RM Cypress test structure beyond what is needed for runner and pipeline parity.
- Do not change Cypress dependency versions unless the existing lockfile already requires a refresh from normal Yarn changes.
- Do not keep `test:opalComponent` as a compatibility alias.

## Runner And Script Parity

`opal-rm-frontend` should expose the same Cypress script surface as `opal-frontend`:

- `test:component`
- `test:component:parallel`
- `test:component:leaf`
- `test:smoke`
- `test:smoke:serial`
- `test:smoke:parallel`
- `test:smoke:leaf`
- `test:functional`
- `test:functional:serial`
- `test:functional:parallel`
- `test:functional:leaf`
- `test:functional:tags`
- `test:functional:uat_legacy`
- `test:functionalOpalVideo`
- `test:fullfunctional`
- `test:Chrome`
- `test:Edge`
- `test:Firefox`
- `zephyr:test:component`
- `zephyr:test:functional`
- `zephyr:test:smoke`

The old RM-only scripts should be removed from `package.json`:

- `test:opalComponent`
- `test:opalComponent:noReset`
- `test:opalComponentParallel`
- `zephyr:test:opalComponent`
- `test:cypress:ensure-binary`
- direct browser-specific functional runner scripts replaced by `run-test-suite.js`
- direct report-combine package scripts replaced by `run-test-suite.js`

The runner should keep using `scripts/browser-support.js` for browser detection and explicit browser validation. Generic runs should continue to default to Edge, with the same Edge-to-Chrome fallback behavior already shared by both repositories.

## Pipeline Parity

`Jenkinsfile_CNP` and `Jenkinsfile_nightly` should be updated so component test stages call `test:component` or `zephyr:test:component`, matching `opal-frontend`.

Legacy functional execution should use the same mode flag shape as `opal-frontend`:

```bash
yarn test:functional --mode=legacy
```

Browser-specific runs should use the same package scripts as `opal-frontend`:

```bash
yarn test:Chrome
yarn test:Edge
yarn test:Firefox
```

Any remaining `test:opalComponent` usage in docs, Jenkins, or package scripts should be replaced rather than aliased.

## Reporting And Artifacts

Component test artifacts should match the `opal-frontend` structure:

- Mochawesome JSON: `functional-output/component/<browser>/json`
- JUnit XML: `functional-output/component/<browser>/junit`
- HTML report: `functional-output/component/<browser>/html/component-report.html`
- Screenshots: `functional-output/component/<browser>/screenshots`

Jenkins should archive and publish component artifacts from:

```text
functional-output/component/<browser>/**
functional-output/component/<browser>/html/component-report.html
```

Functional, smoke, and legacy Cucumber artifacts should keep the existing browser-specific structure:

- `functional-output/prod/<browser>/...`
- `functional-output/prod/<browser>/legacy/...`
- `smoke-output/prod/<browser>/...`
- `smoke-output/prod/<browser>/legacy/...`

`scripts/build-cucumber-report.js` should include the newer `opal-frontend` runtime message ID remapping. This prevents unrelated scenarios from being merged incorrectly when parallel Cucumber shards reuse `testCaseStarted.id` values.

`scripts/run-test-suite.js` should own report generation after test execution. Package scripts should not duplicate JUnit merging, Cucumber JSON generation, or Cucumber HTML generation.

## Metadata And Tagging Capability

`scripts/check-cypress-test-metadata.js` should be aligned with `opal-frontend` so future RM tests can participate in Jira and Zephyr workflows. The checker should inspect executable component specs and functional Cucumber scenarios, then report:

- missing `@JIRA-STORY:*` tags
- missing `@JIRA-KEY:POT-*` tags
- duplicate POT tags on one executable test
- shared POT keys across executable tests
- duplicate test titles
- duplicate qualified test titles
- component tag shapes that are not compatible with automatic POT tag rewriting

The checker should export reusable helpers such as `collectExecutableTests()` so related metadata scripts can share the same parsing logic.

The following future-facing scripts should be added from `opal-frontend`:

- `scripts/find-tests-missing-epic.js`
- `scripts/find-tests-with-multiple-epics.js`
- `scripts/resolve-placeholder-jira-epics.js`

These scripts should support future use of:

- `@JIRA-EPIC:*`
- `@JIRA-STORY:*`
- `@JIRA-KEY:POT-*`
- placeholder epic resolution with `@JIRA-EPIC:PO-0000`

Existing RM tests should remain untagged during this migration. The metadata tooling can report gaps, but this work should not invent Jira or POT identifiers.

## Cypress Support Files

The `opal-frontend` evidence capture and screenshot relocation support should not be migrated as part of this work. It is tied to account evidence outputs and larger fines journeys, while the RM Cypress surface is currently a small starter suite.

Generic support-file alignment is acceptable where it directly supports runner parity, component reporting, or metadata visibility. For example, component support may need the same reporter registration and tag-title behavior used by `opal-frontend` if required for report output parity.

## Documentation

README Cypress sections should be updated to match the `opal-frontend` command model:

- component tests use `yarn test:component`
- top-level Cypress runners accept `--browser=<chrome|edge|firefox>`
- top-level Cypress runners accept `--mode=<opal|legacy>` where relevant
- top-level Cypress runners accept `--parallel` and `--serial`
- legacy UAT script uses `test:functional:uat_legacy`
- Zephyr component execution uses `zephyr:test:component`

The Zephyr and metadata documentation should explain the future tag model without requiring current RM tests to be tagged immediately.

## Verification Strategy

Implementation should verify the orchestration without assuming local backend services are running.

Run checks that do not require a live SSR app where possible:

- inspect `package.json` scripts for the aligned command surface
- run metadata tooling in report mode
- run report-builder scripts in skip or empty-output scenarios where supported
- run linting or targeted formatting checks for edited JS, TS, Groovy, and Markdown files

Full smoke or functional Cypress runs should only be run if the SSR app and dependent services are available. If they are not available, the implementation should clearly report that those suites were not executed locally.

## Risks

- Removing `test:opalComponent` may break stale developer commands or external automation that has not been updated. This is intentional because the two applications should run the same way.
- Jenkins artifact path changes need to be updated consistently, or component HTML publishing may point at the old `functional-output/component-html/<browser>/` location.
- Metadata tooling may report existing RM test gaps. Those reports should be accepted as capability output, not treated as a requirement to tag current tests in this migration.
- Copying feature-specific support tasks from `opal-frontend` would add unnecessary complexity. This design avoids that unless a later requirement introduces RM evidence capture.

## Approved Direction

Proceed with strict Cypress runner and pipeline parity. Replace RM-specific command names with the `opal-frontend` command model, align component report artifacts, bring across future metadata/tagging tooling, and leave current RM test metadata cleanup for a separate ticket.
