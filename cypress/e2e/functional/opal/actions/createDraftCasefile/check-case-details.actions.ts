import { CreateCasefileSelectors as S } from '../../../../../shared/selectors/create-casefile.selectors';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CASES_CREATE_CASEFILE_INDEXATION_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-indexation-types.constant';
import { CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-payment-arrangements.constant';

/** Exercises the simulated submission through the real rendered journey. */
export class CheckCaseDetailsActions {
  /** Completes the remaining mandatory tasks before opening review. */
  public completeRemainingTasks(): void {
    cy.get(S.orderTerms.return).click();
    cy.get(S.caseDetails.interestAndIndexationLink).click();
    cy.get(S.interestAndIndexation.interestRadio(false)).check();
    cy.get(S.interestAndIndexation.indexationRadio(CASES_CREATE_CASEFILE_INDEXATION_TYPES.NONE)).check();
    cy.get(S.interestAndIndexation.returnToCaseDetails).click();
    cy.get(S.caseDetails.managingPaymentsLink).click();
    cy.get(S.managingPayments.paymentArrangementRadio(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT)).check();
    cy.get(S.managingPayments.returnToCaseDetails).click();
    cy.get(S.caseDetails.checkCaseButton).click();
    cy.get(S.review.heading).should('have.text', 'Check case details');
  }

  /** Saves a respondent correction from its contextual review action. */
  public correctRespondent(): void {
    cy.get(S.review.change('respondent')).click();
    cy.get(S.respondentDetails.firstNames).clear().type('Corrected synthetic');
    cy.get(S.respondentDetails.returnToCaseDetails).click();
  }

  /** Checks the saved correction, unaffected terms and return focus. */
  public assertCorrection(): void {
    cy.get(S.review.section('respondent')).should('contain.text', 'Corrected synthetic');
    cy.get(S.review.section('orderTerms')).should('contain.text', '£10.00').and('contain.text', '£20.00');
    cy.get(S.review.section('respondent')).should('be.focused');
  }

  /** Activates the mock submission once. */
  public submit(): void {
    cy.get(S.review.submit).click();
  }

  /** Checks the simulated confirmation and absence of backend creation. */
  public assertConfirmation(): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.submissionConfirmation);
    cy.get(S.review.confirmationHeading)
      .should('be.focused')
      .and(($heading) => expect($heading.text().trim()).to.equal('You’ve submitted this case for review'));
    cy.get('h1').should('have.length', 1);
    cy.get(S.review.confirmationNextSteps).should('have.text', 'Next steps');
    cy.screenshot('po-9819-full-app-confirmation');
    cy.get(S.review.createNew)
      .should('contain.text', 'Create a new case')
      .and('have.attr', 'href', '/' + PATHS.root + '/' + PATHS.children.caseType);
    cy.get(S.review.inReview)
      .should('contain.text', 'See your cases in review')
      .and('have.attr', 'href', '/' + PATHS.root + '/' + PATHS.children.caseType);
    cy.get('@draftCreation').should('not.have.been.called');
    cy.get(S.primaryNavigation).should('not.exist');
  }

  /**
   * Activates the selected next step using native keyboard navigation.
   * @param link confirmation link to activate
   */
  public startNextCase(link: 'Create a new case' | 'See your cases in review'): void {
    const selector = link === 'Create a new case' ? S.review.createNew : S.review.inReview;
    cy.get(S.review.confirmationHeading).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    if (link === 'See your cases in review') cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(selector).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.ENTER);
  }

  /** Opens confirmation in a fresh document without recorded completion. */
  public openFreshConfirmation(): void {
    cy.intercept('POST', '**/opal-maintenance-service/draft-casefiles', cy.spy().as('draftCreation'));
    cy.visit('/' + PATHS.root + '/' + PATHS.children.submissionConfirmation);
  }

  /** Returns through browser history after acceptance. */
  public backFromConfirmation(): void {
    cy.go('back');
  }

  /** Reloads the confirmation page to verify the existing in-memory journey reset. */
  public refreshConfirmation(): void {
    cy.reload();
  }

  /** Checks that refresh uses the existing journey reset without sending a submission. */
  public assertRestartedJourney(): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.caseType);
    cy.get(S.caseTypeGroup).should('be.visible');
    cy.get(S.caseTypeRadios).should('not.be.checked');
    cy.get('@draftCreation').should('not.have.been.called');
    cy.get(S.primaryNavigation).should('not.exist');
  }

  /** Opens the cancellation page without persisting the local case. */
  public openCancellation(): void {
    const mutation = cy.spy().as('cancelPersistence');
    cy.intercept(
      { method: '+(POST|PUT|PATCH|DELETE)', url: /\/opal-maintenance-service\/draft-casefiles(?:[/?]|$)/ },
      mutation,
    );
    cy.get(S.review.cancel).click();
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.cancel);
    cy.get(S.cancellation.heading).should('have.text', 'Cancel case creation').and('be.focused');
  }

  /** Opens cancellation and returns directly to the reviewed draft. */
  public cancel(): void {
    this.openCancellation();
    cy.get(S.cancellation.back).click();
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.checkCaseDetails);
    cy.get(S.review.heading).should('be.focused');
    cy.get('@cancelPersistence').should('not.have.been.called');
  }

  /** Confirms that the local case should be discarded. */
  public discard(): void {
    cy.get(S.cancellation.confirm).click();
  }

  /** Checks that cancellation starts a fresh case without persistence. */
  public assertFreshCase(): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.caseType);
    cy.get(S.caseTypeHeading).should('have.text', 'Create a case').and('be.focused');
    cy.get(S.caseTypeGroup).find('input[type="radio"]:checked').should('not.exist');
    cy.get(S.applicantTypeSelectedOption).should('have.text', 'Select');
    cy.get('@draftCreation').should('not.have.been.called');
    cy.get('@cancelPersistence').should('not.have.been.called');
  }

  /** Checks that Back and Forward cannot recover the discarded case. */
  public assertHistoryStaysEmpty(): void {
    cy.go('back');
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.caseType);
    cy.get(S.caseTypeGroup).find('input[type="radio"]:checked').should('not.exist');
    cy.go('forward');
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.caseType);
    cy.get(S.caseTypeGroup).find('input[type="radio"]:checked').should('not.exist');
    cy.get('@cancelPersistence').should('not.have.been.called');
  }

  /** Checks that cancellation navigation has retained the accepted draft. */
  public assertRetainedDraft(): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.checkCaseDetails);
    cy.get(S.review.section('respondent')).should('contain.text', 'Synthetic');
    cy.get(S.review.section('orderTerms')).should('contain.text', '£10.00').and('contain.text', '£20.00');
    cy.get('@draftCreation').should('not.have.been.called');
    cy.get('@cancelPersistence').should('not.have.been.called');
  }
}
