/** Owns shared Axe accessibility assertions for functional E2E journeys. */
export class AccessibilityActions {
  /** Checks the current page and fails for every Axe violation. */
  public checkAccessibilityOnly(): void {
    cy.injectAxe();
    cy.checkA11y();
  }
}

export const accessibilityActions = new AccessibilityActions();
