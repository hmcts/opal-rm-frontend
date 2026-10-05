import { HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { PAGES_ROUTING_PATHS as COMMON_PAGES_ROUTING_PATHS } from '@hmcts/opal-frontend-common/pages/routing/constants';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import {
  catchError,
  combineLatest,
  defer,
  distinctUntilChanged,
  EMPTY,
  filter,
  map,
  merge,
  Observable,
  of,
  ReplaySubject,
  startWith,
  Subject,
  Subscription,
  switchMap,
  take,
  takeUntil,
  throwIfEmpty,
} from 'rxjs';
import { RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG } from '../../constants/release-1c-rm-create-case-files-feature-flag.constant';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
import type { ICasesDraftBadgeState } from '../interfaces/cases-draft-badge-state.interface';
import type { ICasesDraftIdentity } from '../interfaces/cases-draft-identity.interface';
import type { ICasesDraftListState } from '../interfaces/cases-draft-list-state.interface';
import type { CasesDraftLoadEvent } from '../types/cases-draft-load-event.type';
import type { CasesDraftTab } from '../types/cases-draft-tab.type';
import { casesDraftErrorReference, formatCasesDraftRejectedCount } from '../utils/cases-draft-error';
import { resolveCasesDraftIdentity } from '../utils/cases-draft-identity';
import { buildCasesDraftListParams } from '../utils/cases-draft-list-params';
import { mapCasesDraftRows } from '../utils/cases-draft-summary';

/** Component-scoped owner: fresh consultations only after load, with no retained personal data on exit. */
@Injectable()
export class CasesDraftDashboardService {
  private readonly api = inject(OpalMaintenanceService);
  private readonly dates = inject(DateService);
  private readonly router = inject(Router);
  private readonly globalStore = inject(GlobalStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly rawList = signal<ICasesDraftListState>(this.listState('idle'));
  private readonly rawBadge = signal<ICasesDraftBadgeState>(this.badgeState('idle'));
  private readonly accessDenied = signal(false);
  private readonly active = signal(true);
  private readonly selectionEpoch = signal(0);
  private readonly owner = signal<{ identity: ICasesDraftIdentity | null; epoch: number } | null>(null);
  private readonly tabs = new ReplaySubject<CasesDraftTab>(1);
  private readonly listRetry = new Subject<void>();
  private readonly badgeRetry = new Subject<void>();
  private readonly stopOperation = new Subject<void>();
  private readonly currentOperation = new Subscription();
  private selectedTab: CasesDraftTab | null = null;
  private readonly authorisedIdentity = computed(() => {
    const flags: Record<string, unknown> = this.globalStore.featureFlags();
    const authenticated = this.globalStore.authenticated();
    const user = this.globalStore.userState();
    return authenticated
      ? resolveCasesDraftIdentity(user, flags[RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG] === true)
      : null;
  });

  // Read the live signals as well as the request epoch: effects cannot expose the previous user's rows.
  public readonly list = computed(() =>
    this.visibleState(this.rawList(), this.listState('idle'), this.listState('denied')),
  );
  public readonly badge = computed(() =>
    this.visibleState(this.rawBadge(), this.badgeState('idle'), this.badgeState('denied')),
  );

  constructor() {
    const identity$ = toObservable(this.authorisedIdentity).pipe(
      startWith(this.authorisedIdentity()),
      distinctUntilChanged((previous, current) => this.sameIdentity(previous, current)),
    );
    this.currentOperation.add(
      combineLatest([identity$, this.tabs])
        .pipe(
          switchMap(([identity, tab]) => {
            // A routed load can arrive before the identity effect. Wait for the live identity's emission.
            if (!this.sameIdentity(identity, this.authorisedIdentity())) return EMPTY;
            const epoch = this.selectionEpoch();
            this.clearForSelection(identity, tab, epoch);
            if (!identity) return of<CasesDraftLoadEvent>({ kind: 'denied' });
            const lists = this.listRetry.pipe(
              startWith(undefined),
              switchMap(() => this.listEvents(identity, tab)),
            );
            const events =
              tab === 'rejected'
                ? lists
                : merge(
                    lists,
                    this.badgeRetry.pipe(
                      startWith(undefined),
                      switchMap(() => this.badgeEvents(identity)),
                    ),
                  );
            return events.pipe(filter(() => this.isCurrent(identity, epoch)));
          }),
          takeUntil(this.stopOperation),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((event) => this.applyEvent(event)),
    );
    this.destroyRef.onDestroy(() => this.deactivate());
  }

  private sameIdentity(current: ICasesDraftIdentity | null, previous: ICasesDraftIdentity | null): boolean {
    if (!current || !previous) return current === previous;
    return (
      current.userId === previous.userId &&
      current.businessUnitId === previous.businessUnitId &&
      current.submittedBy === previous.submittedBy
    );
  }

  private isCurrent(identity: ICasesDraftIdentity | null, epoch: number): boolean {
    return (
      this.active() &&
      !this.accessDenied() &&
      epoch === this.selectionEpoch() &&
      this.sameIdentity(identity, this.authorisedIdentity())
    );
  }

  private visibleState<T>(raw: T, idle: T, denied: T): T {
    if (!this.active()) return idle;
    if (this.accessDenied()) return denied;
    const owner = this.owner();
    if (!owner) return idle;
    return this.isCurrent(owner.identity, owner.epoch) ? raw : denied;
  }

  private listState(status: ICasesDraftListState['status'], reference: string | null = null): ICasesDraftListState {
    return { status, rows: [], count: null, correlationReference: reference };
  }

  private badgeState(status: ICasesDraftBadgeState['status'], reference: string | null = null): ICasesDraftBadgeState {
    return { status, count: null, label: null, correlationReference: reference };
  }

  private clearForSelection(identity: ICasesDraftIdentity | null, tab: CasesDraftTab, epoch: number): void {
    this.selectedTab = tab;
    this.owner.set({ identity, epoch });
    this.rawList.set(this.listState(identity ? 'loading' : 'denied'));
    this.rawBadge.set(this.badgeState(identity ? 'loading' : 'denied'));
  }

  private listEvents(identity: ICasesDraftIdentity, tab: CasesDraftTab): Observable<CasesDraftLoadEvent> {
    return defer(() =>
      this.api.getDraftCasefiles(buildCasesDraftListParams(identity, tab, this.dates.getDateRange(7, 0))),
    ).pipe(
      take(1),
      throwIfEmpty(),
      map((response): CasesDraftLoadEvent => ({
        kind: 'list-ready',
        tab,
        count: response.count,
        rows: mapCasesDraftRows(
          response.summaries.filter(
            (summary) =>
              summary.business_unit_id === identity.businessUnitId && summary.submitted_by === identity.submittedBy,
          ),
          tab,
        ),
      })),
      catchError((error: unknown) => of<CasesDraftLoadEvent>(this.errorEvent(error, tab))),
      startWith<CasesDraftLoadEvent>({ kind: 'list-loading', tab }),
    );
  }

  private badgeEvents(identity: ICasesDraftIdentity): Observable<CasesDraftLoadEvent> {
    return defer(() => this.api.getRejectedDraftCasefileCount(identity)).pipe(
      take(1),
      throwIfEmpty(),
      map((response): CasesDraftLoadEvent => ({ kind: 'badge-ready', count: response.count })),
      catchError((error: unknown) => of<CasesDraftLoadEvent>(this.errorEvent(error))),
      startWith<CasesDraftLoadEvent>({ kind: 'badge-loading' }),
    );
  }

  private errorEvent(error: unknown, tab?: CasesDraftTab): CasesDraftLoadEvent {
    if (error instanceof HttpErrorResponse && [401, 403].includes(error.status)) return { kind: 'denied' };
    const reference = casesDraftErrorReference(error);
    return tab === undefined ? { kind: 'badge-error', reference } : { kind: 'list-error', tab, reference };
  }

  private setBadge(count: number): void {
    this.rawBadge.set({
      status: 'ready',
      count,
      label: formatCasesDraftRejectedCount(count),
      correlationReference: null,
    });
  }

  private applyEvent(event: CasesDraftLoadEvent): void {
    switch (event.kind) {
      case 'denied':
        this.accessDenied.set(true);
        this.rawList.set(this.listState('denied'));
        this.rawBadge.set(this.badgeState('denied'));
        this.stopOperation.next();
        this.currentOperation.unsubscribe();
        void this.router.navigateByUrl('/' + COMMON_PAGES_ROUTING_PATHS.children.accessDenied).catch(() => undefined);
        return;
      case 'list-loading':
        this.rawList.set(this.listState('loading'));
        if (event.tab === 'rejected') this.rawBadge.set(this.badgeState('loading'));
        return;
      case 'list-ready':
        this.rawList.set({
          status: event.rows.length ? 'ready' : 'empty',
          rows: event.rows,
          count: event.count,
          correlationReference: null,
        });
        if (event.tab === 'rejected') this.setBadge(event.count);
        return;
      case 'list-error':
        this.rawList.set(this.listState('error', event.reference));
        if (event.tab === 'rejected') this.rawBadge.set(this.badgeState('error', event.reference));
        return;
      case 'badge-loading':
        this.rawBadge.set(this.badgeState('loading'));
        return;
      case 'badge-ready':
        this.setBadge(event.count);
        return;
      case 'badge-error':
        this.rawBadge.set(this.badgeState('error', event.reference));
    }
  }

  /** Every routed entry reloads, including the same tab; a stopped owner needs a fresh component instance. */
  public load(tab: CasesDraftTab): void {
    if (!this.active() || this.accessDenied()) return;
    this.selectionEpoch.update((epoch) => epoch + 1);
    if (!this.authorisedIdentity()) {
      this.applyEvent({ kind: 'denied' });
      return;
    }
    this.tabs.next(tab);
  }

  public retryList(): void {
    if (this.list().status === 'error') this.listRetry.next();
  }

  public retryBadge(): void {
    if (this.selectedTab !== 'rejected' && this.badge().status === 'error') this.badgeRetry.next();
  }

  /** Permanently cancels this component's requests and clears all retained personal summaries. */
  public deactivate(): void {
    this.active.set(false);
    this.stopOperation.next();
    this.currentOperation.unsubscribe();
    this.owner.set(null);
    this.rawList.set(this.listState('idle'));
    this.rawBadge.set(this.badgeState('idle'));
  }
}
