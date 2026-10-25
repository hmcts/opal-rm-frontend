import {
  RejectedCasefileJourneyActions,
  rejectedAmendmentKind,
} from '../../actions/checkAndValidateCase/rejected-casefile-journey.actions';

/** Fresh owned fixture and evidence per business example. */
export class RejectedCasefileAmendmentFlow {
  private actions = new RejectedCasefileJourneyActions();

  /** Prepare the exact real rejected outcome.
   * @param kind Explicit supported outcome.
   * @param accessible Native keyboard activation.
   */
  public prepare(kind: string, accessible = false): void {
    const validated = rejectedAmendmentKind(kind);
    this.actions = new RejectedCasefileJourneyActions();
    this.actions.prepare(validated, accessible);
  }

  /** Complete the prepared journey.
   * @param kind Explicit supported outcome.
   */
  public complete(kind: string): void {
    this.actions.complete(rejectedAmendmentKind(kind));
  }

  /** Prove its persisted business outcome.
   * @param kind Explicit supported outcome.
   */
  public assertOutcome(kind: string): void {
    this.actions.assertOutcome(rejectedAmendmentKind(kind));
  }
}
