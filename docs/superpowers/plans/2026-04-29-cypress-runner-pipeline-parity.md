# Cypress Runner And Pipeline Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `opal-rm-frontend` run Cypress through the same package scripts, Jenkins calls, report paths, and future metadata tooling as `opal-frontend`.

**Architecture:** Keep Cypress orchestration centralized in `scripts/run-test-suite.js`, with package scripts acting as thin entry points. Copy generic runner/report/metadata helper scripts from `../opal-frontend` where parity is required, then update RM-specific Jenkins and README references to use the new command names and artifact paths. Do not add metadata tags to current RM tests.

**Tech Stack:** Angular 21, Yarn 4, Cypress 15, Cypress Cucumber preprocessor, cypress-parallel, Mochawesome, JUnit report merger, Jenkins Groovy pipelines, Node.js helper scripts.

---

## File Structure

- Modify `package.json`: replace RM-specific Cypress scripts with the `opal-frontend` command surface.
- Modify `scripts/run-test-suite.js`: align suite orchestration, component leaf script, and artifact paths with `opal-frontend`.
- Modify `scripts/build-cucumber-report.js`: add runtime Cucumber message ID remapping from `opal-frontend`.
- Modify `scripts/check-cypress-test-metadata.js`: align metadata extraction, reporting, and exported helpers with `opal-frontend`.
- Create `scripts/find-tests-missing-epic.js`: future epic-tag gap reporting and safe placeholder insertion.
- Create `scripts/find-tests-with-multiple-epics.js`: future multiple-epic tag reporting.
- Create `scripts/resolve-placeholder-jira-epics.js`: future placeholder epic resolution using Jira.
- Create `scripts/resolve-placeholder-jira-epics.test.js`: Node unit tests for the placeholder epic resolver.
- Modify `cypress/support/component.ts`: register the Mochawesome reporter in component support and include tag metadata in component test titles.
- Modify `Jenkinsfile_CNP`: use `test:component` and publish the new component report path.
- Modify `Jenkinsfile_nightly`: use `test:component`, `zephyr:test:component`, the new component report path, and `test:functional --mode=legacy`.
- Modify `README.md`: document the aligned command model, artifact structure, Zephyr component command, and metadata maintenance capability.

## Task 1: Package Script Parity

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Run a failing script-surface check**

Run:

```bash
node - <<'NODE'
const scripts = require('./package.json').scripts;
const expected = {
  'test:smoke': 'node scripts/run-test-suite.js smoke',
  'test:smoke:serial': 'node scripts/run-test-suite.js smoke --serial',
  'test:smoke:parallel': 'node scripts/run-test-suite.js smoke --parallel',
  'test:smoke:leaf': 'node scripts/run-test-suite.js smoke --serial --no-reports --no-reset',
  'test:functional': 'node scripts/run-test-suite.js functional',
  'test:functional:serial': 'node scripts/run-test-suite.js functional --serial',
  'test:functional:parallel': 'node scripts/run-test-suite.js functional --parallel',
  'test:functional:leaf': 'node scripts/run-test-suite.js functional --serial --no-reports --no-reset',
  'test:Chrome': 'yarn test:functional --browser=chrome --parallel',
  'test:Edge': 'yarn test:functional --browser=edge --parallel',
  'test:Firefox': 'yarn test:functional --browser=firefox --parallel',
  'test:component': 'node scripts/run-test-suite.js component',
  'test:component:parallel': 'node scripts/run-test-suite.js component --parallel',
  'test:component:leaf': 'node scripts/run-test-suite.js component --serial --no-reports --no-reset',
  'test:functionalOpalVideo': "CYPRESS_VIDEO=true node scripts/run-test-suite.js functional --mode=opal --browser=edge --serial --spec 'cypress/e2e/functional/opal/**/PO-530*.feature' --config 'videosFolder=functional-output/videos,screenshotsFolder=functional-output/screenshots/edge'",
  'test:fullfunctional': 'node scripts/run-test-suite.js fullfunctional',
  'test:functional:tags': 'node scripts/run-test-suite.js functional --tags',
  'test:functional:uat_legacy': 'TAGS=@UAT-Technical DEV_DEFAULT_APP_MODE=legacy LEGACY_ENABLED=true yarn test:functional:tags',
  'zephyr:test:component': 'CODE=0; yarn test:component || CODE=$?; yarn zephyr:cypress:jira-execute; exit $CODE',
  'zephyr:test:functional': 'CODE=0; yarn test:functional --reset || CODE=$?; yarn zephyr:cucumber:functional:jira-execute; exit $CODE',
  'zephyr:test:smoke': 'CODE=0; yarn test:smoke --reset || CODE=$?; yarn zephyr:cucumber:smoke:jira-execute; exit $CODE',
};
const forbidden = [
  'test:opalComponent',
  'test:opalComponent:noReset',
  'test:opalComponentParallel',
  'zephyr:test:opalComponent',
  'test:cypress:ensure-binary',
  'test:component:htmlReport',
  'test:functionalLegacy',
  'test:functionalOpal',
  'test:functionalOpal:tagged',
  'test:functionalOpalParallel',
  'test:functionalOpalParallel:tagged',
  'test:functionalChrome',
  'test:functionalChromeParallel',
  'test:functionalEdge',
  'test:functionalEdgeParallel',
  'test:functionalFirefox',
  'test:functionalFirefoxParallel',
  'test:smokeOpal',
  'test:smokeOpalParallel',
  'test:smokeLegacy',
];
const failures = [];
for (const [key, value] of Object.entries(expected)) {
  if (scripts[key] !== value) failures.push(`${key}=${JSON.stringify(scripts[key])}`);
}
for (const key of forbidden) {
  if (Object.hasOwn(scripts, key)) failures.push(`forbidden ${key}`);
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('package Cypress scripts match opal-frontend parity surface');
NODE
```

Expected: FAIL, listing existing RM-specific scripts such as `forbidden test:opalComponent` and mismatched browser scripts.

- [ ] **Step 2: Replace the Cypress package scripts**

Edit `package.json` so the Cypress-related script entries use this exact command surface, while leaving unrelated build, SSR, import, lint, OpenAPI, audit, Zephyr action, and reset scripts unchanged:

```json
{
  "test:smoke": "node scripts/run-test-suite.js smoke",
  "test:smoke:serial": "node scripts/run-test-suite.js smoke --serial",
  "test:smoke:parallel": "node scripts/run-test-suite.js smoke --parallel",
  "test:smoke:leaf": "node scripts/run-test-suite.js smoke --serial --no-reports --no-reset",
  "test:functional": "node scripts/run-test-suite.js functional",
  "test:functional:serial": "node scripts/run-test-suite.js functional --serial",
  "test:functional:parallel": "node scripts/run-test-suite.js functional --parallel",
  "test:functional:leaf": "node scripts/run-test-suite.js functional --serial --no-reports --no-reset",
  "test:Chrome": "yarn test:functional --browser=chrome --parallel",
  "test:Edge": "yarn test:functional --browser=edge --parallel",
  "test:Firefox": "yarn test:functional --browser=firefox --parallel",
  "test:component": "node scripts/run-test-suite.js component",
  "test:component:parallel": "node scripts/run-test-suite.js component --parallel",
  "test:component:leaf": "node scripts/run-test-suite.js component --serial --no-reports --no-reset",
  "test:functionalOpalVideo": "CYPRESS_VIDEO=true node scripts/run-test-suite.js functional --mode=opal --browser=edge --serial --spec 'cypress/e2e/functional/opal/**/PO-530*.feature' --config 'videosFolder=functional-output/videos,screenshotsFolder=functional-output/screenshots/edge'",
  "test:fullfunctional": "node scripts/run-test-suite.js fullfunctional",
  "test:functional:tags": "node scripts/run-test-suite.js functional --tags",
  "test:functional:uat_legacy": "TAGS=@UAT-Technical DEV_DEFAULT_APP_MODE=legacy LEGACY_ENABLED=true yarn test:functional:tags",
  "zephyr:test:component": "CODE=0; yarn test:component || CODE=$?; yarn zephyr:cypress:jira-execute; exit $CODE",
  "zephyr:test:functional": "CODE=0; yarn test:functional --reset || CODE=$?; yarn zephyr:cucumber:functional:jira-execute; exit $CODE",
  "zephyr:test:smoke": "CODE=0; yarn test:smoke --reset || CODE=$?; yarn zephyr:cucumber:smoke:jira-execute; exit $CODE"
}
```

Remove these package script keys entirely:

```text
test:opalComponent
test:opalComponent:noReset
test:opalComponentParallel
zephyr:test:opalComponent
test:cypress:ensure-binary
test:component:htmlReport
test:dev:smoke
test:dev:smoke:combine:reports
test:dev:functional
test:dev:functional:combine:reports
test:smokeOpal
test:smokeOpalParallel
test:smokeLegacy
test:smoke:combine:reports
test:smoke:cucumber:combineParallelReport
test:smoke:cucumber:jsonReport
test:smoke:cucumber:htmlReport
test:functionalOpal
test:functionalOpal:tagged
test:functionalOpalParallel
test:functionalOpalParallel:tagged
test:functionalChrome
test:functionalChromeParallel
test:functionalChrome:combine:reports
test:functionalChrome:cucumber:combineParallelReport
test:functionalEdge
test:functionalEdgeParallel
test:functionalEdge:combine:reports
test:functionalEdge:cucumber:combineParallelReport
test:functionalEdge:cucumber:jsonReport
test:functionalEdge:cucumber:htmlReport
test:functionalFirefox
test:functionalFirefoxParallel
test:functionalFirefox:combine:reports
test:functionalFirefox:cucumber:combineParallelReport
test:functionalFirefox:cucumber:jsonReport
test:functionalFirefox:cucumber:htmlReport
test:functionalLegacy
test:functionalLegacy:combine:reports
test:functionalLegacy:cucumber:combineParallelReport
test:functionalLegacy:cucumber:jsonReport
test:functionalLegacy:cucumber:htmlReport
test:functional:combine:reports
test:functional:cucumber:combineParallelReport
test:functional:cucumber:jsonReport
test:functional:cucumber:htmlReport
test:functionalOpalRecord
test:functional:uat-legacy
```

- [ ] **Step 3: Run the script-surface check again**

Run the same `node - <<'NODE' ... NODE` command from Step 1.

Expected: PASS with:

```text
package Cypress scripts match opal-frontend parity surface
```

- [ ] **Step 4: Commit package script parity**

Run:

```bash
git add package.json
git commit -m "chore: align cypress package scripts"
```

Expected: commit succeeds. `git status --short` still shows the pre-existing `.yarnrc.yml` change as unstaged unless the user has separately staged it.

## Task 2: Runner, Report, Metadata, And Component Support Helpers

**Files:**
- Modify: `scripts/run-test-suite.js`
- Modify: `scripts/build-cucumber-report.js`
- Modify: `scripts/check-cypress-test-metadata.js`
- Create: `scripts/find-tests-missing-epic.js`
- Create: `scripts/find-tests-with-multiple-epics.js`
- Create: `scripts/resolve-placeholder-jira-epics.js`
- Create: `scripts/resolve-placeholder-jira-epics.test.js`
- Modify: `cypress/support/component.ts`

- [ ] **Step 1: Run failing parity checks for helper scripts**

Run:

```bash
cmp -s scripts/run-test-suite.js ../opal-frontend/scripts/run-test-suite.js; echo "run-test-suite:$?"
cmp -s scripts/build-cucumber-report.js ../opal-frontend/scripts/build-cucumber-report.js; echo "build-cucumber-report:$?"
cmp -s scripts/check-cypress-test-metadata.js ../opal-frontend/scripts/check-cypress-test-metadata.js; echo "metadata:$?"
test -f scripts/find-tests-missing-epic.js; echo "missing-epic:$?"
test -f scripts/find-tests-with-multiple-epics.js; echo "multiple-epics:$?"
test -f scripts/resolve-placeholder-jira-epics.js; echo "resolve-placeholder:$?"
```

Expected before edits:

```text
run-test-suite:1
build-cucumber-report:1
metadata:1
missing-epic:1
multiple-epics:1
resolve-placeholder:1
```

- [ ] **Step 2: Mechanically align generic helper scripts from `opal-frontend`**

Copy these generic helper files from `../opal-frontend`:

```bash
cp ../opal-frontend/scripts/run-test-suite.js scripts/run-test-suite.js
cp ../opal-frontend/scripts/build-cucumber-report.js scripts/build-cucumber-report.js
cp ../opal-frontend/scripts/check-cypress-test-metadata.js scripts/check-cypress-test-metadata.js
cp ../opal-frontend/scripts/find-tests-missing-epic.js scripts/find-tests-missing-epic.js
cp ../opal-frontend/scripts/find-tests-with-multiple-epics.js scripts/find-tests-with-multiple-epics.js
cp ../opal-frontend/scripts/resolve-placeholder-jira-epics.js scripts/resolve-placeholder-jira-epics.js
cp ../opal-frontend/scripts/resolve-placeholder-jira-epics.test.js scripts/resolve-placeholder-jira-epics.test.js
```

These files are generic Cypress orchestration and metadata tooling. Do not copy `opal-frontend` account evidence support tasks or screenshot relocation tasks.

- [ ] **Step 3: Update component support reporting**

Edit `cypress/support/component.ts` so it includes the same reporter registration and title tagging behavior as `opal-frontend`, while preserving the existing GDS body class setup:

```ts
/// <reference types="@cypress/grep" />
import { register as registerCypressGrep } from '@cypress/grep';
import 'cypress-mochawesome-reporter/register';
import { addGdsBodyClass } from '@hmcts/opal-frontend-common/components/govuk/helpers';

registerCypressGrep();

beforeEach(function () {
  const test = this.currentTest;

  // @ts-expect-error Cypress test metadata is untyped here
  const tags = test?._testConfig.unverifiedTestConfig.tags;

  if (tags && tags.length > 0) {
    test.title = `${test.title} [${tags.join(', ')}]`;
  }

  addGdsBodyClass();
});
```

- [ ] **Step 4: Run helper parity and syntax checks**

Run:

```bash
cmp -s scripts/run-test-suite.js ../opal-frontend/scripts/run-test-suite.js; echo "run-test-suite:$?"
cmp -s scripts/build-cucumber-report.js ../opal-frontend/scripts/build-cucumber-report.js; echo "build-cucumber-report:$?"
cmp -s scripts/check-cypress-test-metadata.js ../opal-frontend/scripts/check-cypress-test-metadata.js; echo "metadata:$?"
node -c scripts/run-test-suite.js
node -c scripts/build-cucumber-report.js
node -c scripts/check-cypress-test-metadata.js
node -c scripts/find-tests-missing-epic.js
node -c scripts/find-tests-with-multiple-epics.js
node -c scripts/resolve-placeholder-jira-epics.js
node scripts/resolve-placeholder-jira-epics.test.js
```

Expected:

```text
run-test-suite:0
build-cucumber-report:0
metadata:0
```

The `node -c` commands produce no output and exit `0`. The resolver unit test exits `0` and reports 9 passing tests.

- [ ] **Step 5: Run metadata checker in report mode**

Run:

```bash
node scripts/check-cypress-test-metadata.js --output=/tmp/opal-rm-cypress-metadata.csv
```

Expected: exit code `1`, because current RM starter Cypress tests intentionally remain untagged. The output should include:

```text
[check-cypress-test-metadata] component total=3 missing_story=3 missing_pot=3 auto_pot_incompatible=0 multiple_pot=0 shared_pot=0 duplicate_title=0 duplicate_qualified_title=0
[check-cypress-test-metadata] functional total=1 missing_story=1 missing_pot=1 auto_pot_incompatible=0 multiple_pot=0 shared_pot=0 duplicate_title=0 duplicate_qualified_title=0
```

- [ ] **Step 6: Commit helper parity**

Run:

```bash
git add scripts/run-test-suite.js scripts/build-cucumber-report.js scripts/check-cypress-test-metadata.js scripts/find-tests-missing-epic.js scripts/find-tests-with-multiple-epics.js scripts/resolve-placeholder-jira-epics.js scripts/resolve-placeholder-jira-epics.test.js cypress/support/component.ts
git commit -m "chore: align cypress runner helpers"
```

Expected: commit succeeds.

## Task 3: Jenkins Pipeline Parity

**Files:**
- Modify: `Jenkinsfile_CNP`
- Modify: `Jenkinsfile_nightly`

- [ ] **Step 1: Run a failing old-reference check**

Run:

```bash
rg -n "test:opalComponent|zephyr:test:opalComponent|component-html|test:functionalLegacy" Jenkinsfile_CNP Jenkinsfile_nightly
```

Expected: FAIL-style discovery output with references in both Jenkins files, including `test:opalComponent`, `zephyr:test:opalComponent`, `functional-output/component-html`, and the old legacy command sequence.

- [ ] **Step 2: Update `Jenkinsfile_CNP` component stage**

Replace:

```groovy
yarnBuilder.yarn('test:opalComponent')
```

with:

```groovy
yarnBuilder.yarn('test:component')
```

Replace:

```groovy
"functional-output/component-html/${resolvedBrowserToRun()}/",
```

with:

```groovy
"functional-output/component/${resolvedBrowserToRun()}/html/",
```

- [ ] **Step 3: Update `Jenkinsfile_nightly` component and legacy stages**

Replace:

```groovy
builder.yarn(shouldRunWithZephyr ? 'zephyr:test:opalComponent' : 'test:opalComponent')
```

with:

```groovy
builder.yarn(shouldRunWithZephyr ? 'zephyr:test:component' : 'test:component')
```

Replace the old component artifact publishing block:

```groovy
archiveArtifact(functionalProdArtifactsPath)
archiveArtifact("functional-output/screenshots/${browserToRun}/component/**")
publishHtmlReport(
  "functional-output/component-html/${browserToRun}/",
  'component-report.html',
  "Component Test Report (${browserToRun})"
)
```

with:

```groovy
archiveArtifact("functional-output/component/${browserToRun}/**")
publishHtmlReport(
  "functional-output/component/${browserToRun}/html/",
  'component-report.html',
  "Component Test Report (${browserToRun})"
)
```

Replace the old legacy command sequence:

```groovy
builder.yarn(
  'yarn test:functionalLegacy ; ' +
  'yarn test:functionalLegacy:combine:reports ; ' +
  'yarn test:functionalLegacy:cucumber:combineParallelReport'
)
```

with:

```groovy
builder.yarn('test:functional --mode=legacy')
```

- [ ] **Step 4: Verify Jenkins old references are gone**

Run:

```bash
rg -n "test:opalComponent|zephyr:test:opalComponent|component-html|test:functionalLegacy" Jenkinsfile_CNP Jenkinsfile_nightly
```

Expected: no output and exit code `1`.

Run:

```bash
rg -n "test:component|zephyr:test:component|functional-output/component/.*/html|test:functional --mode=legacy" Jenkinsfile_CNP Jenkinsfile_nightly
```

Expected: output includes the new component calls and legacy mode command.

- [ ] **Step 5: Commit Jenkins parity**

Run:

```bash
git add Jenkinsfile_CNP Jenkinsfile_nightly
git commit -m "ci: align cypress pipeline commands"
```

Expected: commit succeeds.

## Task 4: README And Zephyr Documentation Parity

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Run a failing docs old-reference check**

Run:

```bash
rg -n "test:opalComponent|zephyr:test:opalComponent|test:functional:uat-legacy|component-html" README.md
```

Expected: output includes old component and legacy script references.

- [ ] **Step 2: Replace the Cypress runner section**

In `README.md`, replace the current Cypress section from `Run \`yarn test:opalComponent\`` through the legacy mode command with this content:

````markdown
Run `yarn test:component` to execute the Cypress component suite.

All three top-level runners accept:

- `--browser=<chrome|edge|firefox>` for an explicit browser
- `--mode=<opal|legacy>` for suite mode selection
- `--parallel` or `--serial` to override the default execution style

Examples:

```bash

yarn test:component --browser=chrome --parallel
yarn test:smoke --mode=legacy --serial
yarn test:functional --browser=firefox --mode=opal --parallel

```

### Legacy app mode

To run the UAT-Technical-tagged functional tests against legacy app mode locally:
This keeps the functional suite on the normal OPAL spec tree and only switches the app/helpers into legacy mode.

```bash

yarn test:functional:uat_legacy

```
````

Keep the RM-specific prerequisite lines above this section, including the default local base URL of `http://localhost:5000/` and the starter coverage note.

- [ ] **Step 3: Replace the reports section**

Replace the current one-line reports section:

```markdown
Artifacts and reports are written to `smoke-output/` and `functional-output/`, using browser-specific subdirectories where applicable.
```

with:

````markdown
After a clean run, artifacts and reports are written to `functional-output/` and `smoke-output/`.
Replace `<browser>` with `chrome`, `edge`, or `firefox`.

```text
functional-output/
  component/
    <browser>/
      html/
        component-report.html
        assets/...
      json/
        .jsons/
          mochawesome*.json
      junit/
        component-test-output-*.xml
      screenshots/...
  prod/
    <browser>/
      opal-mode-test-output-*.xml
      <browser>-test-result.xml
      cucumber/
        OPAL-report-*.ndjson
        <browser>-report.ndjson
        <browser>-report.html
      legacy/
        legacy-mode-test-output-*.xml
        legacy-test-result.xml
        cucumber/
          LEGACY-report-*.ndjson
          legacy-report.ndjson
          legacy-report.html
  screenshots/
    <browser>/...
    <browser>/legacy/...
  videos/...
  zephyr/
    cypress-report-1.json
    cucumber-report.json
    temp/...

smoke-output/
  prod/
    <browser>/
      opal-mode-test-output-*.xml
      <browser>-test-result.xml
      cucumber/
        OPAL-report-*.ndjson
        smoke-report.ndjson
        smoke-report.html
      legacy/
        legacy-mode-test-output-*.xml
        legacy-test-result.xml
        cucumber/
          LEGACY-report-*.ndjson
          legacy-report.ndjson
          legacy-report.html
  screenshots/
    <browser>/...
    <browser>/legacy/...
  zephyr/
    cucumber-report.json
```

Notes:

- `functional-output/component/<browser>/json/.jsons/` is the raw Mochawesome JSON used to build `html/component-report.html`.
- `functional-output/prod/<browser>/legacy/` and `smoke-output/prod/<browser>/legacy/` are only created for legacy-mode runs.
- `videos/` is only expected when using `yarn test:functionalOpalVideo`.
- These older component paths should not be recreated on a clean run: `functional-output/component-report/`, `functional-output/component-html/`, and `functional-output/prod/<browser>/component/`.
````

- [ ] **Step 4: Update Zephyr component and metadata maintenance docs**

Replace:

```markdown
- `zephyr:test:opalComponent`: Reset outputs, run component tests, then create a Zephyr execution from the Cypress JSON report.
```

with:

```markdown
- `zephyr:test:component`: Reset outputs, run component tests, then create a Zephyr execution from the Cypress JSON report.
```

Add this section immediately after the Zephyr project scripts list and before `### Supported Tags`:

```markdown
## Test Metadata Maintenance

- `node scripts/find-tests-missing-epic.js`: Report executable Cypress tests that have no `@JIRA-EPIC:*` tag. Add `--write` to insert the placeholder `@JIRA-EPIC:PO-0000` where the script can do so safely.
- `node scripts/resolve-placeholder-jira-epics.js`: Report executable Cypress tests that still use the placeholder `@JIRA-EPIC:PO-0000`. Add `--write` with `JIRA_AUTH_TOKEN` set to replace only placeholder epic tags whose test has exactly one `@JIRA-STORY:*` tag and whose Jira story resolves to an epic. Tests with multiple story tags are skipped.
- `node scripts/find-tests-with-multiple-epics.js`: Report executable Cypress tests that have more than one `@JIRA-EPIC:*` tag.
```

- [ ] **Step 5: Verify docs old references are gone**

Run:

```bash
rg -n "test:opalComponent|zephyr:test:opalComponent|test:functional:uat-legacy|component-html" README.md
```

Expected: no output and exit code `1`, except `component-html` may appear only in the note saying older component paths should not be recreated. If that note remains, run this narrower check:

```bash
rg -n "test:opalComponent|zephyr:test:opalComponent|test:functional:uat-legacy" README.md
```

Expected: no output and exit code `1`.

Run:

```bash
rg -n "test:component|zephyr:test:component|find-tests-missing-epic|resolve-placeholder-jira-epics|find-tests-with-multiple-epics" README.md
```

Expected: output includes the new runner, Zephyr, and metadata maintenance references.

- [ ] **Step 6: Commit README parity**

Run:

```bash
git add README.md
git commit -m "docs: align cypress runner guidance"
```

Expected: commit succeeds.

## Task 5: Final Verification

**Files:**
- Verify only; no file edits expected.

- [ ] **Step 1: Verify Yarn scripts are enabled**

Run:

```bash
yarn config get enableScripts
```

Expected:

```text
true
```

This confirms the user-owned `.yarnrc.yml` change is active and replaces the need for `test:cypress:ensure-binary`.

- [ ] **Step 2: Verify no old command names remain in code, scripts, pipelines, or docs**

Run:

```bash
rg -n "test:opalComponent|zephyr:test:opalComponent|test:cypress:ensure-binary|test:functionalLegacy|test:smokeOpal|test:smokeLegacy|test:functionalOpalParallel|test:functionalChromeParallel|test:functionalEdgeParallel|test:functionalFirefoxParallel" package.json README.md Jenkinsfile_CNP Jenkinsfile_nightly scripts
```

Expected: no output and exit code `1`.

- [ ] **Step 3: Verify package scripts still match the parity surface**

Run the exact package script assertion from Task 1 Step 1.

Expected:

```text
package Cypress scripts match opal-frontend parity surface
```

- [ ] **Step 4: Verify helper script syntax and resolver tests**

Run:

```bash
node -c scripts/run-test-suite.js
node -c scripts/build-cucumber-report.js
node -c scripts/check-cypress-test-metadata.js
node -c scripts/find-tests-missing-epic.js
node -c scripts/find-tests-with-multiple-epics.js
node -c scripts/resolve-placeholder-jira-epics.js
node scripts/resolve-placeholder-jira-epics.test.js
```

Expected: syntax checks exit `0` with no output; resolver test reports 9 passing tests.

- [ ] **Step 5: Verify metadata report behavior**

Run:

```bash
node scripts/check-cypress-test-metadata.js --output=/tmp/opal-rm-cypress-metadata.csv
```

Expected: exit code `1` because current RM starter tests are intentionally untagged. The output should include `auto_pot_incompatible=0` for component and functional summaries.

- [ ] **Step 6: Verify Cypress command parsing without requiring the SSR app**

Run:

```bash
yarn test:component:leaf --help
```

Expected: Cypress prints command help or exits before running tests. If Cypress attempts to launch and fails because no browser is installed, record the browser error; do not treat unavailable browsers as a migration failure.

- [ ] **Step 7: Run linting for edited Cypress support and scripts**

Run:

```bash
yarn lint:cypress
```

Expected: PASS. If existing unrelated Cypress lint failures appear, capture the first failing file and rule in the implementation summary.

- [ ] **Step 8: Check final git status**

Run:

```bash
git status --short
```

Expected: only the user-owned `.yarnrc.yml` change may remain unstaged if it was not intentionally committed with this migration. No generated `/tmp` reports should appear in git status.

## Self-Review Checklist

- Spec coverage: Tasks 1 and 3 cover runner and pipeline parity; Task 2 covers report helpers and metadata capability; Task 4 covers docs; Task 5 covers verification and the Cypress binary lifecycle-script assumption.
- Placeholder scan: The only intentional placeholder text is the literal future tag `@JIRA-EPIC:PO-0000`.
- Type consistency: Script names use `test:component`, `test:component:leaf`, `zephyr:test:component`, and `test:functional:uat_legacy` consistently across package, Jenkins, README, and verification commands.
- Scope check: Existing RM tests remain untagged; account evidence and screenshot relocation support are not migrated.
