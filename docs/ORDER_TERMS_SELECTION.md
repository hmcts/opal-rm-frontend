# Order term selection

Create Draft Casefile always opens Order Terms Summary from the task list. Add terms starts a fresh pending selection. Continue stores only the selected Result ID and opens the minimal input destination. Back from input restores the selection; Cancel discards local edits after the existing warning when required. Selection does not create a completed term or persist a Draft Casefile.

Results are fetched from `GET /opal-maintenance-service/results` through `OpalMaintenanceService.getResults({ order_term: true, active: true })`. The resolver starts one disposable load and returns immediately so loading, empty and error states can render. Retry uses the same owner and service boundary. Requests include `order_term=true` and `active=true`; no new feature flag is used.

The service uses typed HTTP with `withoutHttpRetry()`, retaining the response `{ count, refData }`, server ordering and explicit consumer retry. Responses are not cached: each selection entry or retry fetches again. An empty database response (`{ count: 0, refData: [] }`) displays “There are currently no order terms.” There is no synthetic fallback. Populating the Results table is a backend prerequisite for selecting terms. Verify filtering and supported correlation propagation against the deployed endpoint when data is available.

The pending Result ID lives separately from task completion. Starting Add terms, changing case type or resetting the journey clears it. Input URLs must match the pending ID. Failed reloads retain the ID and last usable labels; successful responses remove choices no longer present.

Unit tests cover the contract, load lifecycle, store and guard. Routed component tests control service Observables for loading, empty and error states, focus, retry and warnings. Functional tests cover the HTTP-backed journey with stubbed Results responses and all three route destinations; accessibility features and component scans provide partial accessibility evidence.

No configuration or feature flag is introduced. Deployed backend verification, dynamic Result input and completed-term management remain pending. The current journey preserves the existing authentication and account guards. The authoritative RM Business Unit permission boundary is explicitly deferred and remains unverified; authentication alone is not proof of that permission. Permission prerequisites and any incomplete verification must be recorded in the ticket handoff without inventing a permission identifier or rule.
