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
  /** Enters the amount for the pending term.
   * @param amount Raw amount to enter.
   */
  public enterAmount(amount: string): void {
    this.actions.enterAmount(amount);
  }
  /** Submits the pending term. */
  public continueInput(): void {
    this.actions.continueInput();
  }
  /** Checks Creditor is reached without backend draft creation. */
  public assertCreditor(): void {
    this.actions.assertCreditor();
  }
  /** Checks required amount validation and summary focus. */
  public assertAmountRequired(): void {
    this.actions.assertAmountRequired();
  }

  /** Creates two accepted Maintenance orders with controlled identities. */
  public givenTwoAcceptedMaintenanceOrders(): void {
    this.openSummary();
    this.actions.addTwoAcceptedMaintenanceOrders();
  }

  /** Amends the second accepted order. */
  public amendSecondMaintenanceOrder(): void {
    this.actions.amendSecondMaintenanceOrder();
  }

  /** Checks only the second accepted order changed. */
  public assertOnlySecondOrderAmended(): void {
    this.actions.assertOnlySecondOrderAmended();
  }

  /** Creates a shared-minor-creditor amendment ready for creditor selection. */
  public givenSharedMinorCreditorAmendment(): void {
    this.openSummary();
    this.actions.addSharedMinorCreditorOrders();
  }

  /** Reviews and cancels a new creditor during amendment. */
  public enterNewCreditorAndCancelReview(): void {
    this.actions.enterNewCreditorAndCancelReview();
  }

  /** Checks the original terms and shared creditor remain. */
  public assertOriginalOrderAndCreditor(): void {
    this.actions.assertOriginalOrderAndCreditor();
  }

  /** Checks the cancelled creditor is unavailable. */
  public assertNewCreditorUnavailable(): void {
    this.actions.assertNewCreditorUnavailable();
  }

  /** Opens removal for the second term and returns. */
  public openSecondRemovalAndReturn(): void {
    this.actions.openSecondRemoval();
    this.actions.returnFromRemoval();
  }

  /** Opens removal for accessibility evidence. */
  public openSecondRemoval(): void {
    this.actions.openSecondRemoval();
  }

  /** Returns from the removal placeholder. */
  public returnFromRemoval(): void {
    this.actions.returnFromRemoval();
  }

  /** Checks both original orders remain. */
  public assertBothOriginalOrders(): void {
    this.actions.assertBothOriginalOrders();
  }

  /** Checks the draft-casefile write boundary was untouched. */
  public assertCasefileNotSubmitted(): void {
    this.actions.assertCasefileNotSubmitted();
  }
}
