# PO-9809 component-test evidence

## Scope and agreed rules

This change adds Cypress component coverage for Minor Creditor Details and combines its accessibility scenarios into
`cypress/component/createDraftCasefile/minorCreditor/minor-creditor.cy.ts`. The separate accessibility spec is removed.
Application code, dependency declarations and lock files are unchanged.

The user confirmed that non-UK payment reference is required. The latest instruction follows the supplied change
description: BIC/SWIFT and IBAN are independently optional, including when both are blank; Countries resolves before
entry; no bespoke navigation-error banner is required; full Summary content belongs to PO-9810. Application behaviour
remains unchanged. The two local 320px reflow tests were removed at the user's request after investigation. The difference from the
reported passing pipeline is not classified as a product defect. Automated Minor Creditor reflow coverage is no longer
provided by this component spec; a manual reflow check remains part of accessibility verification.

## Acceptance criteria and evidence

| Criterion            | Component evidence                                                                                                                                                                                                                                                                                     | Limits                                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1                  | Exact initial choices; no default radio selection; hidden branches; saved identity, address and bank fields restored from the real store for Individual/None, Organisation/UK and Organisation/non-UK.                                                                                                 | Mounted helpers do not prove outer permission checks or a complete browser journey.                                                                                                    |
| AC2                  | Required and whitespace-only inputs, individual/organisation switching, active bank branch clearing, field limits, invalid formats, valid format boundaries, recognised Country selection, UK sort-code normalisation and account leading zeros.                                                       | Both identifiers blank, BIC/SWIFT only and IBAN only are valid; supplied values must meet their format rules.                                                                          |
| AC3 / EMAC1 / EMAC1a | Independent expected error copy; initial inline and ordered summary errors; summary focus; field links and error associations; invalid Save cannot allocate or navigate; valid values retained during validation; Countries empty/error retry, correlated failure and preservation of saved creditors. | Countries resolves before entry by design. Retry preserves saved creditor state; these tests do not claim unsaved fields on an already visible Details screen during resolver failure. |
| AC4                  | Real store assertions for local save and active branch data; prohibited Draft Casefile write requests; real routed Save and dirty Cancel outcomes in the creditor spec; navigation-failure retry without duplication; keyboard confirmed Cancel discards a new unsaved creditor.                       | No deployed backend/database or full E2E evidence is claimed.                                                                                                                          |
| AC5                  | Preserved Axe scenarios; Individual, Organisation, UK and non-UK keyboard conditional focus; Country keyboard selection; Save, Cancel and error-link keyboard activation; hidden-bank-field tab skipping.                                                                                              | Axe and DOM/focus assertions are partial accessibility evidence. 320px reflow checks were removed at the user's request; manual reflow and screen-reader verification remain.          |
| RGAC                 | Minor Details synthetic beforeunload warning and retained edits; real child-route Cancel guards.                                                                                                                                                                                                       | Synthetic beforeunload does not prove the browser's confirmed reload/discard outcome.                                                                                                  |
| PAC1 / PAC2 / PAC3   | No new component claim.                                                                                                                                                                                                                                                                                | Outer permission guard and dashboard action visibility require existing or additional QA E2E evidence.                                                                                 |

## Validation organisation

The [component-test guide](../CYPRESS_COMPONENT_TESTING.md) requires one coherent behaviour per test rather than one
assertion per test. Nearby Applicant Individual and Applicant Organisation specs group active inline errors and summary
links; Order Details and Order Terms Input also use separate data-driven cases for distinct validation rules.

The validation block now has **15 cases instead of 60**:

- three required-field cases, grouping blank and whitespace-only values by Individual, UK bank and non-UK bank setup;
- three over-limit and three accepted-limit cases, checking every applicable field in each setup;
- two invalid-bank-format cases, checking all invalid values sequentially, restoring each field and proving corrected
  values can save; and
- four valid-format boundary cases, retaining separate initial states for the specific accepted account/BIC/IBAN values.

All original data rows remain: ten required fields, sixteen character limits checked on both sides, fourteen invalid
formats and four valid format boundaries. Every grouped error checks exact inline copy, summary focus/link behaviour,
field focus and error association. Invalid submissions still verify no store allocation or navigation; accepted limits
still verify every saved canonical value. Accessibility and navigation scenarios remain separate.

## Verification

| Command                                                           | Result                                                                                                                                                                     |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `corepack yarn prettier`                                          | Pass.                                                                                                                                                                      |
| `corepack yarn lint:cypress`                                      | Pass.                                                                                                                                                                      |
| `corepack yarn check:cypress:test-metadata`                       | Pass; 340 statically discovered covered component/functional E2E test declarations checked. This is not the runtime test count.                                            |
| `corepack yarn exec tsc --project cypress/tsconfig.json --noEmit` | Pass.                                                                                                                                                                      |
| `git diff --check`                                                | Pass.                                                                                                                                                                      |
| `corepack yarn test:component --browser=chrome --serial`          | Before the user-requested removal: exit 2; 463 scenarios across 15 specs, 461 pass and 2 local reflow failures. This is historical evidence, not a run of the final files. |

The preceding full component run used Chrome 155 headless, Node 24.19.0 and Yarn 4.18.1, after restoring the locked dependencies,
with production styles, real feature stores
and child routing where relevant. It is local Cypress component evidence, not deployed or browser-journey evidence.

Earlier targeted verification used
`BROWSER_TO_RUN=chrome corepack yarn exec cypress run --browser chrome --component --spec 'cypress/component/createDraftCasefile/minorCreditor/minor-creditor.cy.ts,cypress/component/createDraftCasefile/creditor/creditor.cy.ts'`;
all 35 creditor tests passed. The preceding full run superseded the intermediate minor-creditor result. Intermediate
runs exposed and corrected test compilation, fixture typing and label-expectation issues. No production behaviour was
changed to make tests pass. Cypress initially exited before starting in the sandbox; browser-enabled execution succeeded.
An extra diagnostic adding `--noPropertyAccessFromIndexSignature` to the TypeScript command reported existing accesses
in unchanged `cypress.config.ts`; this is not a configured repository check. The normal TypeScript check passes.
Cypress also reports the existing `allowCypressEnv` configuration warning; configuration is unchanged. A final
formatting-only pass followed the browser run; static checks were repeated on the final files.

## Confirmation automation

The accepted and declined keyboard Cancel scenarios stub the application's `window.confirm` directly before pressing
Enter. Both assert exactly one call with the approved unsaved-changes warning, then check the real routed destination
and retained/discarded state. This replaces reliance on the Cypress `window:confirm` event for native keyboard activation
and prevents an actual dialog requiring a manual response. The production guard and warning are unchanged.

Final verification uses visible Chrome (`--headed`) to cover the mode in the user's screenshot; the exact command and
result follow. The initial visible run passed all 54 cases. TypeScript then identified alias chaining after `.returns()`;
placing `.as()` before `.returns()` corrected the type without changing the confirmation response.

Final targeted verification after confirmation automation:
`CYPRESS_THREAD=1 BROWSER_TO_RUN=chrome corepack yarn exec cypress run --browser chrome --headed --component --spec 'cypress/component/createDraftCasefile/minorCreditor/minor-creditor.cy.ts'`
passed: **54 tests, 54 passing, 0 failing, 0 pending, 0 skipped**. The previous focused run after regrouping passed all 54
cases in headless Chrome too. The reduction from the original 99 cases reflects grouped assertions, with all original
validation data rows retained.

Formatting, Cypress lint, metadata (340 statically discovered declarations), Cypress TypeScript and diff checks passed
on the final files. The full suite was not repeated because this confirmation fix changes only the Minor Creditor spec;
its earlier result is retained as historical evidence above. Application code and shared setup remain unchanged by
this regrouping. The first browser attempt could not start because port 8090 was occupied by a Cypress Config Manager;
the repository's `CYPRESS_THREAD=1` setting selected port 8091 without changing configuration or stopping that process.

## Local reflow investigation

The earlier product-defect classification is withdrawn. The local/pipeline discrepancy remains unexplained. The user
authorised removing both affected tests; production styling remains unchanged.

- The local installation had shared UI library 0.0.109, although `package.json` and `yarn.lock` require 0.0.110.
  `NODE_USE_SYSTEM_CA=1 corepack yarn install --immutable` restored the pinned dependencies successfully, without
  changing the manifest or lockfile. Initial retries were blocked by sandbox DNS and certificate trust; system CA
  trust resolved installation without disabling TLS verification. Existing peer-dependency warnings remain.
- After alignment, temporary geometry diagnostics reproduced document width **335px at a 320px viewport** in
  Chrome 155 and Edge 154 on macOS 26.6.2. The shared Creditor route measured 320px in the same harness. The dependency
  mismatch therefore did not explain the measured overflow.
- Routed Details and Summary have a child `govuk-grid-row` inside the application shell's `govuk-grid-row`.
  Computed negative 15px margins on the child place its bounds at -15px and 335px. This identifies the local overflow
  geometry; it does not establish why the pipeline differs. No CSS masking or relaxed assertion was introduced.
- The latest [PR-405 build 25](https://sds-build.hmcts.net/job/HMCTS/job/opal-rm-frontend/job/PR-405/25/display/redirect)
  is **SUCCESS**, verified through GitHub check metadata at `4269875e24fc595aa99a5a1fa45bdf2c2a172024`, the local base
  revision. Jenkins test-report and console endpoints redirect to Microsoft authentication, so scenario-level output,
  browser version and executed component command could not be inspected. The user reports that Minor Creditor passes.
- Pipeline configuration runs component tests with Edge by default and Chrome fallback, using the same production
  styles. Local Edge reproduced the measurement too. The temporary diagnostic spec was removed after comparison.

Optional investigation follow-up: compare authenticated build 25's component report and console with the local measurements,
including the precise reflow scenario, browser/platform versions and mounted markup. No product bug is raised from
the local measurement alone.

## Remaining verification boundaries

- Permissions: use authenticated users with qualifying Maintenance Business Unit permission, no qualifying permission,
  and a different Business Unit. Verify allowed entry, hidden create action, direct-route denial, Permission Denied,
  and absence of entered case data for denied access. This belongs to QA E2E evidence.
- Reload: on dirty Minor Details, cancel the browser warning and verify retained edits; confirm reload/departure and
  verify unsaved frontend-only data is discarded. Component beforeunload dispatch is not sufficient evidence.
- Reflow: on Details and Summary, use a 320 CSS-pixel viewport or 400% zoom at a 1280px viewport. Verify readable
  content and operable controls without horizontal page scrolling, including conditional fields and validation errors.
- Screen reader: check conditional field instructions, error-summary announcements, Country results, resolver error
  announcements, and focus after routed navigation with a supported assistive-technology/browser combination.
- Countries wording: the approved change description resolves Countries before entry. The ticket's disabled-Country
  wording should be aligned with that decision. Component coverage follows the approved pre-entry behaviour.

## Definition of Done

**Agent-executable checks pass for this test change.** The two reflow tests were removed by explicit user instruction.
Their removed coverage is recorded above and requires manual verification; no automated Minor Creditor reflow claim
is made. The regrouped 54-scenario spec and applicable static checks pass.

Repository review and test-pattern checks apply to this test change. Application lint, production build, unit tests,
unit coverage and Sonar New Code evidence are not applicable to changed application code because none is changed.
The request specifically concerns QA component tests. Dependency/security audit changes, configuration, feature flags,
and before/after UI-change screenshots are not applicable: there are no dependency, configuration or UI changes.
Existing component screenshot output supplies test evidence only. Final read-only agent review found no concrete new
defects. Final diff review checks scope, synthetic test data,
no secrets, cloned fixtures, selector reuse and Jira tags. Human reviews, QA sign-off, CI, deployed environment checks
and ticket closure remain unverified.

## Draft PR handoff

Title: `test(PO-9809): expand minor creditor component coverage`

Jira: PO-9809. Use the verified project Jira URL when preparing a PR.

Minor Creditor Details now has one component spec containing behaviour and accessibility scenarios. It adds required
field, format and length-boundary checks; independent exact validation-copy assertions; local-store and no-write Save
checks; Country retry/error evidence; real-store restoration; and keyboard and navigation-guard checks. BIC/SWIFT and IBAN are
independently optional and payment reference remains required, following the approved description. The two local reflow
checks were removed at the user's request after browser, dependency and DOM investigation; manual reflow evidence remains
outstanding. Application code and dependency
declarations are unchanged.

Security Vulnerability Assessment: no new or changed dependency, CVE suppression, credential or production security
behaviour is introduced. Fixtures use synthetic creditor data. Existing vulnerability status is not reassessed by this
component-test change.

Review, QA, CI and the remaining manual accessibility evidence remain pending.
