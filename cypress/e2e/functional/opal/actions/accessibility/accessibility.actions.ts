/** Owns shared Axe accessibility assertions for functional E2E journeys. */
export class AccessibilityActions {
  /** Checks the current page using the established Fines GOV.UK ARIA exemption. */
  public checkAccessibilityOnly(): void {
    cy.injectAxe();
    cy.checkA11y(undefined, { rules: { 'aria-allowed-attr': { enabled: false } } });
  }
}

export const accessibilityActions = new AccessibilityActions();
