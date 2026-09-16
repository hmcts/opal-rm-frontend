import { OrderDetailsActions } from '../../actions/createDraftCasefile/order-details.actions';

/** Drives the Order Details acceptance journey. */
export class OrderDetailsFlow {
  private readonly actions = new OrderDetailsActions();
  /** Completes the required party pages through the real UI. */
  public completeParties(): void {
    this.actions.completeParties();
  }
  /** Opens Order Details after the applications response. */
  public openAvailable(): void {
    this.actions.openAvailable();
  }
  /** Saves required values while leaving the optional order date empty. */
  public saveWithoutOrderDate(): void {
    this.actions.saveWithoutOrderDate();
  }
  /** Checks task availability and absence of draft creation. */
  public assertProvided(): void {
    this.actions.assertProvided();
  }
  /** Re-enters the form and verifies a fresh lookup. */
  public reopen(): void {
    this.actions.reopen();
  }
  /** Checks that all saved values are restored for editing. */
  public assertEditable(): void {
    this.actions.assertEditable();
  }
  /** Returns a correlated service failure when entering the form. */
  public openWithFailure(): void {
    this.actions.openWithFailure();
  }
  /** Checks safe error presentation and preserved parties. */
  public assertSafeFailure(): void {
    this.actions.assertSafeFailure();
  }
  /** Retries entry using native keyboard activation. */
  public retryUsingKeyboard(): void {
    this.actions.retryUsingKeyboard();
  }
  /** Checks the activated form is available. */
  public assertAvailable(): void {
    this.actions.assertAvailable();
  }
  /** Submits the empty form to expose validation. */
  public submitEmpty(): void {
    this.actions.submitEmpty();
  }
  /** Checks that validation focuses the linked summary. */
  public assertErrorFocus(): void {
    this.actions.assertErrorFocus();
  }
  /** Opens the unavailable empty-list state. */
  public openEmpty(): void {
    this.actions.openEmpty();
  }
  /** Checks refreshed journey navigation and direct-link protection. */
  public reloadJourney(): void {
    this.actions.reloadJourney();
  }
}
