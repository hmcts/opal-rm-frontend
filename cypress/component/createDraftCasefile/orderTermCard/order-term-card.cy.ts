import { Router } from '@angular/router';
import type { ICasesCreateCasefileOrderTermCard } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-order-term-card.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors as S } from '../../../shared/selectors/create-casefile.selectors';
import { setupOrderTerms, type OrderTermsStore } from '../orderTerms/setup/order-terms.setup';
import { SUMMARY_CREDITORS, SUMMARY_TERMS } from '../orderTermsSummary/mocks/order-terms-summary.mock';
import { NO_BANK_CARD, NON_UK_CARD, TEXT_ONLY_CARD, UK_CARD } from './mocks/order-term-card.mock';
import { setupOrderTermCard } from './setup/order-term-card.setup';

const buildTags = (): string[] => ['@JIRA-STORY:PO-9812', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];

// Presentation coverage for the shared card; routed removal is covered in orderTermsSummary.
describe('Order term read-only card', () => {
  it('AC1. should display the supplied second term without editable actions', { tags: buildTags() }, () => {
    setupOrderTermCard();
    cy.get(S.orderTermCard.root).find('h2').should('have.text', 'Maintenance');
    cy.get(S.orderTermCard.root)
      .should('contain.text', '£20.00')
      .and('contain.text', '31 December 2026')
      .and('contain.text', 'Synthetic creditor')
      .and('not.contain.text', '£10.00');
    cy.get(S.orderTermCard.root).find('a, button, input, select, textarea').should('not.exist');
    cy.get(S.orderTermsSummary.creditorDisclosure(2)).should('not.have.attr', 'open');
    cy.get(S.orderTermsSummary.creditorDetails(2)).should(([details]) => {
      expect(details.checkVisibility()).to.eq(false);
    });
  });

  it(
    'AC5. should reach the disclosure with Tab and toggle it with Space without changing the supplied card',
    { tags: buildTags() },
    () => {
      setupOrderTermCard();
      cy.get('h1').focus();
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.orderTermsSummary.creditorToggle(2)).should('be.focused');
      cy.press(Cypress.Keyboard.Keys.SPACE);
      cy.get(S.orderTermsSummary.creditorDisclosure(2)).should('have.attr', 'open');
      cy.get(S.orderTermsSummary.creditorDetails(2)).should('be.visible').and('contain.text', '00112233');
      cy.get(S.orderTermsSummary.creditorToggle(2)).should('be.focused').and('contain.text', 'Creditor details');
      cy.press(Cypress.Keyboard.Keys.SPACE);
      cy.get(S.orderTermsSummary.creditorDisclosure(2)).should('not.have.attr', 'open');
      cy.get(S.orderTermsSummary.creditorDetails(2)).should(([details]) => {
        expect(details.checkVisibility()).to.eq(false);
      });
      cy.get(S.orderTermsSummary.creditorToggle(2)).should('be.focused');
      cy.get<ICasesCreateCasefileOrderTermCard>('@inputCard').should('deep.equal', UK_CARD);
    },
  );

  it('AC1, AC5. should omit bank disclosure for a creditor without bank details', { tags: buildTags() }, () => {
    setupOrderTermCard(NO_BANK_CARD);
    cy.get(S.orderTermCard.root).should('contain.text', 'Synthetic no-bank creditor');
    cy.get(S.orderTermCard.root).find('details, summary').should('not.exist');
    cy.get(S.orderTermCard.root).should('contain.text', '£20.00');
  });

  it('AC1. should render supplied titles, labels and values as text', { tags: buildTags() }, () => {
    setupOrderTermCard(TEXT_ONLY_CARD);
    cy.get(S.orderTermCard.root).find('h2').should('have.text', TEXT_ONLY_CARD.title);
    cy.get(S.orderTermCard.root)
      .should('contain.text', '<b>Amount</b>')
      .and('contain.text', TEXT_ONLY_CARD.rows[0].value);
    cy.get(S.orderTermsSummary.creditorToggle(2)).click();
    cy.get(S.orderTermsSummary.creditorDetails(2)).should('contain.text', '<b>Synthetic creditor</b>');
    cy.get(S.orderTermCard.root).find('img, b').should('not.exist');
  });

  it(
    'AC5. should have no detected Axe violations with collapsed and expanded bank details',
    { tags: buildTags() },
    () => {
      setupOrderTermCard();
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
      cy.get(S.orderTermsSummary.creditorToggle(2)).click();
      cy.get(S.orderTermsSummary.creditorDetails(2)).should('be.visible');
      cy.checkA11y();
    },
  );

  it('AC5. should reflow expanded international bank details at 320 CSS pixels', { tags: buildTags() }, () => {
    cy.viewport(320, 800);
    setupOrderTermCard(NON_UK_CARD);
    cy.get(S.orderTermsSummary.creditorToggle(2)).click();
    cy.get(S.orderTermsSummary.creditorDetails(2))
      .should('be.visible')
      .and('contain.text', 'SYNTHETIC-LONG-PAYMENT-REFERENCE-00000001');
    cy.document().should((document) => {
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
    });
  });

  it(
    'AC1, AC5. should retain projected summary actions and keyboard navigation after card extraction',
    { tags: buildTags() },
    () => {
      setupOrderTerms({
        initialChild: PATHS.children.orderTermsSummary,
        acceptedTerms: SUMMARY_TERMS,
        minorCreditors: SUMMARY_CREDITORS,
      });
      cy.get(S.orderTermCard.root).should('have.length', 2);
      cy.get(S.orderTermsSummary.card(2)).within(() => {
        cy.get(S.orderTermsSummary.change(2)).should('contain.text', 'Change').and('contain.text', 'Maintenance');
        cy.get(S.orderTermsSummary.remove(2)).should('contain.text', 'Remove').and('contain.text', 'Maintenance');
      });
      cy.get(S.orderTermsSummary.change(2)).focus();
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.orderTermsSummary.remove(2)).should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.orderTermsSummary.creditorToggle(2)).should('be.focused');
      cy.get(S.orderTermsSummary.change(2)).focus();
      cy.press(Cypress.Keyboard.Keys.ENTER);
      cy.get<Router>('@angularRouter')
        .its('url')
        .should('eq', '/' + PATHS.root + '/' + PATHS.children.orderTermsInput + '/MAT');
      cy.get(S.orderTermsInput.amount).should('have.value', '20.00');
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
        expect(store.orderTermAmendment()?.termId).to.eq(2);
        expect(store.orderTerms()).to.deep.equal(SUMMARY_TERMS);
        expect(store.minorCreditors()).to.deep.equal(SUMMARY_CREDITORS);
      });
    },
  );
});
