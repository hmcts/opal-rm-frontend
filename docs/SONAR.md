# Sonar quality guidance

Use this guide for new or materially changed frontend journeys and when remediating Sonar findings. It supplements
the repository standards in [REPO_GUIDELINES.md](REPO_GUIDELINES.md); the externally configured Sonar analysis is the
definitive source for Quality Gate status.

## Quality gates

- Duplicated lines on New Code must be strictly below 3%.
- Coverage on New Code must meet the configured gate; aim for 100% meaningful coverage.
- Overall metrics are improvement signals, not permission to refactor unrelated code.

Meaningful coverage proves observable behaviour and important paths, including business rules, validation, state
transitions, transformations, and error handling. Do not add tests that merely execute lines to improve a metric.

## Form identifiers

Use one `create_casefile_<page-or-entity>_<field>` value for the reactive-form key and DOM ID/name. This canonical
identifier keeps the control, its validation and its accessible error target aligned. Saved domain models remain
independently named and are populated by mappers at the form-to-domain boundary.

### Canonical field example

Before:
`applicant_main_email_address`

After on Applicant Individual:
`create_casefile_applicant_individual_main_email_address`

After on Applicant Organisation:
`create_casefile_applicant_organisation_main_email_address`

Use the same value as the reactive-form key, input ID, input name, error-map key, error-summary target, and automated
selector. Saved domain models remain independently named and are populated by mappers.

## Preventing duplication

Extract repeated domain sections, pure mapping, and cohesive typed parameter objects. Keep GOV.UK markup explicit.
Favour a journey-local extraction over a broad shared abstraction unless there is a stable, demonstrated reuse
boundary.

### Cohesive mapper parameters

Do not pass each address field positionally. Pass one typed address-source object to a pure address mapper so call sites
name every value and changes to the address contract happen once.

### Form-section extraction

When two journey pages repeat a GOV.UK section with the same control order and behaviour, create a journey-local nested
form component. Pass the parent form, errors, typed field names, and section-specific options. Keep validation,
submission, persistence, and navigation in the parent.

## Prohibited shortcuts

Do not change thresholds, add broad exclusions, suppress valid findings, cosmetically reorder code, or add
assertion-free tests. Do not weaken or avoid measurement to make a gate pass; fix the underlying maintainability,
duplication, or behaviour-coverage issue instead. Never game Sonar metrics. Any narrowly justified exclusion or
remaining coverage gap must be recorded in the PR with its affected behaviour or code, risk, rationale, and
alternative verification.

## Verification

Run formatting, lint, unit tests, coverage, component tests, and build locally. Treat the external Sonar scan as
definitive. Follow [CYPRESS_COMPONENT_TESTING.md](CYPRESS_COMPONENT_TESTING.md) for component-test workflow and
execution details.

### Local pre-flight

Run:
`corepack yarn prettier`
`corepack yarn lint:ng`
`corepack yarn lint:cypress`
`corepack yarn test`
`corepack yarn test:coverage`
`corepack yarn test:component`
`corepack yarn build`

Inspect `coverage/index.html` for uncovered behaviour. A local pass does not prove the external Sonar Quality Gate;
record the branch analysis result separately.
