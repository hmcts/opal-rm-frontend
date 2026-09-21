import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors as S } from '../../../shared/selectors/create-casefile.selectors';
import { setupOrderTerms } from '../orderTerms/setup/order-terms.setup';
import { SUMMARY_CREDITORS, SUMMARY_TERMS } from './mocks/order-terms-summary.mock';

const buildTags = (): string[] => ['@JIRA-STORY:PO-9811', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
const setupSummary = () =>
  setupOrderTerms({
    initialChild: PATHS.children.orderTermsSummary,
    acceptedTerms: SUMMARY_TERMS,
    minorCreditors: SUMMARY_CREDITORS,
  });

describe('Order terms summary accessibility', () => {
  it('AC5. should have no detected Axe violations when populated and expanded', { tags: buildTags() }, () => {
    setupSummary();
    cy.get(S.orderTermsSummary.creditorToggle(1)).click();
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  it('AC5. should reflow without horizontal document scrolling at 320 CSS pixels', { tags: buildTags() }, () => {
    cy.viewport(320, 900);
    setupSummary();
    cy.get(S.orderTermsSummary.cards).should('have.length', 2);
    cy.document().should((document) => {
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
    });
  });
});
