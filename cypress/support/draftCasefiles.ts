let installed = false;

/** Support and feature files have separate bundles; Cypress env shares only these non-secret receipts. */
function createdReceipts(): { id: number; testRunReference: string }[] {
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
    { id, testRunReference },
  ]);
}

/** Installs cleanup for local and deployed E2E, including after failed scenario assertions. */
export function installDraftCasefileCleanup(): void {
  if (installed) return;
  installed = true;
  afterEach(() => {
    const ids = [...createdReceipts()];
    if (!ids.length) return;

    const failures: string[] = [];
    return cy
      .wrap(ids, { log: false })
      .each(({ id, testRunReference }: { id: number; testRunReference: string }) => {
        // Persist every receipt before any request so a transport failure cannot lose later targets.
        // CNP archives functional-output/** after both passing and failing functional stages.
        const ledgerPath = `functional-output/draft-casefile-cleanup/${testRunReference}-${id}.json`;
        return cy.writeFile(
          ledgerPath,
          { baseUrl: Cypress.config('baseUrl'), outstanding: [{ id, testRunReference }] },
          { log: false },
        );
      })
      .each(({ id, testRunReference }: { id: number; testRunReference: string }) => {
        const ledgerPath = `functional-output/draft-casefile-cleanup/${testRunReference}-${id}.json`;
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
