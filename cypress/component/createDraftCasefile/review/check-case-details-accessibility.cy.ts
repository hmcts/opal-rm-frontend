import { getState } from '@ngrx/signals';
import { createSubmittedReviewState } from './mocks/review.mock';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors } from '../../../shared/selectors/create-casefile.selectors';
import { setupReview, type ReviewStore } from './setup/review.setup';

const S = CreateCasefileSelectors.review;
const buildTags = (story = 'PO-9817'): string[] => [
  '@JIRA-STORY:' + story,
  '@JIRA-EPIC:PO-6506',
  '@JIRA-LABEL:create-draft-casefile',
];

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
      cy.get(S.change('respondent')).click();
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

  [1280, 320].forEach((width) => {
    it(
      `AC1. should expose only the available confirmation action at ${width}px`,
      { tags: buildTags('PO-9819') },
      () => {
        cy.viewport(width, 800);
        setupReview({ confirmation: true });
        cy.get<ReviewStore>('@reviewStore').should((store) =>
          expect(getState(store)).to.deep.equal(createSubmittedReviewState()),
        );
        cy.get(S.confirmationHeading)
          .should('be.focused')
          .and(($heading) => expect($heading.text().trim()).to.equal('You’ve submitted this case for review'));
        cy.get('h1').should('have.length', 1);
        cy.get(S.confirmationNextSteps).should('have.text', 'Next steps');
        cy.get(S.createNew)
          .should('contain.text', 'Create a new case')
          .and('have.attr', 'href', '/' + PATHS.root + '/' + PATHS.children.caseType);
        cy.get(S.inReview).should(($text) => {
          expect($text).to.contain.text('See your cases in review');
          expect($text).not.to.have.attr('href');
          expect($text).not.to.have.attr('tabindex');
          expect($text).not.to.match('a, button, [role="link"], [role="button"]');
        });
        cy.press(Cypress.Keyboard.Keys.TAB);
        cy.get(S.createNew).should('be.focused');
        cy.press(Cypress.Keyboard.Keys.TAB);
        cy.get(S.inReview).should('not.be.focused');
        cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
        cy.checkA11y();
        cy.document().should((document) =>
          expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth),
        );
        cy.screenshot(`po-9819-confirmation-${width}x800`);
        cy.get(S.createNew).focus();
        cy.press(Cypress.Keyboard.Keys.ENTER);
        cy.get<ReviewStore>('@reviewStore').should((store) =>
          expect(getState(store)).to.deep.equal(createSubmittedReviewState()),
        );
        cy.get('@routerNavigate').should('have.been.calledOnceWith', '/' + PATHS.root + '/' + PATHS.children.caseType, {
          state: { startNewCase: true },
        });
      },
    );
  });

  ['cancelled', 'rejected'].forEach((failure) => {
    it(
      `AC1. should preserve the case and focus the error after ${failure} new-case navigation`,
      { tags: buildTags('PO-9819') },
      () => {
        setupReview({ confirmation: true, failNavigation: true });
        if (failure === 'rejected') {
          cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').then((navigate) =>
            navigate.rejects(new Error('Synthetic navigation rejection')),
          );
        }
        cy.get(S.createNew).focus();
        cy.press(Cypress.Keyboard.Keys.ENTER);
        cy.get(S.confirmationError)
          .should('be.focused')
          .and('contain.text', 'The page could not be opened. Try again.');
        cy.get<ReviewStore>('@reviewStore').should((store) =>
          expect(getState(store)).to.deep.equal(createSubmittedReviewState()),
        );
        cy.get(S.createNew).should('not.have.attr', 'aria-disabled', 'true');
        cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
        cy.checkA11y();
        cy.screenshot(`po-9819-confirmation-new-case-${failure}`);
        cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').then((navigate) => navigate.resolves(true));
        cy.get(S.createNew).focus();
        cy.press(Cypress.Keyboard.Keys.ENTER);
        cy.get(S.confirmationError).should('not.exist');
        cy.get('@routerNavigate').should('have.been.calledTwice');
        cy.get<ReviewStore>('@reviewStore').should((store) =>
          expect(getState(store)).to.deep.equal(createSubmittedReviewState()),
        );
      },
    );
  });

  it(
    'AC1. should prevent repeated new-case navigation while the first attempt is pending',
    { tags: buildTags('PO-9819') },
    () => {
      let finishNavigation!: (success: boolean) => void;
      const pending = new Cypress.Promise<boolean>((resolve) => {
        finishNavigation = resolve;
      });
      setupReview({ confirmation: true });
      cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').then((navigate) => navigate.returns(pending));
      cy.get(S.createNew).click();
      cy.get(S.createNew).should('have.attr', 'aria-disabled', 'true').click();
      cy.get('@routerNavigate').should('have.been.calledOnce');
      cy.get<ReviewStore>('@reviewStore').should((store) =>
        expect(getState(store)).to.deep.equal(createSubmittedReviewState()),
      );
      cy.then(() => finishNavigation(false));
      cy.get(S.confirmationError).should('be.focused');
      cy.get(S.createNew).should('not.have.attr', 'aria-disabled', 'true');
    },
  );
});
