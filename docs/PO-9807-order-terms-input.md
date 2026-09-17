# PO-9807 order term input

The Create Draft Casefile journey reads mocked MAT and MCHILD Result details before activating the order term input page. Metadata supplies field order, labels, requiredness, hints and supported constraints. Failed or unusable metadata prevents activation and uses the shared error banner; actual HTTP failures retain shared interceptor reporting.

Payment frequency is inherited from Order Details and displayed only when the Result includes the frequency parameter. It is never stored per term. Raw editable values and accepted canonical terms are retained separately in memory. Continue validates and adds one local term; Cancel invokes the established unsaved-change guard and discards only the cancelled draft. Reload or confirmed journey departure clears in-memory state.

## Mock contract

OpalMaintenanceService.getResults and getResult remain cold mocked Observables. The detail wrapper uses result_id, result_title, active, order_term and a JSON-string result_parameters array. Supported kinds are money/decimal, integer, text, long_text, date, radio, select/menu, autocomplete and checkbox. The frequency select/menu is inherited text. Provisional extensions are readonly, precision: 2 and date_rule: past. language_dependent must be false. Only mock:order-term-options is an allowed synthetic lookup source. Unknown types, keys, conditional rules and arbitrary URLs fail safely.

Text bounds describe length, integer/money bounds describe value, and menu bounds never constrain option IDs. Date lower 0 and upper No Limit are unbounded sentinels. Canonical dates are ISO strings, integers are safe numbers, money is a normalized two-decimal string, and choices are controlled IDs. Blank optional values are omitted. This is a local model, not a final backend Result Responses contract.

Autocomplete suggestions use a journey-local adapter over the existing accessible-autocomplete dependency to escape metadata labels at the suggestion HTML boundary. Selection on blur is disabled. A separate in-memory confirmation map distinguishes a selected option from unconfirmed raw text, even when the text equals an option ID. That map is excluded from canonical parameters. The adapter uses the installed component unmount lifecycle to clear its polling timer; focused tests cover this integration contract.

## Delivery boundary

The Creditor destination is a guarded placeholder with a return path. Full Creditor capture, submission serialization, backend integration and Order Terms task completion remain outside this ticket. No new feature flag, dependency, browser storage or production failure switch is introduced. Existing parent authentication/account and journey-state guards continue to apply. RM-specific Create Draft Casefile permission and Maintenance Business Unit enforcement is a prerequisite gap on the inspected PO-9806 baseline and must be supplied and verified before delivery readiness.

## Verification

Meaningful coverage includes strict metadata mapping, validation/canonicalization, resolver cancellation/retry, compatible draft restoration, one-time acceptance, cancellation/departure, shared-control keyboard behavior and Axe scans. Browser and local coverage are partial evidence; external Sonar, human review, QA and live backend verification require their own evidence.
