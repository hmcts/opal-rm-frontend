import { CheckCaseDetailsActions } from '../../actions/createDraftCasefile/check-case-details.actions';
import { OrderTermsFlow } from './order-terms.flow';

/** Completes prerequisites using maintained actions, then exercises casefile review. */
export class CheckCaseDetailsFlow {
  private readonly terms = new OrderTermsFlow();
  private readonly review = new CheckCaseDetailsActions();

  /** Builds a complete case using the maintained real journey steps. */
  public open(): void {
    this.terms.givenTwoAcceptedMaintenanceOrders();
    this.review.prepareSubmission();
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
  /** Submits the accepted case to the controlled HTTP boundary. */
  public submit(): void {
    this.review.submit();
  }
  /** Checks the confirmation page, resolved payload and single successful submission. */
  public assertConfirmation(): void {
    this.review.assertConfirmation();
  }
  /** Reloads the confirmation page to verify the existing in-memory journey reset. */
  public refreshConfirmation(): void {
    this.review.refreshConfirmation();
  }
  /** Opens the existing cancellation boundary and returns to review. */
  public cancel(): void {
    this.review.cancel();
  }
  /** Checks the existing journey reset after refresh. */
  public assertRestartedJourney(): void {
    this.review.assertRestartedJourney();
  }
  /** Checks draft retention after visiting cancellation. */
  public assertRetainedDraft(): void {
    this.review.assertRetainedDraft();
  }
}
