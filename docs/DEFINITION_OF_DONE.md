# Frontend UI Definition of Done

This document separates the agent completion gate from the human and external gates required for a Frontend UI ticket to be Done.

Detailed implementation standards are in `docs/REPO_GUIDELINES.md`. Branch, commit, pull request, evidence, review, and QA procedures are in `docs/CONTRIBUTING.md`.

## Agent completion: Ready for human review

A Frontend UI ticket is **Ready for human review** only when every applicable criterion below is satisfied.

### Scope and correctness

- [ ] Every applicable ticket Acceptance Criterion is implemented.
- [ ] Every Acceptance Criterion is mapped to its implementation and verification evidence.
- [ ] The implemented behaviour matches the approved ticket scope.
- [ ] Applicable success, validation, loading, empty, error, permission, and navigation states are handled.
- [ ] No known blocking functional defect remains.

### Code and supporting artefacts

- [ ] The final change contains only intended, ticket-related modifications.
- [ ] Unrelated pre-existing changes have been preserved.
- [ ] Required automated tests are present and updated for the changed behaviour.
- [ ] Documentation, configuration, and feature-flag definitions affected by the change are current.
- [ ] No temporary code, debugging output, obsolete comments, or unintended generated files remain.

### Verification

- [ ] All agent-executable checks required by the repository pass against the final change.
- [ ] Verification evidence records the commands executed and their results.
- [ ] Every applicable Acceptance Criterion has automated or manual verification evidence.
- [ ] No failed required check remains unresolved.
- [ ] Checks that require a human, unavailable environment, specialist tooling, account, or permission are listed with:
  - The scenario to verify.
  - The required setup.
  - The expected result.

### Accessibility

- [ ] All agent-executable accessibility checks applicable to the changed UI pass.
- [ ] No known blocking accessibility issue remains.
- [ ] Accessibility checks not executable by the agent are included in the human verification instructions.
- [ ] Automated accessibility results are identified as partial evidence and are not represented as proof of full WCAG 2.2 AA compliance.

### Security and privacy

- [ ] The final change contains no exposed secret, credential, token, PII, or unintended sensitive information.
- [ ] No unjustified unsafe HTML, URL, dynamic-content, or logging mechanism has been introduced.
- [ ] Applicable dependency and vulnerability checks pass.
- [ ] Every security exception or vulnerability suppression is documented with its reason and mitigating controls.
- [ ] No known blocking security or privacy issue remains.

### Review readiness

- [ ] The final change has completed the repository-required agent review.
- [ ] All blocking review findings are resolved.
- [ ] Verification affected by review changes has been repeated.
- [ ] Remaining non-blocking findings, limitations, assumptions, and follow-up work are disclosed.
- [ ] Before-and-after screenshots are available for applicable visible UI changes.

### Handoff package

- [ ] A change summary is provided.
- [ ] Materially changed files and their purposes are identified.
- [ ] Acceptance Criteria-to-evidence mapping is provided.
- [ ] Verification commands and results are provided.
- [ ] Accessibility and security evidence is provided.
- [ ] Human-only verification instructions are provided.
- [ ] Known limitations and non-blocking follow-ups are provided.
- [ ] Required draft PR content and Security Vulnerability Assessment are prepared.

### Agent completion condition

The agent may report **Ready for human review** only when every applicable agent criterion is satisfied.

An item may be marked **Not applicable** only with a recorded reason. An agent-executable requirement cannot be deferred to a human.

If an applicable item is unsatisfied, the work is **not Agent Complete**. The handoff must identify the unmet criterion and what is required to resolve it.

## Human and external completion gates

A Frontend UI ticket is **Done** only after Agent Complete work also satisfies every applicable gate below:

- [ ] A pull request has been raised and completed in accordance with `docs/CONTRIBUTING.md`.
- [ ] The PR is approved by at least two reviewers.
- [ ] Reviewers confirm the Acceptance Criteria, testing evidence, accessibility, project-pattern compliance, and absence of avoidable regressions.
- [ ] QA recommendations and Acceptance Criteria are verified, with QA sign-off obtained where required.
- [ ] Required CI pipeline checks pass.
- [ ] Required configuration and feature-flag changes are documented and in place for release.
- [ ] The change is verified in the relevant environment.
- [ ] No known critical or blocking defect remains open against the ticket.
- [ ] Required documentation and any whole-journey or whole-feature LLD update are complete.
- [ ] Required merge, release, deployment, and ticket-closure activities are complete.

An agent must report these gates as pending unless direct, current evidence confirms completion. **Implementation complete**, **Locally verified**, and **Ready for human review** must not be represented as **Done**.
