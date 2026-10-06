import { Router } from '@angular/router';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors as S } from '../../../shared/selectors/create-casefile.selectors';
import { setupOrderTerms, type OrderTermsStore } from '../orderTerms/setup/order-terms.setup';
import { ORDER_TERMS_REMOVAL_COPY } from './constants/order-terms-removal-copy.constant';
import { SUMMARY_CREDITORS, SUMMARY_TERMS } from './mocks/order-terms-summary.mock';

const buildTags = (): string[] => ['@JIRA-STORY:PO-9812', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
const setupSummary = (): void => {
  setupOrderTerms({
    shell: true,
    initialChild: PATHS.children.orderTermsSummary,
    acceptedTerms: SUMMARY_TERMS,
    minorCreditors: SUMMARY_CREDITORS,
  });
};
const openSecondRemoval = (): void => {
  cy.get(S.orderTermsSummary.remove(2)).click();
  cy.get(S.heading).should('have.text', ORDER_TERMS_REMOVAL_COPY.confirmationHeading);
};
const checkReflow = (): void => {
  cy.document().should((document) => {
    expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
  });
};

describe('Order terms removal accessibility', () => {
  it('AC1. should reveal creditor bank rows with native Tab and Space', { tags: buildTags() }, () => {
    setupSummary();
    openSecondRemoval();
    cy.get(S.orderTermsSummary.creditorDisclosure(2)).should('not.have.attr', 'open');
    cy.get(S.orderTermsSummary.creditorToggle(2)).then(([summary]) => summary.focus());
    cy.get(S.orderTermsSummary.creditorToggle(2)).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(S.orderTermsSummary.creditorDisclosure(2)).should('have.attr', 'open');
    cy.get(S.orderTermsSummary.creditorToggle(2)).should('be.focused');
    cy.get(S.orderTermsSummary.creditorDetails(2)).should('be.visible').and('contain.text', '00112233');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.orderTermsRemoval.confirm).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.orderTermsRemoval.cancel).should('be.focused');
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  it('AC2. should activate confirmation with Enter and focus the success notice', { tags: buildTags() }, () => {
    setupSummary();
    openSecondRemoval();
    cy.get(S.orderTermsRemoval.confirm).focus().type('{enter}');
    cy.get(S.orderTermsRemoval.notice).should('be.focused').and('contain.text', ORDER_TERMS_REMOVAL_COPY.success);
    cy.get(S.orderTermsRemoval.dismiss).focus().type('{enter}');
    cy.get(S.orderTermsRemoval.summaryHeading).should('be.focused');
  });

  it('AC3. should activate Cancel as a native link with Enter and return focus', { tags: buildTags() }, () => {
    setupSummary();
    openSecondRemoval();
    cy.get(S.orderTermsRemoval.cancel).focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get<Router>('@angularRouter')
      .its('url')
      .should('eq', '/' + PATHS.root + '/' + PATHS.children.orderTermsSummary);
    cy.get(S.orderTermsSummary.remove(2)).should('be.focused');
  });

  it('AC1. should have no detected Axe violations on collapsed confirmation', { tags: buildTags() }, () => {
    setupSummary();
    openSecondRemoval();
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  it('AC2. should have no detected Axe violations on returned success', { tags: buildTags() }, () => {
    setupSummary();
    openSecondRemoval();
    cy.get(S.orderTermsRemoval.confirm).click();
    cy.get(S.orderTermsRemoval.notice).should('be.focused');
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  it(
    'AC4. should have no detected Axe violations after a stale selection silently returns',
    { tags: buildTags() },
    () => {
      setupSummary();
      openSecondRemoval();
      cy.get<OrderTermsStore>('@casesCreateCasefileStore').then((store) => {
        store.removeAcceptedOrderTerm(2);
      });
      cy.get(S.orderTermsRemoval.summaryHeading).should('be.visible');
      cy.get(S.orderTermsRemoval.notice).should('not.exist');
      cy.get(S.orderTermsSummary.cards).should('have.length', 1);
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
    },
  );

  it('AC1. should reflow the open confirmation at 320 CSS pixels', { tags: buildTags() }, () => {
    cy.viewport(320, 900);
    setupSummary();
    openSecondRemoval();
    checkReflow();
    cy.get(S.orderTermsSummary.creditorToggle(2)).click();
    cy.get(S.orderTermsSummary.creditorDetails(2)).should('be.visible');
    checkReflow();
    cy.screenshot('po-9812-order-terms-removal-320px');
  });
});
