# PO-10273 local verification — 21 October 2026

The 11 ticket scenarios and all 23 scenarios in the normal review/permission selection pass against the rebuilt local
Maintenance service, including real submissions and automatic cleanup. Displaying the generated ID on
confirmation is agreed future work, not a blocker for the revised PO-10273 scope.

## Accepted scope clarification

On 21 October 2026 the user confirmed the developer's clarification: displaying the generated Draft Casefile ID in
confirmation belongs to future work. The saved ticket export still includes that original display criterion; the
explicit clarification supersedes it for this branch. Comments in the live feature and action record this decision.
No future ticket key has been supplied or invented.

The live scenario continues to verify HTTP 201, `SUBMITTED`, a positive safe-integer backend ID, the exact REMO run
marker in the POST payload, confirmation content/focus, one submission, and cleared journey state. The ID is still
captured synchronously by the response listener before assertions and retained for authenticated cleanup. The
scenario name, tags and `@retries(0)` are unchanged. Only the display assertion, its unused alias and misleading step
wording were removed.

## Changed files

- `cypress/e2e/functional/opal/actions/createDraftCasefile/check-case-details.actions.ts`: documents the deferred
  display work; preserves backend receipt checks and all applicable confirmation assertions.
- `cypress/e2e/functional/opal/flows/createDraftCasefile/check-case-details.flow.ts`: updates the confirmation contract
  comment.
- `cypress/support/step_definitions/createDraftCasefile/check-case-details.steps.ts` and the adjacent
  `CheckCaseDetails.feature`: use the accurate step `the live Draft Casefile submission is confirmed`; preserve
  scenario identity and add the future-work comment.
- `docs/CYPRESS_E2E_TESTING.md`: records the scope clarification and merged-backend setup.
- This verification report: replaces the obsolete missing-ID blocker and PR-image requirements with current evidence.

No application source, cleanup-helper behaviour, dependency manifest, lockfile, deployment values or CI scripts were
changed. The installed dependency tree was restored using `NODE_OPTIONS=--use-system-ca corepack yarn install
--immutable` after an initial certificate error; TLS validation stayed enabled. Existing peer-dependency warnings
remain. No dependency-version change was made.

## Local environment

- Frontend branch: `codex/PO-10273`, based on `8edd5769` when this work began; clean before these edits.
- Maintenance checkout: clean `master` at `e09bba6`, containing cleanup merge `d3123e7` / PR 302.
- Running backend: `opal-maintenance-service:local`, healthy, with `TESTING_SUPPORT_ENDPOINTS_ENABLED=true`.
- Existing local User Service, PostgreSQL and Redis were used. The frontend was freshly built with
  `corepack yarn build:ssr` and temporarily started at `http://localhost:5000` with:

```sh
FEATURE_FLAGS_OVERRIDE=true RELEASE_1C_RM_CREATE_CASE_FILES_ENABLED=true FEATURES_LAUNCH_DARKLY_ENABLED=false FEATURES_SSO_ENABLED=false PORT=5000 node dist/opal-rm-frontend/server/main.js
```

Node 24.19.0 / Corepack Yarn 4.18.1 were used. The local flow uses the existing passwordless sign-in/session/proxy;
no new token handling or account provisioning was added. Successful permission preflights verify ACTIVE Maintenance
membership and BU 44 permission 21 for the creator, and its absence for the denied account. Real Country, Application,
Central Authority, Result and Major Creditor data were used where required by the selected journeys.

The frontend PR's temporary Maintenance PR-image selection labels were confirmed removed. Cleanup is merged into
Maintenance master, so the PR image is no longer required. Actual deployed image contents, resolved dev/staging
configuration and deployed SSO remain unverified. Keep frontend-owned Maintenance test support true in E2E dev/staging
and false in base/production; there is no application environment allowlist.

## Commands and results

| Check                                                          | Result                                                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `corepack yarn prettier`                                       | Pass.                                                                                                                     |
| `corepack yarn lint:cypress`                                   | Pass.                                                                                                                     |
| `corepack yarn exec tsc --noEmit --project e2e.tsconfig.json`  | Pass.                                                                                                                     |
| `corepack yarn lint:ng`                                        | Pass.                                                                                                                     |
| `corepack yarn test`                                           | 12 cleanup regressions and 1,854 Angular tests pass.                                                                      |
| `corepack yarn build:ssr`                                      | Browser production bundle and SSR build pass; existing Sass/CommonJS/optional module warnings remain.                     |
| `corepack yarn check:cypress:test-metadata`                    | 538 covered tests checked; pass.                                                                                          |
| `corepack yarn find:duplicate:scenarios`                       | No duplicate scenario names.                                                                                              |
| Before/after Gherkin compilation and tag-expression comparison | All 11 selected scenario names/tags across nine features are unchanged; all six CheckCaseDetails scenarios are unchanged. |
| Ticket discovery command below with `--env dryRun=true`        | 11 pass; selection/binding evidence only.                                                                                 |
| Ticket live command below                                      | 11 pass, including three accessibility scenarios; none pending or skipped.                                                |
| Normal default review/permissions selection below              | All 23 pass: six review/submission scenarios and 17 protected-route permission examples; none skipped or pending.         |
| Smoke suite                                                    | One sign-in/sign-out scenario passes; none pending or skipped.                                                            |
| `git diff --check`                                             | Pass.                                                                                                                     |

Ticket discovery and actual browser execution use the same selection. Add `--env dryRun=true` only for discovery:

```sh
TEST_URL=http://localhost:5000 TAGS='@JIRA-STORY:PO-10273 and not @skip' CYPRESS_TAGS='@JIRA-STORY:PO-10273 and not @skip' corepack yarn test:functional:serial --browser=chrome --reset --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/IndividualCaseParties.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrganisationCaseParties.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CentralAuthorityDetails.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrderDetails.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CheckCaseDetails.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CasefilePermissions.feature,cypress/e2e/functional/opal/features/createDraftCasefile/IndividualCasePartiesAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/OrderDetailsAccessibility.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CheckCaseDetailsAccessibility.feature'
```

Normal pipeline default tags, bounded to the shared review and permission owners:

```sh
env -u TAGS -u CYPRESS_TAGS TEST_URL=http://localhost:5000 corepack yarn test:functional:serial --browser=chrome --reset --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/CheckCaseDetails.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CasefilePermissions.feature'
```

Smoke command:

```sh
env -u TAGS -u CYPRESS_TAGS TEST_URL=http://localhost:5000 corepack yarn test:smoke:serial --browser=chrome --reset
```

## Cleanup evidence and limitations

The ticket live run created draft 11 and completed confirmation and journey clearing. The existing authenticated
`afterEach` hook removed it: its `functional-output/draft-casefile-cleanup/` entry is empty, which the helper writes
only after HTTP 204. A read-only SQL check confirmed draft 11 is absent and the draft table returned to the zero
baseline recorded before execution. The normal-selection run separately created draft 12 and cleaned it with HTTP 204.
Both archived ledger entries are empty. A final read-only count returned zero total drafts and zero rows with IDs
11 or 12. Existing data was not deleted: the baseline was already zero.

The helper remains unchanged. It retains the exact marker/ID, persists outstanding receipts before any DELETE,
reports non-204 and transport errors, and removes receipts only on 204. The 12 deterministic regressions include early
capture, separate support/feature bundles, HTTP failure retention and transport failure. A crash before teardown or a
lost POST response can still leave an unrecorded draft; no recovery job is claimed.

Reports are preserved before subsequent runner resets under `/private/tmp/po-10273-20261021-evidence/`; these are local,
ignored artifacts. CI already archives `functional-output/**` in its `afterAlways` hooks.

## Acceptance mapping and remaining verification

- Supported REMO In Individual/Organisation starts, mandatory capture and retained progress: passing party journeys.
- REMO Out and REMO Out (CMS): passing Central Authority regression/start scenarios.
- Ordered task unlocking and completion gate: passing party, Order Details and live submission journeys.
- Submission confirmation and journey clearing: passing live scenario; UI ID display is deferred by explicit scope
  clarification, while backend ID validation remains covered.
- Permission denial: passing live authorised/denied preflights and protected-route journeys.
- Task-list, party, order and review accessibility: three passing Axe journeys plus existing browser keyboard/focus
  assertions. This is partial evidence, not proof of complete WCAG 2.2 AA compliance.
- Automated deletion: successful authenticated cleanup plus database absence check as recorded above.

Application component tests, new application coverage and before/after UI screenshots are not applicable to this
delta: no application source, UI, selectors or production behaviour changed. Existing application coverage was not
regenerated because this change affects Cypress assertions outside `sonar.sources=src/`; no coverage exclusions were
changed. No dependency version or CVE suppression changed. No secret, token or participant payload was added to code
or cleanup artifacts.

Final review applied repository review guidance and the frontend review skill; no qualifying introduced defect was found. Full functional-suite execution,
full component-suite execution, full SSO/deployed E2E, current CI/Sonar/security gates, Helm rendering/deployment,
specialist screen-reader/magnification assurance, two reviewer approvals, QA sign-off and ticket closure remain
pending or outside this local change. No manual deployment is performed.
