import { CreateCasefileSelectors as S } from '../../../../../shared/selectors/create-casefile.selectors';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { ORDER_DETAILS_MOCK as M } from '../../mocks/createDraftCasefile/order-details.mock';
import { COUNTRIES_RESPONSE } from '../../mocks/createDraftCasefile/countries.mock';

/** Drives the Order Details acceptance journey. */
export class OrderDetailsActions {
  /** Completes the required party pages through the real UI. */
  public completeParties(): void {
    cy.intercept('GET', '**/opal-maintenance-service/countries*', { body: COUNTRIES_RESPONSE });
    cy.intercept('POST', '**/opal-maintenance-service/draft-casefiles', cy.spy().as('draftCreation'));
    cy.visit('/' + PATHS.root + '/' + PATHS.children.caseType);
    cy.get(S.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN)).check();
    cy.get(S.applicantType).select('Individual');
    cy.get(S.continueButton).click();
    cy.get(S.caseDetails.respondentLink).click();
    cy.get(S.respondentDetails.firstNames).type('Synthetic');
    cy.get(S.respondentDetails.lastName).type('Respondent');
    cy.get(S.respondentDetails.addressLine1).type('1 Test Street');
    cy.get(S.respondentDetails.countryAutocomplete).type('United Kingdom').type('{downArrow}{enter}');
    cy.get(S.respondentDetails.returnToCaseDetails).click();
    cy.get(S.caseDetails.respondentStatus).should('contain.text', 'Provided');
    cy.get(S.caseDetails.applicantLink).click();
    cy.get(S.applicantIndividual.firstNames).type('Synthetic');
    cy.get(S.applicantIndividual.lastName).type('Applicant');
    cy.get(S.applicantIndividual.addressLine1).type('2 Test Street');
    cy.get(S.applicantIndividual.countryAutocomplete).type('United Kingdom').type('{downArrow}{enter}');
    cy.get(S.applicantIndividual.bankTypeRadio('none')).check();
    cy.get(S.applicantIndividual.returnToCaseDetails).click();
    cy.get(S.caseDetails.applicantStatus).should('contain.text', 'Provided');
  }
  /** Opens Order Details after the applications response. */
  public openAvailable(): void {
    cy.intercept('GET', '**/opal-maintenance-service/maintenance-applications*', {
      body: structuredClone(M.response),
    }).as('applications');
    cy.get(S.caseDetails.orderDetailsLink).click();
    cy.wait('@applications')
      .its('request.query')
      .should('deep.equal', { application_group: 'Create Casefile', active: 'true' });
    this.assertAvailable();
  }
  /** Saves required values while leaving the optional order date empty. */
  public saveWithoutOrderDate(): void {
    cy.get(S.orderDetails.application).type('TEST01').type('{downArrow}{enter}');
    cy.get(S.orderDetails.paymentFrequency).select('Monthly');
    cy.get(S.orderDetails.dateArrearsLastUpdated).type('01/01/2026');
    cy.get(S.orderDetails.dateOrderMade).should('have.value', '');
    cy.get(S.orderDetails.returnButton).click();
  }
  /** Checks task availability and absence of draft creation. */
  public assertProvided(): void {
    cy.get(S.caseDetails.orderDetailsStatus).should('contain.text', 'Provided');
    cy.get(S.caseDetails.orderTermsLink).should('have.attr', 'href');
    cy.get(S.caseDetails.respondentStatus).should('contain.text', 'Provided');
    cy.get(S.caseDetails.applicantStatus).should('contain.text', 'Provided');
    cy.get('@draftCreation').should('not.have.been.called');
  }
  /** Re-enters the form and verifies a fresh lookup. */
  public reopen(): void {
    cy.get(S.caseDetails.orderDetailsLink).click();
    cy.wait('@applications');
    cy.get('@applications.all').should('have.length', 2);
  }
  /** Checks that all saved values are restored for editing. */
  public assertEditable(): void {
    cy.get(S.orderDetails.application).should('have.value', 'TEST01 - Synthetic application');
    cy.get(S.orderDetails.paymentFrequency).should('have.value', 'Monthly');
    cy.get(S.orderDetails.dateArrearsLastUpdated).should('have.value', '01/01/2026');
    cy.get(S.orderDetails.dateOrderMade).should('have.value', '');
  }
  /** Returns a correlated service failure when entering the form. */
  public openWithFailure(): void {
    cy.intercept('GET', '**/opal-maintenance-service/maintenance-applications*', {
      statusCode: 503,
      body: structuredClone(M.problem),
    }).as('applicationsFailure');
    cy.get(S.caseDetails.orderDetailsLink).click();
    cy.wait('@applicationsFailure');
  }
  /** Checks safe error presentation and preserved parties. */
  public assertSafeFailure(): void {
    cy.get(S.orderDetails.application).should('not.exist');
    cy.get(S.globalErrorBanner)
      .should('be.visible')
      .and('contain.text', 'There was a problem')
      .and('contain.text', 'You can try again. If the problem persists, contact the service desk.')
      .and('contain.text', M.problem.operation_id)
      .and('not.contain.text', M.problem.detail)
      .and('not.contain.text', M.problem.title);
    cy.get(S.liveAnnouncement)
      .should('contain.text', 'There was a problem')
      .and('contain.text', 'You can try again.')
      .and('have.attr', 'aria-atomic', 'true');
    cy.get(S.caseDetails.respondentStatus).should('contain.text', 'Provided');
    cy.get(S.caseDetails.applicantStatus).should('contain.text', 'Provided');
    cy.get('@applicationsFailure.all').should('have.length', 1);
  }
  /** Retries entry using native keyboard activation. */
  public retryUsingKeyboard(): void {
    cy.intercept('GET', '**/opal-maintenance-service/maintenance-applications*', {
      body: structuredClone(M.response),
    }).as('applicationsRetry');
    cy.get(S.caseDetails.orderDetailsLink).focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.wait('@applicationsRetry');
    cy.get('@applicationsRetry.all').should('have.length', 1);
  }
  /** Checks the activated form is available. */
  public assertAvailable(): void {
    cy.get(S.orderDetails.heading).should('have.text', 'Order details');
    cy.get(S.orderDetails.application).should('be.visible').and('not.be.disabled');
    cy.get(S.primaryNavigation).should('not.exist');
  }
  /** Submits the empty form to expose validation. */
  public submitEmpty(): void {
    cy.get(S.orderDetails.returnButton).click();
  }
  /** Checks that validation focuses the linked summary. */
  public assertErrorFocus(): void {
    cy.get(S.errorSummary).should('be.focused').and('contain.text', 'There is a problem');
    cy.get(S.errorSummaryLinks).should('have.length', 3);
  }
  /** Returns an empty lookup and checks that entry is blocked with safe copy. */
  public openEmpty(): void {
    cy.intercept('GET', '**/opal-maintenance-service/maintenance-applications*', {
      body: { count: 0, refData: [] },
    }).as('applicationsEmpty');
    cy.get(S.caseDetails.orderDetailsLink).click();
    cy.wait('@applicationsEmpty');
    cy.get(S.orderDetails.application).should('not.exist');
    cy.get(S.globalErrorBanner)
      .should('contain.text', 'There was a problem')
      .and('contain.text', 'You can try again. If the problem persists, contact the service desk.');
    cy.get(S.liveAnnouncement).should('contain.text', 'There was a problem').and('contain.text', 'You can try again.');
    cy.get(S.caseDetails.respondentStatus).should('contain.text', 'Provided');
    cy.get(S.caseDetails.applicantStatus).should('contain.text', 'Provided');
    cy.get('@applicationsEmpty.all').should('have.length', 1);
  }

  /** Reloads the in-memory journey and checks its existing direct-link guard. */
  public reloadJourney(): void {
    cy.get(S.primaryNavigation).should('not.exist');
    cy.reload();
    cy.get(S.caseTypeGroup).should('be.visible');
    cy.get(S.orderDetails.application).should('not.exist');
    cy.get(S.primaryNavigation).should('not.exist');
  }
}
