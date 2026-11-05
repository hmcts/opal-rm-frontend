# Staging pipeline publication queue

The frontend staging pipeline deploys its own maintenance service and PostgreSQL
database. Its publication messages must not be consumed by the durable staging
maintenance service, which uses a different database.

The staging overlay provisions one Azure Service Operator `NamespacesQueue` named
`<Helm release>-rm-publish-<Jenkins build number>` and gives the bundled backend
the same name. The queue references the existing `opal-servicebus-stg` namespace
by ARM ID. It does not create or take ownership of that Terraform-managed namespace.
The shared connection credentials remain usable for sending and listening on the
new queue. The shared publication queue-name secret is omitted from this overlay.

The queue is disabled in default chart values. Durable deployments continue using
their existing dependencies, and dev PR deployments keep their existing Service
Bus subchart configuration. The chart dependency cannot directly replace this
template: version 1.3.0 requires a Kubernetes namespace owner resource, which Opal
staging does not currently have.

Before staging functional tests, Jenkins waits up to five minutes for the operator
to report the queue Ready. A failed wait fails the stage instead of letting tests
publish to an unprovisioned queue. Queue creation requires the staging operator's
Azure permissions and Jenkins' Kubernetes custom-resource permissions.

Helm uninstall deletes the queue custom resource; the operator's finalizer handles
Azure deletion. No keep annotation or orphan policy is used. Pipeline failure may
retain the release under the shared pipeline's cleanup policy. A new build uses a
new queue name, preventing retained messages from targeting a later test database.

## Verification

With Helm and Python/PyYAML available, fetch the pinned chart dependencies and run:

```sh
helm dependency update charts/opal-rm-frontend
python3 scripts/test-staging-publication-queue.py
```

These checks render the real dependency charts and verify queue/backend name
agreement, per-build isolation, direct namespace reference, and absence of queue
provisioning in the durable configuration. They also render the raw staging values
template, matching the shared pipeline's chart-publication schema validation, and
check that missing or malformed build numbers are rejected. They do not provision
Azure resources.

The shared pipeline validates `values.stg.template.yaml` before environment
substitution. The queue template therefore accepts the exact `${BUILD_NUMBER}`
placeholder as well as numeric build numbers, so validation receives the complete
staging manifests. Jenkins substitutes the actual build number before deployment.
An empty or malformed value still fails rendering; an unsubstituted placeholder
cannot be installed because it is not a valid Kubernetes resource name. There is
no fallback queue name.

The staging pipeline still needs to verify operator permissions, queue Ready,
successful end-to-end publication while durable consumers are active, and Azure
queue deletion after Helm cleanup. A dev PR pipeline alone does not exercise the
staging overlay. Never infer staging verification from a passing dev build.
