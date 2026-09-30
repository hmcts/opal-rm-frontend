import {
  CentralAuthorityDetailsActions,
  type CentralAuthorityChoice,
} from '../../actions/createDraftCasefile/central-authority-details.actions';

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
   * @param authorityChoice Which returned Central Authority option to select.
   */
  public saveDetails(remo: string, reference: string, authorityChoice: CentralAuthorityChoice): void {
    this.actions.saveDetails(remo, reference, authorityChoice);
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
   * @param authorityChoice Which returned Central Authority option is expected.
   */
  public assertEditableDetails(remo: string, reference: string, authorityChoice: CentralAuthorityChoice): void {
    this.actions.assertEditableDetails(remo, reference, authorityChoice);
  }

  /** Submits over-limit Central Authority references. */
  public submitOverLimitReferences(): void {
    this.actions.submitOverLimitReferences();
  }
}
