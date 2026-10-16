import { AllRejectedActions } from '../../actions/createDraftCasefile/all-rejected.actions';

/** Composes consultation and protected-shell browser journeys. */
export class AllRejectedFlow {
  private readonly actions = new AllRejectedActions();

  /** Checks direct protected-shell fallback.
   * @param kind Protected destination kind. */
  public expectDirectShell(kind: string): void {
    this.actions.expectDirectShell(kind);
  }
  /** Available for the controlled browser journey.
   */
  public available(): void {
    this.actions.available();
  }
  /** Open from rejected for the controlled browser journey.
   */
  public openFromRejected(): void {
    this.actions.openDashboard();
    this.actions.enterList();
  }
  /** Expect collection for the controlled browser journey.
   */
  public expectCollection(): void {
    this.actions.expectInitialRows();
  }
  /** Independent selections for the controlled browser journey.
   */
  public independentSelections(): void {
    this.actions.available();
    this.actions.openDashboard();
    this.actions.sortDescending('applicant');
    this.actions.dashboardPage();
    this.actions.enterList();
    this.actions.expectInitialRows();
    this.actions.sortDescending('submittedByName');
    this.actions.nextPage();
  }
  /** Visit details and return for the controlled browser journey.
   */
  public visitDetailsAndReturn(): void {
    this.actions.openDetails();
    this.actions.refreshRows();
    this.actions.returnList();
  }
  /** Expect restored list for the controlled browser journey.
   */
  public expectRestoredList(): void {
    this.actions.expectRestoredList();
  }
  /** Return dashboard for the controlled browser journey.
   */
  public returnDashboard(): void {
    this.actions.returnDashboard();
  }
  /** Expect restored dashboard for the controlled browser journey.
   */
  public expectRestoredDashboard(): void {
    this.actions.expectRestoredDashboard();
  }
  /** Later selection for the controlled browser journey.
   */
  public laterSelection(): void {
    this.actions.available();
    this.actions.openDirect();
    this.actions.expectInitialRows();
    this.actions.sortDescending('submittedByName');
    this.actions.nextPage();
  }
  /** Refresh for the controlled browser journey.
   */
  public refresh(): void {
    this.actions.refresh();
  }
  /** Expect defaults for the controlled browser journey.
   */
  public expectDefaults(): void {
    this.actions.expectDefaults();
  }
  /** Fail once for the controlled browser journey.
   */
  public failOnce(): void {
    this.actions.failOnce();
  }
  /** Open direct for the controlled browser journey.
   */
  public openDirect(): void {
    this.actions.openDirect();
  }
  /** Expect failure for the controlled browser journey.
   */
  public expectFailure(): void {
    this.actions.expectFailure();
  }
  /** Expect denied for the controlled browser journey.
   */
  public expectDenied(): void {
    this.actions.expectDenied();
  }
  /** Browser return for the controlled browser journey.
   */
  public browserReturn(): void {
    this.actions.openDetails();
    this.actions.refreshRows();
    this.actions.browserBack();
  }
  /** Shrink return for the controlled browser journey.
   */
  public shrinkReturn(): void {
    this.actions.openDetails();
    this.actions.shrinkRows();
    this.actions.returnList();
  }
  /** Expect clamp for the controlled browser journey.
   */
  public expectClamp(): void {
    this.actions.expectRestoredList(true);
  }
  /** Empty for the controlled browser journey.
   */
  public empty(): void {
    this.actions.empty();
  }
  /** Expect empty for the controlled browser journey.
   */
  public expectEmpty(): void {
    this.actions.expectEmpty();
  }
  /** Reflow for the controlled browser journey.
   */
  public reflow(): void {
    this.actions.reflow();
  }
  /** Capture populated for the controlled browser journey.
   */
  public capturePopulated(): void {
    this.actions.capture('populated');
  }
  /** Capture empty for the controlled browser journey.
   */
  public captureEmpty(): void {
    this.actions.capture('empty');
  }
  /** Open details for the controlled browser journey.
   */
  public openDetails(): void {
    this.actions.openDetails();
  }
  /** Return list for the controlled browser journey.
   */
  public returnList(): void {
    this.actions.refreshRows();
    this.actions.returnList();
    this.actions.expectRestoredList();
  }
  /** Denied role for the controlled browser journey.
   * @param role Expected or configured role.
   */
  public deniedRole(role: string): void {
    this.actions.deniedRole(role);
  }
  /** Direct shell for the controlled browser journey.
   * @param kind Expected or configured kind.
   */
  public directShell(kind: string): void {
    this.actions.directShell(kind);
  }
}
