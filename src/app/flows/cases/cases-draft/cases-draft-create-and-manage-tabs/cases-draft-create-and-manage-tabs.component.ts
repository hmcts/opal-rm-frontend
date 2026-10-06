import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, UrlTree } from '@angular/router';
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
  skip,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs';
import { CustomPageHeaderComponent } from '@hmcts/opal-frontend-common/components/custom/custom-page-header';
import { GovukButtonDirective } from '@hmcts/opal-frontend-common/directives/govuk-button';
import { MojSubNavigationComponent } from '@hmcts/opal-frontend-common/components/moj/moj-sub-navigation';
import { MojNotificationBadgeComponent } from '@hmcts/opal-frontend-common/components/moj/moj-notification-badge';
import { CASES_DRAFT_TABS } from '../constants/cases-draft-tabs.constant';
import { CasesDraftDashboardService } from '../services/cases-draft-dashboard.service';
import { CasesDraftNavigationService } from '../services/cases-draft-navigation.service';
import { CasesDraftTableComponent } from '../cases-draft-table/cases-draft-table.component';
import type { CasesDraftTab } from '../types/cases-draft-tab.type';
import type { CasesDraftSortColumn } from '../types/cases-draft-sort-column.type';
import type { ICasesDraftIdentity } from '../interfaces/cases-draft-identity.interface';
import type { ICasesDraftResolvedList } from '../interfaces/cases-draft-resolved-list.interface';
import type { ICasesDraftNavigation } from '../interfaces/cases-draft-navigation.interface';
import type { ICasesDraftTabData } from '../interfaces/cases-draft-tab-data.interface';
import { defaultCasesDraftNavigation, parseCasesDraftNavigation } from '../utils/cases-draft-navigation';
import { sameCasesDraftIdentity } from '../utils/cases-draft-identity';
import { mapCasesDraftRows } from '../utils/cases-draft-summary';
import { AbstractTabData } from '@hmcts/opal-frontend-common/components/abstract/abstract-tab-data';
import type { SortDirectionType } from '@hmcts/opal-frontend-common/components/abstract/abstract-sortable-table/types';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../../cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';

@Component({
  selector: 'app-cases-draft-create-and-manage-tabs',
  imports: [
    AsyncPipe,
    CustomPageHeaderComponent,
    GovukButtonDirective,
    MojSubNavigationComponent,
    MojNotificationBadgeComponent,
    CasesDraftTableComponent,
  ],
  templateUrl: './cases-draft-create-and-manage-tabs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesDraftCreateAndManageTabsComponent extends AbstractTabData {
  private readonly dashboardRouter = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly injector = inject(Injector);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly httpDenied = signal(false);
  private readonly identity = computed(() => (this.httpDenied() ? null : this.data.getIdentity()));
  public readonly data = inject(CasesDraftDashboardService);
  public readonly navigation = inject(CasesDraftNavigationService);
  public readonly tabs: readonly CasesDraftTab[] = ['in-review', 'rejected', 'approved', 'deleted'];
  public readonly tabLinks = computed(() =>
    this.tabs.map((tab) => ({
      tab,
      label: CASES_DRAFT_TABS[tab].label,
      href: this.dashboardRouter.serializeUrl(this.navigation.dashboardUrl(defaultCasesDraftNavigation(tab))),
    })),
  );
  public readonly selectedTabLabel = computed(() => CASES_DRAFT_TABS[this.navigation.selection().tab].label);
  public readonly emptyMessage = computed(() => CASES_DRAFT_TABS[this.navigation.selection().tab].empty);
  public readonly allRejectedUrl = computed(() =>
    this.dashboardRouter.serializeUrl(this.navigation.placeholderUrl('rejections')),
  );
  public readonly tabData$: Observable<ICasesDraftTabData | null>;
  public readonly rejectedCount$: Observable<{ identity: ICasesDraftIdentity; count: number | null }>;

  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => {
      this.destroy$.next();
      this.destroy$.complete();
    });
    afterNextRender(() => this.heading()?.nativeElement.focus());
    const initialSelection = this.selectionForFragment(this.activatedRoute.snapshot.fragment);
    // AbstractTabData filters empty fragments. Add their transitions, including re-entry to the preceding tab.
    const fragment$ = merge(
      this.getFragmentStream('in-review', this.destroy$),
      this.activatedRoute.fragment.pipe(
        startWith(null),
        pairwise(),
        filter(([previous, current]) => !previous || !current),
        map(([, fragment]) => fragment || 'in-review'),
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
      map(([fragment, identity]) => (identity ? this.selectionForFragment(fragment) : defaultCasesDraftNavigation())),
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
    const resolvedIdentity = pendingResolved?.identity ?? null;
    const resolvedCount = this.activatedRoute.snapshot.data['rejectedCount'] as number | null | undefined;
    this.tabData$ = combineLatest([identity$, tab$]).pipe(
      switchMap(([identity, tab]) => {
        const resolved = pendingResolved;
        pendingResolved = undefined;
        if (!identity) return of(null);
        const request =
          resolved && resolved.tab === tab && sameCasesDraftIdentity(identity, resolved.identity)
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
                  summary.business_unit_id === identity.businessUnitId && summary.submitted_by === identity.submittedBy,
              ),
              tab,
            ),
          })),
          tap((result) => afterNextRender(() => this.clampPage(result), { injector: this.injector })),
          startWith<ICasesDraftTabData>({ identity, tab, rows: null, count: null }),
          catchError((error: unknown) => {
            this.handleRequestError(error);
            return of(null);
          }),
        );
      }),
      takeUntilDestroyed(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    const initialCount$ = identity$.pipe(
      withLatestFrom(tab$),
      switchMap(([identity, tab]) => {
        if (!identity) return of(null);
        // Without resolver data, Rejected still supplies its own badge count from the selected list.
        if (tab === 'rejected') return of({ identity, count: null });
        if (sameCasesDraftIdentity(identity, resolvedIdentity)) return of({ identity, count: resolvedCount ?? null });
        return this.data.getRejectedCount(identity).pipe(
          map((count) => ({ identity, count })),
          startWith({ identity, count: null }),
          takeUntil(tab$.pipe(skip(1))),
          catchError((error: unknown) => {
            this.handleRequestError(error);
            return of({ identity, count: null });
          }),
        );
      }),
    );
    this.rejectedCount$ = merge(
      initialCount$,
      this.tabData$.pipe(
        filter((result): result is ICasesDraftTabData => result?.tab === 'rejected' && result.count !== null),
        map(({ identity, count }) => ({ identity, count })),
      ),
    ).pipe(
      filter((result) => result !== null),
      takeUntilDestroyed(),
    );
  }

  private selectionForFragment(fragment: string | null): ICasesDraftNavigation {
    const defaults = parseCasesDraftNavigation(fragment);
    const current = this.navigation.selection();
    return current.tab === defaults.tab ? current : defaults;
  }

  private clampPage(result: ICasesDraftTabData): void {
    const selection = this.navigation.selection();
    if (!this.isCurrentData(result) || !result.rows) return;
    const page = Math.max(1, Math.min(selection.page, Math.ceil(result.rows.length / 25)));
    if (page !== selection.page) this.navigation.setSelection({ ...selection, page });
  }
  private handleRequestError(error: unknown): void {
    if (error instanceof HttpErrorResponse && [401, 403].includes(error.status)) {
      this.httpDenied.set(true);
    }
  }
  private async navigate(url: string | UrlTree, replaceUrl = false, state?: Record<string, boolean>): Promise<boolean> {
    try {
      return await this.dashboardRouter.navigateByUrl(url, state ? { state } : { replaceUrl });
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
    await this.navigate(this.navigation.dashboardUrl(defaultCasesDraftNavigation(tab)));
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
  public async openRow(id: number): Promise<void> {
    await this.navigate(this.navigation.placeholderUrl('details', id));
  }
  public async openAllRejected(event: MouseEvent): Promise<void> {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    await this.navigate(this.navigation.placeholderUrl('rejections'));
  }
  public async startNewCase(): Promise<void> {
    this.navigation.rememberCreateOrigin();
    await this.navigate(
      '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.caseType,
      false,
      { startNewCase: true, focusCaseTypeHeading: true },
    );
  }
}
