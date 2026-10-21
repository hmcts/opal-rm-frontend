import { CheckCaseDetailsModesActions } from '../../actions/createDraftCasefile/check-case-details-modes.actions';
import { checkerRole } from '../../mocks/createDraftCasefile/checker-dashboard.mock';

/** Composes saved casefile journeys; browser and HTTP details belong to Actions. */
export class CheckCaseDetailsModesFlow {
  private readonly actions = new CheckCaseDetailsModesActions();

  /** Sets the actor, lifecycle and ownership for a saved case journey.
   * @param role Permission role.
   * @param status Persisted lifecycle.
   * @param submitter Other or self BU-user.
   */
  public prepare(role: string, status: string, submitter: string): void {
    this.actions.prepare(checkerRole(role), status, submitter);
  }
  /** Supplies the selected failure boundary.
   * @param failure Named failure contract.
   */
  public fail(failure: string): void {
    this.actions.fail(failure);
  }
  /** Opens one canonical persisted destination.
   * @param destination Route intent.
   * @param id Selected draft ID.
   */
  public open(destination: string, id: string): void {
    this.actions.open(destination, id);
  }
  /** Proves caller mode flags do not control review eligibility.
   * @param destination Route intent.
   */
  public openWithQuery(destination: string): void {
    this.actions.open(destination, '17', '?mode=review&canReview=true&tab=failed&page=2&sort=applicant#rejected');
  }
  /** Remembers the originating inputter dashboard before opening details.
   */
  public openFromInputter(): void {
    this.actions.openFromInputter();
  }
  /** Checks restored parties, terms and chronological history.
   */
  public expectSummary(): void {
    this.actions.expectSummary();
  }
  /** Checks visible actions against the selected route and actor.
   * @param mode Expected review or view mode.
   */
  public expectMode(mode: string): void {
    this.actions.expectMode(mode);
  }
  /** Continues with the requested decision and reason.
   * @param decision Approve, Reject or none.
   * @param reason Named reason boundary.
   */
  public decide(decision: string, reason: string): void {
    this.actions.decide(decision, reason);
  }
  /** Checks the focused summary link targets the actual invalid field.
   * @param message Expected validation message.
   */
  public expectError(message: string): void {
    this.actions.expectError(message);
  }
  /** Clears conditional rejection errors before approving.
   */
  public switchToApprove(): void {
    this.actions.switchToApprove();
  }
  /** Returns through the saved details Back control.
   */
  public back(): void {
    this.actions.back();
  }
  /** Checks the available dashboard still contains unchanged submitted work.
   * @param dashboard Expected inputter or checker dashboard.
   */
  public expectReturn(dashboard: string): void {
    this.actions.expectReturn(dashboard);
  }
  /** Supplies one explicit checker provider result.
   * @param outcome Success, shared error or malformed receipt. */
  public enableDecision(outcome: string): void {
    this.actions.enableDecision(outcome);
  }
  /** Checks the exact confirmation and accepted queue transition.
   * @param outcome Approved or rejected confirmation. */
  public expectDecisionReturn(outcome: string): void {
    this.actions.expectDecisionReturn(outcome);
  }
  /** Checks an uncertain completion is locked without success or replay. */
  public expectDecisionError(): void {
    this.actions.expectDecisionError();
  }
  /** Checks a notice lifetime boundary does not repeat the write.
   * @param method Dismiss, refresh, history or departure. */
  public clearDecisionNotice(method: string): void {
    this.actions.clearDecisionNotice(method);
  }
  /** Checks the confirmed decision at a narrow viewport. */
  public expectDecisionReflow(): void {
    this.actions.expectDecisionReflow();
  }
  /** Opens the deletion reason screen from review.
   */
  public chooseDelete(): void {
    this.actions.chooseDelete();
  }
  /** Checks the deletion reason screen has visible controls.
   */
  public expectDelete(): void {
    this.actions.expectDelete();
  }
  /** Opens the selected case from the checker review queue. */
  public openFromChecker(): void {
    this.actions.openFromChecker();
  }
  /** Enables the explicit synthetic deletion contract.
   * @param outcome Success or a shared request error. */
  public enableDeletion(outcome: string): void {
    this.actions.enableDeletion(outcome);
  }
  /** Enters the accepted deletion reason.
   * @param reason Synthetic reason sent unchanged. */
  public enterDeletionReason(reason: string): void {
    this.actions.enterDeletionReason(reason);
  }
  /** Confirms deletion through the rendered form. */
  public confirmDeletion(): void {
    this.actions.confirmDeletion();
  }
  /** Submits an empty reason to exercise validation. */
  public submitEmptyDeletion(): void {
    this.actions.submitEmptyDeletion();
  }
  /** Cancels deletion back to the selected review. */
  public cancelDeletion(): void {
    this.actions.cancelDeletion();
  }
  /** Checks shared feedback leaves the reason editable without another request. */
  public expectDeletionError(): void {
    this.actions.expectDeletionError();
  }
  /** Checks the confirmed deletion notice and refreshed queue. */
  public expectDeletedReturn(): void {
    this.actions.expectDeletedReturn();
  }
  /** Checks cancellation performs fresh selected loading without mutation.
   * @param expectedGets Total selected requests for this journey. */
  public expectReviewAfterCancel(expectedGets: number): void {
    this.actions.expectReviewAfterCancel(expectedGets);
  }

  /** Checks denial and the selected GET boundary.
   * @param count Expected selected GET count.
   */
  public expectDenied(count: number): void {
    this.actions.expectDenied(count);
  }
  /** Attempts saved loading through actual Angular navigation.
   * @param destination Route intent.
   * @param id Selected or malformed draft ID.
   */
  public attempt(destination: string, id: string): void {
    this.actions.attempt(destination, id);
  }
  /** Checks failed resolution preserves the current Cases page.
   * @param count Expected selected GET count.
   */
  public expectFailure(count: number): void {
    this.actions.expectFailure(count);
  }
  /** Reuses the saved component for draft B before entering fresh creation.
   */
  public switchThenCreate(): void {
    this.actions.switchDraft();
    this.actions.startCreation();
  }
  /** Checks the explicit persisted mutation counter.
   */
  public expectNoWrites(): void {
    this.actions.expectNoWrites();
  }
}
