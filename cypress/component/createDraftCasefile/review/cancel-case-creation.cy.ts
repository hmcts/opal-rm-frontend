import { getState } from '@ngrx/signals';
import { CASES_CREATE_CASEFILE_STATE } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-state.constant';
import { createCasesCreateCasefileCancellationState } from 'src/app/flows/cases/cases-create-casefile/mocks/cases-create-casefile-cancellation-state.mock';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import type { CasesCreateCasefileReviewNavigationService } from 'src/app/flows/cases/cases-create-casefile/services/cases-create-casefile-review-navigation.service';
import { CreateCasefileSelectors } from '../../../shared/selectors/create-casefile.selectors';
import { CANCEL_CASE_CREATION_COPY as COPY } from './constants/cancel-case-creation-copy.constant';
import { setupCancellation, type CancelStore } from './setup/cancel-case-creation.setup';

const S = CreateCasefileSelectors.cancellation;
const buildTags = (): string[] => ['@JIRA-STORY:PO-9818', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
const route = (child: string): string => '/' + PATHS.root + '/' + child;
const axeTags = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
const scan = (): void => {
  cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
  cy.checkA11y(undefined, { runOnly: { type: 'tag', values: axeTags } });
};

describe('Cancel case creation', () => {
  it('AC1, AC4. should render the exact cancellation content without clearing data', { tags: buildTags() }, () => {
    setupCancellation();

    cy.get(S.heading).should('have.text', COPY.heading).and('be.focused');
    cy.get(S.warning)
      .invoke('text')
      .then((text) => expect(text.trim()).to.eq(COPY.warning));
    cy.get(S.confirm).should('contain.text', COPY.confirm).and('have.class', 'govuk-button--warning');
    cy.get(S.back).should('have.text', COPY.back);
    cy.get<CancelStore>('@cancelStore').should((store) =>
      expect(getState(store)).to.deep.equal(createCasesCreateCasefileCancellationState()),
    );
    cy.get('@cancelRouterNavigate').should('not.have.been.called');
  });

  it('AC2, AC4. should discard every case value through the rendered action', { tags: buildTags() }, () => {
    setupCancellation();
    cy.get<CasesCreateCasefileReviewNavigationService>('@cancelReviewNavigation').then((navigation) =>
      navigation.setContext({ origin: 'review', section: 'commentsAndNotes' }),
    );

    cy.get(S.confirm).click();

    cy.get<CancelStore>('@cancelStore').should((store) =>
      expect(getState(store)).to.deep.equal(CASES_CREATE_CASEFILE_STATE),
    );
    cy.get<CasesCreateCasefileReviewNavigationService>('@cancelReviewNavigation').should(
      (navigation) => expect(navigation.context()).to.be.null,
    );
    cy.get('@cancelRouterNavigate').should('have.been.calledWith', route(PATHS.children.caseType), {
      state: { focusCaseTypeHeading: true },
    });
  });

  it('AC3, AC4. should return to review without losing case values', { tags: buildTags() }, () => {
    setupCancellation();

    cy.get(S.back).click();

    cy.get<CancelStore>('@cancelStore').should((store) =>
      expect(getState(store)).to.deep.equal(createCasesCreateCasefileCancellationState()),
    );
    cy.get('@cancelRouterNavigate').should('have.been.calledWith', route(PATHS.children.checkCaseDetails));
  });

  it('AC2, AC4. should retry failed deletion navigation without resetting twice', { tags: buildTags() }, () => {
    setupCancellation({ failNavigation: true });

    cy.get(S.confirm).click();
    cy.get(S.error).should('be.focused').and('have.attr', 'role', 'alert');
    cy.get(S.confirm).should('contain.text', COPY.confirm).and('not.have.class', 'govuk-button--warning');
    cy.get(S.back).should('not.exist');
    cy.get<CancelStore>('@cancelStore').should((store) =>
      expect(getState(store)).to.deep.equal(CASES_CREATE_CASEFILE_STATE),
    );

    cy.get<Cypress.Agent<sinon.SinonStub>>('@cancelRouterNavigate').then((navigate) => navigate.resolves(true));
    cy.get(S.confirm).focus().type('{enter}');
    cy.get('@cancelRouterNavigate').should('have.been.calledTwice');
    cy.get('@cancelStoreReset').should('have.been.calledOnce');
    cy.get('@cancelReviewContextClear').should('have.been.calledOnce');
    cy.get(S.error).should('not.exist');
    cy.get<CancelStore>('@cancelStore').should((store) =>
      expect(getState(store)).to.deep.equal(CASES_CREATE_CASEFILE_STATE),
    );
  });

  it('AC3, AC4. should retry failed return navigation while retaining every case value', { tags: buildTags() }, () => {
    setupCancellation({ failNavigation: true });

    cy.get(S.back).click();
    cy.get(S.error).should('be.focused').and('have.attr', 'role', 'alert');
    cy.get(S.confirm).should('contain.text', COPY.confirm);
    cy.get(S.back).should('be.visible');
    cy.get<CancelStore>('@cancelStore').should((store) =>
      expect(getState(store)).to.deep.equal(createCasesCreateCasefileCancellationState()),
    );

    cy.get<Cypress.Agent<sinon.SinonStub>>('@cancelRouterNavigate').then((navigate) => navigate.resolves(true));
    cy.get(S.back).click();
    cy.get('@cancelRouterNavigate').should('have.been.calledTwice');
    cy.get(S.error).should('not.exist');
    cy.get<CancelStore>('@cancelStore').should((store) =>
      expect(getState(store)).to.deep.equal(createCasesCreateCasefileCancellationState()),
    );
  });
});

describe('Cancel case creation accessibility', () => {
  it('AC5. should focus the heading and reach Go back in visual order', { tags: buildTags() }, () => {
    setupCancellation();

    cy.get(S.heading).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.confirm).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.back).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get('@cancelRouterNavigate').should('have.been.calledWith', route(PATHS.children.checkCaseDetails));
  });

  it('AC2, AC5. should activate deletion with Space', { tags: buildTags() }, () => {
    setupCancellation();

    cy.get(S.heading).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.confirm).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get<CancelStore>('@cancelStore').should((store) =>
      expect(getState(store)).to.deep.equal(CASES_CREATE_CASEFILE_STATE),
    );
  });

  it('AC2, AC5. should activate deletion with Enter', { tags: buildTags() }, () => {
    setupCancellation();

    cy.get(S.confirm).focus().type('{enter}');
    cy.get<CancelStore>('@cancelStore').should((store) =>
      expect(getState(store)).to.deep.equal(CASES_CREATE_CASEFILE_STATE),
    );
  });

  it('AC5. should pass Axe at the normal 1440px cancellation layout', { tags: buildTags() }, () => {
    cy.viewport(1440, 900);
    setupCancellation();
    cy.get(S.heading).should('be.visible');
    scan();
    cy.screenshot('po-9818-cancellation-1440px');
  });

  it('AC5. should pass Axe at the supplied 1024px cancellation layout', { tags: buildTags() }, () => {
    cy.viewport(1024, 900);
    setupCancellation();
    cy.get(S.heading).should('be.visible');
    scan();
    cy.screenshot('po-9818-cancellation-1024px');
  });

  it(
    'AC5. should have no detected Axe violations after failed deletion navigation recovery',
    { tags: buildTags() },
    () => {
      setupCancellation({ failNavigation: true });
      scan();
      cy.get(S.confirm).click();
      cy.get(S.error).should('be.focused').and('have.attr', 'role', 'alert');
      cy.get(S.error).should('contain.text', COPY.navigationError);
      cy.get(S.back).should('not.exist');
      cy.get(S.confirm).should('contain.text', COPY.confirm).and('not.have.class', 'govuk-button--warning');
      scan();
      cy.screenshot('po-9818-cancellation-recovery');

      cy.get<Cypress.Agent<sinon.SinonStub>>('@cancelRouterNavigate').then((navigate) => navigate.resolves(true));
      cy.get(S.confirm).focus().type('{enter}');
      cy.get('@cancelRouterNavigate').should('have.been.calledTwice');
    },
  );

  it(
    'AC3, AC5. should focus the failed-return alert while retaining data and both actions',
    { tags: buildTags() },
    () => {
      setupCancellation({ failNavigation: true });
      cy.get(S.back).click();
      cy.get(S.error).should('be.focused').and('have.attr', 'role', 'alert');
      cy.get(S.confirm).should('contain.text', COPY.confirm);
      cy.get(S.back).should('be.visible');
      cy.get<CancelStore>('@cancelStore').should((store) =>
        expect(getState(store)).to.deep.equal(createCasesCreateCasefileCancellationState()),
      );
      scan();
      cy.screenshot('po-9818-cancellation-back-recovery');
    },
  );

  it('AC5. should reflow at 320 CSS pixels without horizontal overflow', { tags: buildTags() }, () => {
    cy.viewport(320, 900);
    setupCancellation();
    cy.get(S.confirm).should('be.visible');
    cy.get(S.back).should('be.visible');
    cy.document().should((document) =>
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth),
    );
    cy.screenshot('po-9818-cancellation-320px');
  });
});
