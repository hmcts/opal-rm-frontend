/** Scenario-local created IDs, keyed by business unit and casefile ID. */
const createdIds = new Map<string, { id: number; businessUnitId: number }>();
let installed = false;

/** Build the assumed cleanup route, rejecting invalid or coerced receipt IDs. */
export function pathForDraftCasefileCleanup(id: number, businessUnitId: number): string {
  if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(businessUnitId) || businessUnitId <= 0) {
    throw new Error('Draft Casefile cleanup requires positive safe-integer casefile and business unit IDs');
  }
  const query = new URLSearchParams({ business_unit_id: String(businessUnitId) });
  return `/opal-maintenance-service/testing-support/draft-casefiles/${encodeURIComponent(String(id))}?${query}`;
}

/** Record synchronously from the live response listener, before later assertions can fail. */
export function recordCreatedId(id: number, businessUnitId: number): void {
  pathForDraftCasefileCleanup(id, businessUnitId);
  createdIds.set(`${businessUnitId}:${id}`, { id, businessUnitId });
}

/** Install once in E2E support; clear ownership before attempting this scenario's deletions. */
export function installDraftCasefileCleanup(): void {
  if (installed) return;
  installed = true;
  afterEach(() => {
    const ids = [...createdIds.values()];
    createdIds.clear();
    if (!ids.length) return;

    const failures: string[] = [];
    return cy
      .wrap(ids, { log: false })
      .each(({ id, businessUnitId }: { id: number; businessUnitId: number }) => {
        // Dependency: Draft Casefile test-support deletion is not implemented yet.
        // This cleanup will fail, and the live E2E tests will not pass, until that API is available.
        // Assumed contract: DELETE testing-support/draft-casefiles/{id}?business_unit_id={bu} -> 204,
        // including an already-absent record. A 404 is a missing route/failure, not cleanup success.
        return cy
          .request({
            method: 'DELETE',
            url: pathForDraftCasefileCleanup(id, businessUnitId),
            headers: { Accept: 'application/json' },
            failOnStatusCode: false,
            followRedirect: false,
            retryOnStatusCodeFailure: false,
            retryOnNetworkFailure: false,
            timeout: 15000,
            log: false,
          })
          .then((response) => {
            if (response.status !== 204) failures.push(`${id} (BU ${businessUnitId}, HTTP ${response.status})`);
          });
      })
      .then(() => {
        if (failures.length) {
          throw new Error(
            `Draft Casefile test-support deletion failed: ${failures.join(', ')}. The required API must be implemented and enabled. Failed IDs are not retained across tests or runs.`,
          );
        }
      });
  });
}
