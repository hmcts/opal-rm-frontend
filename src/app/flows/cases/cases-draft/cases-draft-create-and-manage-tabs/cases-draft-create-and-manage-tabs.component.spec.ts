import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { CasesDraftTableComponent } from '../cases-draft-table/cases-draft-table.component';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter, Router, UrlTree } from '@angular/router';
import { BehaviorSubject, finalize, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { AbstractTabData } from '@hmcts/opal-frontend-common/components/abstract/abstract-tab-data';
import { CasesDraftNavigationService } from '../services/cases-draft-navigation.service';
import { defaultCasesDraftNavigation } from '../utils/cases-draft-navigation';
import { CasesDraftCreateAndManageTabsComponent } from './cases-draft-create-and-manage-tabs.component';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
import { CASES_DRAFT_TABS } from '../constants/cases-draft-tabs.constant';
import type { CasesDraftInputterTab } from '../types/cases-draft-tab.type';
import type { IOpalMaintenanceDraftCasefileListResponse } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-list-response.interface';
import { createCasesDraftSummary } from '../mocks/cases-draft-summary.mock';

const permittedUser = () => ({
  ...structuredClone(OPAL_USER_STATE_MOCK),
  status: 'active' as const,
  business_unit_users: [
    {
      business_unit_id: 44,
      business_unit_user_id: 'BUU-SYNTHETIC',
      permissions: [{ permission_id: 21, permission_name: 'Create and Manage Draft Casefiles' }],
    },
  ],
});
const response = (tab: CasesDraftInputterTab, id = 123): IOpalMaintenanceDraftCasefileListResponse => ({
  count: 1,
  summaries: [
    createCasesDraftSummary({
      draft_casefile_id: id,
      casefile_status: CASES_DRAFT_TABS[tab].statuses.split(',')[0] as
        'SUBMITTED' | 'REJECTED' | 'PUBLISHED' | 'DELETED',
    }),
  ],
});
describe('resolver-backed dashboard', () => {
  const userState = signal(permittedUser());
  const authenticated = signal(true);
  const featureFlags = signal({ 'release-1c-rm-create-case-files': true });
  const setBannerError = vi.fn();
  const api = { getDraftCasefiles: vi.fn(), getRejectedDraftCasefileCount: vi.fn() };
  let fragment: BehaviorSubject<string | null>;
  let query: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let snapshot: {
    fragment: string | null;
    queryParamMap: ReturnType<typeof convertToParamMap>;
    data: Record<string, unknown>;
  };
  beforeEach(() => {
    vi.clearAllMocks();
    userState.set(permittedUser());
    authenticated.set(true);
    featureFlags.set({ 'release-1c-rm-create-case-files': true });
    fragment = new BehaviorSubject<string | null>('in-review');
    query = new BehaviorSubject(convertToParamMap({}));
    snapshot = { fragment: 'in-review', queryParamMap: convertToParamMap({}), data: {} };
    api.getDraftCasefiles.mockReturnValue(of({ count: 0, summaries: [] }));
    api.getRejectedDraftCasefileCount.mockReturnValue(of({ count: 0 }));
    TestBed.configureTestingModule({
      imports: [CasesDraftCreateAndManageTabsComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { fragment, queryParamMap: query, snapshot } },
        { provide: GlobalStore, useValue: { userState, featureFlags, authenticated, setBannerError } },
        { provide: OpalMaintenanceService, useValue: api },
        {
          provide: DateService,
          useValue: { getDateRange: () => ({ from: '2026-09-29', to: '2026-10-06' }), getDaysAgo: () => 1 },
        },
      ],
    });
  });
  async function render(
    tab: CasesDraftInputterTab = 'in-review',
    result: IOpalMaintenanceDraftCasefileListResponse = { count: 0, summaries: [] },
    count: number | null = 0,
  ) {
    fragment.next(tab);
    snapshot.fragment = tab;
    snapshot.data = {
      draftCasefiles: {
        tab,
        identity: {
          userId: userState().user_id,
          businessUnitId: 44,
          submittedBy: userState().business_unit_users[0]?.business_unit_user_id,
        },
        response: result,
      },
      rejectedCount: count,
    };
    const fixture = TestBed.createComponent(CasesDraftCreateAndManageTabsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }
  it('renders the exact inputter heading without surrounding whitespace', async () => {
    const fixture = await render();
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Create cases');
  });
  it('uses an unresolved initial Rejected list for its badge without a count consultation', async () => {
    snapshot.fragment = 'rejected';
    fragment.next('rejected');
    const pending = new Subject<IOpalMaintenanceDraftCasefileListResponse>();
    api.getDraftCasefiles.mockReturnValue(pending);
    const fixture = TestBed.createComponent(CasesDraftCreateAndManageTabsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(api.getDraftCasefiles).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ casefile_status: 'REJECTED' }),
    );
    expect(api.getRejectedDraftCasefileCount).not.toHaveBeenCalled();
    const loading: HTMLElement = fixture.nativeElement.querySelector('#cases-draft-loading');
    expect(loading.tagName).toBe('OUTPUT');
    expect(loading.getAttribute('aria-live')).toBe('polite');
    expect(loading.getAttribute('aria-atomic')).toBe('true');
    expect(loading.textContent).toContain('Loading Rejected cases.');
    pending.next({ ...response('rejected'), count: 7 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('opal-lib-moj-notification-badge').textContent).toContain('7');
    expect(fixture.nativeElement.querySelector('tbody')).not.toBeNull();
  });
  it('keeps fallback Approved rows usable when the independent count decoding fails, and recovers its badge on Rejected', async () => {
    snapshot.fragment = 'approved';
    fragment.next('approved');
    api.getDraftCasefiles.mockReturnValue(of(response('approved')));
    api.getRejectedDraftCasefileCount.mockReturnValue(throwError(() => new Error('private count detail')));
    const fixture = TestBed.createComponent(CasesDraftCreateAndManageTabsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(api.getRejectedDraftCasefileCount).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('tbody')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('#cases-draft-tabs a')).toHaveLength(4);
    expect(fixture.nativeElement.querySelector('opal-lib-moj-notification-badge')).toBeNull();
    expect(setBannerError).toHaveBeenCalledOnce();
    expect(JSON.stringify(setBannerError.mock.calls)).not.toContain('private count detail');
    api.getDraftCasefiles.mockReturnValueOnce(of(response('rejected')));
    fragment.next('rejected');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('opal-lib-moj-notification-badge').textContent).toContain('1');
    expect(api.getRejectedDraftCasefileCount).toHaveBeenCalledOnce();
  });
  it.each([401, 403])(
    'cancels fallback rows and prevents more consultations after count HTTP %s denial',
    async (status) => {
      snapshot.fragment = 'approved';
      fragment.next('approved');
      const list = new Subject<IOpalMaintenanceDraftCasefileListResponse>();
      const count = new Subject<{ count: number }>();
      const cancelled = vi.fn();
      api.getDraftCasefiles.mockReturnValue(list.pipe(finalize(cancelled)));
      api.getRejectedDraftCasefileCount.mockReturnValue(count);
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      const fixture = TestBed.createComponent(CasesDraftCreateAndManageTabsComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      count.error(new HttpErrorResponse({ status }));
      await fixture.whenStable();
      fixture.detectChanges();
      expect(cancelled).toHaveBeenCalledOnce();
      expect(navigate).toHaveBeenCalledExactlyOnceWith('/access-denied', { replaceUrl: false });
      expect(fixture.nativeElement.querySelector('tbody')).toBeNull();
      expect(fixture.nativeElement.querySelector('#cases-draft-empty')).toBeNull();
      expect(fixture.nativeElement.querySelector('opal-lib-moj-notification-badge')).toBeNull();
      expect(setBannerError).not.toHaveBeenCalled();
      fragment.next('deleted');
      await fixture.whenStable();
      expect(api.getDraftCasefiles).toHaveBeenCalledOnce();
      expect(api.getRejectedDraftCasefileCount).toHaveBeenCalledOnce();
    },
  );
  it('ignores a scheduled stale response clamp after an authorised identity replacement', async () => {
    const fixture = await render();
    const pending = new Subject<IOpalMaintenanceDraftCasefileListResponse>();
    api.getDraftCasefiles.mockReturnValueOnce(pending).mockReturnValue(new Subject());
    api.getRejectedDraftCasefileCount.mockReturnValue(new Subject());
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fragment.next('approved');
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.componentInstance.changePage(8);
    pending.next(response('approved'));
    const replacement = permittedUser();
    replacement.user_id += 1;
    replacement.business_unit_users[0].business_unit_user_id = 'BUU-REPLACEMENT';
    userState.set(replacement);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('tbody')).toBeNull();
    expect(api.getDraftCasefiles).toHaveBeenLastCalledWith(
      expect.objectContaining({ submitted_by: 'BUU-REPLACEMENT', casefile_status: 'PUBLISHED' }),
    );
  });
  it('uses the shared tab base and capped count formatting', async () => {
    const format = vi.spyOn(AbstractTabData.prototype, 'formatCountWithCap');
    const fixture = await render('in-review', response('in-review'), 102);
    expect(fixture.componentInstance).toBeInstanceOf(AbstractTabData);
    expect(format).toHaveBeenCalledWith(102, 99);
    format.mockRestore();
  });
  it('ignores query table state after an initially empty fragment', async () => {
    snapshot.fragment = '';
    fragment.next('');
    const fixture = TestBed.createComponent(CasesDraftCreateAndManageTabsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    query.next(convertToParamMap({ sort: 'respondent', direction: 'descending' }));
    await fixture.whenStable();
    expect(fixture.componentInstance.navigation.selection().sort).toBe('created');
    expect(api.getDraftCasefiles).toHaveBeenCalledOnce();
  });
  it('ignores shared inactive sort direction without navigation', async () => {
    const fixture = await render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await fixture.componentInstance.changeSort({ key: 'respondent', direction: 'none' });
    expect(navigate).not.toHaveBeenCalled();
  });
  it('returns to In review on an absent fragment and reopens the previous tab', async () => {
    const fixture = await render('approved', response('approved'));
    fragment.next(null);
    await fixture.whenStable();
    expect(fixture.componentInstance.navigation.selection().tab).toBe('in-review');
    fragment.next('approved');
    await fixture.whenStable();
    expect(fixture.componentInstance.navigation.selection().tab).toBe('approved');
    expect(api.getDraftCasefiles).toHaveBeenCalledTimes(2);
  });
  it.each(Object.keys(CASES_DRAFT_TABS) as CasesDraftInputterTab[])(
    'uses resolved %s rows and count without duplicate GETs',
    async (tab) => {
      const fixture = await render(tab, response(tab), 7);
      expect(fixture.nativeElement.querySelector('tbody')).not.toBeNull();
      expect(fixture.nativeElement.querySelectorAll('#cases-draft-tabs a')).toHaveLength(4);
      expect(api.getDraftCasefiles).not.toHaveBeenCalled();
      expect(api.getRejectedDraftCasefileCount).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('opal-lib-moj-notification-badge').textContent).toContain(
        tab === 'rejected' ? '1' : '7',
      );
    },
  );
  it.each(Object.keys(CASES_DRAFT_TABS) as CasesDraftInputterTab[])(
    'renders the %s empty message with all four tabs',
    async (tab) => {
      const fixture = await render(tab);
      expect(fixture.nativeElement.querySelector('#cases-draft-empty').textContent.trim()).toBe(
        CASES_DRAFT_TABS[tab].empty,
      );
      expect(fixture.nativeElement.querySelectorAll('#cases-draft-tabs a')).toHaveLength(4);
      expect(fixture.nativeElement.querySelector('opal-lib-moj-notification-badge')).toBeNull();
    },
  );
  it('ignores query-only table changes without reloading', async () => {
    const fixture = await render();
    query.next(convertToParamMap({ page: '1', sort: 'respondent', direction: 'descending' }));
    await fixture.whenStable();
    expect(fixture.componentInstance.navigation.selection().sort).toBe('created');
    expect(api.getDraftCasefiles).not.toHaveBeenCalled();
  });
  it('does not change the fragment-selected tab when table query values are invalid', async () => {
    const fixture = await render('approved', response('approved'));
    query.next(convertToParamMap({ page: '-2', sort: 'respondent', direction: 'sideways' }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.navigation.selection()).toEqual(defaultCasesDraftNavigation('approved'));
    expect(api.getDraftCasefiles).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('tbody')).not.toBeNull();
  });
  it('clears rows immediately, cancels stale requests, and requests only the next tab', async () => {
    const pending = new Subject<IOpalMaintenanceDraftCasefileListResponse>();
    const cancelled = vi.fn();
    api.getDraftCasefiles.mockReturnValue(pending.pipe(finalize(cancelled)));
    const fixture = await render('in-review', response('in-review'));
    fragment.next('approved');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody')).toBeNull();
    expect(fixture.nativeElement.querySelector('#cases-draft-empty')).toBeNull();
    expect(api.getDraftCasefiles).toHaveBeenCalledTimes(1);
    fragment.next('deleted');
    await fixture.whenStable();
    expect(cancelled).toHaveBeenCalledOnce();
    expect(api.getDraftCasefiles).toHaveBeenLastCalledWith(expect.objectContaining({ casefile_status: 'DELETED' }));
  });
  it('shows global generic decoding failure and recovers on a later tab', async () => {
    const fixture = await render('in-review', response('in-review'));
    api.getDraftCasefiles.mockReturnValueOnce(throwError(() => new Error('private detail')));
    fragment.next('approved');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(setBannerError).toHaveBeenCalledOnce();
    expect(JSON.stringify(setBannerError.mock.calls)).not.toContain('private detail');
    expect(fixture.nativeElement.querySelector('tbody')).toBeNull();
    expect(fixture.nativeElement.querySelector('#cases-draft-empty')).toBeNull();
    expect(fixture.nativeElement.querySelector('#cases-draft-list-error')).toBeNull();
    expect(fixture.nativeElement.querySelector('#cases-draft-list-retry')).toBeNull();
    api.getDraftCasefiles.mockReturnValueOnce(of(response('deleted', 456)));
    fragment.next('deleted');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody')).not.toBeNull();
  });
  it('refreshes the independent badge from a successful Rejected list', async () => {
    const fixture = await render('in-review', response('in-review'), 7);
    api.getDraftCasefiles.mockReturnValueOnce(of({ ...response('rejected'), count: 102 }));
    fragment.next('rejected');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('opal-lib-moj-notification-badge').textContent).toContain('99+');
    expect(api.getRejectedDraftCasefileCount).not.toHaveBeenCalled();
  });
  it('hides resolved rows before identity effects flush and loads the replacement identity', async () => {
    const fixture = await render('in-review', response('in-review'), 7);
    const replacement = permittedUser();
    replacement.user_id += 1;
    replacement.business_unit_users[0].business_unit_user_id = 'BUU-NEW';
    api.getDraftCasefiles.mockReturnValue(new Subject());
    api.getRejectedDraftCasefileCount.mockReturnValue(new Subject());
    userState.set(replacement);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody')).toBeNull();
    expect(fixture.nativeElement.querySelector('opal-lib-moj-notification-badge')).toBeNull();
    await fixture.whenStable();
    expect(api.getDraftCasefiles).toHaveBeenLastCalledWith(expect.objectContaining({ submitted_by: 'BUU-NEW' }));
  });
  it.each(['authentication', 'flag', 'permission'] as const)(
    'hides personal rows and redirects on live %s loss',
    async (reason) => {
      const fixture = await render('in-review', response('in-review'));
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      if (reason === 'authentication') authenticated.set(false);
      if (reason === 'flag') featureFlags.set({ 'release-1c-rm-create-case-files': false });
      if (reason === 'permission') userState.set({ ...permittedUser(), business_unit_users: [] });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('tbody')).toBeNull();
      await fixture.whenStable();
      expect(navigate).toHaveBeenCalledExactlyOnceWith('/access-denied', { replaceUrl: false });
      expect(api.getDraftCasefiles).not.toHaveBeenCalled();
    },
  );
  it('does not retain or replay personal rows after component destruction', async () => {
    const fixture = await render('in-review', response('in-review'));
    fixture.destroy();
    const replayed: unknown[] = [];
    fixture.componentInstance.tabData$.subscribe((value) => replayed.push(value));
    expect(replayed).toEqual([]);
  });
  it('releases pending list on component destruction', async () => {
    const cancelled = vi.fn();
    api.getDraftCasefiles.mockReturnValue(new Subject().pipe(finalize(cancelled)));
    const fixture = await render();
    fragment.next('approved');
    await fixture.whenStable();
    fixture.destroy();
    expect(cancelled).toHaveBeenCalledOnce();
  });
  it.each([401, 403])('clears rows and denies later HTTP %s', async (status) => {
    const fixture = await render('in-review', response('in-review'));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    api.getDraftCasefiles.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status })));
    fragment.next('approved');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody')).toBeNull();
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/access-denied', { replaceUrl: false });
    expect(setBannerError).not.toHaveBeenCalled();
  });
  it('silently retains selection on dismissed navigation guard', async () => {
    const fixture = await render();
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(false);
    await fixture.componentInstance.selectTab('approved');
    fixture.detectChanges();
    expect(fixture.componentInstance.navigation.selection().tab).toBe('in-review');
    expect(fixture.nativeElement.querySelector('#cases-draft-navigation-error')).toBeNull();
    expect(setBannerError).not.toHaveBeenCalled();
  });
  it('uses the generic global banner for thrown navigation failures', async () => {
    const fixture = await render();
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockRejectedValue(new Error('private detail'));
    await fixture.componentInstance.openRow(123);
    expect(setBannerError).toHaveBeenCalledOnce();
    expect(JSON.stringify(setBannerError.mock.calls)).not.toContain('private detail');
  });
  it('sorts loaded rows locally without navigating or consulting the API', async () => {
    TestBed.inject(CasesDraftNavigationService).setSelection({ ...defaultCasesDraftNavigation(), page: 2 });
    const fixture = await render('in-review', {
      count: 26,
      summaries: Array.from({ length: 26 }, (_, index) => createCasesDraftSummary({ draft_casefile_id: index + 1 })),
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(false);
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('tbody tr')?.getAttribute('data-draft-id')).toBe('26');
    (element.querySelector('th button') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(navigate).not.toHaveBeenCalled();
    expect(api.getDraftCasefiles).not.toHaveBeenCalled();
    expect(element.querySelectorAll('th')[0].getAttribute('aria-sort')).toBe('ascending');
    expect(element.querySelectorAll('th')[3].getAttribute('aria-sort')).toBe('none');
    expect(element.querySelector('output')?.textContent).toContain('Page 1 of 2');
    expect(fixture.componentInstance.navigation.selection()).toEqual({
      tab: 'in-review',
      page: 1,
      sort: 'respondent',
      direction: 'ascending',
    });
  });
  it('updates local page selection without navigating even when a route guard would cancel', async () => {
    const fixture = await render('in-review', {
      count: 26,
      summaries: Array.from({ length: 26 }, (_, index) => createCasesDraftSummary({ draft_casefile_id: index + 1 })),
    });
    const table = fixture.debugElement.query(By.directive(CasesDraftTableComponent))
      .componentInstance as CasesDraftTableComponent;
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(false);
    table.onPageChange(2);
    await fixture.whenStable();
    expect(navigate).not.toHaveBeenCalled();
    expect(table.currentPageSignal()).toBe(2);
    expect(fixture.componentInstance.navigation.selection().page).toBe(2);
  });
  it('starts accepted fresh creation with return metadata', async () => {
    const fixture = await render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await fixture.componentInstance.startNewCase();
    expect(navigate).toHaveBeenCalledWith('/cases/create-casefile/case-type', {
      state: { startNewCase: true, focusCaseTypeHeading: true },
    });
  });
  it.each([{ button: 1 }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }])(
    'preserves native tab and rejected-link activation for modifiers %j',
    async (options) => {
      const fixture = await render('rejected');
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      const event = new MouseEvent('click', { ...options, cancelable: true });
      fixture.componentInstance.activateTab(event, 'approved');
      await fixture.componentInstance.openAllRejected(event);
      expect(event.defaultPrevented).toBe(false);
      expect(navigate).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('#cases-draft-approved-tab').getAttribute('href')).toContain(
        '#approved',
      );
      expect(fixture.nativeElement.querySelector('#cases-draft-all-rejected').getAttribute('href')).toContain(
        '/rejections',
      );
    },
  );
  it('handles an ordinary native tab click with its closed default selection URL', async () => {
    const fixture = await render('rejected');
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const click = new MouseEvent('click', { button: 0, bubbles: true, cancelable: true });
    fixture.nativeElement.querySelector('#cases-draft-approved-tab').dispatchEvent(click);
    await fixture.whenStable();
    expect(click.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledOnce();
    expect(router.serializeUrl(navigate.mock.calls[0][0] as UrlTree)).toBe(
      '/cases/draft/create-and-manage/tabs#approved',
    );
  });
  it('handles an ordinary native rejected-link click retaining return selection', async () => {
    const fixture = await render('rejected');
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const click = new MouseEvent('click', { button: 0, bubbles: true, cancelable: true });
    fixture.nativeElement.querySelector('#cases-draft-all-rejected').dispatchEvent(click);
    await fixture.whenStable();
    expect(click.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledOnce();
    expect(router.serializeUrl(navigate.mock.calls[0][0] as UrlTree)).toBe('/cases/draft/create-and-manage/rejections');
  });
  it('preserves inherited page state and visible rows without paging navigation', async () => {
    const fixture = await render('in-review', {
      count: 26,
      summaries: Array.from({ length: 26 }, (_, index) => createCasesDraftSummary({ draft_casefile_id: index + 1 })),
    });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const table = fixture.debugElement.query(By.directive(CasesDraftTableComponent))
      .componentInstance as CasesDraftTableComponent;
    table.onPageChange(2);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(navigate).not.toHaveBeenCalled();
    expect(router.serializeUrl(fixture.componentInstance.navigation.dashboardUrl())).toBe(
      '/cases/draft/create-and-manage/tabs#in-review',
    );
    expect(table.currentPageSignal()).toBe(2);
    expect(fixture.nativeElement.querySelector('tbody tr').getAttribute('data-draft-id')).toBe('26');
    expect(fixture.nativeElement.querySelector('output').textContent.trim()).toBe('Create cases, page 2 of 2');
    expect(api.getDraftCasefiles).not.toHaveBeenCalled();
  });
  it('sorts locally and opens details with only the source fragment', async () => {
    const fixture = await render();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await fixture.componentInstance.changeSort({ key: 'respondent', direction: 'descending' });
    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.componentInstance.navigation.selection()).toEqual({
      tab: 'in-review',
      page: 1,
      sort: 'respondent',
      direction: 'descending',
    });
    await fixture.componentInstance.openRow(123);
    expect(router.serializeUrl(navigate.mock.calls[0][0] as UrlTree)).toBe(
      '/cases/create-casefile/check-case-details/123#in-review',
    );
    expect(api.getDraftCasefiles).not.toHaveBeenCalled();
  });
  it('clears stale all-rejected row context on ordinary dashboard activation', async () => {
    const fixture = await render();
    const navigation = fixture.componentInstance.navigation;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await navigation.navigateToPlaceholder('details', 123, 'all-rejected');
    expect(navigation.contextForPlaceholder('details', '123')).not.toBeNull();
    await fixture.componentInstance.openRow(123);
    expect(navigation.contextForPlaceholder('details', '123')).toBeNull();
  });
  it('reports failed all-rejected entry while retaining rejected origin memory', async () => {
    const fixture = await render();
    const navigation = fixture.componentInstance.navigation;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockRejectedValue(new Error('Synthetic cancelled entry'));
    const selection = { tab: 'rejected' as const, page: 2, sort: 'created' as const, direction: 'descending' as const };
    navigation.setSelection(selection);
    await fixture.componentInstance.openAllRejected(new MouseEvent('click'));
    expect(navigation.selection()).toEqual(selection);
    expect(setBannerError).toHaveBeenCalledOnce();
  });
});
