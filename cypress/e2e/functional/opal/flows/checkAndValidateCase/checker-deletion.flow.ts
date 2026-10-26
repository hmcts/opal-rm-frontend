import { CheckerDeletionActions } from '../../actions/checkAndValidateCase/checker-deletion.actions';

/** Composes independent deletion journeys while Actions retain all page and provider evidence. */
export class CheckerDeletionFlow {
  private actions = new CheckerDeletionActions();

  /** Replaces scenario state before preparing the requested outcome.
   * @param kind Explicit deletion outcome.
   */
  public prepare(kind: string): void {
    this.actions = new CheckerDeletionActions();
    this.actions.prepare(kind);
  }

  /** Prepares one independent accessible fixture without completing its business interaction.
   * @param kind Explicit accessible deletion outcome.
   */
  public prepareAccessible(kind: string): void {
    if (!['success', 'validation', 'cancel', 'retry'].includes(kind))
      throw new Error('Unsupported deletion accessibility kind');
    this.actions = new CheckerDeletionActions();
    this.actions.enableAccessibility();
    this.actions.prepare(kind === 'validation' ? 'blank' : kind);
  }

  /** Confirms one guarded, receipt-owning deletion. */
  public confirm(): void {
    this.actions.submitOnce();
  }

  /** Activates validation without dispatching a provider mutation. */
  public submitValidation(): void {
    this.actions.submitValidation();
  }

  /** Cancels through the warning back to unchanged review. */
  public cancel(): void {
    this.actions.cancelToReview();
  }

  /** Requires the selected linked error and zero PATCH.
   * @param message Exact business validation copy.
   */
  public assertValidation(message: string): void {
    this.actions.assertValidation(message);
  }

  /** Types a visible boundary correction through the native field.
   * @param length Exact business boundary visible in the scenario.
   */
  public enterReasonWithLength(length: number): void {
    if (length !== 250 && length !== 251) throw new Error('Unsupported deletion reason boundary');
    cy.then(() => {
      this.actions.enterReason('D'.repeat(length));
      if (length === 250) this.actions.assertCorrectedReason();
    });
  }

  /** Proves the saved aggregate and original version remain unchanged. */
  public assertUnchanged(): void {
    this.actions.assertOutcome();
  }

  /** Explicitly retries the retained warning once, using one monitor and the original ETag. */
  public retry(): void {
    this.actions.armDefiniteFailure();
    this.actions.submitOnce();
    this.actions.assertDefiniteFailure();
    this.actions.submitOnce();
  }

  /** Proves one acknowledged persisted deletion and the retained read-only outcome. */
  public assertDeleted(): void {
    this.actions.assertOutcome();
  }

  /** Retains the broad controlled caller while sharing the explicit business operations.
   * @param kind Independent accessibility outcome.
   */
  public accessible(kind: string): void {
    this.prepareAccessible(kind);
    if (kind === 'validation') this.validateAccessibly();
    else if (kind === 'cancel') this.cancel();
    else if (kind === 'retry') this.retry();
    else this.confirm();
    if (kind === 'success' || kind === 'retry') this.assertDeleted();
    else this.assertUnchanged();
  }

  /** Exercises blank, visible 251 and corrected 250 states before native cancellation. */
  private validateAccessibly(): void {
    this.submitValidation();
    this.assertValidation('Enter reason');
    this.actions.scan();
    this.enterReasonWithLength(251);
    this.submitValidation();
    this.assertValidation('Reason must be 250 characters or fewer');
    this.actions.scan();
    this.enterReasonWithLength(250);
    this.actions.scan();
    this.cancel();
  }
}
