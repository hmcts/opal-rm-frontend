import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router, UrlTree } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { CasesDraftCreateAndManageTabsComponent } from './cases-draft-create-and-manage-tabs.component';
import { CasesDraftDashboardService } from '../services/cases-draft-dashboard.service';
import { CasesDraftNavigationService } from '../services/cases-draft-navigation.service';
import type { ICasesDraftListState } from '../interfaces/cases-draft-list-state.interface';
import type { ICasesDraftBadgeState } from '../interfaces/cases-draft-badge-state.interface';
import { CASES_DRAFT_TABS } from '../constants/cases-draft-tabs.constant';
import type { CasesDraftTab } from '../types/cases-draft-tab.type';
import { mapCasesDraftRows } from '../utils/cases-draft-summary';
import { createCasesDraftSummary } from '../mocks/cases-draft-summary.mock';

const user = {
  user_id: 100,
  status: 'active',
  business_unit_users: [
    { business_unit_id: 44, business_unit_user_id: 'BUU-SYNTHETIC', permissions: [{ permission_id: 21 }] },
  ],
};
describe('CasesDraftCreateAndManageTabsComponent', () => {
  const list = signal<ICasesDraftListState>({ status: 'empty', rows: [], count: 0, correlationReference: null });
  const badge = signal<ICasesDraftBadgeState>({
    status: 'error',
    count: null,
    label: null,
    correlationReference: null,
  });
  let fragment: BehaviorSubject<string | null>;
  let query: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  const data = { list, badge, load: vi.fn(), retryList: vi.fn(), retryBadge: vi.fn(), deactivate: vi.fn() };
  beforeEach(() => {
    vi.clearAllMocks();
    list.set({ status: 'empty', rows: [], count: 0, correlationReference: null });
    badge.set({ status: 'error', count: null, label: null, correlationReference: null });
    fragment = new BehaviorSubject<string | null>('in-review');
    query = new BehaviorSubject(convertToParamMap({}));
    TestBed.configureTestingModule({
      imports: [CasesDraftCreateAndManageTabsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            fragment: fragment.asObservable(),
            queryParamMap: query.asObservable(),
            snapshot: { fragment: 'in-review', queryParamMap: convertToParamMap({}) },
          },
        },
        {
          provide: GlobalStore,
          useValue: {
            authenticated: signal(true),
            userState: signal(user),
            featureFlags: signal({ 'release-1c-rm-create-case-files': true }),
          },
        },
      ],
    });
    TestBed.overrideComponent(CasesDraftCreateAndManageTabsComponent, {
      set: { providers: [{ provide: CasesDraftDashboardService, useValue: data }] },
    });
  });
  async function render(tab: CasesDraftTab = 'in-review') {
    fragment.next(tab);
    const f = TestBed.createComponent(CasesDraftCreateAndManageTabsComponent);
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();
    return f;
  }
  it.each(Object.keys(CASES_DRAFT_TABS) as CasesDraftTab[])(
    'renders the exact %s empty message with all four tabs',
    async (tab) => {
      const f = await render(tab);
      expect(f.nativeElement.querySelector('#cases-draft-empty').textContent.trim()).toBe(CASES_DRAFT_TABS[tab].empty);
      expect(f.nativeElement.querySelectorAll('#cases-draft-tabs a')).toHaveLength(4);
      expect(f.nativeElement.querySelector('#cases-draft-create').textContent.trim()).toBe('Create a case');
      expect(f.nativeElement.querySelector('opal-lib-moj-notification-badge')).toBeNull();
    },
  );
  it('shows loading without stale rows or an empty message', async () => {
    list.set({
      status: 'loading',
      rows: mapCasesDraftRows([createCasesDraftSummary()], 'in-review'),
      count: null,
      correlationReference: null,
    });
    const f = await render();
    expect(f.nativeElement.querySelector('#cases-draft-loading').textContent).toContain('Loading In review cases.');
    expect(f.nativeElement.querySelector('tbody')).toBeNull();
    expect(f.nativeElement.querySelector('#cases-draft-empty')).toBeNull();
  });
  it('renders independent retry controls and reference text safely', async () => {
    list.set({ status: 'error', rows: [], count: null, correlationReference: '<synthetic>' });
    const f = await render();
    expect(f.nativeElement.querySelector('#cases-draft-list-error').textContent).toContain('<synthetic>');
    expect(f.nativeElement.querySelector('synthetic')).toBeNull();
    f.nativeElement.querySelector('#cases-draft-list-retry').click();
    expect(data.retryList).toHaveBeenCalledOnce();
    f.nativeElement.querySelector('#cases-draft-badge-retry').click();
    expect(data.retryBadge).toHaveBeenCalledOnce();
  });
  it('renders all rejected navigation for empty and populated lists', async () => {
    const f = await render('rejected');
    expect(f.nativeElement.querySelector('#cases-draft-all-rejected')).not.toBeNull();
    list.set({
      status: 'ready',
      rows: mapCasesDraftRows([createCasesDraftSummary({ casefile_status: 'REJECTED' })], 'rejected'),
      count: 1,
      correlationReference: null,
    });
    f.detectChanges();
    expect(f.nativeElement.querySelector('#cases-draft-all-rejected')).not.toBeNull();
  });
  it('retains selection and focuses navigation error on rejected navigation', async () => {
    const f = await render();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(false);
    const selection = TestBed.inject(CasesDraftNavigationService).selection();
    await f.componentInstance.selectTab('approved');
    f.detectChanges();
    await f.whenStable();
    expect(TestBed.inject(CasesDraftNavigationService).selection()).toEqual(selection);
    expect(f.nativeElement.querySelector('#cases-draft-navigation-error')).not.toBeNull();
  });
  it('coalesces route metadata and fetches only on actual tab changes', async () => {
    const f = await render();
    expect(data.load).toHaveBeenCalledOnce();
    query.next(convertToParamMap({ page: '2', sort: 'respondent', direction: 'descending' }));
    await f.whenStable();
    expect(data.load).toHaveBeenCalledOnce();
    fragment.next('approved');
    query.next(convertToParamMap({ page: '1', sort: 'approved', direction: 'ascending' }));
    await f.whenStable();
    expect(data.load).toHaveBeenCalledTimes(2);
    expect(data.load).toHaveBeenLastCalledWith('approved');
  });
  it('starts creation with origin metadata and accepted-arrival flags', async () => {
    const f = await render();
    const spy = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await f.componentInstance.startNewCase();
    expect(spy).toHaveBeenCalledWith('/cases/create-casefile/case-type', {
      state: { startNewCase: true, focusCaseTypeHeading: true },
    });
  });
  it('sorts from page two using a closed URL and resets to page one', async () => {
    list.set({
      status: 'ready',
      rows: mapCasesDraftRows(
        Array.from({ length: 26 }, (_, i) => createCasesDraftSummary({ draft_casefile_id: i + 1 })),
        'in-review',
      ),
      count: 26,
      correlationReference: null,
    });
    query.next(convertToParamMap({ page: '2', sort: 'created', direction: 'ascending' }));
    const f = await render();
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await f.componentInstance.changeSort({ key: 'respondent', direction: 'descending' });
    expect(router.serializeUrl(spy.mock.calls[0][0] as UrlTree)).toBe(
      '/cases/draft/create-and-manage/tabs?page=1&sort=respondent&direction=descending#in-review',
    );
    expect(data.load).toHaveBeenCalledOnce();
    await f.componentInstance.changePage(1);
    expect(spy).toHaveBeenCalledTimes(2);
    await f.componentInstance.openRow(123);
    expect(router.serializeUrl(spy.mock.calls[2][0] as UrlTree)).toContain(
      '/check-case-details/123?tab=in-review&page=2',
    );
  });
  it('replaces an out of range URL without consulting again', async () => {
    query.next(convertToParamMap({ page: '8' }));
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await render();
    expect(spy).toHaveBeenCalledWith(expect.anything(), { replaceUrl: true });
    expect(router.serializeUrl(spy.mock.calls[0][0] as UrlTree)).toContain('page=1');
    expect(data.load).toHaveBeenCalledOnce();
  });
  it('reloads a deliberately selected current tab exactly once', async () => {
    const f = await render();
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await f.componentInstance.selectTab('in-review');
    expect(data.load).toHaveBeenCalledTimes(2);
  });
  it('uses real hrefs and preserves modified tab and all-rejected activation', async () => {
    const f = await render('rejected');
    const spy = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const modified = new MouseEvent('click', { ctrlKey: true, cancelable: true });
    f.componentInstance.activateTab(modified, 'approved');
    await f.componentInstance.openAllRejected(modified);
    expect(modified.defaultPrevented).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    const click = new MouseEvent('click', { cancelable: true });
    await f.componentInstance.openAllRejected(click);
    expect(click.defaultPrevented).toBe(true);
    expect(spy).toHaveBeenCalledOnce();
    f.componentInstance.activateTab(new MouseEvent('click', { cancelable: true }), 'approved');
    await f.whenStable();
    expect(spy).toHaveBeenCalledTimes(2);
  });
  it('handles thrown navigation failures without altering selection', async () => {
    const f = await render();
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockRejectedValue(new Error('synthetic navigation failure'));
    await f.componentInstance.openRow(123);
    f.detectChanges();
    expect(f.nativeElement.querySelector('#cases-draft-navigation-error')).not.toBeNull();
    expect(TestBed.inject(CasesDraftNavigationService).selection().tab).toBe('in-review');
  });
  it('moves retry focus through loading to a successful selected heading', async () => {
    list.set({ status: 'error', rows: [], count: null, correlationReference: null });
    const f = await render();
    f.componentInstance.retryList();
    list.set({ status: 'loading', rows: [], count: null, correlationReference: null });
    f.detectChanges();
    await f.whenStable();
    expect(data.retryList).toHaveBeenCalledOnce();
    list.set({ status: 'empty', rows: [], count: 0, correlationReference: null });
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('#cases-draft-list-retry')).toBeNull();
  });
  it('renders known count only on Rejected and does not focus after a count refresh', async () => {
    badge.set({ status: 'ready', count: 102, label: '99+', correlationReference: null });
    const f = await render();
    expect(f.nativeElement.querySelector('opal-lib-moj-notification-badge').textContent.trim()).toBe('99+');
    badge.set({ status: 'loading', count: null, label: null, correlationReference: null });
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('#cases-draft-tabs a')).toHaveLength(4);
  });
  it('restores a retried list error and retains selection after rejected paging', async () => {
    list.set({ status: 'error', rows: [], count: null, correlationReference: null });
    const f = await render();
    f.componentInstance.retryList();
    list.set({ status: 'loading', rows: [], count: null, correlationReference: null });
    f.detectChanges();
    await f.whenStable();
    list.set({ status: 'error', rows: [], count: null, correlationReference: 'SYNTHETIC-RETRY' });
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('#cases-draft-list-error').textContent).toContain('SYNTHETIC-RETRY');
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(false);
    await f.componentInstance.changePage(2);
    expect(TestBed.inject(CasesDraftNavigationService).selection().page).toBe(1);
  });
  it('removes retry controls on denied access without exposing retained content', async () => {
    list.set({ status: 'error', rows: [], count: null, correlationReference: null });
    const f = await render();
    f.componentInstance.retryList();
    list.set({ status: 'denied', rows: [], count: null, correlationReference: null });
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('#cases-draft-list-retry')).toBeNull();
    expect(f.nativeElement.querySelector('app-cases-draft-table')).toBeNull();
    expect(f.nativeElement.querySelector('#cases-draft-empty')).toBeNull();
  });
  it('omits an empty notification badge when rejected count is zero', async () => {
    badge.set({ status: 'ready', count: 0, label: null, correlationReference: null });
    const f = await render();
    expect(f.nativeElement.querySelector('opal-lib-moj-notification-badge')).toBeNull();
    expect(f.nativeElement.querySelectorAll('#cases-draft-tabs a')).toHaveLength(4);
  });
  it.each(['ready', 'error'] as const)(
    'keeps useful focus through an intentional pending badge retry and %s completion',
    async (status) => {
      const f = await render();
      f.autoDetectChanges();
      await f.whenStable();
      const retry = f.nativeElement.querySelector('#cases-draft-badge-retry') as HTMLButtonElement;
      retry.focus();
      data.retryBadge.mockImplementationOnce(() =>
        badge.set({ status: 'loading', count: null, label: null, correlationReference: null }),
      );
      retry.click();
      await f.whenStable();
      const loading = f.nativeElement.querySelector('#cases-draft-badge-loading');
      expect(loading).not.toBeNull();
      expect(document.activeElement).toBe(loading);
      expect(f.nativeElement.querySelector('#cases-draft-badge-retry')).toBeNull();
      badge.set({
        status,
        count: status === 'ready' ? 7 : null,
        label: status === 'ready' ? '7' : null,
        correlationReference: null,
      });
      await f.whenStable();
      const target = status === 'error' ? '#cases-draft-badge-retry' : '#cases-draft-selected-heading';
      expect(document.activeElement).toBe(f.nativeElement.querySelector(target));
      expect(data.retryBadge).toHaveBeenCalledOnce();
      expect(data.load).toHaveBeenCalledOnce();
    },
  );
  it('keeps the users chosen focus when a pending badge retry completes after they move on', async () => {
    const f = await render();
    f.autoDetectChanges();
    await f.whenStable();
    data.retryBadge.mockImplementationOnce(() =>
      badge.set({ status: 'loading', count: null, label: null, correlationReference: null }),
    );
    f.nativeElement.querySelector('#cases-draft-badge-retry').click();
    await f.whenStable();
    const create = f.nativeElement.querySelector('#cases-draft-create') as HTMLButtonElement;
    create.focus();
    badge.set({ status: 'ready', count: 7, label: '7', correlationReference: null });
    await f.whenStable();
    expect(document.activeElement).toBe(create);
  });
  it('does not steal focus during an ordinary rejected count loading and completion', async () => {
    const f = await render();
    f.autoDetectChanges();
    await f.whenStable();
    const create = f.nativeElement.querySelector('#cases-draft-create') as HTMLButtonElement;
    create.focus();
    badge.set({ status: 'loading', count: null, label: null, correlationReference: null });
    await f.whenStable();
    expect(document.activeElement).toBe(create);
    badge.set({ status: 'ready', count: 7, label: '7', correlationReference: null });
    await f.whenStable();
    expect(document.activeElement).toBe(create);
  });
  it('ignores a badge Retry action once the count has already recovered', async () => {
    badge.set({ status: 'ready', count: 7, label: '7', correlationReference: null });
    const f = await render();
    f.componentInstance.retryBadge();
    expect(data.retryBadge).not.toHaveBeenCalled();
    expect(f.componentInstance.badgeRetryPending()).toBe(false);
  });
});
