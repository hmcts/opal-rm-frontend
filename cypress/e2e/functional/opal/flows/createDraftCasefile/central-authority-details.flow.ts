import { CentralAuthorityDetailsActions } from '../../actions/createDraftCasefile/central-authority-details.actions';

/** Exposes Central Authority business journey verbs to Cucumber steps. */
export class CentralAuthorityDetailsFlow {
  private readonly actions = new CentralAuthorityDetailsActions();

  /** Opens Central Authority details in a new REMO Out casefile. */
  public openInNewRemoOutCasefile(): void {
    this.actions.openInNewRemoOutCasefile();
  }

  /**
   * Saves Central Authority details through the page action.
   *
   * @param remo The REMO reference to save.
   * @param reference The Central Authority reference to save.
   * @param authority The displayed Central Authority option to select.
   */
  public saveDetails(remo: string, reference: string, authority: string): void {
    this.actions.saveDetails(remo, reference, authority);
  }

  /** Confirms the Central Authority task is marked as provided. */
  public assertTaskProvided(): void {
    this.actions.assertTaskProvided();
  }

  /** Reopens the Central Authority details page. */
  public reopen(): void {
    this.actions.reopen();
  }

  /**
   * Confirms saved Central Authority details are restored and editable.
   *
   * @param remo The expected REMO reference.
   * @param reference The expected Central Authority reference.
   * @param authority The expected displayed Central Authority option.
   */
  public assertEditableDetails(remo: string, reference: string, authority: string): void {
    this.actions.assertEditableDetails(remo, reference, authority);
  }

  /** Submits over-limit Central Authority references. */
  public submitOverLimitReferences(): void {
    this.actions.submitOverLimitReferences();
  }
}
