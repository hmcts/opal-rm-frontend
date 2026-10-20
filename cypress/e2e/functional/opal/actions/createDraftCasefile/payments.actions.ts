import { CreateCasefileSelectors as S } from '../../../../../shared/selectors/create-casefile.selectors';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CASES_CREATE_CASEFILE_INDEXATION_TYPES as INDEXATION } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-indexation-types.constant';
import { CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS as ARRANGEMENTS } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-payment-arrangements.constant';

/** Exercises payment choices through the rendered journey without submitting the casefile. */
export class PaymentsActions {
  /** Requires both payment tasks to be available and incomplete in this independent draft. */
  public assertReady(): void {
    cy.get(S.caseDetails.interestAndIndexationStatus).should('contain.text', 'Required');
    cy.get(S.caseDetails.managingPaymentsStatus).should('contain.text', 'Required');
    cy.get(S.caseDetails.interestAndIndexationLink).should('have.attr', 'href');
    cy.get(S.caseDetails.managingPaymentsLink).should('have.attr', 'href');
    this.assertNoSubmission();
  }

  /** Opens or reopens Interest and Indexation using native keyboard link activation. */
  public openInterest(): void {
    cy.get(S.caseDetails.interestAndIndexationLink).focus().should('be.focused');
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.interestAndIndexation);
    cy.get(S.interestAndIndexation.heading).should('have.text', 'Interest and indexation');
  }

  /** Selects both decisions, including the selection-only Other option.
   * @param interest Whether interest applies, expressed as Yes or No.
   * @param indexation Controlled indexation value from the scenario.
   */
  public chooseInterest(interest: string, indexation: string): void {
    expect(['Yes', 'No'], 'Supported interest decision').to.include(interest);
    expect(Object.values(INDEXATION), 'Supported indexation choice').to.include(indexation);
    cy.get(S.interestAndIndexation.interestRadio(interest === 'Yes')).check();
    cy.get(S.interestAndIndexation.indexationRadio(indexation)).check();
  }

  /** Proves radio activation and native Tab movement between both groups and the save button. */
  public chooseInterestUsingKeyboard(): void {
    cy.get(S.interestAndIndexation.interestRadio(false)).focus();
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(S.interestAndIndexation.interestRadio(false)).should('be.checked').and('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.interestAndIndexation.indexationRadio(INDEXATION.RPI)).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(S.interestAndIndexation.indexationRadio(INDEXATION.RPI)).should('be.checked').and('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.interestAndIndexation.returnToCaseDetails).should('be.focused');
  }

  /** Saves locally and requires the Interest and Indexation task to be Provided. */
  public saveInterest(): void {
    this.save(S.interestAndIndexation.returnToCaseDetails, S.caseDetails.interestAndIndexationStatus);
  }

  /** Checks the actual reopened controls rather than inspecting or injecting store state.
   * @param interest Expected saved interest decision.
   * @param indexation Expected saved indexation value.
   */
  public assertInterest(interest: string, indexation: string): void {
    cy.get(S.interestAndIndexation.interestRadio(interest === 'Yes')).should('be.checked');
    cy.get(S.interestAndIndexation.indexationRadio(indexation)).should('be.checked');
    this.assertNoSubmission();
  }

  /** Opens or reopens Managing Payments using native keyboard link activation. */
  public openPayments(): void {
    cy.get(S.caseDetails.managingPaymentsLink).focus().should('be.focused');
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.managingPayments);
    cy.get(S.managingPayments.heading).should('have.text', 'Managing payments');
  }

  /** Chooses either court or direct payments for this draft.
   * @param arrangement Controlled payment arrangement from the scenario.
   */
  public chooseArrangement(arrangement: string): void {
    expect(Object.values(ARRANGEMENTS), 'Supported payment arrangement').to.include(arrangement);
    cy.get(S.managingPayments.paymentArrangementRadio(arrangement)).check();
  }

  /** Proves direct-payment keyboard activation and native Tab movement to the save button. */
  public chooseDirectUsingKeyboard(): void {
    cy.get(S.managingPayments.paymentArrangementRadio(ARRANGEMENTS.DIRECT)).focus();
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(S.managingPayments.paymentArrangementRadio(ARRANGEMENTS.DIRECT)).should('be.checked').and('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.managingPayments.returnToCaseDetails).should('be.focused');
  }

  /** Saves locally and requires the Managing Payments task to be Provided. */
  public savePayments(): void {
    this.save(S.managingPayments.returnToCaseDetails, S.caseDetails.managingPaymentsStatus);
  }

  /** Checks the payment arrangement restored when the task is reopened.
   * @param arrangement Expected saved court or direct arrangement.
   */
  public assertArrangement(arrangement: string): void {
    cy.get(S.managingPayments.paymentArrangementRadio(arrangement)).should('be.checked');
    this.assertNoSubmission();
  }

  /** Saves through keyboard activation and checks completion without losing prerequisite tasks.
   * @param button Current page's Return to case details button.
   * @param status Task-list status for the page being saved.
   */
  private save(button: string, status: string): void {
    cy.get(button).focus().should('be.focused').type('{enter}');
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.taskList);
    cy.get(status).should('contain.text', 'Provided');
    cy.get(S.caseDetails.respondentStatus).should('contain.text', 'Provided');
    cy.get(S.caseDetails.applicantStatus).should('contain.text', 'Provided');
    cy.get(S.caseDetails.orderDetailsStatus).should('contain.text', 'Provided');
    this.assertNoSubmission();
  }

  /** Requires that no Draft Casefile creation request has been attempted during the journey. */
  private assertNoSubmission(): void {
    cy.get('@liveDraftCreation').should('not.have.been.called');
  }
}
