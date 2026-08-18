# Opal Maintenance Service Integration Design

## Objective

Replace the frontend's `opal-rm-service` integration with `opal-maintenance-service`. The sibling
`../opal-maintenance-service` checkout is the source of truth for the service's current runtime and Helm configuration.

## Scope

The migration covers every active `opal-rm-service` integration point in this repository:

- Express proxy configuration and route naming
- Node Config defaults and environment-variable mappings
- Helm dependency, base values, and development/staging values templates
- Jenkins development and nightly deployment variables and PR-label handling
- Cypress API path recognition
- server configuration unit tests
- local-development and runtime documentation

The frontend's own `opal-rm-frontend` identity and RM-related feature-flag names are not service integration references and
will remain unchanged.

## Service Configuration

Use the maintenance service's checked-in configuration:

- local application port: `4551`
- Helm dependency: `opal-maintenance-service` version `0.0.17`
- container image: `hmctsprod.azurecr.io/opal/maintenance-service`
- proxy path: `/opal-maintenance-service`
- environment variable: `OPAL_MAINTENANCE_SERVICE_API_URL`
- database variables: `OPAL_MAINTENANCE_DB_*`
- database name and user: `opal-maintenance-db` and `opal-maintenance`
- default deployed ingress: the internal `opal-maintenance-service-<environment>` core-compute hostname defined by the
  maintenance chart

Development preview deployments will use a dedicated aliased PostgreSQL dependency. This prevents maintenance migrations
from sharing the fines-service database and replaces the database dependency that was previously supplied transitively by
the RM service chart.

## Proxy Compatibility

`@hmcts/opal-frontend-common-node` currently defines `ProxyConfiguration` with `opalRmServiceUrl` and has no maintenance
equivalent. Keep that shared field and populate it from the new `opal-api.opal-maintenance-service` configuration value. The
field is an internal compatibility detail and can carry the maintenance service URL without introducing a repository-local
type or requiring an upstream package change and release.

The old `/opal-rm-service` frontend proxy path will not be retained because the requested integration is a complete service
replacement rather than a backward-compatible backend retarget.

## Deployment Behaviour

Development and nightly pipelines will use maintenance-named enable, URL, and image-suffix variables. The existing optional
PR-label image override will become `enable_opal_maintenance_service[:<image-tag>]`. Development preview hostnames and Helm
release names will use `maintenance-service` consistently.

Staging values will address the maintenance subchart by its Helm release name and configure a dedicated ephemeral
maintenance PostgreSQL dependency. Base environment values will use the maintenance service's internal ingress convention.

## Verification

- Add or update server unit assertions so the maintenance URL and proxy route fail before the implementation and pass after
  it.
- Search tracked files to ensure no active `opal-rm-service`, `OPAL_RM_SERVICE`, or RM deployment-variable references remain.
- Run the focused server unit spec, formatting checks for changed supported files, Angular linting, and a production build.
- Render/lint the Helm chart where the repository toolchain makes that available; otherwise document that CI deployment
  validation remains pending.
- Review the final diff for focused scope, configuration consistency, security, and accidental dependency or lockfile
  changes.

## Non-goals

- Renaming the `opal-rm-frontend` application or repository
- Renaming business feature flags containing `rm`
- Changing maintenance-service source code
- Publishing a new frontend-common-node package
- Changing unrelated dependencies or generated lock files
