# Cypress release selection

Use this guide to choose the release folder, tags, and runner for OPAL RM Frontend tests. For on-demand and nightly coverage, see [Extended test runs](EXTENDED_TEST_RUNS.md).

## Release folder rules

Release-specific functional and accessibility scenarios live under `features/releaseFlags`. Their confirmed Jira
metadata is `@JIRA-STORY:PO-10606` and `@JIRA-EPIC:PO-10817`, restored from the existing same-scenario assignment in
commit `417cdd022a555cb0713ab26aa128f65e2222826c`. Separately assigned Jira Test identifiers remain unclaimed.

## Running release suites

The `release-1c-rm-create-case-files` flag gates the Cases dashboard and the complete create-casefile journey.
Smoke tests follow the sibling frontend pattern: sign-in must reach an available dashboard before checking sign-out.
They therefore require this release to be enabled. Dedicated flag-off functional scenarios use authentication without
a dashboard assertion and verify Access Denied. Tagged CNP and nightly runs skip smoke tests.

- `@R1CRmCreateCaseFiles` identifies scenarios requiring the flag to be enabled, including existing create-casefile
  functional and accessibility features.
- `@R1CRmCreateCaseFilesOff` identifies scenarios requiring the flag to be disabled.
- Default Cypress, CNP and nightly selections exclude `@skip` and `@R1CRmCreateCaseFilesOff`. The default functional
  suite therefore requires the release to be enabled. Explicit tag selections override this default; tagged pipeline
  runs retain the existing behaviour of skipping smoke tests.

Run the matching suite against an environment already configured for that flag state:

```bash
corepack yarn test:functional:rm-create-case-files
corepack yarn test:functional:rm-create-case-files-off
corepack yarn test:smoke
```

Cypress maps the existing uppercase `TAGS` contract to the lowercase `tags` setting required by Cucumber v26 before
registering the preprocessor. An explicit lowercase `tags` value takes precedence.

The release scripts set both `TAGS` and `CYPRESS_TAGS` to avoid inheriting an incompatible pipeline tag expression.
They do not change LaunchDarkly or application configuration. For local override testing, start the app with
`FEATURE_FLAGS_OVERRIDE=true` and `RELEASE_1C_RM_CREATE_CASE_FILES_ENABLED=true` or `false`. For deployed runs, configure
LaunchDarkly separately. Do not run enabled and disabled functional selections against the same unchanged flag state.

CNP supports the existing `run_tag:@R1CRmCreateCaseFiles` and `run_tag:@R1CRmCreateCaseFilesOff` labels. Nightly supports
the equivalent `TAGS` parameter. No new release selector or automatic flag mutation is introduced.

A Cucumber dry run proves scenario selection and step binding only; it is not evidence of a completed browser
journey or deployed authentication.
