import { getState } from '@ngrx/signals';
import { createSubmittedReviewState } from './mocks/review.mock';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors } from '../../../shared/selectors/create-casefile.selectors';
import { setupReview, type ReviewStore } from './setup/review.setup';
import { UrlTree } from '@angular/router';

const S = CreateCasefileSelectors.review;

const buildTags = (story = 'PO-9819'): string[] => [
  '@JIRA-STORY:' + story,
  '@JIRA-EPIC:PO-6506',
  '@JIRA-LABEL:create-draft-casefile',
];

describe('Submission confirmation', () => {
  beforeEach(() => {
    const mutation = cy.spy().as('confirmationPersistence');
    cy.intercept(
      { method: '+(POST|PUT|PATCH|DELETE)', url: /\/opal-maintenance-service\/draft-casefiles(?:[/?]|$)/ },
      mutation,
    );
  });

  [1280, 320].forEach((width) => {
    it(
      `AC1, AC2, AC3, AC5. should render confirmation and operate Create a new case at ${width}px`,
      { tags: buildTags() },
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
        cy.press(Cypress.Keyboard.Keys.TAB);
        cy.get(S.createNew).should('be.focused');
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
        cy.get('@confirmationPersistence').should('not.have.been.called');
        cy.get('@routerNavigate').should('have.been.calledOnceWith', '/' + PATHS.root + '/' + PATHS.children.caseType, {
          state: { startNewCase: true, focusCaseTypeHeading: true },
        });
      },
    );
  });

  ['cancelled', 'rejected'].forEach((failure) => {
    it(
      `AC2, AC3, AC5. should preserve the confirmation marker and focus the error after ${failure} new-case navigation`,
      { tags: buildTags() },
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
        cy.get('@confirmationPersistence').should('not.have.been.called');
        cy.get<ReviewStore>('@reviewStore').should((store) =>
          expect(getState(store)).to.deep.equal(createSubmittedReviewState()),
        );
      },
    );
  });

  it(
    'AC2, AC3. should prevent repeated new-case navigation while the first attempt is pending',
    { tags: buildTags() },
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
      cy.get('@confirmationPersistence').should('not.have.been.called');
    },
  );
});

const IN_REVIEW_URL = '/cases/draft/create-and-manage/tabs#in-review';

describe('Check case details accessibility', () => {
  [1280, 320].forEach((width) => {
    it(
      `AC1. should expose both confirmation actions with keyboard navigation at ${width}px`,
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
        cy.get(S.inReview)
          .should('match', 'a')
          .and('contain.text', 'See your cases in review')
          .and('have.attr', 'href', IN_REVIEW_URL);
        cy.press(Cypress.Keyboard.Keys.TAB);
        cy.get(S.createNew).should('be.focused');
        cy.press(Cypress.Keyboard.Keys.TAB);
        cy.get(S.inReview).should('be.focused');
        cy.press(Cypress.Keyboard.Keys.ENTER);
        cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').should((navigate) => {
          expect(navigate).to.have.been.calledOnce;
          const url = navigate.firstCall.args[0];
          expect(url).to.be.instanceOf(UrlTree);
          expect(url.toString()).to.equal(IN_REVIEW_URL);
        });
        cy.get<ReviewStore>('@reviewStore').should((store) =>
          expect(getState(store)).to.deep.equal(createSubmittedReviewState()),
        );
        cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
        cy.checkA11y();
        cy.document().should((document) =>
          expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth),
        );
        cy.screenshot(`po-9819-confirmation-${width}x800`);
        // The review request is verified above; isolate the next action's call count.
        cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').then((navigate) => navigate.resetHistory());
        cy.get(S.createNew).focus().should('be.focused');
        cy.press(Cypress.Keyboard.Keys.ENTER);
        cy.get<ReviewStore>('@reviewStore').should((store) =>
          expect(getState(store)).to.deep.equal(createSubmittedReviewState()),
        );
        cy.get('@routerNavigate').should('have.been.calledOnceWith', '/' + PATHS.root + '/' + PATHS.children.caseType, {
          state: { startNewCase: true, focusCaseTypeHeading: true },
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
