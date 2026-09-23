import { CheckCaseDetailsActions } from '../../actions/createDraftCasefile/check-case-details.actions';
import { OrderTermsFlow } from './order-terms.flow';

/** Completes prerequisites using maintained actions, then exercises casefile review. */
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
  /** Checks the confirmation page and absence of backend creation. */
  public assertConfirmation(): void {
    this.review.assertConfirmation();
  }
  /** Starts an empty case through Create a new case. */
  public startNextCase(): void {
    this.review.startNextCase();
  }
  /** Opens confirmation after login without an accepted submission. */
  public openFreshConfirmation(): void {
    this.review.openFreshConfirmation();
  }
  /** Returns through browser history after acceptance. */
  public backFromConfirmation(): void {
    this.review.backFromConfirmation();
  }
  /** Checks the retained case when Back returns within the current journey. */
  public assertReviewAfterConfirmation(): void {
    this.review.assertReviewAfterConfirmation();
  }
  /** Reloads the confirmation page to verify the existing in-memory journey reset. */
  public refreshConfirmation(): void {
    this.review.refreshConfirmation();
  }
  /** Opens the existing cancellation boundary and returns to review. */
  public cancel(): void {
    this.review.cancel();
  }
  /** Opens the cancellation page. */
  public openCancellation(): void {
    this.review.openCancellation();
  }
  /** Confirms that the local case should be discarded. */
  public discard(): void {
    this.review.discard();
  }
  /** Checks that cancellation starts a fresh case. */
  public assertFreshCase(): void {
    this.review.assertFreshCase();
  }
  /** Checks that browser history cannot recover the discarded case. */
  public assertHistoryStaysEmpty(): void {
    this.review.assertHistoryStaysEmpty();
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
