import type { IDraftCasefileCleanupReceipt } from './interfaces/draft-casefile-cleanup-receipt.interface';

let installed = false;

/** Support and feature files have separate bundles; Cypress env shares only these non-secret receipts. */
function createdReceipts(): IDraftCasefileCleanupReceipt[] {
  return Cypress.env('draftCasefileCleanupReceipts') ?? [];
}

/** Creates the exact 20-character marker accepted by Maintenance and the REMO Reference field. */
export function createDraftCasefileTestRunReference(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(8));
  return `E2E-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

/** Builds the agreed cleanup route, rejecting invalid or coerced receipt IDs. */
function pathForDraftCasefileCleanup(id: number): string {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('Draft Casefile cleanup requires a positive safe-integer casefile ID');
  }
  return `/opal-maintenance-service/testing-support/draft-casefiles/${encodeURIComponent(String(id))}`;
}

/** Record synchronously from the live response listener, before later assertions can fail. */
export function recordCreatedId(id: number, testRunReference: string): void {
  pathForDraftCasefileCleanup(id);
  if (!/^E2E-[0-9a-f]{16}$/.test(testRunReference)) {
    throw new Error('Draft Casefile cleanup requires the exact E2E- plus 16 lowercase hexadecimal marker');
  }
  Cypress.env('draftCasefileCleanupReceipts', [
    ...createdReceipts().filter((receipt) => receipt.id !== id),
    {
      ...createdReceipts().find((receipt) => receipt.id === id && receipt.testRunReference === testRunReference),
      id,
      testRunReference,
    },
  ]);
}

/** Only newly configured owned receipts may defer deletion, explicitly and on a local frontend. */
export function configureDraftCasefileCleanup(
  id: number,
  testRunReference: string,
  options: { policy: 'required' | 'deferred'; actor: string },
): void {
  const receipt = createdReceipts().find((value) => value.id === id && value.testRunReference === testRunReference);
  if (!receipt || !options.actor.trim())
    throw new Error('Cleanup configuration requires an observed owned receipt and actor');
  if (options.policy === 'deferred') {
    const host = new URL(Cypress.config('baseUrl') ?? '').hostname;
    if (Cypress.env('PO10626_DEFER_CLEANUP') !== true || !['localhost', '127.0.0.1', '[::1]'].includes(host)) {
      throw new Error('PO-10626 cleanup deferral requires explicit local development configuration');
    }
  }
  Cypress.env(
    'draftCasefileCleanupReceipts',
    createdReceipts().map((value) =>
      value === receipt
        ? {
            ...value,
            cleanupPolicy: options.policy,
            cleanupActor: options.actor,
          }
        : value,
    ),
  );
}

/** Persist before any lifecycle mutation or teardown authentication can fail. */
export function persistDraftCasefileCleanupReceipts(): Cypress.Chainable<IDraftCasefileCleanupReceipt[]> {
  return cy.wrap([...createdReceipts()], { log: false }).each((receipt: IDraftCasefileCleanupReceipt) => {
    const ledgerPath = `functional-output/draft-casefile-cleanup/${receipt.testRunReference}-${receipt.id}.json`;
    return cy.writeFile(
      ledgerPath,
      {
        baseUrl: Cypress.config('baseUrl'),
        outstanding: [receipt],
      },
      { log: false },
    );
  });
}

/** Installs cleanup for local and deployed E2E, including after failed scenario assertions. */
export function installDraftCasefileCleanup(restoreActor?: (actor: string) => void): void {
  if (installed) return;
  installed = true;
  afterEach(() => {
    const ids = [...createdReceipts()];
    if (!ids.length) return;

    const failures: string[] = [];
    return persistDraftCasefileCleanupReceipts()
      .each(({ id, testRunReference, cleanupPolicy, cleanupActor }: IDraftCasefileCleanupReceipt) => {
        if (cleanupPolicy === 'deferred') {
          return cy.log(`PO-10626: owned draft ${id} retained; its cleanup receipt is outstanding`);
        }
        const ledgerPath = `functional-output/draft-casefile-cleanup/${testRunReference}-${id}.json`;
        if (cleanupActor) {
          cy.then(() => {
            if (!restoreActor) throw new Error('Cleanup actor restoration is unavailable; receipts retained');
            restoreActor(cleanupActor);
          });
        }
        return cy
          .request({
            method: 'DELETE',
            url: pathForDraftCasefileCleanup(id),
            headers: { 'Test-Run-Reference': testRunReference },
            failOnStatusCode: false,
            followRedirect: false,
            retryOnStatusCodeFailure: false,
            retryOnNetworkFailure: false,
            timeout: 15000,
            log: false,
          })
          .then((response) => {
            if (response.status !== 204) {
              failures.push(`${id} (${testRunReference}, HTTP ${response.status})`);
              return;
            }
            Cypress.env(
              'draftCasefileCleanupReceipts',
              createdReceipts().filter((receipt) => receipt.id !== id),
            );
            return cy.writeFile(ledgerPath, { baseUrl: Cypress.config('baseUrl'), outstanding: [] }, { log: false });
          });
      })
      .then(() => {
        if (failures.length) {
          throw new Error(
            `Draft Casefile test-support deletion failed: ${failures.join(', ')}. Check authentication, permission 21, ownership, marker, lifecycle and TESTING_SUPPORT_ENDPOINTS_ENABLED. Outstanding receipts are retained in functional-output/draft-casefile-cleanup/.`,
          );
        }
      });
  });
}
