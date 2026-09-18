import { Router } from '@angular/router';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors as S } from '../../../shared/selectors/create-casefile.selectors';
import { UNSAVED_CHANGES_WARNING } from '../constants/create-casefile-test-copy.constant';
import { CREDITOR_MAJOR_RESPONSE } from './mocks/creditor.mock';
import { setupCreditor } from './setup/creditor.setup';

const buildTags = (): string[] => ['@JIRA-STORY:PO-9808', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
const scan = () => {
  cy.document().its('documentElement.lang').should('eq', 'en');
  cy.title().should('eq', 'OPAL - Creditor');
  cy.get('main').should('exist');
  cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
  cy.checkA11y();
};

describe('Order term creditor accessibility', () => {
  it('AC1, AC5. should support keyboard choice, conditional focus and Continue', { tags: buildTags() }, () => {
    setupCreditor({ shell: true });
    cy.get(S.creditor.applicant).focus();
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(S.creditor.applicant).should('be.checked').and('be.focused');
    cy.press(Cypress.Keyboard.Keys.DOWN);
    cy.get(S.creditor.major).should('be.checked').and('be.focused');
    cy.get(S.creditor.majorId).should('be.visible');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.creditor.majorId)
      .should('be.focused')
      .select(String(CREDITOR_MAJOR_RESPONSE.refData[0].major_creditor_id));
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.creditor.continueButton).should('be.focused').type('{enter}');
    cy.get<Router>('@angularRouter')
      .its('url')
      .should('eq', '/' + PATHS.root + '/' + PATHS.children.orderTermsSummary);
  });

  it(
    'AC3, AC5. should activate the summary link with Enter and focus the creditor group',
    { tags: buildTags() },
    () => {
      setupCreditor();
      cy.get(S.creditor.continueButton).focus().type('{enter}');
      cy.get(S.errorSummary).should('be.focused');
      cy.get(S.errorSummaryLinks).contains('Select a creditor').focus();
      cy.press(Cypress.Keyboard.Keys.ENTER);
      cy.get(S.creditor.applicant).should('be.focused');
      cy.get(S.creditor.choiceFieldset).find('legend').should('contain.text', 'Select creditor');
    },
  );

  it('AC4, AC5. should activate Cancel independently with Enter', { tags: buildTags() }, () => {
    setupCreditor();
    cy.get(S.creditor.applicant).check();
    cy.on('window:confirm', (message) => {
      expect(message).to.eq(UNSAVED_CHANGES_WARNING);
      return false;
    });
    cy.get(S.creditor.cancel).focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get<Router>('@angularRouter')
      .its('url')
      .should('eq', '/' + PATHS.root + '/' + PATHS.children.orderTermCreditor);
    cy.get(S.creditor.applicant).should('be.checked');
  });

  it(
    'AC5. should pass strict Axe scans with the Major conditional hidden and visible, and after validation',
    { tags: buildTags() },
    () => {
      setupCreditor({ shell: true });
      scan();
      cy.get(S.creditor.major)
        .should('have.attr', 'aria-controls', 'create_casefile_order_term_creditor_major')
        .and('not.have.attr', 'aria-expanded');
      cy.get(S.creditor.major).check();
      cy.get(S.creditor.majorId).should('be.visible');
      scan();
      cy.screenshot('po-9808-after-creditor-initial');
      cy.get(S.creditor.continueButton).click();
      cy.get(S.errorSummary).should('be.focused');
      scan();
      cy.screenshot('po-9808-after-creditor-validation');
    },
  );

  it('AC5. should pass Axe on the details destination', { tags: buildTags() }, () => {
    setupCreditor({ shell: true });
    cy.get(S.creditor.addNew).check();
    cy.get(S.creditor.continueButton).click();
    cy.title().should('eq', 'OPAL - Minor creditor details');
    cy.get('main').should('exist');
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
    cy.screenshot('po-9808-after-minor-creditor-details');
  });

  it('AC5. should reflow at 320 CSS pixels without horizontal document overflow', { tags: buildTags() }, () => {
    cy.viewport(320, 900);
    setupCreditor({ shell: true, seedFiveMinorCreditors: true });
    cy.get(S.creditor.major).check();
    cy.get(S.creditor.majorId).should('be.visible');
    cy.document().then((document) => {
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
    });
    cy.get(S.creditor.continueButton).should('be.visible');
    cy.get(S.creditor.cancel).should('be.visible');
    cy.screenshot('po-9808-after-creditor-major-320px');
  });
});
