import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, UrlTree } from '@angular/router';
import { asapScheduler, auditTime, combineLatest } from 'rxjs';
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
import type { CasesDraftSortDirection } from '../types/cases-draft-sort-direction.type';
import { defaultCasesDraftNavigation, parseCasesDraftNavigation } from '../utils/cases-draft-navigation';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../../cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';

@Component({
  selector: 'app-cases-draft-create-and-manage-tabs',
  imports: [
    CustomPageHeaderComponent,
    GovukButtonDirective,
    MojSubNavigationComponent,
    MojNotificationBadgeComponent,
    CasesDraftTableComponent,
  ],
  providers: [CasesDraftDashboardService],
  templateUrl: './cases-draft-create-and-manage-tabs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesDraftCreateAndManageTabsComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly sectionHeading = viewChild<ElementRef<HTMLElement>>('sectionHeading');
  private readonly listError = viewChild<ElementRef<HTMLElement>>('listError');
  private readonly navigationError = viewChild<ElementRef<HTMLElement>>('navigationError');
  private readonly loading = viewChild<ElementRef<HTMLElement>>('loading');
  private readonly table = viewChild(CasesDraftTableComponent);
  private readonly retryPending = signal(false);
  private loadedTab: CasesDraftTab | null = null;
  private clampingPage: number | null = null;
  public readonly data = inject(CasesDraftDashboardService);
  public readonly navigation = inject(CasesDraftNavigationService);
  public readonly navigationFailed = signal(false);
  public readonly tabs: readonly CasesDraftTab[] = ['in-review', 'rejected', 'approved', 'deleted'];
  public readonly tabLinks = computed(() =>
    this.tabs.map((tab) => ({
      tab,
      label: CASES_DRAFT_TABS[tab].label,
      href: this.router.serializeUrl(this.navigation.dashboardUrl(defaultCasesDraftNavigation(tab))),
    })),
  );
  public readonly selectedTabLabel = computed(() => CASES_DRAFT_TABS[this.navigation.selection().tab].label);
  public readonly emptyMessage = computed(() => CASES_DRAFT_TABS[this.navigation.selection().tab].empty);
  public readonly allRejectedUrl = computed(() =>
    this.router.serializeUrl(this.navigation.placeholderUrl('rejections')),
  );
  constructor() {
    afterNextRender(() => this.heading()?.nativeElement.focus());
    combineLatest([this.route.fragment, this.route.queryParamMap])
      .pipe(auditTime(0, asapScheduler), takeUntilDestroyed())
      .subscribe(([fragment, query]) => {
        const selection = parseCasesDraftNavigation(fragment, query);
        this.navigation.setSelection(selection);
        if (this.loadedTab !== selection.tab) {
          this.loadedTab = selection.tab;
          this.data.load(selection.tab);
        }
      });
    effect(() => {
      const list = this.data.list();
      if (list.status === 'ready' || list.status === 'empty') {
        const selection = this.navigation.selection();
        const page = Math.max(1, Math.min(selection.page, Math.ceil(list.rows.length / 25)));
        if (page !== selection.page && page !== this.clampingPage) {
          this.clampingPage = page;
          void this.navigate(this.navigation.dashboardUrl({ ...selection, page }), true).finally(() => {
            this.clampingPage = null;
          });
        }
      }
      if (this.retryPending()) {
        if (list.status === 'loading') this.focusAfterRender(() => this.loading());
        else if (list.status === 'ready' || list.status === 'empty' || list.status === 'error') {
          this.retryPending.set(false);
          this.focusAfterRender(() => (list.status === 'error' ? this.listError() : this.sectionHeading()));
        }
      }
    });
  }
  private focusAfterRender(target: () => ElementRef<HTMLElement> | undefined): void {
    afterNextRender(() => target()?.nativeElement.focus(), { injector: this.injector });
  }
  private async navigate(url: string | UrlTree, replaceUrl = false, state?: Record<string, boolean>): Promise<boolean> {
    this.navigationFailed.set(false);
    try {
      const accepted = await this.router.navigateByUrl(url, state ? { state } : { replaceUrl });
      if (accepted) return true;
    } catch {
      /* A rejected navigation retains the current dashboard selection. */
    }
    this.navigationFailed.set(true);
    this.focusAfterRender(() => this.navigationError());
    return false;
  }
  public activateTab(event: MouseEvent, tab: CasesDraftTab): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void this.selectTab(tab);
  }
  public async selectTab(tab: CasesDraftTab): Promise<void> {
    const same = this.navigation.selection().tab === tab;
    if ((await this.navigate(this.navigation.dashboardUrl(defaultCasesDraftNavigation(tab)))) && same)
      this.data.load(tab);
  }
  public async changeSort(change: { key: CasesDraftSortColumn; direction: CasesDraftSortDirection }): Promise<void> {
    await this.navigate(
      this.navigation.dashboardUrl({
        ...this.navigation.selection(),
        page: 1,
        sort: change.key,
        direction: change.direction,
      }),
    );
  }
  public async changePage(page: number): Promise<void> {
    if (await this.navigate(this.navigation.dashboardUrl({ ...this.navigation.selection(), page })))
      this.table()?.focusFirstRow();
  }
  public async openRow(id: number): Promise<void> {
    await this.navigate(this.navigation.placeholderUrl('details', id));
  }
  public async openAllRejected(event: MouseEvent): Promise<void> {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    await this.navigate(this.navigation.placeholderUrl('rejections'));
  }
  public retryList(): void {
    this.retryPending.set(true);
    this.data.retryList();
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
