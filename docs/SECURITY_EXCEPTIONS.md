# Security exceptions

Record approved temporary dependency security exceptions here. Follow the
[dependency security process](DEPENDENCY_SECURITY.md) for investigation, remediation and approval.
Use current audit results and authorised security-alert tracking for the full set of remaining findings.

Keep public entries to published advisory links, affected packages, brief rationale and approval metadata.
Keep sensitive deployment assessments, internal infrastructure details and raw evidence in access-controlled tracking.
An entry records temporary acceptance; remediation remains required.

## Review and expiry

The owner should begin reassessment by the review/expiry date, and earlier when an affected dependency,
its path, the exposure or an available supported fix changes. On reaching the date, rerun the remediation
workflow instead of carrying the acceptance forward unchanged:

1. Read the advisory and capture fresh production and complete dependency audits using the declared toolchain.
   Check current supported fixes in the dependencies that own each affected path.
2. Use `opal-ui-dependency-security` in remediation mode, when available, to attempt supported fixes and
   verify the result. If the skill is unavailable, follow the linked dependency security process directly.
   Keep local plans and evidence in the repository's ignored locations.
3. Remove resolved entries and their matching baseline records only after the audits and affected integration
   checks confirm remediation. If a fix remains blocked, record the current reason and seek fresh approval
   with an owner and a new review/expiry date before extending the exception.

An expired entry is no longer a current approval. Do not silently move its date or regenerate the baseline
to extend acceptance. The audit baseline does not enforce dates automatically; a passing check does not renew
an expired exception. Record reassessment evidence and any new decision in the tracking item.

Suggested agent prompt:

> Use opal-ui-dependency-security in remediation mode for the due entries in docs/SECURITY_EXCEPTIONS.md.
> Follow docs/DEPENDENCY_SECURITY.md. Capture fresh production and complete dependency audits, check
> current supported parent releases, apply supported fixes and verify every affected dependency path.
> Remove verified resolved exceptions and matching baseline entries. Seek fresh approval for anything
> that remains blocked; do not automatically extend dates or accept new findings.
> If the skill is unavailable, follow the dependency security process directly.

## Recorded exceptions

### CVE-2026-54285: OpenTelemetry Core

| Field               | Record                                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Advisory            | [GHSA-8988-4f7v-96qf / CVE-2026-54285](https://github.com/advisories/GHSA-8988-4f7v-96qf)                         |
| Package and scope   | `@opentelemetry/core@1.30.1`, production dependency through `applicationinsights@2.9.8`.                          |
| Reason              | Compatible remediation requires a supported update to the shared telemetry integration.                           |
| Owner and approver  | [@iamfrankiemoran](https://github.com/iamfrankiemoran)                                                            |
| Approved            | 29 October 2026                                                                                                   |
| Review and expiry   | **28 November 2026**                                                                                              |
| Tracking / evidence | [PR #499](https://github.com/hmcts/opal-rm-frontend/pull/499), including the approved disposition and its limits. |

This approval covers the recorded dependency context. Reassess changed versions or paths before carrying it
forward. The remaining development advisories require remediation and are not accepted by this entry.
