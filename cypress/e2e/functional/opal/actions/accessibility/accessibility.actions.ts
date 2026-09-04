const DEFAULT_VIOLATION_EXEMPTIONS = new Set(['aria-allowed-attr']);

/** Owns shared Axe accessibility assertions for functional E2E journeys. */
export class AccessibilityActions {
  /** Checks the current page and fails for every non-exempt Axe violation. */
  public checkAccessibilityOnly(): void {
    cy.injectAxe();
    cy.checkA11y(
      undefined,
      undefined,
      (violations) => {
        const failures = violations.filter((violation) => !DEFAULT_VIOLATION_EXEMPTIONS.has(violation.id));
        if (failures.length) assert.fail(`${failures.length} accessibility violation(s) detected.`);
      },
      true,
    );
  }
}

export const accessibilityActions = new AccessibilityActions();
