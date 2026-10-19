# PO-10273 Maintenance test-support alignment

Status: **Not Agent Complete**. The cleanup setup works locally, but the existing live acceptance assertion still
fails because the confirmation panel does not display the returned Draft Casefile identifier. No application source
was changed or assertion weakened. Fix the product confirmation behaviour and rerun the live scenario before claiming
PO-10273 acceptance. Deployed authentication, frontend CI and deployment verification remain pending.

## Changes and retained behaviour

- `charts/opal-rm-frontend/values.yaml`: explicitly disables nested Maintenance test support in base/production.
- `charts/opal-rm-frontend/values.dev.template.yaml` and `values.stg.template.yaml`: explicitly enable the shared switch
  in the frontend-owned E2E deployments. Backend-owned overlays do not configure these deployments.
- `cypress/support/draftCasefiles.ts`: exact marker, agreed DELETE/header, shared receipts across support/feature
  bundles, ledger before deletion, removal only on 204, and visible HTTP/transport failures.
- `cypress/e2e/functional/opal/actions/createDraftCasefile/check-case-details.actions.ts`: saves/reopens the marker
  through REMO Reference and checks the real POST payload. Retains synchronous response capture before assertions.
- `cypress/e2e/functional/opal/flows/createDraftCasefile/check-case-details.flow.ts`: includes the real reference form
  in the live journey.
- `cypress/e2e/functional/opal/features/createDraftCasefile/CheckCaseDetails.feature`: updates obsolete setup comments;
  preserves scenario identity, tags, generated-ID assertion and `@retries(0)`.
- `scripts/draft-casefile-cleanup.test.mjs` and `package.json`: 12 deterministic regressions, included in `yarn test`.
- `docs/CYPRESS_E2E_TESTING.md`: current contract, rollout, pipeline selection and failure/recovery limitations.

The existing E2E support installation and session/proxy authentication are retained. No new credentials, token
handling, configured cleanup identity, BU query, body, GET lookup, ETag or If-Match were added. Cleanup leaves Accept
unrestricted; the old JSON-only header produced HTTP 406 with the generated cleanup API.

Receipts contain only a synthetic ID, marker and frontend target. Non-204 statuses fail cleanup and remain in
`functional-output/draft-casefile-cleanup/`; transport errors fail the hook with receipts already written. A crash
before teardown or a lost POST response can still leave an unrecorded draft. Reports must be preserved before reset.
There is no automatic recovery process. CNP already archives `functional-output/**` in dev/staging `afterAlways`.

## Deployment and packaged backend evidence

Inspected on 19 October 2026:

- Backend checkout and PR 302 head: `4f2a9466a9af48cd99f9b13fe63e528a58a98898`, clean branch
  `codex/PO-10273-draft-casefile-cleanup`.
- Published `hmctsprod.azurecr.io/opal/maintenance-service:pr-302` digest:
  `sha256:d1a74e0cdd73af75eddc81c9a4e66e03551dcc8baadc9ea570d8b6ac963ca4ca`.
  Registry update: 16:14:46 UTC / 17:14:46 BST. The downloaded application JAR's 178 application classes match the
  rebuilt local JAR byte-for-byte, including `TestingSupportDraftCasefileController` and `DraftCasefileCleanupService`;
  `application.yaml` also matches and uses `${TESTING_SUPPORT_ENDPOINTS_ENABLED:false}`.
- Existing Maintenance chart dependency `0.0.27` is published. Its package contains Java chart `6.1.1`, environment
  forwarding in the library container template, and `TESTING_SUPPORT_ENDPOINTS_ENABLED: false` in Maintenance base
  values. Keep this compatible dependency; source chart `0.0.28` was not published when checked. A chart version does
  not pin the backend application implementation.
- Local running Maintenance container had `TESTING_SUPPORT_ENDPOINTS_ENABLED=true`; its health endpoint reported UP.

Use the existing frontend PR image selection workflow: labels `enable_keep_helm` and
`enable_opal_maintenance_service:pr-302` select `DEV_OPAL_MAINTENANCE_SERVICE_IMAGE_SUFFIX=pr-302`. Frontend PR 457 did
not have these labels when inspected, so its existing dev selector still defaulted to `latest`. Deployment selector labels were not
changed; committing and pushing the feature branch does not select the backend PR image. Recheck the mutable PR tag/digest at deployment time.

The existing PR image selector is dev-only. Staging needs an explicit verified
`opal-maintenance-service.java.image` deployment override until its normal image contains the implementation.
For both frontend-owned E2E deployments, resolve
`opal-maintenance-service.java.environment.TESTING_SUPPORT_ENDPOINTS_ENABLED=true`. Keep base and production false;
there is no application environment allowlist. No cleanup-specific variables or `OPAL_DEPLOYMENT_ENVIRONMENT` are
needed. Shared Docker inherits `.env.shared`; standalone Maintenance Compose already enables test support.

## Verification

Toolchain: Node 24.19.0 and Corepack Yarn 4.18.1. Local browser: headless Chrome 155 / Cypress 15.21.1.

| Command / check                                               | Result                                                                                                                                                                                                                            |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `corepack yarn prettier`                                      | Pass.                                                                                                                                                                                                                             |
| `corepack yarn lint:ng`                                       | Pass.                                                                                                                                                                                                                             |
| `corepack yarn lint:cypress`                                  | Pass.                                                                                                                                                                                                                             |
| `corepack yarn exec tsc --noEmit --project e2e.tsconfig.json` | Pass.                                                                                                                                                                                                                             |
| `node --test scripts/draft-casefile-cleanup.test.mjs`         | 12 pass, including independent support/feature module instances, early capture, HTTP 400/401/403/404/409/500/503 and transport failure retention.                                                                                 |
| `corepack yarn test`                                          | Final rerun passed: 12 cleanup regressions and 1,854 Angular tests. An earlier concurrent rerun hit an existing 5-second routing-test timeout; no timeout was changed.                                                            |
| `corepack yarn test:coverage`                                 | 1,854 tests passed; application lines 100%, branches 99.90%, statements 99.77%, functions 99.01%. Existing uncovered application branches/functions were not changed. Cypress support is outside configured application coverage. |
| `corepack yarn build`                                         | Pass.                                                                                                                                                                                                                             |
| YAML parse/assertions using installed `js-yaml`               | Base false, dev/staging true, compatible dependency retained.                                                                                                                                                                     |
| `git diff --check`                                            | Pass.                                                                                                                                                                                                                             |

Final live command, using the normal default tag expression and only two bounded spec files:

```sh
env -u TAGS -u CYPRESS_TAGS TEST_URL=http://localhost:5000 corepack yarn test:functional:serial --browser=chrome --spec 'cypress/e2e/functional/opal/features/createDraftCasefile/CheckCaseDetails.feature,cypress/e2e/functional/opal/features/createDraftCasefile/CasefilePermissions.feature'
```

Result: 23 executed, 22 passed, one failed; none pending or skipped. Five controlled review scenarios and all 17
permission routes passed. The live scenario created draft 3, checked HTTP 201/SUBMITTED and the exact persisted marker,
then failed the generated-ID display assertion. Its real `afterEach` cleanup succeeded with 204, leaving an empty
outstanding ledger. Two earlier synthetic drafts created during diagnosis were also removed through the authenticated
hook; a second recovery scenario verified already-absent 204 responses. The temporary recovery feature/steps were
removed. All three local cleanup ledger files are empty. A final read-only count confirmed none of IDs 1, 2 or 3 remain in the local database.

The normal CNP glob `cypress/e2e/functional/opal/**/*.feature` and tags
`not @skip and not @R1CRmCreateCaseFilesOff` include this scenario. Its hook is installed by the shared E2E support
file in local and CI runs. Existing frontend PR labels did not narrow tests. Static pipeline inspection and the local
normal-selection run prove selection, not deployed CI success. Backend Gradle results do not prove frontend E2E.

The passing live permission preflights checked ACTIVE Maintenance membership, BU 44 permission 21 for the creator,
and its absence for the denied account. The live creation journey used Country, Create Casefile Application, Result
and Major Creditor reference data and the enabled create-casefile release. These results establish local readiness
only. Verify the same prerequisites and full SSO in the deployed target.

Reports from diagnostic runs are preserved under `/private/tmp/po-10273-evidence/`; the final local run also remains
under `functional-output/`. These are ignored/local evidence, not committed artifacts.

After restoring cleanup at the user's request, formatting, Angular/Cypress lint, E2E TypeScript checking and
`corepack yarn test` were rerun. The browser results above are from the earlier live verification of this same cleanup
implementation; a new live submission was not repeated solely for restoration.

## Definition of Done and pending evidence

- Scope, configuration, error reporting, regression tests, final diff review and local cleanup: satisfied for this
  support-alignment change. Existing acceptance requirements are preserved.
- **Unmet acceptance:** generated ID must be displayed in confirmation, then the live scenario and journey-clearing
  assertion must pass. Do not represent the ticket or this E2E run as complete.
- Component suite and specialist accessibility checks: not applicable to this delta because no application component,
  template, style, selector, focus behaviour or accessible content changed. Existing accessibility coverage remains.
- Before/after UI screenshots: not applicable because this delta changes test support and deployment configuration.
- Dependency/vulnerability changes: not applicable; no dependency versions, lockfile, exclusions or CVE suppressions
  changed. Existing external security checks are not evidence for unpublished local changes.
- Sonar new application-code coverage: not applicable to this delta (`sonar.sources=src/` is unchanged). No new
  exclusions were introduced. Current external scan and CI results remain pending.
- Helm full render/install: not run; Helm CLI is unavailable. YAML and the published dependency's environment/default
  handling were inspected. Resolve the image and switch in the target deployment before running E2E there.
- Full functional suite, smoke, deployed SSO, deployment settings, production resolved values, QA and reviewer approval:
  unverified/pending. No manual deployment or ticket closure was performed; CI and any pipeline deployment remain unverified.
- Final agent review: repository review guidance applied; no additional blocking defect introduced by this delta was
  found. The existing confirmation acceptance failure is disclosed above.

## Prepared draft PR update

Jira: PO-10273. Enable shared Maintenance test support in frontend-owned dev/staging subcharts while keeping base
false. Align synthetic draft cleanup with the implemented marker/ownership contract, share receipts across Cypress
bundles, persist outstanding receipts and fail on unsuccessful cleanup. Preserve live response capture and acceptance
assertions. Validation is recorded above; the missing confirmation identifier prevents a green live E2E result.

Security Vulnerability Assessment: no new dependency or CVE suppression. No credentials, bearer tokens or participant
payloads are added to source or cleanup artifacts. Authentication and backend permission/ownership/lifecycle checks are
preserved. Production test support remains disabled by base configuration and must remain false in resolved values.
