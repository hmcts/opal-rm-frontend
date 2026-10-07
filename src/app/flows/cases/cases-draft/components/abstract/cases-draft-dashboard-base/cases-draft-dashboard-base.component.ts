import { afterNextRender, computed, DestroyRef, ElementRef, inject, Injector, Signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NavigationBehaviorOptions, Router, UrlTree } from '@angular/router';
import {
  asapScheduler,
  auditTime,
  catchError,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  merge,
  Observable,
  of,
  pairwise,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { AbstractTabData } from '@hmcts/opal-frontend-common/components/abstract/abstract-tab-data';
import type { SortDirectionType } from '@hmcts/opal-frontend-common/components/abstract/abstract-sortable-table/types';
import { getCasesDraftTabMetadata } from '../../../utils/cases-draft-tab-metadata';
import { CasesDraftDashboardService } from '../../../services/cases-draft-dashboard.service';
import { CasesDraftNavigationService } from '../../../services/cases-draft-navigation.service';
import type { CasesDraftDashboardMode } from '../../../types/cases-draft-dashboard-mode.type';
import type { CasesDraftTab } from '../../../types/cases-draft-tab.type';
import type { CasesDraftSortColumn } from '../../../types/cases-draft-sort-column.type';
import type { ICasesDraftIdentity } from '../../../interfaces/cases-draft-identity.interface';
import type { ICasesDraftResolvedList } from '../../../interfaces/cases-draft-resolved-list.interface';
import type { ICasesDraftNavigation } from '../../../interfaces/cases-draft-navigation.interface';
import type { ICasesDraftTabData } from '../../../interfaces/cases-draft-tab-data.interface';
import { defaultCasesDraftNavigation, parseCasesDraftNavigation } from '../../../utils/cases-draft-navigation';
import { sameCasesDraftIdentity } from '../../../utils/cases-draft-identity';
import { mapCasesDraftRows } from '../../../utils/cases-draft-summary';

/** Shared table behavior; each routed dashboard retains its own badge and permission-error reactions. */
export abstract class CasesDraftDashboardBaseComponent extends AbstractTabData {
  private readonly destroy$ = new Subject<void>();
  private readonly injector = inject(Injector);
  protected readonly dashboardRouter = inject(Router);
  protected abstract readonly heading: Signal<ElementRef<HTMLElement> | undefined>;
  protected abstract readonly mode: CasesDraftDashboardMode;
  protected abstract readonly identity: Signal<ICasesDraftIdentity | null>;
  public readonly data = inject(CasesDraftDashboardService);
  public readonly navigation = inject(CasesDraftNavigationService);
  public abstract readonly tabs: readonly CasesDraftTab[];
  public readonly tabLinks = computed(() =>
    this.tabs.map((tab) => ({
      tab,
      label: getCasesDraftTabMetadata(tab, this.mode).label,
      href: this.dashboardRouter.serializeUrl(
        this.navigation.dashboardUrl(defaultCasesDraftNavigation(tab, this.mode)),
      ),
    })),
  );
  public readonly selectedTabLabel = computed(
    () => getCasesDraftTabMetadata(this.navigation.selection().tab, this.mode).label,
  );
  public readonly emptyMessage = computed(
    () => getCasesDraftTabMetadata(this.navigation.selection().tab, this.mode).empty,
  );
  public abstract readonly tabData$: Observable<ICasesDraftTabData | null>;

  private selectionForFragment(fragment: string | null): ICasesDraftNavigation {
    const defaults = parseCasesDraftNavigation(fragment, this.mode);
    const current = this.navigation.selection();
    return current.tab === defaults.tab ? current : defaults;
  }

  private clampPage(result: ICasesDraftTabData): void {
    const selection = this.navigation.selection();
    if (!this.isCurrentData(result) || !result.rows) return;
    const page = Math.max(1, Math.min(selection.page, Math.ceil(result.rows.length / 25)));
    if (page !== selection.page) this.navigation.setSelection({ ...selection, page });
  }
  /** Initialise after the concrete page has created its mode and live identity signal. */
  protected initialiseDashboard(onListError?: (error: unknown) => void) {
    inject(DestroyRef).onDestroy(() => {
      this.destroy$.next();
      this.destroy$.complete();
    });
    afterNextRender(() => this.heading()?.nativeElement.focus());
    const defaultSelection = defaultCasesDraftNavigation(undefined, this.mode);
    const initialSelection = this.selectionForFragment(this.activatedRoute.snapshot.fragment);
    // AbstractTabData filters empty fragments. Add their transitions, including re-entry to the preceding tab.
    const fragment$ = merge(
      this.getFragmentStream(defaultSelection.tab, this.destroy$),
      this.activatedRoute.fragment.pipe(
        startWith(null),
        pairwise(),
        filter(([previous, current]) => !previous || !current),
        map(([, fragment]) => fragment || defaultSelection.tab),
      ),
    ).pipe(distinctUntilChanged());
    const identity$ = toObservable(this.identity).pipe(
      startWith(this.identity()),
      distinctUntilChanged(sameCasesDraftIdentity),
      tap((identity) => {
        if (!identity) void this.navigate('/access-denied');
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    // Reapply the current route after the navigation service clears metadata for a replacement identity.
    const selection$ = combineLatest([fragment$, identity$]).pipe(
      auditTime(0, asapScheduler),
      map(([fragment, identity]) => (identity ? this.selectionForFragment(fragment) : defaultSelection)),
      startWith(initialSelection),
      tap((selection) => {
        this.navigation.setSelection(selection);
        this.activeTab = selection.tab;
      }),
      takeUntilDestroyed(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    const tab$ = selection$.pipe(
      map((selection) => selection.tab),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    let pendingResolved = this.activatedRoute.snapshot.data['draftCasefiles'] as ICasesDraftResolvedList | undefined;
    const tabData$ = combineLatest([identity$, tab$]).pipe(
      switchMap(([identity, tab]) => {
        const resolved = pendingResolved;
        pendingResolved = undefined;
        if (!identity) return of(null);
        const request =
          resolved?.tab === tab && sameCasesDraftIdentity(identity, resolved.identity)
            ? of(resolved.response)
            : this.data.getList(identity, tab);
        return request.pipe(
          map((response): ICasesDraftTabData => ({
            identity,
            tab,
            count: response.count,
            rows: mapCasesDraftRows(
              response.summaries.filter(
                (summary) =>
                  summary.business_unit_id === identity.businessUnitId &&
                  (this.mode === 'checker'
                    ? summary.submitted_by !== identity.submittedBy
                    : summary.submitted_by === identity.submittedBy),
              ),
              tab,
              this.mode,
            ),
          })),
          tap((result) => afterNextRender(() => this.clampPage(result), { injector: this.injector })),
          startWith<ICasesDraftTabData>({ identity, tab, rows: null, count: null }),
          catchError((error: unknown) => {
            onListError?.(error);
            return of(null);
          }),
        );
      }),
      takeUntilDestroyed(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    return { identity$, tab$, tabData$ };
  }

  protected async navigate(
    url: string | UrlTree,
    options: NavigationBehaviorOptions = { replaceUrl: false },
  ): Promise<boolean> {
    try {
      return await this.dashboardRouter.navigateByUrl(url, options);
    } catch (error: unknown) {
      this.data.reportError(error);
      return false;
    }
  }
  public formatRejectedCount(count: number | null): string | null {
    return count === null || count === 0 ? null : this.formatCountWithCap(count, 99);
  }

  /** The live scope check hides old rows before the signal-to-observable effect has run. */
  public isCurrentData(result: ICasesDraftTabData): boolean {
    return this.isCurrentIdentity(result.identity) && result.tab === this.navigation.selection().tab;
  }
  public isCurrentIdentity(identity: ICasesDraftIdentity): boolean {
    return sameCasesDraftIdentity(identity, this.identity());
  }
  public activateTab(event: MouseEvent, tab: CasesDraftTab): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void this.selectTab(tab);
  }
  public async selectTab(tab: CasesDraftTab): Promise<void> {
    await this.navigate(this.navigation.dashboardUrl(defaultCasesDraftNavigation(tab, this.mode)));
  }
  public changeSort(change: { key: CasesDraftSortColumn; direction: SortDirectionType }): void {
    if (change.direction === 'none') return;
    this.navigation.setSelection({
      ...this.navigation.selection(),
      page: 1,
      sort: change.key,
      direction: change.direction,
    });
  }
  public changePage(page: number): void {
    this.navigation.setSelection({ ...this.navigation.selection(), page });
  }
}
