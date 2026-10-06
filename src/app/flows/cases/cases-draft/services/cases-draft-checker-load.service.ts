import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import type { ICasesDraftIdentity } from '../interfaces/cases-draft-identity.interface';
import type {
  CasesDraftCheckerListState,
  CasesDraftCheckerCountState,
} from '../types/cases-draft-checker-load-state.type';
import type { CasesDraftCheckerTab, CasesDraftOutcomeTab } from '../types/cases-draft-tab.type';
import { sameCasesDraftIdentity } from '../utils/cases-draft-identity';
import { safeCasesDraftCorrelation } from '../utils/cases-draft-safe-correlation';
import { mapCasesDraftRows } from '../utils/cases-draft-summary';
import { CasesDraftDashboardService } from './cases-draft-dashboard.service';

/** Route-scoped request ownership. Page and sort changes consume the same loaded collection. */
@Injectable()
export class CasesDraftCheckerLoadService {
  private readonly data = inject(CasesDraftDashboardService);
  private readonly currentList = signal<CasesDraftCheckerListState | null>(null);
  private readonly currentCounts = signal<Record<CasesDraftOutcomeTab, CasesDraftCheckerCountState>>({
    rejected: { status: 'idle', count: null },
    failed: { status: 'idle', count: null },
  });
  private readonly accessDenied = signal(false);
  private identity: ICasesDraftIdentity | null = null;
  private tab: CasesDraftCheckerTab = 'to-review';
  private listRequest: Subscription | null = null;
  private listVersion = 0;
  private readonly countRequests = new Map<CasesDraftOutcomeTab, Subscription>();
  private readonly countVersions: Record<CasesDraftOutcomeTab, number> = { rejected: 0, failed: 0 };

  public readonly listState = this.currentList.asReadonly();
  public readonly counts = this.currentCounts.asReadonly();
  public readonly denied = this.accessDenied.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.activate(null, this.tab));
  }

  private setCount(tab: CasesDraftOutcomeTab, state: CasesDraftCheckerCountState): void {
    this.currentCounts.update((counts) => ({ ...counts, [tab]: state }));
  }

  private cancelCount(tab: CasesDraftOutcomeTab): void {
    this.countVersions[tab]++;
    this.countRequests.get(tab)?.unsubscribe();
    this.countRequests.delete(tab);
  }

  private outcome(tab: CasesDraftCheckerTab): CasesDraftOutcomeTab | null {
    return tab === 'rejected' || tab === 'failed' ? tab : null;
  }

  private ensureUnselectedCounts(): void {
    for (const tab of ['rejected', 'failed'] as const) {
      if (tab !== this.tab && this.counts()[tab].status === 'idle') this.startCount(tab);
    }
  }

  private startList(): void {
    const identity = this.identity;
    const tab = this.tab;
    if (!identity || this.denied()) return;
    this.listRequest?.unsubscribe();
    const version = ++this.listVersion;
    this.currentList.set({ identity, tab, status: 'loading', rows: null, count: null });
    this.listRequest = this.data.getList(identity, tab).subscribe({
      next: (response) => {
        if (version !== this.listVersion || !sameCasesDraftIdentity(identity, this.identity)) return;
        const scoped = response.summaries.filter(
          (summary) =>
            summary.business_unit_id === identity.businessUnitId && summary.submitted_by !== identity.submittedBy,
        );
        this.currentList.set({
          identity,
          tab,
          status: 'success',
          count: response.count,
          rows: mapCasesDraftRows(scoped, tab, 'checker'),
        });
        const outcome = this.outcome(tab);
        if (outcome) {
          this.cancelCount(outcome);
          this.setCount(outcome, { status: 'success', count: response.count });
        }
      },
      error: (error: unknown) => {
        if (version !== this.listVersion || !sameCasesDraftIdentity(identity, this.identity)) return;
        if (this.handleDenied(error)) return;
        const correlationReference = safeCasesDraftCorrelation(error);
        this.currentList.set({ identity, tab, status: 'failure', rows: null, count: null, correlationReference });
        const outcome = this.outcome(tab);
        if (outcome) {
          this.cancelCount(outcome);
          this.setCount(outcome, { status: 'failure', count: null, correlationReference });
        }
      },
    });
  }

  private startCount(tab: CasesDraftOutcomeTab): void {
    const identity = this.identity;
    if (!identity || this.denied()) return;
    this.cancelCount(tab);
    const version = this.countVersions[tab];
    this.setCount(tab, { status: 'loading', count: null });
    const subscription = this.data.getOutcomeCount(identity, tab).subscribe({
      next: (count) => {
        if (version !== this.countVersions[tab] || !sameCasesDraftIdentity(identity, this.identity)) return;
        this.setCount(tab, { status: 'success', count });
      },
      error: (error: unknown) => {
        if (version !== this.countVersions[tab] || !sameCasesDraftIdentity(identity, this.identity)) return;
        if (this.handleDenied(error)) return;
        this.setCount(tab, { status: 'failure', count: null, correlationReference: safeCasesDraftCorrelation(error) });
      },
    });
    this.countRequests.set(tab, subscription);
  }

  private handleDenied(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse) || ![401, 403].includes(error.status)) return false;
    this.accessDenied.set(true);
    this.activate(null, this.tab);
    return true;
  }

  /** Select a consultation; repeated activation of the same identity and tab is inert. */
  public activate(identity: ICasesDraftIdentity | null, tab: CasesDraftCheckerTab): void {
    if (identity && sameCasesDraftIdentity(identity, this.identity) && tab === this.tab) return;
    const changedIdentity = !sameCasesDraftIdentity(identity, this.identity);
    const abandonedOutcome = this.outcome(this.tab);
    const abandonedPending = this.currentList()?.status === 'loading';
    this.listVersion++;
    this.listRequest?.unsubscribe();
    this.listRequest = null;
    if (changedIdentity || !identity) {
      this.cancelCount('rejected');
      this.cancelCount('failed');
      this.currentCounts.set({ rejected: { status: 'idle', count: null }, failed: { status: 'idle', count: null } });
    } else if (
      abandonedOutcome &&
      abandonedPending &&
      this.counts()[abandonedOutcome].count === null &&
      this.counts()[abandonedOutcome].status !== 'failure'
    ) {
      this.setCount(abandonedOutcome, { status: 'idle', count: null });
    }
    this.identity = identity;
    this.tab = tab;
    this.currentList.set(null);
    if (!identity || this.denied()) return;
    this.startList();
    this.ensureUnselectedCounts();
  }

  /** Retry is explicit and cannot restart access-denied or already pending requests. */
  public retryList(): void {
    if (!this.identity || this.denied() || this.listState()?.status === 'loading') return;
    this.startList();
  }

  public retryCount(tab: CasesDraftOutcomeTab): void {
    if (!this.identity || this.denied()) return;
    if (this.tab === tab) {
      this.retryList();
      return;
    }
    if (this.counts()[tab].status !== 'loading') this.startCount(tab);
  }
}
