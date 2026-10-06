import { CASES_DRAFT_DASHBOARD_MODE } from '../constants/cases-draft-dashboard-mode.token';
import { CasesDraftDashboardService } from '../services/cases-draft-dashboard.service';
import { CASES_DRAFT_CHECKER_TABS } from '../constants/cases-draft-checker-tabs.constant';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { CasesDraftTableComponent } from '../cases-draft-table/cases-draft-table.component';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router, UrlTree } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { CasesDraftNavigationService } from '../services/cases-draft-navigation.service';
import { CasesDraftCheckAndValidateTabsComponent } from './cases-draft-check-and-validate-tabs.component';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
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
describe('checker dashboard presentation', () => {
  const userState = signal(permittedUser());
  const authenticated = signal(true);
  const featureFlags = signal({ 'release-1c-rm-create-case-files': true });
  const api = { getDraftCasefiles: vi.fn(), getDraftCasefileCount: vi.fn() };
  let fragment: BehaviorSubject<string | null>;
  let query: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  beforeEach(() => {
    vi.clearAllMocks();
    const user = permittedUser();
    user.business_unit_users[0].permissions = [
      { permission_id: 22, permission_name: 'Check and Validate Draft Casefiles' },
    ];
    userState.set(user);
    authenticated.set(true);
    featureFlags.set({ 'release-1c-rm-create-case-files': true });
    fragment = new BehaviorSubject<string | null>('to-review');
    query = new BehaviorSubject(convertToParamMap({}));
    api.getDraftCasefiles.mockReturnValue(of({ count: 0, summaries: [] }));
    api.getDraftCasefileCount.mockReturnValue(of({ count: 0 }));
    TestBed.configureTestingModule({
      imports: [CasesDraftCheckAndValidateTabsComponent],
      providers: [
        provideRouter([]),
        { provide: CASES_DRAFT_DASHBOARD_MODE, useValue: 'checker' },
        CasesDraftDashboardService,
        CasesDraftNavigationService,
        {
          provide: ActivatedRoute,
          useValue: {
            fragment,
            queryParamMap: query,
            snapshot: { fragment: 'to-review', queryParamMap: convertToParamMap({}), data: {} },
          },
        },
        { provide: GlobalStore, useValue: { userState, authenticated, featureFlags, setBannerError: vi.fn() } },
        { provide: OpalMaintenanceService, useValue: api },
        {
          provide: DateService,
          useValue: { getDateRange: () => ({ from: '2026-09-29', to: '2026-10-06' }), getDaysAgo: () => 1 },
        },
      ],
    });
  });
  async function render() {
    const fixture = TestBed.createComponent(CasesDraftCheckAndValidateTabsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }
  it.each(['to-review', 'rejected', 'deleted', 'failed'] as const)(
    'renders Review cases and exact %s empty copy without creation controls',
    async (tab) => {
      fragment.next(tab);
      const fixture = await render();
      expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Review cases');
      expect(fixture.nativeElement.querySelector('#cases-draft-create')).toBeNull();
      expect(fixture.nativeElement.querySelector('#cases-draft-all-rejected')).toBeNull();
      expect(fixture.nativeElement.querySelectorAll('#cases-draft-tabs a')).toHaveLength(4);
      expect(fixture.nativeElement.querySelector('#cases-draft-empty').textContent.trim()).toBe(
        CASES_DRAFT_CHECKER_TABS[tab].empty,
      );
    },
  );
  it('announces pending cases and counts without claiming zero', async () => {
    api.getDraftCasefiles.mockReturnValue(new Subject());
    api.getDraftCasefileCount.mockReturnValue(new Subject());
    const fixture = await render();
    expect(fixture.nativeElement.querySelector('#cases-draft-loading')?.getAttribute('role')).toBe('status');
    expect(fixture.nativeElement.querySelector('#cases-draft-loading')?.textContent).toContain(
      'Loading To review cases.',
    );
    expect(fixture.nativeElement.querySelector('opal-lib-moj-notification-badge')).toBeNull();
  });
  it('immediately hides rows and badges when the checker identity is replaced', async () => {
    api.getDraftCasefiles.mockReturnValue(
      of({ count: 1, summaries: [createCasesDraftSummary({ submitted_by: 'BUU-OTHER' })] }),
    );
    api.getDraftCasefileCount.mockReturnValue(of({ count: 3 }));
    const fixture = await render();
    const replacement = structuredClone(userState());
    replacement.business_unit_users[0].business_unit_user_id = 'BUU-NEW';
    api.getDraftCasefiles.mockReturnValue(new Subject());
    api.getDraftCasefileCount.mockReturnValue(new Subject());
    userState.set(replacement);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody')).toBeNull();
    expect(fixture.nativeElement.querySelector('opal-lib-moj-notification-badge')).toBeNull();
    await fixture.whenStable();
    expect(api.getDraftCasefiles).toHaveBeenLastCalledWith(expect.objectContaining({ not_submitted_by: 'BUU-NEW' }));
  });
  it('changes page/sort metadata without consulting again and opens the selected checker destination', async () => {
    const fixture = await render();
    query.next(convertToParamMap({ sort: 'submittedByName', direction: 'descending' }));
    await fixture.whenStable();
    expect(api.getDraftCasefiles).toHaveBeenCalledOnce();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await fixture.componentInstance.openRow(123);
    expect(router.serializeUrl(navigate.mock.calls[0][0] as UrlTree)).toContain('/check-and-validate/review/123');
    fragment.next('failed');
    await fixture.whenStable();
    await fixture.componentInstance.openRow(123);
    expect(router.serializeUrl(navigate.mock.calls[1][0] as UrlTree)).toContain('/check-and-validate/view/123');
  });
  it.each(['authentication', 'flag', 'permission'] as const)(
    'hides checker summaries and counts immediately on %s loss',
    async (reason) => {
      api.getDraftCasefiles.mockReturnValue(
        of({ count: 1, summaries: [createCasesDraftSummary({ submitted_by: 'BUU-OTHER' })] }),
      );
      api.getDraftCasefileCount.mockReturnValue(of({ count: 3 }));
      const fixture = await render();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      if (reason === 'authentication') authenticated.set(false);
      if (reason === 'flag') featureFlags.set({ 'release-1c-rm-create-case-files': false });
      if (reason === 'permission') userState.set({ ...userState(), business_unit_users: [] });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('tbody')).toBeNull();
      expect(fixture.nativeElement.querySelector('opal-lib-moj-notification-badge')).toBeNull();
      await fixture.whenStable();
      expect(navigate).toHaveBeenCalledWith('/access-denied', { replaceUrl: false });
      expect(api.getDraftCasefiles).toHaveBeenCalledOnce();
    },
  );
  it('clamps retained checker state and updates sort/page locally even with a cancelling router', async () => {
    const navigation = TestBed.inject(CasesDraftNavigationService);
    navigation.setSelection({ tab: 'to-review', page: 8, sort: 'created', direction: 'ascending' });
    api.getDraftCasefiles.mockReturnValue(
      of({
        count: 26,
        summaries: Array.from({ length: 26 }, (_, index) =>
          createCasesDraftSummary({ draft_casefile_id: index + 1, submitted_by: 'BUU-OTHER' }),
        ),
      }),
    );
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(false);
    const fixture = await render();
    expect(navigation.selection().page).toBe(2);
    expect(navigate).not.toHaveBeenCalled();
    fixture.nativeElement.querySelector('th[columnKey="submittedByName"] button').click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(navigation.selection()).toMatchObject({ page: 1, sort: 'submittedByName', direction: 'ascending' });
    const table = fixture.debugElement.query(By.directive(CasesDraftTableComponent))
      .componentInstance as CasesDraftTableComponent;
    table.onPageChange(2);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(table.currentPageSignal()).toBe(2);
    expect(navigate).not.toHaveBeenCalled();
    expect(api.getDraftCasefiles).toHaveBeenCalledOnce();
  });
  it('does not consult or show counts for missing checker identity on first entry', async () => {
    authenticated.set(false);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = await render();
    expect(fixture.nativeElement.querySelectorAll('#cases-draft-tabs a')).toHaveLength(4);
    expect(fixture.nativeElement.querySelector('tbody')).toBeNull();
    expect(fixture.nativeElement.querySelector('opal-lib-moj-notification-badge')).toBeNull();
    expect(api.getDraftCasefiles).not.toHaveBeenCalled();
    expect(api.getDraftCasefileCount).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/access-denied', { replaceUrl: false });
  });
});
