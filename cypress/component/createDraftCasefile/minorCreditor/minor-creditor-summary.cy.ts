import { Router } from '@angular/router';
import { getState } from '@ngrx/signals';
import type { ICasesCreateCasefileState } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-state.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors as S } from '../../../shared/selectors/create-casefile.selectors';
import { setupCreditor, type CreditorStore } from '../creditor/setup/creditor.setup';
import {
  MINOR_CREDITOR_PENDING_STATE_MOCK,
  MINOR_CREDITOR_PENDING_REPLACEMENT_STATE_MOCK,
  MINOR_CREDITOR_UK_MOCK,
} from './mocks/minor-creditor.mock';

const buildTags = (): string[] => ['@JIRA-STORY:PO-9810', '@JIRA-LABEL:create-draft-casefile'];
const route = (child: string): string => '/' + PATHS.root + '/' + child;

describe('Minor creditor summary journey', () => {
  it(
    'AC2. preserves the pending creditor through Remove and Back without fetching countries',
    { tags: buildTags() },
    () => {
      setupCreditor({ initialChild: PATHS.children.minorCreditorSummary, state: MINOR_CREDITOR_PENDING_STATE_MOCK });
      cy.get(S.minorCreditorSummary.remove).click();
      cy.get(S.heading).should('have.text', 'Remove minor creditor');
      cy.get(S.minorCreditorSummary.back).click();
      cy.get(S.heading).should('have.text', 'Minor creditor summary');
      cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.creditorDraft()).to.deep.equal(MINOR_CREDITOR_PENDING_STATE_MOCK.creditorDraft);
        expect(store.currentOrderTermId()).to.eq(1);
        expect(store.orderTerms()).to.deep.equal(MINOR_CREDITOR_PENDING_STATE_MOCK.orderTerms);
        expect(store.minorCreditors()).to.deep.equal([]);
        expect(store.nextMinorCreditorSequence()).to.eq(1);
      });
      cy.get('@countriesRequest').should('not.have.been.called');
    },
  );

  it('AC1. displays the reviewed UK details with the country name and leading zeroes', { tags: buildTags() }, () => {
    setupCreditor({ initialChild: PATHS.children.minorCreditorSummary, state: MINOR_CREDITOR_PENDING_STATE_MOCK });
    cy.get(S.minorCreditorSummary.rowValue('Name')).should('have.text', 'Example creditor');
    cy.get(S.minorCreditorSummary.rowValue('Address'))
      .should('contain.text', '1 Test Street')
      .and('contain.text', 'United Kingdom')
      .and('not.contain.text', '826');
    cy.get(S.minorCreditorSummary.rowValue('BankType')).should('have.text', 'UK');
    cy.get(S.minorCreditorSummary.rowValue('SortCode')).should('have.text', '001122');
    cy.get(S.minorCreditorSummary.rowValue('AccountNumber')).should('have.text', '00112233');
    cy.get(S.minorCreditorSummary.rowValue('PaymentReference')).should('have.text', 'Example reference');
  });

  it('AC2, AC3. changes the pending name and accepts it only on Continue', { tags: buildTags() }, () => {
    setupCreditor({ initialChild: PATHS.children.minorCreditorSummary, state: MINOR_CREDITOR_PENDING_STATE_MOCK });
    cy.get(S.minorCreditorSummary.change).click();
    cy.get(S.minorCreditor.organisationName)
      .should('have.value', 'Example creditor')
      .clear()
      .type('Changed example creditor');
    cy.get(S.minorCreditor.ukAccountNumber).should('have.value', '00112233');
    cy.get(S.minorCreditor.save).click();
    cy.get(S.heading).should('have.text', 'Minor creditor summary');
    cy.get(S.minorCreditorSummary.rowValue('Name')).should('have.text', 'Changed example creditor');
    const details = {
      ...MINOR_CREDITOR_UK_MOCK,
      identity: { type: 'organisation', organisationName: 'Changed example creditor' },
    };
    cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.orderTerms()[0].creditor).to.eq(null);
      expect(store.minorCreditors()).to.deep.equal([]);
      expect(store.nextMinorCreditorSequence()).to.eq(1);
      expect(store.creditorDraft()?.details).to.deep.equal(details);
    });
    cy.get(S.minorCreditorSummary.continue).click();
    cy.get<Router>('@angularRouter').its('url').should('eq', route(PATHS.children.orderTermsSummary));
    cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
      expect(store.creditorDraft()).to.eq(null);
      expect(store.minorCreditors()).to.deep.equal([
        { sequenceNumber: 1, displayName: 'Changed example creditor', details },
      ]);
      expect(store.orderTerms()[0].creditor).to.deep.equal({ type: 'minor', sequenceNumber: 1 });
      expect(store.nextMinorCreditorSequence()).to.eq(2);
    });
  });

  const priorAssignments: [string, Partial<ICasesCreateCasefileState>][] = [
    [
      'applicant',
      {
        ...MINOR_CREDITOR_PENDING_STATE_MOCK,
        orderTerms: [{ ...MINOR_CREDITOR_PENDING_STATE_MOCK.orderTerms![0], creditor: { type: 'applicant' } }],
      },
    ],
    ['minor creditor', MINOR_CREDITOR_PENDING_REPLACEMENT_STATE_MOCK],
  ];
  for (const [assignment, state] of priorAssignments) {
    it(
      `AC3. Cancel preserves the prior ${assignment} assignment and wider casefile state`,
      { tags: buildTags() },
      () => {
        setupCreditor({ initialChild: PATHS.children.minorCreditorSummary, state });
        cy.get<CreditorStore>('@casesCreateCasefileStore').then((store) => {
          const before = structuredClone(getState(store));
          cy.get(S.minorCreditorSummary.cancel).click();
          cy.get<Router>('@angularRouter').its('url').should('eq', route(PATHS.children.orderTermCreditor));
          cy.then(() => expect(getState(store)).to.deep.equal({ ...before, creditorDraft: null }));
        });
      },
    );
  }

  const invalidDrafts: { name: string; state: Partial<ICasesCreateCasefileState> }[] = [
    { name: 'missing draft', state: { creditorDraft: null } },
    {
      name: 'mismatched draft',
      state: { creditorDraft: { ...MINOR_CREDITOR_PENDING_STATE_MOCK.creditorDraft!, termId: 2 } },
    },
    { name: 'unpopulated draft', state: { creditorDraft: { termId: 1, branch: 'add-new' } } },
  ];
  for (const child of [PATHS.children.minorCreditorSummary, PATHS.children.minorCreditorRemove]) {
    for (const { name, state } of invalidDrafts) {
      it(`AC2. recovers from ${child} with a ${name}`, { tags: buildTags() }, () => {
        setupCreditor({ initialChild: child, state: { ...MINOR_CREDITOR_PENDING_STATE_MOCK, ...state } });
        cy.get<Router>('@angularRouter').its('url').should('eq', route(PATHS.children.orderTermCreditor));
        cy.get(S.heading).should('have.text', 'Creditor');
        cy.get(S.minorCreditorSummary.continue).should('not.exist');
        cy.get('@countriesRequest').should('not.have.been.called');
      });
    }
    for (const termId of [null, 99]) {
      it(`AC2. recovers from ${child} with unavailable current term ${termId}`, { tags: buildTags() }, () => {
        setupCreditor({
          initialChild: child,
          state: { ...MINOR_CREDITOR_PENDING_STATE_MOCK, currentOrderTermId: termId },
        });
        cy.get<Router>('@angularRouter').its('url').should('eq', route(PATHS.children.orderTermsSelect));
        cy.get(S.orderTerms.select).should('be.visible');
        cy.get(S.minorCreditorSummary.continue).should('not.exist');
        cy.get('@countriesRequest').should('not.have.been.called');
      });
    }
  }
});
