import { CheckerDashboardActions } from '../../actions/createDraftCasefile/checker-dashboard.actions';
import type { CheckerRole, CheckerDestination } from '../../mocks/createDraftCasefile/checker-dashboard.mock';

/** Exposes checker business journeys while HTTP and page details stay in Actions. */
export class CheckerDashboardFlow {
  private readonly actions = new CheckerDashboardActions();
  /** Verifies later safe recovery and terminal denial through the real shell.
   * @param kind Consultation kind.
   * @param status Provider status.
   * @param reference Provider correlation reference. */
  public laterFailure(kind: string, status: number, reference: string): void {
    this.actions.laterFailure(kind, status, reference);
  }
  /** Delegates the prepare journey to its page action.
   * @param role Synthetic role at the HTTP boundary. */
  public prepare(role: CheckerRole): void {
    this.actions.prepare(role);
  }
  /** Delegates the enterFromCases journey to its page action. */
  public enterFromCases(): void {
    this.actions.enterFromCases();
  }
  /** Delegates the expectQueuesAndOtherWork journey to its page action. */
  public expectQueuesAndOtherWork(): void {
    this.actions.expectQueuesAndOtherWork();
  }
  /** Delegates the expectRequestScope journey to its page action. */
  public expectRequestScope(): void {
    this.actions.expectRequestScope();
  }
  /** Delegates the selectRejectedPage journey to its page action. */
  public selectRejectedPage(): void {
    this.actions.selectRejectedPage();
  }
  /** Delegates the viewRejectedAndShrink journey to its page action. */
  public viewRejectedAndShrink(): void {
    this.actions.viewRejectedAndShrink();
  }
  /** Delegates the expectFreshClampedReturn journey to its page action. */
  public expectFreshClampedReturn(): void {
    this.actions.expectFreshClampedReturn();
  }
  /** Delegates the failFirstList journey to its page action. */
  public failFirstList(): void {
    this.actions.failFirstList();
  }
  /** Delegates the failFirstFailedCount journey to its page action. */
  public failFirstFailedCount(): void {
    this.actions.failFirstFailedCount();
  }
  /** Checks existing initial HTTP error routing. */
  public expectInitialError(): void {
    this.actions.expectInitialError();
  }
  /** Checks a count failure preserves the successful list. */
  public expectCountFailureWithTable(): void {
    this.actions.expectCountFailureWithTable();
  }
  /** Delegates the openProtected journey to its page action.
   * @param destination Named protected route. */
  public openProtected(destination: CheckerDestination): void {
    this.actions.openProtected(destination);
  }
  /** Delegates the expectDenied journey to its page action. */
  public expectDenied(): void {
    this.actions.expectDenied();
  }
  /** Delegates the prohibitCreation journey to its page action. */
  public prohibitCreation(): void {
    this.actions.prohibitCreation();
  }
  /** Delegates the inspectQueues journey to its page action. */
  public inspectQueues(): void {
    this.actions.inspectQueues();
  }
  /** Delegates the safeShell journey to its page action.
   * @param kind Protected shell destination.
   * @param id Synthetic positive or malformed identifier. */
  public safeShell(kind: CheckerDestination, id: string): void {
    if (kind === 'dashboard') throw new Error('Expected review or view shell');
    this.actions.safeShell(kind, id);
  }
  /** Delegates the pendingOutcome journey to its page action. */
  public pendingOutcome(): void {
    this.actions.pendingOutcome();
  }
  /** Delegates the recoverPendingOutcome journey to its page action. */
  public recoverPendingOutcome(): void {
    this.actions.recoverPendingOutcome();
  }
  /** Delegates the revokePendingAccess journey to its page action. */
  public revokePendingAccess(): void {
    this.actions.revokePendingAccess();
  }
  /** Delegates the independentReturns journey to its page action. */
  public independentReturns(): void {
    this.actions.independentReturns();
  }
  /** Delegates the state journey to its page action.
   * @param state Accessible dashboard state. */
  public state(state: string): void {
    this.actions.state(state);
  }
  /** Delegates the captureState journey to its page action.
   * @param state Accessible dashboard state. */
  public captureState(state: string): void {
    this.actions.captureState(state);
  }
  /** Delegates the screenshotTables journey to its page action. */
  public screenshotTables(): void {
    this.actions.screenshotTables();
  }
  /** Delegates the reflow journey to its page action. */
  public reflow(): void {
    this.actions.reflow();
  }
  /** Delegates the captureShell journey to its page action.
   * @param kind Protected shell destination. */
  public captureShell(kind: string): void {
    this.actions.captureShell(kind);
  }
}
