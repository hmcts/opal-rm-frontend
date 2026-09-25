import { getState } from '@ngrx/signals';
import { CASES_CREATE_CASEFILE_STATE } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-state.constant';
import { createCasesCreateCasefileCancellationState } from 'src/app/flows/cases/cases-create-casefile/mocks/cases-create-casefile-cancellation-state.mock';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import type { CasesCreateCasefileReviewNavigationService } from 'src/app/flows/cases/cases-create-casefile/services/cases-create-casefile-review-navigation.service';
import { CreateCasefileSelectors } from '../../../shared/selectors/create-casefile.selectors';
import { setupCancellation, type CancelStore } from './setup/cancel-case-creation.setup';

const S = CreateCasefileSelectors.cancellation;
const buildTags = (): string[] => ['@JIRA-STORY:PO-9818', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];
const route = (child: string): string => '/' + PATHS.root + '/' + child;

describe('Cancel case creation', () => {
  it('AC1, AC4. should render the exact cancellation content without clearing data', { tags: buildTags() }, () => {
    setupCancellation();

    cy.get(S.heading).should('have.text', 'Cancel case creation').and('be.focused');
    cy.get(S.warning)
      .invoke('text')
      .then((text) =>
        expect(text.trim()).to.eq('If you continue, all of the details added for this case will be lost.'),
      );
    cy.get(S.confirm)
      .should('contain.text', 'Continue and delete all details')
      .and('have.class', 'govuk-button--warning');
    cy.get(S.back).should('have.text', 'Go back');
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
    cy.get(S.confirm)
      .should('contain.text', 'Continue and delete all details')
      .and('not.have.class', 'govuk-button--warning');
    cy.get(S.back).should('not.exist');
    cy.get<CancelStore>('@cancelStore').should((store) =>
      expect(getState(store)).to.deep.equal(CASES_CREATE_CASEFILE_STATE),
    );

    cy.get<Cypress.Agent<sinon.SinonStub>>('@cancelRouterNavigate').then((navigate) => navigate.resolves(true));
    cy.get(S.confirm).focus().type('{enter}');
    cy.get('@cancelRouterNavigate').should('have.been.calledTwice');
    cy.get(S.error).should('not.exist');
    cy.get<CancelStore>('@cancelStore').should((store) =>
      expect(getState(store)).to.deep.equal(CASES_CREATE_CASEFILE_STATE),
    );
  });

  it('AC3, AC4. should retry failed return navigation while retaining every case value', { tags: buildTags() }, () => {
    setupCancellation({ failNavigation: true });

    cy.get(S.back).click();
    cy.get(S.error).should('be.focused').and('have.attr', 'role', 'alert');
    cy.get(S.confirm).should('contain.text', 'Continue and delete all details');
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
