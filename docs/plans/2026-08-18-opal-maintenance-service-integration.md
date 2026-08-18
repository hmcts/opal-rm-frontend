# Opal Maintenance Service Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every active `opal-rm-service` integration in `opal-rm-frontend` with a correctly configured
`opal-maintenance-service` integration.

**Architecture:** Preserve the shared `ProxyConfiguration.opalRmServiceUrl` field as an internal compatibility detail, but
source it from maintenance-service configuration and expose the proxy at `/opal-maintenance-service`. Replace the deployed
Helm subchart, preview/staging pipeline wiring, API path recognition, and documentation using the sibling maintenance
repository's port, chart, image, ingress, and database settings.

**Tech Stack:** Angular 21 SSR, TypeScript 6, Vitest, Node Config, Cypress 15, Helm 3 YAML, Jenkins Groovy, Yarn 4.

## Global Constraints

- Use Node `24.19.0` from `.nvmrc` and Yarn `4.18.0` from `package.json#packageManager` through Corepack.
- Preserve `ProxyConfiguration.opalRmServiceUrl`; do not change `@hmcts/opal-frontend-common-node` or dependency files.
- Use local port `4551`, Helm chart `opal-maintenance-service` version `0.0.17`, and image
  `hmctsprod.azurecr.io/opal/maintenance-service` from `../opal-maintenance-service`.
- Use `OPAL_MAINTENANCE_SERVICE_API_URL` for the frontend service URL and `OPAL_MAINTENANCE_DB_*` for preview database
  configuration.
- Keep `opal-rm-frontend` application identity and RM business feature-flag names unchanged.
- Do not retain `/opal-rm-service` as a compatibility route.
- Do not change `package.json`, `yarn.lock`, or unrelated dependencies.

---

### Task 1: Route the SSR proxy to Opal Maintenance Service

**Files:**

- Modify: `server-setup.spec.ts:25-65`
- Modify: `server-setup.ts:39-45,103-108`
- Modify: `config/default.json:7-12`
- Modify: `config/custom-environment-variables.json:3-9`
- Modify: `angular.json:161`
- Modify: `tsconfig.spec.json:4-12`

**Interfaces:**

- Consumes: shared `ProxyConfiguration` with `opalRmServiceUrl: string | null`.
- Produces: `getRoutesConfig().proxyConfiguration.opalRmServiceUrl` sourced from
  `opal-api.opal-maintenance-service`, plus Express route `/opal-maintenance-service`.

- [ ] **Step 1: Write the failing server configuration assertions**

Update the existing assertions and fixture without renaming the shared field:

```typescript
expect(routesConfig.proxyConfiguration.opalRmServiceUrl).toBe('http://localhost:4551');

const proxyConfiguration = {
  opalApiUrl: 'http://legacy-opal-api',
  opalFinesServiceUrl: 'http://opal-fines-service',
  opalUserServiceUrl: 'http://opal-user-service',
  opalRmServiceUrl: 'http://opal-maintenance-service',
} as Parameters<typeof configureApiProxyRoutes>[1] & { opalApiUrl: string };

expect(app.use).toHaveBeenCalledWith('/opal-maintenance-service', expect.any(Function));
```

- [ ] **Step 2: Run the server assertions directly and confirm the red state**

Run:

```bash
yarn exec vitest run server-setup.spec.ts
```

Expected: FAIL because the current default is `http://localhost:4556` and the current Express route is
`/opal-rm-service`.

- [ ] **Step 3: Change the Node Config service key and environment variable**

In `config/default.json`, replace the backend entry with:

```json
"opal-maintenance-service": "http://localhost:4551"
```

In `config/custom-environment-variables.json`, replace the backend mapping with:

```json
"opal-maintenance-service": "OPAL_MAINTENANCE_SERVICE_API_URL"
```

- [ ] **Step 4: Point the shared proxy field at maintenance configuration and route**

Keep the shared field name and change only its source and route:

```typescript
const proxyConfiguration: ProxyConfiguration = {
  ...DEFAULT_PROXY_CONFIG,
  opalFinesServiceUrl: config.get('opal-api.opal-fines-service'),
  opalUserServiceUrl: config.get('opal-api.opal-user-service'),
  opalRmServiceUrl: config.get('opal-api.opal-maintenance-service'),
  timeoutInMilliseconds: config.get('opal-api.timeoutInMilliseconds'),
};
```

```typescript
if (proxyConfiguration.opalRmServiceUrl) {
  app.use(
    '/opal-maintenance-service',
    OpalApiProxy(proxyConfiguration.opalRmServiceUrl, ipLoggingEnabled, proxyConfiguration.timeoutInMilliseconds),
  );
}
```

- [ ] **Step 5: Include and type-check the root server spec in the Angular test target**

In `angular.json`, update the test target include list to:

```json
"include": ["src/**/*.spec.ts", "../server-setup.spec.ts"]
```

In `tsconfig.spec.json`, set the test program root and include the root server spec:

```json
"compilerOptions": {
  "rootDir": "."
},
"include": ["src/**/*.spec.ts", "server-setup.spec.ts", "src/test-setup.ts", "src/**/*.d.ts"]
```

- [ ] **Step 6: Run the focused supported spec and confirm the green state**

Run:

```bash
yarn test --include=../server-setup.spec.ts
```

Expected: PASS with **1 test file and 3/3 tests** successful.

- [ ] **Step 7: Run the complete supported suite and confirm the green state**

Run:

```bash
yarn test
```

Expected: PASS with **11 test files and 67/67 tests** successful, preserving the existing 64 tests and executing the 3
server assertions.

- [ ] **Step 8: Commit the proxy migration**

```bash
git add server-setup.spec.ts server-setup.ts config/default.json config/custom-environment-variables.json
git commit -m "fix: proxy opal maintenance service"
```

This is the implementation commit `a6f49e6`.

- [ ] **Step 9: Commit the test-discovery configuration separately**

```bash
git add angular.json tsconfig.spec.json
git commit -m "test: include server setup spec in Angular test target"
```

This is the subsequent test-discovery commit `1efa614`; do not amend, squash, or otherwise rewrite the implementation
commit.

---

### Task 2: Replace the Helm service dependency and preview database

**Files:**

- Modify: `charts/opal-rm-frontend/Chart.yaml:17-32`
- Modify: `charts/opal-rm-frontend/values.yaml:18-57`
- Modify: `charts/opal-rm-frontend/values.dev.template.yaml:12-143`
- Modify: `charts/opal-rm-frontend/values.stg.template.yaml:5-80`

**Interfaces:**

- Consumes: maintenance chart values from `../opal-maintenance-service/charts/opal-maintenance-service`.
- Produces: Helm dependency `opal-maintenance-service`, URL variable `OPAL_MAINTENANCE_SERVICE_API_URL`, and an isolated
  `opal-maintenance-postgresql` dependency for preview/staging migrations.

- [ ] **Step 1: Run the deployment-reference check and confirm the red state**

Run:

```bash
if rg -n 'opal-rm-service|OPAL_RM_SERVICE' charts/opal-rm-frontend; then exit 1; fi
```

Expected: FAIL after printing the existing RM chart dependency, values, and environment-variable references.

- [ ] **Step 2: Replace and extend the chart dependencies**

Keep the existing fines PostgreSQL dependency and add a second aliased database dependency for maintenance. Replace the RM
dependency with:

```yaml
  - name: postgresql
    alias: opal-maintenance-postgresql
    version: 18.8.7
    repository: "oci://registry-1.docker.io/bitnamicharts"
    condition: opal-maintenance-postgresql.enabled
  - name: opal-maintenance-service
    version: 0.0.17
    repository: "oci://hmctsprod.azurecr.io/helm"
    condition: opal-maintenance-service.enabled
```

- [ ] **Step 3: Update the base Helm values**

Set the frontend environment URL from the maintenance chart's ingress convention:

```yaml
OPAL_MAINTENANCE_SERVICE_API_URL: https://opal-maintenance-service-{{ .Values.global.environment }}.service.core-compute-{{ .Values.global.environment }}.internal
```

Replace the disabled RM service with these disabled dependencies:

```yaml
opal-maintenance-service:
  enabled: false

opal-maintenance-postgresql:
  enabled: false
  image:
    registry: hmctsprod.azurecr.io
    repository: imported/bitnami/postgresql
    tag: "17.5.0"
```

- [ ] **Step 4: Configure development preview values**

Set the frontend URL variable:

```yaml
OPAL_MAINTENANCE_SERVICE_API_URL: ${DEV_OPAL_MAINTENANCE_SERVICE_URL}
```

Replace the RM subchart block with:

```yaml
opal-maintenance-service:
  enabled: ${DEV_ENABLE_OPAL_MAINTENANCE_SERVICE}
  java:
    image: 'hmctsprod.azurecr.io/opal/maintenance-service:${DEV_OPAL_MAINTENANCE_SERVICE_IMAGE_SUFFIX}'
    ingressHost: "opal-rm-frontend-pr-${CHANGE_ID}-maintenance-service.dev.platform.hmcts.net"
    imagePullPolicy: Always
    keyVaults:
      opal:
        secrets:
          - name: app-insights-connection-string
            alias: app-insights-connection-string
    environment:
      OPAL_MAINTENANCE_DB_HOST: "${SERVICE_NAME}-maintenance-postgresql"
      OPAL_MAINTENANCE_DB_NAME: "opal-maintenance-db"
      OPAL_MAINTENANCE_DB_USERNAME: "opal-maintenance"
      OPAL_MAINTENANCE_DB_PASSWORD: "opal-maintenance"
      OPAL_MAINTENANCE_DB_PORT: "5432"
      OPAL_MAINTENANCE_DB_OPTIONS: "?stringtype=unspecified"
      RUN_DB_MIGRATION_ON_STARTUP: true
      FLYWAY_LOCATIONS: classpath:db/migration/ddl, classpath:db/migration/data/allEnvs, classpath:db/migration/data/nle, classpath:db/migration/data/dev
      APPLICATIONINSIGHTS_ROLE_NAME: "opal-rm-frontend-pr-${CHANGE_ID}-maintenance-service"
opal-maintenance-postgresql:
  enabled: ${DEV_ENABLE_OPAL_MAINTENANCE_SERVICE}
  fullnameOverride: ${SERVICE_NAME}-maintenance-postgresql
  auth:
    username: opal-maintenance
    password: opal-maintenance
    database: opal-maintenance-db
  primary:
    persistence:
      enabled: false
    resourcesPreset: small
```

- [ ] **Step 5: Configure staging values**

Set the frontend URL to the Helm dependency's in-cluster service:

```yaml
OPAL_MAINTENANCE_SERVICE_API_URL: http://${SERVICE_NAME}-opal-maintenance-service
```

Replace the RM block and add its isolated database:

```yaml
opal-maintenance-service:
  enabled: true
  java:
    ingressHost: opal-maintenance-service-${SERVICE_FQDN}
    imagePullPolicy: Always
    keyVaults:
      opal:
        secrets:
          - name: app-insights-connection-string
            alias: app-insights-connection-string
    environment:
      OPAL_MAINTENANCE_DB_HOST: "${SERVICE_NAME}-maintenance-postgresql"
      OPAL_MAINTENANCE_DB_NAME: "opal-maintenance-db"
      OPAL_MAINTENANCE_DB_USERNAME: "opal-maintenance"
      OPAL_MAINTENANCE_DB_PASSWORD: "opal-maintenance"
      OPAL_MAINTENANCE_DB_PORT: "5432"
      OPAL_MAINTENANCE_DB_OPTIONS: "?stringtype=unspecified"
      RUN_DB_MIGRATION_ON_STARTUP: true
      FLYWAY_LOCATIONS: classpath:db/migration/ddl, classpath:db/migration/data/allEnvs, classpath:db/migration/data/nle, classpath:db/migration/data/stg
opal-maintenance-postgresql:
  enabled: true
  fullnameOverride: ${SERVICE_NAME}-maintenance-postgresql
  auth:
    username: opal-maintenance
    password: opal-maintenance
    database: opal-maintenance-db
  primary:
    persistence:
      enabled: false
    resourcesPreset: small
```

- [ ] **Step 6: Parse every changed YAML file and confirm the reference check is green**

Run:

```bash
ruby -e "require 'yaml'; ARGV.each { |file| YAML.safe_load(File.read(file), aliases: true); puts \"parsed #{file}\" }" charts/opal-rm-frontend/Chart.yaml charts/opal-rm-frontend/values.yaml charts/opal-rm-frontend/values.dev.template.yaml charts/opal-rm-frontend/values.stg.template.yaml
if rg -n 'opal-rm-service|OPAL_RM_SERVICE' charts/opal-rm-frontend; then exit 1; fi
rg -n 'opal-maintenance-service|OPAL_MAINTENANCE_SERVICE' charts/opal-rm-frontend
```

Expected: Ruby prints one `parsed` line per file, the old-reference check returns no matches, and the final search prints all
new maintenance references.

- [ ] **Step 7: Commit the Helm migration**

```bash
git add charts/opal-rm-frontend/Chart.yaml charts/opal-rm-frontend/values.yaml charts/opal-rm-frontend/values.dev.template.yaml charts/opal-rm-frontend/values.stg.template.yaml
git commit -m "fix: deploy opal maintenance service"
```

---

### Task 3: Rename pipeline deployment controls

**Files:**

- Modify: `Jenkinsfile_CNP:346-379`
- Modify: `Jenkinsfile_nightly:638-646`

**Interfaces:**

- Consumes: development values placeholders `DEV_ENABLE_OPAL_MAINTENANCE_SERVICE`,
  `DEV_OPAL_MAINTENANCE_SERVICE_URL`, and `DEV_OPAL_MAINTENANCE_SERVICE_IMAGE_SUFFIX` from Task 2.
- Produces: default preview/nightly values and PR label `enable_opal_maintenance_service[:<image-tag>]`.

- [ ] **Step 1: Run the pipeline-reference check and confirm the red state**

Run:

```bash
if rg -n 'opal_rm_service|OPAL_RM_SERVICE|Opal RM service|dev rm service' Jenkinsfile_CNP Jenkinsfile_nightly; then exit 1; fi
```

Expected: FAIL after listing existing RM variables, label matching, comments, and log output.

- [ ] **Step 2: Update development deployment defaults and label handling**

Use these maintenance defaults:

```groovy
env.DEV_ENABLE_OPAL_MAINTENANCE_SERVICE = true
env.DEV_OPAL_MAINTENANCE_SERVICE_URL =
  "https://opal-rm-frontend-pr-${env.CHANGE_ID}-maintenance-service.dev.platform.hmcts.net"
env.DEV_OPAL_MAINTENANCE_SERVICE_IMAGE_SUFFIX = 'latest'
```

Replace the label block with:

```groovy
// Maintenance service
if (label ==~ /enable_opal_maintenance_service.*/) {
    env.DEV_ENABLE_OPAL_MAINTENANCE_SERVICE = true
    env.DEV_OPAL_MAINTENANCE_SERVICE_URL =
      "https://opal-rm-frontend-pr-${env.CHANGE_ID}-maintenance-service.dev.platform.hmcts.net"
    if (label ==~ /enable_opal_maintenance_service:pr-.*/) {
        env.DEV_OPAL_MAINTENANCE_SERVICE_IMAGE_SUFFIX =
          label.replace('enable_opal_maintenance_service:', '')
    }
    echo "Deploying Opal maintenance service ${env.DEV_OPAL_MAINTENANCE_SERVICE_URL}"
}
```

Also change the function comment to `// Configure PR env deployment for dev maintenance service`.

- [ ] **Step 3: Update nightly values**

Use the maintenance chart's staging ingress:

```groovy
env.DEV_ENABLE_OPAL_MAINTENANCE_SERVICE = true
env.DEV_OPAL_MAINTENANCE_SERVICE_URL =
  'https://opal-maintenance-service-staging.service.core-compute-staging.internal'
env.DEV_OPAL_MAINTENANCE_SERVICE_IMAGE_SUFFIX = 'latest'
```

- [ ] **Step 4: Confirm the pipeline-reference check is green**

Run:

```bash
if rg -n 'opal_rm_service|OPAL_RM_SERVICE|Opal RM service|dev rm service' Jenkinsfile_CNP Jenkinsfile_nightly; then exit 1; fi
rg -n 'opal_maintenance_service|OPAL_MAINTENANCE_SERVICE|Opal maintenance service|dev maintenance service' Jenkinsfile_CNP Jenkinsfile_nightly
```

Expected: the old-reference check returns no matches and the new-reference search prints all maintenance deployment controls.

- [ ] **Step 5: Commit the pipeline migration**

```bash
git add Jenkinsfile_CNP Jenkinsfile_nightly
git commit -m "ci: deploy opal maintenance service"
```

---

### Task 4: Update Cypress routing and developer documentation

**Files:**

- Modify: `cypress/support/commands.ts:12`
- Modify: `README.md:7,60-75,132,172`

**Interfaces:**

- Consumes: public proxy path `/opal-maintenance-service` from Task 1.
- Produces: Cypress request normalization for maintenance API calls and accurate local setup documentation.

- [ ] **Step 1: Update the Cypress API path prefix**

Use:

```typescript
const OPAL_API_PATH_PREFIXES = ['/opal-fines-service', '/opal-user-service', '/opal-maintenance-service'];
```

- [ ] **Step 2: Update README service references**

Make these exact content changes:

- Replace the backend link with `[opal-maintenance-service](https://github.com/hmcts/opal-maintenance-service)`.
- Replace the sibling tree entry `opal-rm-service/` with `opal-maintenance-service/`.
- Tell developers to clone and run `opal-maintenance-service` for local maintenance API requests.
- State that `opal-logging-service` is required by `opal-fines-service`; do not claim that maintenance service requires it.
- Replace both SSR runtime notes so they require `opal-maintenance-service` and `opal-fines-service`, preserving the missing
  space correction before “to also be running” in the production note.

- [ ] **Step 3: Run focused formatting and Cypress lint checks**

Run:

```bash
yarn exec prettier --check server-setup.ts server-setup.spec.ts cypress/support/commands.ts
yarn lint:cypress
```

Expected: both commands exit 0 with no formatting or lint errors.

- [ ] **Step 4: Verify active old service references are gone**

Run:

```bash
if rg -n 'opal-rm-service|OPAL_RM_SERVICE|opal_rm_service' README.md server-setup.ts server-setup.spec.ts config charts/opal-rm-frontend Jenkinsfile_CNP Jenkinsfile_nightly cypress/support/commands.ts; then exit 1; fi
rg -n 'opal-maintenance-service|OPAL_MAINTENANCE_SERVICE|opal_maintenance_service' README.md server-setup.ts server-setup.spec.ts config charts/opal-rm-frontend Jenkinsfile_CNP Jenkinsfile_nightly cypress/support/commands.ts
```

Expected: the first command returns no matches and the second prints the replacement integration across every active layer.

- [ ] **Step 5: Commit Cypress and documentation changes**

```bash
git add cypress/support/commands.ts README.md
git commit -m "docs: reference opal maintenance service"
```

---

### Task 5: Verify and review the complete migration

**Files:**

- Review: all files changed from `master...HEAD`
- Do not modify: `package.json`, `yarn.lock`, or unrelated files

**Interfaces:**

- Consumes: Tasks 1-4.
- Produces: fresh verification evidence and a focused PR-ready diff.

- [ ] **Step 1: Run the complete unit suite**

Run:

```bash
yarn test
```

Expected: exit 0 with zero failed tests.

- [ ] **Step 2: Run repository formatting and lint checks**

Run:

```bash
yarn prettier
yarn lint:ng
yarn lint:cypress
```

Expected: each command exits 0 with zero errors.

- [ ] **Step 3: Build the production application**

Run:

```bash
yarn build
```

Expected: exit 0 and Angular reports a successful production bundle.

- [ ] **Step 4: Re-parse Helm YAML and repeat the migration scan**

Run:

```bash
ruby -e "require 'yaml'; ARGV.each { |file| YAML.safe_load(File.read(file), aliases: true); puts \"parsed #{file}\" }" charts/opal-rm-frontend/Chart.yaml charts/opal-rm-frontend/values.yaml charts/opal-rm-frontend/values.dev.template.yaml charts/opal-rm-frontend/values.stg.template.yaml
if rg -n 'opal-rm-service|OPAL_RM_SERVICE|opal_rm_service' README.md server-setup.ts server-setup.spec.ts config charts/opal-rm-frontend Jenkinsfile_CNP Jenkinsfile_nightly cypress/support/commands.ts; then exit 1; fi
```

Expected: all YAML files parse and the active integration scan returns no old service references. Helm rendering remains CI
validation because Helm is not installed in the current workspace.

- [ ] **Step 5: Review the final Git diff and workspace state**

Run:

```bash
git diff --check master...HEAD
git diff --stat master...HEAD
git diff master...HEAD
git status --short
```

Expected: no whitespace errors; only the approved design/plan and scoped integration files are changed; no secrets, PII,
package changes, lockfile changes, or unrelated modifications are present; the worktree is clean after commits.

- [ ] **Step 6: Prepare the PR evidence**

Record the exact results of Tasks 1-5 in the repository PR template. Mark CVE suppression “No”, accessibility “considered;
no UI changed”, breaking changes as the proxy/config/deployment rename, Helm rendering as pending CI validation, and reviewer
approval/QA/CI/deployment as pending.
