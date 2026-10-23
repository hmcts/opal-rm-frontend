import { installDraftCasefileCleanup, recordCreatedId } from '../../support/draftCasefiles';
import { DRAFT_CASEFILE_CLEANUP_RECEIPTS } from './mocks/draft-casefile-cleanup-receipts.mock';

const STORY_TAG = '@JIRA-STORY:PO-10273';
const EPIC_TAG = '@JIRA-EPIC:PO-6506';
const buildTags = (): string[] => [STORY_TAG, EPIC_TAG];
const ledgerPath = (receipt: { id: number; testRunReference: string }): string =>
  `functional-output/draft-casefile-cleanup/${receipt.testRunReference}-${receipt.id}.json`;

describe('Draft Casefile cleanup recovery receipts', { retries: 0 }, () => {
  let outcomes: (number | Error)[];
  let requests: Partial<Cypress.RequestOptions>[];
  let expectedOutstanding: typeof DRAFT_CASEFILE_CLEANUP_RECEIPTS;
  let expectedRequestCount: number;
  let expectedFailures: string[];
  let observedFailure: Error | undefined;

  beforeEach(() => {
    Cypress.env('draftCasefileCleanupReceipts', []);
    outcomes = [];
    requests = [];
    expectedOutstanding = [];
    expectedRequestCount = 0;
    expectedFailures = [];
    observedFailure = undefined;

    // Reset these synthetic ledgers so a previous test cannot mask a missing receipt write.
    for (const receipt of DRAFT_CASEFILE_CLEANUP_RECEIPTS) {
      cy.writeFile(ledgerPath(receipt), { baseUrl: Cypress.config('baseUrl'), outstanding: [] }, { log: false });
    }

    // Keep Cypress's real queue and file IO; only the remote DELETE boundary is controlled.
    cy.stub(cy, 'request').callsFake((options: Partial<Cypress.RequestOptions>) => {
      return cy.then(() => {
        requests.push(options);
        if (requests.length === 1) {
          // Even the later targets must be recoverable before the first request can fail.
          for (const receipt of DRAFT_CASEFILE_CLEANUP_RECEIPTS) {
            cy.readFile(ledgerPath(receipt), { log: false }).should('deep.equal', {
              baseUrl: Cypress.config('baseUrl'),
              outstanding: [receipt],
            });
          }
        }
        return cy.then(() => {
          const outcome = outcomes.shift();
          if (outcome instanceof Error) throw outcome;
          expect(outcome, 'configured cleanup response').to.be.a('number');
          return { status: outcome };
        });
      });
    });
  });

  // Exercise the installed afterEach, including Cypress command failures in that hook.
  installDraftCasefileCleanup();

  afterEach(() => {
    if (expectedFailures.length) {
      expect(observedFailure, 'cleanup must fail the hook').to.be.instanceOf(Error);
      for (const message of expectedFailures) {
        expect(observedFailure?.message).to.include(message);
      }
    }
    expect(requests).to.have.length(expectedRequestCount);
    requests.forEach((request, index) => {
      const receipt = DRAFT_CASEFILE_CLEANUP_RECEIPTS[index];
      expect(request).to.deep.equal({
        method: 'DELETE',
        url: `/opal-maintenance-service/testing-support/draft-casefiles/${receipt.id}`,
        headers: { 'Test-Run-Reference': receipt.testRunReference },
        failOnStatusCode: false,
        followRedirect: false,
        retryOnStatusCodeFailure: false,
        retryOnNetworkFailure: false,
        timeout: 15000,
        log: false,
      });
    });
    expect(Cypress.env('draftCasefileCleanupReceipts')).to.deep.equal(expectedOutstanding);
    if (expectedRequestCount) {
      for (const receipt of DRAFT_CASEFILE_CLEANUP_RECEIPTS) {
        cy.readFile(ledgerPath(receipt), { log: false }).should('deep.equal', {
          baseUrl: Cypress.config('baseUrl'),
          outstanding: expectedOutstanding.filter(({ id }) => id === receipt.id),
        });
      }
    }
    cy.then(() => Cypress.env('draftCasefileCleanupReceipts', []));
    for (const receipt of DRAFT_CASEFILE_CLEANUP_RECEIPTS) {
      cy.writeFile(ledgerPath(receipt), { baseUrl: Cypress.config('baseUrl'), outstanding: [] }, { log: false });
    }
  });

  const recordReceipts = (): void => {
    for (const receipt of DRAFT_CASEFILE_CLEANUP_RECEIPTS) {
      recordCreatedId(receipt.id, receipt.testRunReference);
    }
  };

  const expectHookFailure = (messages: string[]): void => {
    expectedFailures = messages;
    cy.once('fail', (error) => {
      // Unexpected assertion/command failures must still fail this regression test.
      if (!error.message.includes(messages[0])) throw error;
      observedFailure = error;
      return false;
    });
  };

  it('AC cleanup. should send no deletion without a captured receipt', { tags: buildTags() }, () => {
    // The installed hook must leave the empty receipt collection alone.
  });

  it('AC cleanup. should clear every receipt and ledger only after HTTP 204', { tags: buildTags() }, () => {
    outcomes = [204, 204, 204];
    expectedRequestCount = 3;
    recordReceipts();
  });

  for (const status of [400, 401, 403, 404, 409, 500, 503]) {
    it(
      `AC cleanup. should fail on HTTP ${status}, retain failed receipts and attempt every target`,
      { tags: buildTags() },
      () => {
        outcomes = [status, 204, status];
        expectedRequestCount = 3;
        expectedOutstanding = [DRAFT_CASEFILE_CLEANUP_RECEIPTS[0], DRAFT_CASEFILE_CLEANUP_RECEIPTS[2]];
        expectHookFailure([
          'Draft Casefile test-support deletion failed:',
          ...expectedOutstanding.map(({ id, testRunReference }) => `${id} (${testRunReference}, HTTP ${status})`),
          'Outstanding receipts are retained in functional-output/draft-casefile-cleanup/.',
        ]);
        recordReceipts();
      },
    );
  }

  it(
    'AC cleanup. should fail on a transport error with every ID and marker already persisted',
    { tags: buildTags() },
    () => {
      outcomes = [new Error('cleanup connection reset')];
      expectedRequestCount = 1;
      expectedOutstanding = [...DRAFT_CASEFILE_CLEANUP_RECEIPTS];
      expectHookFailure(['cleanup connection reset']);
      recordReceipts();
    },
  );

  it(
    'AC cleanup. should retain the failed and unattempted receipts after a transport error follows a 204',
    { tags: buildTags() },
    () => {
      outcomes = [204, new Error('cleanup connection reset')];
      expectedRequestCount = 2;
      expectedOutstanding = DRAFT_CASEFILE_CLEANUP_RECEIPTS.slice(1);
      expectHookFailure(['cleanup connection reset']);
      recordReceipts();
    },
  );
});
