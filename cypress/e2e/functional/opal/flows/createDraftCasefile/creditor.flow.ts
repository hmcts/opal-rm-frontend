import { CreditorActions } from '../../actions/createDraftCasefile/creditor.actions';

/** Composes creditor selection journey verbs for Cucumber steps. */
export class CreditorFlow {
  private readonly actions = new CreditorActions();

  /** Prepares the controlled Major source. */
  public prepareMajorCreditors(): void {
    this.actions.prepareMajorCreditors();
  }
  /** Checks routed creditor readiness. */
  public assertReady(): void {
    this.actions.assertReady();
  }
  /** Chooses Applicant. */
  public chooseApplicant(): void {
    this.actions.chooseApplicant();
  }
  /** Chooses a Major. */
  public chooseMajor(): void {
    this.actions.chooseMajor();
  }
  /** Chooses add-new Minor intent. */
  public chooseAddNew(): void {
    this.actions.chooseAddNew();
  }
  /** Continues the creditor form. */
  public continue(): void {
    this.actions.continue();
  }
  /** Checks Summary and the no-persistence boundary. */
  public assertSummaryWithoutPersistence(): void {
    this.actions.assertSummaryWithoutPersistence();
  }
  /** Checks required-choice validation. */
  public assertValidation(): void {
    this.actions.assertValidation();
  }
  /** Checks stable-ID Major selection. */
  public assertMajorSelected(): void {
    this.actions.assertMajorSelected();
  }
  /** Returns from pending Minor details. */
  public returnFromDetails(): void {
    this.actions.returnFromDetails();
  }
  /** Checks restored add-new intent. */
  public assertAddNewRestored(): void {
    this.actions.assertAddNewRestored();
  }
  /**
   * Cancels with the chosen confirmation outcome.
   * @param confirmed Whether to accept the unsaved-changes warning.
   */
  public cancel(confirmed: boolean): void {
    this.actions.cancel(confirmed);
  }
  /** Checks a local creditor edit remains. */
  public assertCreditorRetained(): void {
    this.actions.assertCreditorRetained();
  }
  /** Reloads without in-memory state. */
  public reloadWithoutJourneyState(): void {
    this.actions.reloadWithoutJourneyState();
  }
  /** Checks rejection of missing term context. */
  public assertMissingContextRejected(): void {
    this.actions.assertMissingContextRejected();
  }
}
