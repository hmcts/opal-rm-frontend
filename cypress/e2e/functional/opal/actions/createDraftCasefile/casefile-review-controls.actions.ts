import { CreateCasefileSelectors as C } from '../../../../../shared/selectors/create-casefile.selectors';
import { pressDashboardEnter } from '../../../../../support/utils/press-dashboard-enter';

/** Replaces the rendered reason, including a deliberate empty value.
 * @param selector Central selector for the editable reason field.
 * @param reason Complete replacement text.
 */
export function setCasefileReason(selector: string, reason: string): void {
  cy.get(selector).should('be.visible').and('be.enabled').clear();
  if (reason) cy.get(selector).type(reason);
  cy.get(selector).should('have.value', reason);
}

/** Activates an available control through the chosen input method.
 * @param selector Central selector for the control.
 * @param keyboard Whether to use the maintained native Enter helper.
 */
export function activateCasefileControl(selector: string, keyboard: boolean): void {
  cy.get(selector).should('be.visible').and('not.be.disabled');
  // Requery before activation so focus and click receive the current DOM element.
  if (keyboard) {
    cy.get(selector).focus().should('be.focused');
    pressDashboardEnter();
  } else cy.get(selector).click();
}

/** Selects a checker decision and reaches its conditional reason through native Tab when requested.
 * @param decision Checker choice to activate.
 * @param reason Complete synthetic rejection reason, including a deliberate blank value.
 * @param keyboard Whether to use native Space and Tab instead of pointer selection.
 */
export function chooseCasefileDecision(decision: 'approve' | 'reject', reason: string, keyboard: boolean): void {
  const selector = decision === 'approve' ? C.review.decisionApprove : C.review.decisionReject;
  if (keyboard) {
    cy.get(selector).focus().should('be.focused');
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(selector).should('be.checked').and('be.focused');
  } else cy.get(selector).check().should('be.checked');
  if (decision === 'reject') {
    cy.get(C.review.rejectionReason).should('be.visible');
    if (keyboard) {
      cy.get(selector).should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(C.review.rejectionReason).should('be.focused');
    }
    setCasefileReason(C.review.rejectionReason, reason);
  }
}
