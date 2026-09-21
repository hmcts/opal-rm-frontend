import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors as S } from '../../../shared/selectors/create-casefile.selectors';
import { setupOrderTerms } from '../orderTerms/setup/order-terms.setup';
import { SUMMARY_CREDITORS, SUMMARY_TERMS } from './mocks/order-terms-summary.mock';

const buildTags = (): string[] => ['@JIRA-STORY:PO-9811', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
const setupSummary = (populated = true, longNonUk = false) =>
  setupOrderTerms({
    initialChild: PATHS.children.orderTermsSummary,
    acceptedTerms: populated
      ? longNonUk
        ? [SUMMARY_TERMS[0], { ...SUMMARY_TERMS[1], creditor: { type: 'minor', sequenceNumber: 2 } }]
        : SUMMARY_TERMS
      : [],
    minorCreditors: populated ? SUMMARY_CREDITORS : [],
  });

describe('Order terms summary accessibility', () => {
  it('AC5. should have no detected Axe violations when empty', { tags: buildTags() }, () => {
    setupSummary(false);
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  it('AC5. should have no detected Axe violations when populated and collapsed', { tags: buildTags() }, () => {
    setupSummary();
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  it('AC5. should have no detected Axe violations when populated and expanded', { tags: buildTags() }, () => {
    setupSummary();
    cy.get(S.orderTermsSummary.creditorToggle(1)).click();
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  it('AC5. should have no detected Axe violations with non-UK details expanded', { tags: buildTags() }, () => {
    setupSummary(true, true);
    cy.get(S.orderTermsSummary.creditorToggle(2)).click();
    cy.get(S.orderTermsSummary.creditorDetails(2))
      .should('be.visible')
      .and('contain.text', 'Synthetic international bank with a deliberately long descriptive name');
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  it('AC5. should have no detected Axe violations on the removal placeholder', { tags: buildTags() }, () => {
    setupSummary();
    cy.get(S.orderTermsSummary.remove(2)).click();
    cy.get(S.orderTerms.heading).should('have.text', 'Remove order term');
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  it('AC5. should reflow without horizontal document scrolling at 320 CSS pixels', { tags: buildTags() }, () => {
    cy.viewport(320, 900);
    setupSummary(true, true);
    cy.get(S.orderTermsSummary.cards).should('have.length', 2);
    cy.document().should((document) => {
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
    });
    cy.screenshot('po-9811-order-terms-summary-320px');
    cy.get(S.orderTermsSummary.creditorToggle(2)).click();
    cy.get(S.orderTermsSummary.creditorDetails(2))
      .should('be.visible')
      .and('contain.text', 'SYNTHETIC-LONG-PAYMENT-REFERENCE-00000001');
    cy.document().should((document) => {
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
    });
    cy.screenshot('po-9811-order-terms-summary-expanded-320px');
  });

  it('AC5. should reflow on the removal placeholder at 320 CSS pixels', { tags: buildTags() }, () => {
    cy.viewport(320, 900);
    setupSummary();
    cy.get(S.orderTermsSummary.remove(2)).click();
    cy.get(S.orderTerms.heading).should('have.text', 'Remove order term');
    cy.document().should((document) => {
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
    });
    cy.screenshot('po-9811-order-terms-remove-320px');
  });
});
