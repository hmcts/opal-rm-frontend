import type { CasesDraftInputterTab } from 'src/app/flows/cases/cases-draft/types/cases-draft-tab.type';
import { performAuthentication } from '../../../../actions/login.actions';
import { InputterCasefileMonitoringActions } from '../../actions/checkAndValidateCase/inputter-casefile-monitoring.actions';
import { InputterMonitoringFixtureActions } from '../../actions/checkAndValidateCase/inputter-monitoring-fixture.actions';
import type { IOwnedDraftCasefile } from '../../actions/checkAndValidateCase/interfaces/draft-casefile-owned.interface';

type MonitoringStatus = Parameters<InputterMonitoringFixtureActions['create']>[0];
const TAB_BY_STATUS: Record<MonitoringStatus, CasesDraftInputterTab> = {
  SUBMITTED: 'in-review',
  REJECTED: 'rejected',
  DELETED: 'deleted',
  PUBLISHING_PENDING: 'approved',
  PUBLISHED: 'approved',
};

/** A fresh flow and fixture map belong to each scenario; no record or navigation state crosses scenarios. */
export class InputterCasefileMonitoringFlow {
  private readonly fixtures = new InputterMonitoringFixtureActions();
  private readonly actions = new InputterCasefileMonitoringActions();
  private readonly lifecycle = new Map<CasesDraftInputterTab, IOwnedDraftCasefile>();
  private primary?: IOwnedDraftCasefile;
  private other?: IOwnedDraftCasefile;
  private focus?: IOwnedDraftCasefile;
  private focusTab: CasesDraftInputterTab = 'in-review';

  /** Creates four independent real lifecycle records before monitoring any dashboard traffic. */
  public prepareLifecycle(): void {
    this.fixtures.requirePublication();
    cy.wrap(['SUBMITTED', 'REJECTED', 'PUBLISHED', 'DELETED'] as MonitoringStatus[], { log: false }).each(
      (status: MonitoringStatus) =>
        this.fixtures.create(status).then((owned) => {
          this.primary ??= owned;
          this.lifecycle.set(TAB_BY_STATUS[status], owned);
        }),
    );
    this.openPrimary('in-review');
  }

  /** Validates and creates exactly the requested persisted lifecycle.
   * @param status Explicit lifecycle value from the feature Examples.
   */
  public prepareStatus(status: string): void {
    if (!Object.hasOwn(TAB_BY_STATUS, status)) throw new Error('Unknown live monitoring lifecycle');
    const lifecycle = status as MonitoringStatus;
    this.focusTab = TAB_BY_STATUS[lifecycle];
    this.fixtures.create(lifecycle).then((owned) => {
      this.primary = owned;
      this.focus = owned;
      this.lifecycle.set(this.focusTab, owned);
    });
    this.openPrimary(this.focusTab);
  }

  /** Opens the primary session after setup, including when the final creation belonged to another inputter.
   * @param tab Initial dashboard tab.
   */
  private openPrimary(tab: CasesDraftInputterTab): void {
    cy.then(() => {
      const primary = this.requirePrimary();
      performAuthentication(primary.inputter);
      this.actions.observe(primary.inputterId);
      this.actions.open(tab);
    });
  }

  /** Inspects every own lifecycle through the keyboard before the explicit outcome assertion. */
  public inspectLifecycle(): void {
    for (const tab of ['rejected', 'approved', 'deleted', 'in-review'] as CasesDraftInputterTab[])
      this.actions.consult(tab);
  }

  /** Proves each owned record occurs only in its matching lifecycle response and DOM. */
  public expectLifecycle(): void {
    for (const tab of ['rejected', 'approved', 'deleted', 'in-review'] as CasesDraftInputterTab[]) {
      this.actions.consult(tab);
      this.expectTab(tab);
    }
  }

  /** Visits one explicitly named lifecycle tab with native keyboard interaction.
   * @param tab Named tab in functional/accessibility steps.
   */
  public consultTab(tab: string): void {
    this.actions.consult(this.tab(tab));
  }

  /** Proves the current owned lifecycle identity and excludes the other scenario-owned records.
   * @param tab Expected current lifecycle tab.
   */
  public expectTab(tab: string): void {
    const selected = this.tab(tab);
    cy.then(() => {
      const owned = this.lifecycle.get(selected);
      if (!owned) throw new Error('No scenario-owned fixture exists for the requested lifecycle tab');
      const all = [...this.fixtures.state.ownedById.values()];
      this.actions.expectPersonal(selected, all, this.requirePrimary().inputterId);
      this.actions.expectRows(
        [owned],
        all.filter((item) => item.id !== owned.id),
      );
    });
  }

  /** Reads actual persisted lifecycle date and consults at the two calendar boundaries. */
  public consultDates(): void {
    cy.then(() => this.actions.consultDates(this.requireFocus(), this.focusTab));
  }

  /** Checks both independently observed boundary consultations.
   * @param window Expected business visibility policy.
   */
  public expectWindow(window: string): void {
    this.actions.expectDateWindow(window);
  }

  /** Owns the exact personal state plus an independent other-inputter rejection.
   * @param state Empty or populated personal collection.
   */
  public prepareRejections(state: string): void {
    if (!['empty', 'populated'].includes(state)) throw new Error('Unknown personal rejection state');
    const second = this.fixtures.secondInputter();
    this.fixtures.requireEmptyRejected();
    // An independently submitted primary record supplies actor identity even when personal Rejected is empty.
    this.fixtures.create(state === 'empty' ? 'SUBMITTED' : 'REJECTED').then((owned) => {
      this.primary = owned;
    });
    this.fixtures.create('REJECTED', { inputter: second }).then((owned) => {
      this.other = owned;
    });
    this.openPrimary('rejected');
    cy.then(() => {
      const primary = this.requirePrimary();
      const other = this.requireOther();
      if (state === 'empty') {
        this.actions.expectEmpty();
        this.actions.expectRows([], [primary, other]);
      } else this.actions.expectRows([primary], [other]);
    });
  }

  /** Starts with genuinely empty personal Rejected, then creates exactly 26 own rows and one other-owned row. */
  public preparePagination(): void {
    const second = this.fixtures.secondInputter();
    this.fixtures.requireEmptyRejected();
    cy.wrap(
      Array.from({ length: 26 }, (_, index) => index),
      { log: false },
    ).each(() =>
      this.fixtures.create('REJECTED', { uniqueNames: true }).then((owned) => {
        this.primary ??= owned;
      }),
    );
    this.fixtures.create('REJECTED', { inputter: second, uniqueNames: true }).then((owned) => {
      this.other = owned;
    });
    this.openPrimary('rejected');
    cy.then(() =>
      this.actions.requirePagination(
        [...this.fixtures.state.ownedById.values()].filter(
          (owned) => owned.inputterId === this.requirePrimary().inputterId,
        ),
      ),
    );
  }

  /** Sorts and pages the own collection, retaining its actual values for the final return assertion. */
  public paginate(): void {
    this.actions.paginatePersonal();
  }

  /** Applies one explicit keyboard sort state for accessibility checks.
   * @param direction Expected ascending or descending state.
   */
  public sortPersonal(direction: string): void {
    this.actions.sortPersonal(direction);
  }

  /** Visits one personal page for an explicit accessibility scan.
   * @param direction Next or previous page.
   */
  public pagePersonal(direction: string): void {
    this.actions.pagePersonal(direction);
  }

  /** Opens the complete real BU rejection list from the personal dashboard. */
  public viewAllRejected(): void {
    this.actions.viewAllRejected();
  }

  /** Verifies all this scenario's rejected rows and the other inputter, without assuming the shared-BU total. */
  public expectAllRejected(): void {
    cy.then(() => {
      const submittedPrimary = this.requirePrimary();
      const rejected = [...this.fixtures.state.ownedByKey.entries()]
        .filter(([key]) => key.startsWith('REJECTED:'))
        .map(([, owned]) => owned);
      this.actions.expectRows(
        rejected,
        rejected.some((owned) => owned.id === submittedPrimary.id) ? [] : [submittedPrimary],
      );
    });
  }

  /** Opens the exact other-inputter rejection for amendment, without editing or resubmitting it. */
  public openOther(): void {
    cy.then(() => this.actions.openAmendment(this.requireOther()));
  }

  /** Returns through the supported amendment Back link to All rejected. */
  public returnList(): void {
    this.actions.returnFromAmendment();
  }

  /** Returns through All rejected's Back to your cases link. */
  public returnDashboard(): void {
    this.actions.returnDashboard();
  }

  /** Exercises the full cross-user entry/return journey with independently retained own dashboard state. */
  public amendAndReturn(): void {
    this.paginate();
    this.viewAllRejected();
    this.expectAllRejected();
    this.openOther();
    this.returnList();
    this.returnDashboard();
  }

  /** Checks the exact originating dashboard consultation state and fresh selected GET. */
  public expectRestored(): void {
    this.actions.expectRestored();
  }

  /** Visits Approved through a different tab to ensure a fresh consultation. */
  public inspectApproved(): void {
    this.actions.consult('in-review');
    this.actions.consult('approved');
  }

  /** Checks persisted generated numbers or the strictly null pending account state.
   * @param pending Whether this example requires verified stable pending.
   */
  public expectAccounts(pending: boolean): void {
    cy.then(() => this.actions.expectAccounts(this.requireFocus(), pending));
  }

  /** Requires an authorised own row before verifying an existing denied account. */
  public prepareDenied(): void {
    this.prepareStatus('SUBMITTED');
    cy.then(() => this.actions.prepareDenied(this.requirePrimary()));
  }

  /** Attempts direct dashboard consultation as the denied account. */
  public openDenied(): void {
    this.actions.openDenied();
  }

  /** Checks actual guard destination, absent sensitive content and zero forbidden consultations. */
  public expectDenied(): void {
    this.actions.expectDenied();
  }

  /** Requires no existing personal lifecycle records; never mutates another scenario's data. */
  public prepareEmpty(): void {
    this.actions.requireEmptyDashboard();
  }

  /** Checks the empty UI against its real list response. */
  public expectEmpty(): void {
    this.actions.expectEmpty();
  }

  /** Narrows a feature value without guessing an unsupported tab.
   * @param tab Explicit dashboard tab.
   * @returns Valid inputter tab.
   */
  private tab(tab: string): CasesDraftInputterTab {
    if (!['in-review', 'rejected', 'approved', 'deleted'].includes(tab)) throw new Error('Unknown monitoring tab');
    return tab as CasesDraftInputterTab;
  }

  /** Requires completed fixture setup.
   * @returns The scenario's primary owning inputter record.
   */
  private requirePrimary(): IOwnedDraftCasefile {
    if (!this.primary) throw new Error('Primary monitoring fixture is missing');
    return this.primary;
  }

  /** Requires completed cross-user fixture setup.
   * @returns The scenario's independently owned other-inputter rejection.
   */
  private requireOther(): IOwnedDraftCasefile {
    if (!this.other) throw new Error('Other inputter monitoring fixture is missing');
    return this.other;
  }

  /** Requires completed lifecycle setup.
   * @returns The scenario's requested lifecycle fixture.
   */
  private requireFocus(): IOwnedDraftCasefile {
    if (!this.focus) throw new Error('Focused monitoring fixture is missing');
    return this.focus;
  }
}
