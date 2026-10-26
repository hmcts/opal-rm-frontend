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
  if (keyboard) {
    cy.get(selector).should('be.visible').and('not.be.disabled').focus().should('be.focused');
    pressDashboardEnter();
  } else cy.get(selector).should('be.visible').and('not.be.disabled').click();
}
