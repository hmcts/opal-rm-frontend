import { CHECK_CASE_DETAILS_SUBMISSION as SUBMISSION } from '../../mocks/createDraftCasefile/check-case-details.mock';
import type { IOpalMaintenanceDraftCasefileRequest } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';
import { CreateCasefileSelectors as S } from '../../../../../shared/selectors/create-casefile.selectors';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CASES_CREATE_CASEFILE_INDEXATION_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-indexation-types.constant';
import { CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-payment-arrangements.constant';

/** Exercises intercepted HTTP submission through the real rendered journey. */
export class CheckCaseDetailsActions {
  /** Stubs the create boundary so this journey never sends a live submission. */
  public prepareSubmission(): void {
    cy.intercept('POST', '**/opal-maintenance-service/draft-casefiles', {
      statusCode: 201,
      body: structuredClone(SUBMISSION.receipt),
    }).as('draftSubmission');
  }

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

  /** Submits the accepted case through the real HTTP service. */
  public submit(): void {
    cy.get(S.review.submit).click();
  }

  /** Checks the resolved payload, successful receipt and single create request. */
  public assertConfirmation(): void {
    cy.wait('@draftSubmission').then(({ request, response }) => {
      const payload = request.body as IOpalMaintenanceDraftCasefileRequest;
      expect(response?.statusCode).to.equal(201);
      expect(payload.business_unit_id).to.equal(44);
      expect(payload.casefile_type).to.equal('REMO In');
      expect(payload.casefile.respondent_account.application_code).to.equal('TEST01');
      expect(payload.casefile.respondent_account.respondent.party_details.address).to.deep.equal({
        address_line_1: '1 Test Street',
        cjs_code: 1,
      });
      expect(payload.casefile.applicant.party_details.address).to.deep.equal({
        address_line_1: '2 Test Street',
        cjs_code: 1,
      });
      expect(payload.casefile.applicant.bank_account_details).to.deep.equal({
        bank_account_type: 'None or not applicable',
      });
      expect(payload.casefile.respondent_account.order_details.order_terms).to.deep.equal(
        SUBMISSION.expectedOrderTerms,
      );
      expect(payload).not.to.have.property('taskStatuses');
    });
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.submissionConfirmation);
    cy.get(S.review.confirmationHeading).should('have.text', 'Submission confirmation').and('be.focused');
    cy.get('@draftSubmission.all').should('have.length', 1);
    cy.get(S.primaryNavigation).should('not.exist');
  }

  /** Reloads the confirmation page to verify the existing in-memory journey reset. */
  public refreshConfirmation(): void {
    cy.reload();
  }

  /** Checks that refresh resets the journey without replaying the successful submission. */
  public assertRestartedJourney(): void {
    cy.get(S.caseTypeGroup).should('be.visible');
    cy.get('@draftSubmission.all').should('have.length', 1);
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
    cy.get('@draftSubmission.all').should('have.length', 0);
  }
}
