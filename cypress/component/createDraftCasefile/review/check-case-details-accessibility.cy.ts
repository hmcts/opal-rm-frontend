import { CreateCasefileSelectors } from '../../../shared/selectors/create-casefile.selectors';
import { setupReview } from './setup/review.setup';

const S = CreateCasefileSelectors.review;
const buildTags = (): string[] => ['@JIRA-STORY:PO-9817', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];

describe('Check case details accessibility', () => {
  it(
    'AC6. should have no detected Axe violations in the valid review and expanded bank disclosure',
    { tags: buildTags() },
    () => {
      setupReview();
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
      cy.get(S.change('applicant')).focus();
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.bankToggle).should('be.focused');
      cy.press(Cypress.Keyboard.Keys.SPACE);
      cy.get(S.bankDetails).should('have.attr', 'open');
      cy.checkA11y();
    },
  );

  it(
    'AC2, AC6. should announce and focus navigation errors without detected Axe violations',
    { tags: buildTags() },
    () => {
      setupReview({ failNavigation: true });
      cy.get(S.submit).click();
      cy.get(S.errors).should('be.focused').and('have.attr', 'role', 'alert');
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
      cy.screenshot('po-9817-review-navigation-error');
    },
  );

  it('AC6. should reflow before and after disclosure at 320 CSS pixels', { tags: buildTags() }, () => {
    cy.viewport(320, 900);
    setupReview();
    cy.get(S.heading).should('be.visible');
    cy.document().should((document) =>
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth),
    );
    cy.screenshot('po-9817-review-collapsed-320px');
    cy.get(S.bankToggle).click();
    cy.get(S.bankDetails).should('have.attr', 'open');
    cy.document().should((document) =>
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth),
    );
    cy.screenshot('po-9817-review-expanded-320px');
  });

  it('AC6. should identify simulated submission accessibly', { tags: buildTags() }, () => {
    setupReview({ confirmation: true });
    cy.get(S.confirmationHeading).should('have.text', 'Submission confirmation').and('be.focused');
    cy.contains('This is a simulated submission. No case has been saved or submitted for review.').should('be.visible');
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
    cy.screenshot('po-9817-submission-confirmation');
  });
});
