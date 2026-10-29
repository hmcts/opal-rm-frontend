# Dependency security

Use this process to investigate dependency alerts, apply fixes, and record verification evidence.
Follow the [repository standards](REPO_GUIDELINES.md), [contribution rules](CONTRIBUTING.md), and
[Definition of Done](FRONTEND_DEFINITION_OF_DONE.md).

## Sources of truth

Read the configuration and its referenced tooling for the applicable versions, controls, and behaviour:

| Concern                              | Authoritative configuration                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Toolchain and dependency graph       | [.nvmrc](../.nvmrc), [package.json](../package.json), and [yarn.lock](../yarn.lock)                                             |
| Pipeline checks and inherited policy | [Jenkinsfile_CNP](../Jenkinsfile_CNP), [Jenkinsfile_nightly](../Jenkinsfile_nightly), and their referenced shared configuration |
| Dependency update automation         | [.github/renovate.json](../.github/renovate.json), inherited configuration, and repository dependency-alert/update settings     |
| Image contents and build inputs      | [Dockerfile](../Dockerfile) and [.dockerignore](../.dockerignore)                                                               |

Consult inherited configuration and platform settings when assessing coverage. A configured bot or an
open update PR alone does not establish that detection, verification, or remediation is working.

## Investigate and remediate

1. Record the advisory identifier and primary source, affected installed versions, every dependency
   path, production or development scope, application exposure, and available fixes.
2. Reproduce the locked dependency graph using the declared toolchain. Follow the contribution workflow
   and preserve unrelated changes before updating dependencies.
3. Prefer a supported update to the dependency that owns the vulnerable path. Refresh a transitive
   dependency within its existing range where appropriate. Check every affected copy and review
   compatibility before introducing an override, replacement, or major upgrade.
4. Review the manifest and lockfile changes, repeat the scans, and run the verification required by the
   affected behaviour. Confirm that targeted vulnerable versions disappear and inspect new findings.
5. Record the before-and-after versions and paths, exact commands and results, and remaining work with
   the change evidence.

For a failing dependency PR, inspect the checks and first useful error for its current revision.
Distinguish vulnerability findings, scanner failures, compatibility problems, and unrelated failures
before choosing a remedy.

## Interpret security checks

Cover production dependencies and the complete dependency graph, including build and test tools.
Assess the deployed artifact as well as dependency classifications in the manifest.

Retain raw reports, stderr, exit statuses, revision and toolchain information with the verification
evidence. Validate report contents and scan completion together. Empty, malformed, unexpected, or
incomplete reports and authentication, registry, network, or parser errors must be treated as failed
scans. A failed scan is never evidence of no vulnerabilities.

Distinguish deprecations and other maintenance notices from security advisories. Preserve the applicable
security thresholds and reporting requirements; do not weaken enforcement to clear a failing check.

## Exceptions and suppressions

Record approved temporary exceptions in the public [security exception register](SECURITY_EXCEPTIONS.md).
Follow its review and expiry workflow to reassess due entries, including the suggested skill prompt.

Apply supported fixes before proposing a temporary exception. Record the advisory, affected package,
versions and paths, exposure, rationale, mitigating controls, owner, approver, tracking reference, and
review or expiry date through the established approval process. Missing approval remains outstanding.

Any suppression or baseline change must be individually justified and reviewed. Remove resolved records
and reassess changed versions or paths. Never replace a baseline with an entire scan report merely to
make a check pass. Preserve the unsuppressed findings as evidence.

## Validate and hand over

Follow the applicable repository verification guides. For runtime changes, verify the actual artifact's
contents, required modules and configuration, startup, and affected integrations. Check that local
secrets, host files, and unnecessary build or test tools are excluded. Scan the exact artifact intended
for release and record its identifier and results.

Record checks that could not run, their required setup and expected outcomes, remaining findings, and
required follow-up. Keep review, CI, QA, environment verification, and deployment pending until direct
evidence confirms them. Investigation history and change-specific proposals belong with the delivery
evidence rather than this runbook.

Changes to inherited enforcement or automation policy must follow the owning team's process. Preserve
existing controls and reporting until a supported replacement has been verified.
