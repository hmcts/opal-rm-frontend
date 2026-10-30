import { CheckerReviewActions } from '../../actions/checkAndValidateCase/checker-review-decisions.actions';

/** Composes checker journeys; each Given replaces all scenario state. */
export class CheckerReviewFlow {
  private actions = new CheckerReviewActions();

  /** Creates a fresh independent prerequisite.
   * @param status Explicit persisted lifecycle.
   * @param kind Required fixture purpose.
   */
  public prepare(status: string, kind: string): void {
    this.actions = new CheckerReviewActions();
    this.actions.prepare(status, kind);
  }

  /** Submits the rendered checker decision.
   * @param decision Explicit decision. */
  public decide(decision: string): void {
    this.actions.decide(decision);
  }

  /** Proves the persisted checker outcome.
   * @param decision Expected persisted decision. */
  public assertDecision(decision: string): void {
    this.actions.assertDecision(decision);
  }

  /** Requires real publication and every number. */
  public assertPublication(): void {
    this.actions.assertPublication();
  }

  /** Submits a truly blank rejection reason. */
  public rejectBlank(): void {
    this.actions.rejectBlank();
  }

  /** Requires linked validation and unchanged saved aggregate. */
  public assertValidation(): void {
    this.actions.assertValidation();
  }

  /** Creates a fresh protected prerequisite.
   * @param kind Self or denied protection. */
  public prepareProtection(kind: string): void {
    this.actions = new CheckerReviewActions();
    this.actions.prepareProtection(kind);
  }

  /** Attempts the protected route. */
  public attemptProtectedDecision(): void {
    this.actions.attemptProtectedDecision();
  }

  /** Proves denied or read-only outcome without writes. */
  public assertProtected(): void {
    this.actions.assertProtected();
  }

  /** Competes against the retained original version.
   * @param decision Intended stale decision. */
  public compete(decision: string): void {
    this.actions.compete(decision);
  }

  /** Requires safe conflict and the unchanged winner. */
  public assertConflict(): void {
    this.actions.assertConflict();
  }

  /** Runs a fresh broad accessibility journey.
   * @param kind Independent accessibility journey. */
  public accessible(kind: string): void {
    this.actions = new CheckerReviewActions();
    this.actions.accessible(kind);
  }
}
