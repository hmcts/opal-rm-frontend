# Code Review Guidelines

This document defines the OPAL-specific interpretation and exceptions to apply when reviewing changes in
`opal-rm-frontend`. Use it with the implementation standards in `docs/REPO_GUIDELINES.md` and the repository's
configured review tooling.

## Review objective

- Review the changed code and the behaviour affected by it.
- Report a finding only when the change introduces a concrete correctness, security, accessibility, operational, or
  delivery risk.
- Anchor findings to the smallest relevant changed line range and explain the triggering scenario, impact, and a
  practical correction.
- Do not report pre-existing issues unless the change makes them materially worse.
- Do not report formatting, lint, naming, or stylistic preferences that deterministic checks can enforce.
- Do not treat a preferred implementation pattern as a defect without explaining the resulting failure or risk.

## Severity

- **P0 — critical:** The change could cause widespread or irreversible harm, expose sensitive data, or critically
  compromise the service. It must block merge.
- **P1 — high:** The change can break a supported journey, compromise security or accessibility, corrupt state, or
  prevent safe deployment. It should block merge.
- **P2 — medium:** The change introduces a reproducible defect or material regression with limited impact. It should
  normally be resolved before merge.
- Do not create a finding for optional improvements. Record them separately only when the review request asks for
  advisory feedback.

Severity reflects impact, not the category of the repository rule involved.

## OPAL-specific review checks

### Angular, RxJS, and state

- Flag observable composition only when it can cause stale state, duplicate requests, ordering races, leaked
  subscriptions, repeated side effects, or navigation based on incomplete data.
- Check that state derived from a selected record or route parameter is cleared when that source becomes absent or
  changes.
- Check that form submission cannot be processed more than intended and that request concurrency matches the user
  journey.
- Check nested subscriptions, dependent requests started from `tap()`, and other imperative observable side effects
  when they can cause incomplete navigation state, unhandled failures, duplicate requests, or ordering races.
- Check that imperative subscriptions, timers, event listeners, and retained resources are released with their owner.
- Flag expensive template expressions or change-detection work only when the changed rendering path can create a
  material performance or stability problem.
- Check response caching for defined freshness and invalidation behaviour and for correct user or session isolation.
- Check changed SSR paths for unguarded browser globals or browser-only APIs.

### Security and privacy

- Flag secrets, credentials, tokens, or PII introduced in code, logs, comments, screenshots, fixtures, or tests.
- Examine changed HTML, URL, and style injection sinks, including `bypassSecurityTrust*`, `[innerHTML]`, `[srcdoc]`,
  unsafe URLs, and dynamic styles. Report them when input is insufficiently constrained, sanitised, justified, or
  tested.
- Check for weakened authentication, authorisation, route guards, security headers, or exposure of internal API data.

### Accessibility and design system

- Report changed interactions that are not keyboard operable, lose visible focus, or use non-semantic controls without
  equivalent semantics.
- Report controls without an accessible name, validation errors that are not associated with their controls, and
  state changes that are not understandable to assistive-technology users.
- Report deviations from an established GOV.UK or HMCTS pattern when they create inconsistent behaviour,
  accessibility problems, or a demonstrable user-experience regression.

### Testing and delivery

- Report missing tests when changed behaviour is regression-prone and the existing suite would not detect a likely
  failure. State the behaviour or scenario that needs coverage.
- Check loading, error, empty, validation, and retry behaviour when the change can reach those states.
- Treat failing required checks, TypeScript errors, and production-build failures introduced by the change as
  findings. Do not infer that a check passed without evidence.

## Acceptable exceptions

Do not report the following by themselves:

- Existing Angular modules or legacy template control flow outside the changed implementation.
- An imperative subscription that has a clear lifecycle, cleanup, and ordering model.
- A justified and tested HTML, URL, or style injection mechanism with constrained or sanitised input.
- An established integration that requires a non-preferred Angular pattern.
- A missing test for a mechanical or documentation-only change with no meaningful behavioural regression risk.
- A maintainability preference such as component size, `OnPush`, file suffixes, or container/presentational separation
  without a concrete defect.

## Review output

Order findings by severity. For each finding, include:

- the severity and a concise title;
- the affected file and smallest useful changed line range;
- the concrete triggering scenario;
- the impact; and
- a practical fix or safe alternative.

If no qualifying findings exist, say so explicitly. Keep unverified assumptions and checks that were not run separate
from findings.
