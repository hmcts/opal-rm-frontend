import {
  configureDraftCasefileCleanup,
  recordCreatedId,
  persistDraftCasefileCleanupReceipts,
  installDraftCasefileCleanup,
} from '../../support/draftCasefiles';

describe('PO-10626 owned receipt policy', () => {
  const marker = 'E2E-0123456789abcdef';
  const ledger = `functional-output/draft-casefile-cleanup/${marker}-101.json`;
  let previousBaseUrl: string | null;

  beforeEach(() => {
    previousBaseUrl = Cypress.config('baseUrl');
    Cypress.config('baseUrl', 'http://localhost:5000');
    Cypress.env('draftCasefileCleanupReceipts', []);
    Cypress.env('PO10626_DEFER_CLEANUP', false);
  });

  afterEach(() => {
    Cypress.env('draftCasefileCleanupReceipts', []);
    Cypress.env('PO10626_DEFER_CLEANUP', false);
    Cypress.config('baseUrl', previousBaseUrl);
    cy.writeFile(ledger, { outstanding: [] }, { log: false });
  });

  it(
    'keeps old receipts required and configures only an observed exact ID and marker',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      recordCreatedId(101, marker);
      recordCreatedId(102, 'E2E-fedcba9876543210');
      configureDraftCasefileCleanup(101, marker, { actor: 'synthetic-inputter', policy: 'required' });
      expect(Cypress.env('draftCasefileCleanupReceipts')).to.deep.equal([
        { id: 101, testRunReference: marker, cleanupActor: 'synthetic-inputter', cleanupPolicy: 'required' },
        { id: 102, testRunReference: 'E2E-fedcba9876543210' },
      ]);
      expect(() =>
        configureDraftCasefileCleanup(102, marker, { actor: 'synthetic-inputter', policy: 'required' }),
      ).to.throw('observed owned receipt');
    },
  );

  it(
    'requires explicit localhost deferral and persists ownership before mutation',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      recordCreatedId(101, marker);
      expect(() =>
        configureDraftCasefileCleanup(101, marker, { actor: 'synthetic-inputter', policy: 'deferred' }),
      ).to.throw('explicit local');
      Cypress.env('PO10626_DEFER_CLEANUP', true);
      Cypress.config('baseUrl', 'https://example.invalid');
      expect(() =>
        configureDraftCasefileCleanup(101, marker, { actor: 'synthetic-inputter', policy: 'deferred' }),
      ).to.throw('explicit local');
      Cypress.config('baseUrl', 'http://localhost:5000');
      configureDraftCasefileCleanup(101, marker, { actor: 'synthetic-inputter', policy: 'deferred' });
      recordCreatedId(101, marker);
      persistDraftCasefileCleanupReceipts();
      cy.readFile(ledger, { log: false }).then((body) => {
        expect(body.baseUrl).to.equal('http://localhost:5000');
        expect(body.outstanding).to.deep.equal([
          { id: 101, testRunReference: marker, cleanupActor: 'synthetic-inputter', cleanupPolicy: 'deferred' },
        ]);
      });
    },
  );

  it(
    'persists the receipt and restores its owner before sending lifecycle cleanup',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      let cleanup: (() => Cypress.Chainable<unknown>) | undefined;
      const events: string[] = [];
      const hook = cy.stub(globalThis, 'afterEach').callsFake((callback: () => Cypress.Chainable<unknown>) => {
        cleanup = callback;
      });
      installDraftCasefileCleanup((actor) => {
        cy.readFile(ledger, { log: false }).then((body) => {
          expect(body.outstanding[0].id).to.equal(101);
          events.push(actor);
        });
      });
      hook.restore();
      cy.stub(cy, 'request').callsFake((options: Cypress.RequestOptions) => {
        return cy.then(() => {
          expect(options.method).to.equal('DELETE');
          expect(options.headers).to.have.property('Test-Run-Reference', marker);
          events.push('DELETE');
          return { status: 204 };
        });
      });
      recordCreatedId(101, marker);
      configureDraftCasefileCleanup(101, marker, { actor: 'synthetic-inputter', policy: 'required' });
      if (!cleanup) throw new Error('Cleanup hook was not installed');
      cleanup().then(() => {
        expect(events).to.deep.equal(['synthetic-inputter', 'DELETE']);
        expect(Cypress.env('draftCasefileCleanupReceipts')).to.deep.equal([]);
      });
      cy.readFile(ledger, { log: false }).its('outstanding').should('deep.equal', []);
    },
  );
});
