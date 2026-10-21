import { CheckCaseDetailsActions } from '../../actions/createDraftCasefile/check-case-details.actions';
import { CommentsNotesActions } from '../../actions/createDraftCasefile/comments-notes.actions';
import { ReviewSubmissionFailureActions } from '../../actions/createDraftCasefile/review-submission-failure.actions';
import { OrderTermsFlow } from './order-terms.flow';
import { OrderDetailsFlow } from './order-details.flow';
import { OrderTermsManagementFlow } from './order-terms-management.flow';

/** Completes prerequisites using maintained actions, then exercises casefile review. */
export class CheckCaseDetailsFlow {
  private readonly terms = new OrderTermsFlow();
  private readonly review = new CheckCaseDetailsActions();
  private readonly comments = new CommentsNotesActions();
  private readonly rejection = new ReviewSubmissionFailureActions();
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

  /** Opens optional comments and notes from the task list. */
  public openComments(): void {
    this.comments.openFromTaskList();
  }

  /** Fills and saves both optional comments and notes. */
  public saveComments(): void {
    this.comments.fill();
    this.comments.save();
  }

  /** Saves optional comments and notes using keyboard navigation. */
  public saveCommentsUsingKeyboard(): void {
    this.comments.saveUsingKeyboard();
  }

  /** Reopens saved comments and notes from review. */
  public reopenComments(): void {
    this.comments.openFromReview();
  }

  /** Verifies saved optional values survive review navigation. */
  public assertRetainedComments(): void {
    this.comments.assertSaved();
  }

  /** Returns to review through the comments form's save action. */
  public returnFromComments(): void {
    this.comments.save();
  }

  /** Checks saved optional values and required sections before submission. */
  public assertReviewWithComments(): void {
    this.comments.assertReview();
  }

  /** Checks an untouched optional task is absent from review. */
  public assertReviewWithoutComments(): void {
    this.comments.assertAbsent();
  }

  /** Checks the submitted request contains no optional comments or notes. */
  public assertNoOptionalSubmission(): void {
    this.comments.assertOmittedFromSubmission();
  }

  /** Rejects the next create request after capturing the complete review. */
  public prepareRejectedSubmission(): void {
    this.rejection.prepare();
  }

  /** Checks the rejected request and the visible review error. */
  public assertRejectedSubmission(): void {
    this.rejection.assertRejected();
  }

  /** Checks the reviewed draft remains complete after rejection. */
  public assertRetainedReviewAfterFailure(): void {
    this.rejection.assertRetainedReview();
  }

  /** Checks the successful retry and its only deliberate payload change. */
  public assertCorrectedRetry(): void {
    this.review.assertConfirmation();
    this.rejection.assertCorrectedRetry();
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
    this.review.saveLiveTestRunReference();
    this.comments.openFromTaskList();
    this.comments.fill();
    this.comments.save();
    this.assertReadyForReview();
    this.review.openReview();
  }

  /** Observes the backend submission without substituting a response. */
  public prepareLiveSubmission(): void {
    this.review.prepareLiveSubmission();
  }

  /** Checks submission confirmation after validating the real backend receipt. */
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
  /** Submits the live case and records its receipt for cleanup before assertions. */
  public submitLive(): void {
    this.review.submitLive();
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
  /** Checks the permission boundary at the cancellation URL. */
  public assertCancellationUnavailable(): void {
    this.review.assertCancellationUnavailable();
  }
}
