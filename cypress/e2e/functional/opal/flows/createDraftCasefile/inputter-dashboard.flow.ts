import { InputterDashboardActions } from '../../actions/createDraftCasefile/inputter-dashboard.actions';

/** Exposes business journeys; HTTP and page details remain in the actions. */
export class InputterDashboardFlow {
  private readonly actions = new InputterDashboardActions();
  /** Supplies authorised synthetic inputter collections for every lifecycle tab. */
  public available(): void {
    this.actions.available();
  }
  /** Traverses the released Cases landing entry and captures its changed presentation. */
  public enterFromCases(): void {
    this.actions.enterFromCases();
  }
  /** Checks permanent tabs, scoped status filters and the counts-only privacy boundary. */
  public expectTabs(): void {
    this.actions.expectTabs();
  }
  /** Checks fresh entry clears all case and applicant selections. */
  public expectEmptyCaseType(): void {
    this.actions.expectEmptyCaseType();
  }
  /** Supplies an explicit empty or populated rejected collection.
   * @param state Collection result state. */
  public rejected(state = 'populated'): void {
    this.actions.rejected(state);
  }
  /** Uses native Enter for applicant sorting and second-page navigation without HTTP pagination. */
  public selectRejectedPage(): void {
    this.actions.selectRejectedPage();
  }
  /** Opens the respondent from the second rejected page. */
  public openRejectedDetails(): void {
    this.actions.openDetails(1);
  }
  /** Returns with native keyboard activation of Back. */
  public returnFromPlaceholder(): void {
    this.actions.returnFromPlaceholder();
  }
  /** Checks retained page/sort and freshly fetched respondent content. */
  public expectRestored(): void {
    this.actions.expectRestored();
  }
  /** Opens the all-rejected destination in the same tab using native Enter. */
  public viewAllRejected(): void {
    this.actions.viewAllRejected();
  }
  /** Checks canonical all-rejected route, heading focus and absence of persistence traffic. */
  public expectAllRejectedPlaceholder(): void {
    this.actions.expectAllRejectedPlaceholder();
  }
  /** Supplies published multi-account rows plus a defensive unexpected pending result. */
  public approved(): void {
    this.actions.approved();
  }
  /** Selects Approved through native keyboard activation. */
  public selectApproved(): void {
    this.actions.selectApproved();
  }
  /** Checks read-only account sequence, missing-value fallback and pending exclusion. */
  public expectPublished(): void {
    this.actions.expectPublished();
  }
  /** Checks exact BU/user/status parameters and the seven-day status-date boundary. */
  public expectDateBoundary(): void {
    this.actions.expectDateBoundary();
  }
  /** Starts fresh creation from remembered rejected page/sort metadata. */
  public startFromRejected(): void {
    this.actions.startFromRejected();
  }
  /** Checks cancellation retains the originating rejected page/sort. */
  public expectOriginRestored(): void {
    this.actions.expectRestored(false);
  }
  /** Chooses the application dirty-departure confirmation response.
   * @param decision Whether to accept or dismiss departure. */
  public cancelCaseType(decision: string): void {
    this.actions.cancelCaseType(decision);
  }
  /** Checks preserved input or discarded input and retained dashboard metadata.
   * @param outcome Expected retained or restored state. */
  public expectCaseTypeCancellation(outcome: string): void {
    this.actions.expectCaseTypeCancellation(outcome);
  }
  /** Fails list and counts independently once before successful retry. */
  public temporaryFailures(): void {
    this.actions.temporaryFailures();
  }
  /** Opens a canonical dashboard fragment. */
  public open(): void {
    this.actions.open();
  }
  /** Checks focused list error and independently available Retry actions. */
  public expectErrors(): void {
    this.actions.expectErrors();
  }
  /** Activates list Retry through native keyboard events. */
  public retryList(): void {
    this.actions.retryList();
  }
  /** Checks list Retry leaves count failure untouched. */
  public expectListRecovered(): void {
    this.actions.expectListRecovered();
  }
  /** Activates rejected-count Retry through native keyboard events. */
  public retryBadge(): void {
    this.actions.retryBadge();
  }
  /** Checks count Retry does not reload the ready list. */
  public expectBadgeRecovered(): void {
    this.actions.expectBadgeRecovered();
  }
  /** Opens a canonical persisted destination without a local creation draft.
   * @param kind Details or amendment destination.
   * @param id Valid or malformed route identifier. */
  public openPersisted(kind: string, id: string): void {
    this.actions.openPersisted(kind, id);
  }
  /** Checks safe placeholder copy and the closed persistence boundary.
   * @param kind Expected destination type.
   * @param message Expected safe recovery or future-work copy. */
  public expectShell(kind: string, message: string): void {
    this.actions.expectShell(kind, message);
  }
  /** Supplies permission 21 exclusively in another business unit. */
  public crossBusinessUnit(): void {
    this.actions.crossBusinessUnit();
  }
  /** Opens an inputter route for denied-entry evidence.
   * @param path Named protected destination. */
  public openProtected(path: string): void {
    this.actions.openProtected(path);
  }
  /** Checks access denial before any collection or persisted request. */
  public expectDenied(): void {
    this.actions.expectDenied();
  }
  /** Captures confirmation and follows the In review return through native Enter. */
  public returnFromConfirmation(): void {
    this.actions.returnFromConfirmation();
  }
  /** Checks confirmation resets In review to first page and Created descending. */
  public expectDefaultReview(): void {
    this.actions.expectDefaultReview();
  }
  /** Supplies a representative dashboard accessibility state.
   * @param state Loading, empty, populated, error or published data. */
  public state(state: string): void {
    this.actions.state(state);
  }
  /** Captures every populated lifecycle table using native tab activation. */
  public screenshotTables(): void {
    this.actions.screenshotTables();
  }
  /** Checks document width at 320 CSS pixels and captures partial reflow evidence. */
  public reflow(): void {
    this.actions.reflow();
  }
  /** Captures a focused representative persisted shell.
   * @param kind Evidence name distinguishing valid and malformed destinations. */
  public screenshotShell(kind: string): void {
    this.actions.screenshotShell(kind);
  }
  /** Captures fresh creation after dashboard entry. */
  public captureCaseType(): void {
    this.actions.captureCaseType();
  }
}
