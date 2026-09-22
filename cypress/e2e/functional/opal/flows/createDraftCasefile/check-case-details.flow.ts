import { CheckCaseDetailsActions } from '../../actions/createDraftCasefile/check-case-details.actions';
import { OrderTermsFlow } from './order-terms.flow';

/** Completes prerequisites using maintained actions, then exercises mock review. */
export class CheckCaseDetailsFlow {
  private readonly terms = new OrderTermsFlow();
  private readonly review = new CheckCaseDetailsActions();

  /** Builds a complete case using the maintained real journey steps. */
  public open(): void {
    this.terms.givenTwoAcceptedMaintenanceOrders();
    this.review.completeRemainingTasks();
  }

  /** Saves a respondent correction from its contextual review action. */
  public correctRespondent(): void {
    this.review.correctRespondent();
  }
  /** Checks the saved correction, unaffected terms and return focus. */
  public assertCorrection(): void {
    this.review.assertCorrection();
  }
  /** Activates the mock submission once. */
  public submit(): void {
    this.review.submit();
  }
  /** Checks the synthetic receipt and absence of backend creation. */
  public assertReceipt(): void {
    this.review.assertReceipt();
  }
  /** Reloads the receipt page to exercise in-memory receipt expiry. */
  public refreshReceipt(): void {
    this.review.refreshReceipt();
  }
  /** Opens the existing cancellation boundary and returns to review. */
  public cancel(): void {
    this.review.cancel();
  }
  /** Checks receipt expiry after refresh. */
  public assertExpiredReceipt(): void {
    this.review.assertExpiredReceipt();
  }
  /** Checks draft retention after visiting cancellation. */
  public assertRetainedDraft(): void {
    this.review.assertRetainedDraft();
  }
}
