import type { DraftCasefileRecord } from './draft-casefile-record.interface';

const observations = new Map<string, DraftCasefileRecord>();
const owned = new Map<string, DraftCasefileRecord>();
let installed = false;

function targetKey(record: DraftCasefileRecord): string {
  return JSON.stringify([
    record.environment,
    record.runId,
    record.workerId,
    record.scenarioKey,
    record.businessUnitId,
    record.draftCasefileId,
  ]);
}

function currentScenarioRecords(records: Map<string, DraftCasefileRecord>): [string, DraftCasefileRecord][] {
  const scenarioKey = [Cypress.spec.relative, ...Cypress.currentTest.titlePath].join('/');
  const environment = new URL(Cypress.config('baseUrl')!).origin;
  return [...records].filter(
    ([, record]) =>
      record.scenarioKey === scenarioKey &&
      record.environment === environment &&
      record.runId === String(Cypress.env('draftCasefileRunId')) &&
      record.workerId === String(Cypress.env('draftCasefileWorkerId')),
  );
}

/** Buffer only; safe to call synchronously from a response listener. */
export function observeCreatedDraft(record: DraftCasefileRecord): void {
  pathForDraftCasefileCleanup(record);
  const key = targetKey(record);
  if (!owned.has(key)) {
    const captured = { ...record };
    owned.set(key, captured);
    observations.set(key, captured);
  }
}

/** Persist before removing observations. A rejected task leaves the observation available to afterEach. */
export function flushCreatedDrafts(): Cypress.Chainable<unknown> {
  return cy.then<unknown>(() => {
    for (const [key, record] of currentScenarioRecords(observations)) {
      cy.task('draftCasefiles:created', record, { log: false }).then(() => {
        observations.delete(key);
      });
    }
  });
}

/** Central assumed endpoint contract; IDs must never be inferred or coerced from an invalid receipt. */
export function pathForDraftCasefileCleanup(record: DraftCasefileRecord): string {
  if (
    !Number.isSafeInteger(record.draftCasefileId) ||
    record.draftCasefileId <= 0 ||
    !Number.isSafeInteger(record.businessUnitId) ||
    record.businessUnitId <= 0
  ) {
    throw new Error('Draft Casefile cleanup requires positive safe-integer casefile and business unit IDs');
  }
  const query = new URLSearchParams({ business_unit_id: String(record.businessUnitId) });
  return `/opal-maintenance-service/testing-support/draft-casefiles/${encodeURIComponent(String(record.draftCasefileId))}?${query}`;
}

/** Delete only current scenario ownership. Older pending records require explicit journal replay. */
export function cleanupCreatedDrafts(): Cypress.Chainable<unknown> {
  const failures: Array<{ id: number; status: number }> = [];
  return flushCreatedDrafts().then(() => {
    for (const [key, record] of currentScenarioRecords(owned)) {
      // Dependency: Draft Casefile test-support deletion is not implemented yet.
      // This cleanup will fail, and the live E2E tests will not pass, until that API is available.
      // Assumed contract: DELETE testing-support/draft-casefiles/{id}?business_unit_id={bu} -> 204,
      // including an already-absent record. A 404 is a missing route/failure, not cleanup success.
      cy.request({
        method: 'DELETE',
        url: pathForDraftCasefileCleanup(record),
        headers: { Accept: 'application/json' },
        failOnStatusCode: false,
        followRedirect: false,
        retryOnStatusCodeFailure: false,
        retryOnNetworkFailure: false,
        timeout: 15000,
        log: false,
      }).then((response) => {
        if (response.status === 204) {
          return cy.task('draftCasefiles:deleted', record, { log: false }).then(() => {
            owned.delete(key);
          });
        }
        failures.push({ id: record.draftCasefileId, status: response.status });
        return cy.task('draftCasefiles:failed', { record, status: response.status }, { log: false });
      });
    }
    // Transport errors abort Cypress's queue; durable pending entries then require explicit replay.
    cy.then(() => {
      if (failures.length) {
        throw new Error(
          `Draft Casefile test-support deletion failed: ${failures.map(({ id, status }) => `${id} (HTTP ${status})`).join(', ')}. The required API must be implemented and enabled; pending records require replay.`,
        );
      }
    });
  });
}

/** Install once in E2E support, including teardown after a failed test. Never suppress the original failure. */
export function installDraftCasefileCleanup(): void {
  if (installed) return;
  installed = true;
  afterEach(function () {
    return cleanupCreatedDrafts();
  });
}
