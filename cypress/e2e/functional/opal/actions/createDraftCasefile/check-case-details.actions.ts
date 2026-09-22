import { CreateCasefileSelectors as S } from '../../../../../shared/selectors/create-casefile.selectors';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CASES_CREATE_CASEFILE_INDEXATION_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-indexation-types.constant';
import { CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-payment-arrangements.constant';

/** Exercises the explicit local mock through the real rendered journey. */
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
    cy.get(S.review.notice).should('contain.text', 'Local mock');
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

  /** Checks the synthetic receipt and absence of backend creation. */
  public assertReceipt(): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.submissionConfirmation);
    cy.get(S.review.receiptHeading).should('have.text', 'Mock submission complete').and('be.focused');
    cy.get(S.review.receipt).should('have.text', 'MOCK-9817-1');
    cy.get('@draftCreation').should('not.have.been.called');
    cy.get(S.primaryNavigation).should('not.exist');
  }

  /** Reloads the receipt page to exercise in-memory receipt expiry. */
  public refreshReceipt(): void {
    cy.reload();
  }

  /** Checks that refresh cannot replay or recover a transient receipt. */
  public assertExpiredReceipt(): void {
    cy.get(S.caseTypeGroup).should('be.visible');
    cy.get(S.review.receipt).should('not.exist');
    cy.get('@draftCreation').should('not.have.been.called');
    cy.get(S.primaryNavigation).should('not.exist');
  }

  /** Opens the existing cancellation boundary and returns to review. */
  public cancel(): void {
    cy.get(S.review.cancel).click();
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.cancel);
    cy.get(S.caseDetails.backLink).click();
    cy.get(S.caseDetails.checkCaseButton).click();
  }

  /** Checks that cancellation navigation has retained the accepted draft. */
  public assertRetainedDraft(): void {
    cy.get(S.review.section('respondent')).should('contain.text', 'Synthetic');
    cy.get('@draftCreation').should('not.have.been.called');
  }
}
