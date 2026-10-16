import { CheckCaseDetailsActions } from '../../actions/createDraftCasefile/check-case-details.actions';
import { OrderTermsFlow } from './order-terms.flow';
import { OrderDetailsFlow } from './order-details.flow';
import { OrderTermsManagementFlow } from './order-terms-management.flow';

/** Completes prerequisites using maintained actions, then exercises casefile review. */
export class CheckCaseDetailsFlow {
  private readonly terms = new OrderTermsFlow();
  private readonly review = new CheckCaseDetailsActions();
  private readonly details = new OrderDetailsFlow();
  private readonly liveTerms = new OrderTermsManagementFlow();

  /** Builds a complete case using the maintained real journey steps. */
  public open(): void {
    this.prepareReadyForReview();
    this.openReview();
  }

  /** Completes the controlled-submission draft and leaves its task list ready for review. */
  public prepareReadyForReview(): void {
    this.terms.givenTwoAcceptedMaintenanceOrders();
    this.review.prepareSubmission();
    this.review.completePaymentTasks();
  }

  /** Opens the completed draft from its task list. */
  public openReview(): void {
    this.review.openReview();
  }

  /** Completes one synthetic draft through live services before entering review. */
  public openLive(): void {
    this.prepareLiveSubmission();
    this.details.startLive();
    this.details.openLive();
    this.details.saveLiveDetails();
    this.details.assertLiveProvided();
    this.liveTerms.addApplicantTermToCurrentDraft('10', 'liveApplicantTerm');
    this.review.completePaymentTasks();
    this.assertReadyForReview();
    this.review.openReview();
  }

  /** Observes the backend submission without substituting a response. */
  public prepareLiveSubmission(): void {
    this.review.prepareLiveSubmission();
  }

  /** Requires the real response and existing confirmation panel to show the same generated identifier. */
  public assertLiveConfirmation(): void {
    this.review.assertLiveConfirmation();
  }

  /** Checks the final task-list gate before the live journey enters review. */
  public assertReadyForReview(): void {
    this.review.assertReadyForReview();
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

  /** Starts a fresh case and proves that the submitted journey cannot be resubmitted. */
  public clearSubmittedJourney(): void {
    this.startNextCase();
    this.assertClearedJourneyAfterSubmission();
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
