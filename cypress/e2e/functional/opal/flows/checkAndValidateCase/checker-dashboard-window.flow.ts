import { CheckerDashboardWindowActions } from '../../actions/checkAndValidateCase/checker-dashboard-window.actions';

/** Each Given resets all fixture and observation state; Actions retain page/network details. */
export class CheckerDashboardWindowFlow {
  private actions = new CheckerDashboardWindowActions();

  /** Prepares an independently owned real outcome.
   * @param status Persisted outcome. */
  public prepare(status: string): void {
    this.actions = new CheckerDashboardWindowActions();
    this.actions.prepare(status);
    cy.then(() => this.actions.open());
  }

  /** Consults inside, inclusive boundary and outside days using actual persisted timestamps. */
  public consult(): void {
    for (const days of [0, 3, 7, 8]) this.actions.consultDay(days);
  }

  /** Rechecks the observed window in the explicit outcome step.
   * @param window Optional Gherkin rule to validate. */
  public assertWindow(window?: string): void {
    this.actions.assertWindow(window);
  }

  /** Proves a real no-create empty baseline and opens its checker dashboard. */
  public prepareEmpty(): void {
    this.actions = new CheckerDashboardWindowActions();
    this.actions.prepareEmpty();
    cy.then(() => this.actions.open());
  }

  /** Visits every empty tab. */
  public consultEmpty(): void {
    this.actions.consultEmpty();
  }

  /** Rechecks the business outcome after all visits. */
  public assertEmpty(): void {
    this.actions.assertEmpty();
  }

  /** Runs a separate fixture through every strict-scanned consultation.
   * @param status Persisted outcome. */
  public accessible(status: string): void {
    this.actions = new CheckerDashboardWindowActions();
    this.actions.enableAccessibility();
    this.actions.prepare(status);
    cy.then(() => this.actions.open());
    this.consult();
  }

  /** Runs a separate genuinely empty journey with strict scans on every tab. */
  public accessibleEmpty(): void {
    this.actions = new CheckerDashboardWindowActions();
    this.actions.enableAccessibility();
    this.actions.prepareEmpty();
    cy.then(() => this.actions.open());
    this.consultEmpty();
  }
}
