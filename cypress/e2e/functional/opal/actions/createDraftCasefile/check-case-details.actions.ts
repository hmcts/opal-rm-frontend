import { CHECK_CASE_DETAILS_SUBMISSION as SUBMISSION } from '../../mocks/createDraftCasefile/check-case-details.mock';
import type { IOpalMaintenanceDraftCasefileRequest } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';
import { CreateCasefileSelectors as S } from '../../../../../shared/selectors/create-casefile.selectors';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CASES_CREATE_CASEFILE_INDEXATION_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-indexation-types.constant';
import { CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-payment-arrangements.constant';

/** Exercises intercepted HTTP submission through the real rendered journey. */
export class CheckCaseDetailsActions {
  private expectedSubmissionCount = 0;
  /** Stubs the create boundary so this journey never sends a live submission. */
  public prepareSubmission(): void {
    this.expectedSubmissionCount = 0;
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
    this.expectedSubmissionCount = 1;
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
    cy.get(S.review.confirmationHeading)
      .should('be.focused')
      .and(($heading) => expect($heading.text().trim()).to.equal('You’ve submitted this case for review'));
    cy.get(S.review.confirmationNextSteps).should('have.text', 'Next steps');
    cy.get('@draftSubmission.all').should('have.length', 1);
    cy.get(S.primaryNavigation).should('not.exist');
  }

  /** Activates Create a new case using native keyboard navigation. */
  public startNextCase(): void {
    cy.get(S.review.confirmationHeading).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.review.createNew).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get(S.caseTypeHeading).should('be.focused');
  }

  /** Opens confirmation in a fresh document without a draft in the store. */
  public openFreshConfirmation(): void {
    this.prepareSubmission();
    cy.visit('/' + PATHS.root + '/' + PATHS.children.submissionConfirmation);
  }

  /** Returns through browser history after acceptance. */
  public backFromConfirmation(): void {
    cy.go('back');
  }

  /** Checks that submission leaves an empty journey with no way to resubmit the accepted case. */
  public assertClearedJourneyAfterSubmission(): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.caseType);
    cy.get(S.caseTypeHeading).should('have.text', 'Create a case').and('be.visible');
    cy.get(S.caseTypeGroup).find('input[type="radio"]:checked').should('not.exist');
    cy.get(S.applicantTypeSelectedOption).should('have.text', 'Select');
    cy.get(S.review.submit).should('not.exist');
    cy.get(S.respondentDetails.firstNames).should('not.exist');
    cy.get('@draftSubmission.all').should('have.length', 1);
  }

  /** Checks that direct entry cannot reopen any submitted party form or review page. */
  public assertSubmittedFormsBlocked(): void {
    for (const path of [
      PATHS.children.respondentDetails,
      PATHS.children.applicantIndividual,
      PATHS.children.applicantOrganisation,
      PATHS.children.checkCaseDetails,
    ]) {
      cy.visit('/' + PATHS.root + '/' + path);
      this.assertClearedJourneyAfterSubmission();
    }
  }

  /** Reloads the confirmation page to verify the existing in-memory journey reset. */
  public refreshConfirmation(): void {
    cy.reload();
  }

  /** Checks that refresh resets the journey without replaying the successful submission. */
  public assertRestartedJourney(): void {
    cy.get(S.caseTypeGroup).should('be.visible');
    cy.get('@draftSubmission.all').should('have.length', this.expectedSubmissionCount);
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
    cy.get('@draftSubmission.all').should('have.length', 0);
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
    cy.get('@draftSubmission.all').should('have.length', 0);
    cy.get('@cancelPersistence').should('not.have.been.called');
  }
}
