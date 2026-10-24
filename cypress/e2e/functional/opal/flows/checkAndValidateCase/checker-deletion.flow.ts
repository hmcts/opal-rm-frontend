import { CheckerDeletionActions } from '../../actions/checkAndValidateCase/checker-deletion.actions';

/** Thin scenario boundary with independent mutable actions per Given. */
export class CheckerDeletionFlow {
  private actions = new CheckerDeletionActions();

  /** Replaces scenario state before preparing the requested outcome.
   * @param kind Explicit deletion outcome.
   */
  public prepare(kind: string): void {
    this.actions = new CheckerDeletionActions();
    this.actions.prepare(kind);
  }

  /** Replaces mutable state for every independent broad accessibility journey.
   * @param kind Explicit accessible deletion outcome.
   */
  public accessible(kind: string): void {
    this.actions = new CheckerDeletionActions();
    this.actions.accessible(kind);
  }

  /** Completes the selected UI interaction. */
  public act(): void {
    this.actions.act();
  }

  /** Proves the independently saved business outcome. */
  public assertOutcome(): void {
    this.actions.assertOutcome();
  }
}
