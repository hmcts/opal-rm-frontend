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
  /** Checks that Back cannot recover the submitted draft or allow another submission. */
  public assertClearedJourneyAfterSubmission(): void {
    this.review.assertClearedJourneyAfterSubmission();
  }
  /** Checks that submitted party forms and review remain guarded. */
  public assertSubmittedFormsBlocked(): void {
    this.review.assertSubmittedFormsBlocked();
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
  /** Verifies cancellation returns to the dashboard without persisting the discarded case. */
  public assertDashboard(): void {
    this.review.assertDashboard();
  }
  /** Starts a fresh local case from the returned dashboard. */
  public createCase(): void {
    this.review.createCase();
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
