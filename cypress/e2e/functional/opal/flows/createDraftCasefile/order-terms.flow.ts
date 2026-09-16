import { OrderDetailsFlow } from './order-details.flow';
import { OrderTermsActions } from '../../actions/createDraftCasefile/order-terms.actions';

/** Composes the Order Terms selection journey. */
export class OrderTermsFlow {
  private readonly details = new OrderDetailsFlow();
  private readonly actions = new OrderTermsActions();

  /** Completes the prerequisites and opens Order Terms Summary. */
  public openSummary(): void {
    this.details.completeParties();
    this.details.openAvailable();
    this.details.saveWithoutOrderDate();
    this.actions.openSummary();
  }

  /** Starts a new pending order-term selection. */
  public startAdd(): void {
    this.actions.startAdd();
  }

  /**
   * Selects an order term by its Result ID.
   * @param id The Result ID to select.
   */
  public choose(id: string): void {
    this.actions.choose(id);
  }

  /** Continues from selection to the input destination. */
  public continue(): void {
    this.actions.continue();
  }

  /** Returns from input to selection. */
  public back(): void {
    this.actions.back();
  }

  /**
   * Checks the Result-specific input destination.
   * @param id The expected Result ID.
   */
  public assertInput(id: string): void {
    this.actions.assertInput(id);
  }

  /**
   * Checks the restored pending selection.
   * @param id The expected Result ID.
   */
  public assertSelection(id: string): void {
    this.actions.assertSelection(id);
  }

  /** Checks Order Terms Summary. */
  public assertSummary(): void {
    this.actions.assertSummary();
  }

  /** Checks required-selection validation and focus. */
  public assertValidation(): void {
    this.actions.assertValidation();
  }

  /** Reloads the input route and checks the journey reset. */
  public reload(): void {
    this.actions.reload();
  }
}
