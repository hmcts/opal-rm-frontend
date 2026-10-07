import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Data, provideRouter, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { CasesDraftDashboardService } from '../../services/cases-draft-dashboard.service';
import { CasesDraftNavigationService } from '../../services/cases-draft-navigation.service';
import { createCasesDraftSummary } from '../../mocks/cases-draft-summary.mock';
import { mapCasesDraftRows } from '../../utils/cases-draft-summary';
import type { ICasesDraftAllRejectedResolvedCasefiles } from '../../interfaces/cases-draft-all-rejected-resolved-casefiles.interface';
import type { ICasesDraftIdentity } from '../../interfaces/cases-draft-identity.interface';
import { CasesDraftCreateAndManageViewAllRejectedComponent } from './cases-draft-create-and-manage-view-all-rejected.component';

const identity = { userId: 100, businessUnitId: 44 as const, submittedBy: 'BUU-SYNTHETIC' };
const user = () => ({
  ...structuredClone(OPAL_USER_STATE_MOCK),
  user_id: 100,
  status: 'active' as const,
  business_unit_users: [
    {
      business_unit_id: 44,
      business_unit_user_id: identity.submittedBy,
      permissions: [{ permission_id: 21, permission_name: 'Create and Manage Draft Casefiles' }],
    },
  ],
});
const result = (count = 26, scope = identity): ICasesDraftAllRejectedResolvedCasefiles => ({
  identity: scope,
  rows: mapCasesDraftRows(
    Array.from({ length: count }, (_, index) =>
      createCasesDraftSummary({
        draft_casefile_id: index + 1,
        casefile_status: 'REJECTED',
        submitted_by: 'BUU-OTHER',
      }),
    ),
    'rejected',
  ),
});
const selection = { page: 2, sort: 'created' as const, direction: 'descending' as const };

describe('all rejected resolved page', () => {
  const scope = signal<ICasesDraftIdentity | null>(identity);
  const userState = signal(user());
  let routeData: BehaviorSubject<Data>;
  let fixture: ComponentFixture<CasesDraftCreateAndManageViewAllRejectedComponent>;
  let navigation: CasesDraftNavigationService;
  const data = { getIdentity: () => scope(), getAllRejectedList: vi.fn(), reportError: vi.fn() };
  beforeEach(() => {
    scope.set(identity);
    userState.set(user());
    vi.clearAllMocks();
    routeData = new BehaviorSubject<Data>({ allRejectedCasefiles: result() });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { data: routeData.asObservable(), snapshot: { data: routeData.value } } },
        { provide: CasesDraftDashboardService, useValue: data },
        {
          provide: GlobalStore,
          useValue: {
            authenticated: signal(true),
            userState,
            featureFlags: signal({ 'release-1c-rm-create-case-files': true }),
            setBannerError: vi.fn(),
          },
        },
      ],
    });
    navigation = TestBed.inject(CasesDraftNavigationService);
  });
  afterEach(() => {
    fixture?.destroy();
    routeData.complete();
  });
  function render() {
    fixture = TestBed.createComponent(CasesDraftCreateAndManageViewAllRejectedComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    return fixture.componentInstance;
  }
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  function record(names = { respondentForename: 'Synthetic', respondentSurname: 'Respondent' }, change = {}) {
    return navigation.recordAllRejectedResubmission({
      origin: 'all-rejected',
      identity,
      draftCasefileId: 26,
      ...names,
      ...change,
    });
  }
  it('renders resolved rows and dismisses success without consulting again or changing selection', async () => {
    navigation.setAllRejectedSelection(selection);
    record();
    render();
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain("You have submitted Synthetic Respondent's case for review.");
    fixture.nativeElement.querySelector('#cases-draft-all-rejected-dismiss').click();
    await settle();
    expect(fixture.nativeElement.querySelector('#cases-draft-all-rejected-success')).toBeNull();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('h1'));
    expect(navigation.allRejectedSelection()).toEqual(selection);
    expect(data.getAllRejectedList).not.toHaveBeenCalled();
  });
  it('escapes HTML-looking respondent names and consumes the event once', () => {
    record({ respondentForename: '<img src=x>', respondentSurname: '<script>synthetic</script>' });
    render();
    expect(fixture.nativeElement.querySelector('#cases-draft-all-rejected-success').textContent).toContain(
      '<img src=x>',
    );
    expect(fixture.nativeElement.querySelector('img, script')).toBeNull();
    fixture.destroy();
    render();
    expect(fixture.componentInstance.successText()).toBeNull();
  });
  it.each([
    { origin: 'dashboard' },
    { identity: { ...identity, submittedBy: 'BUU-FOREIGN' } },
    { draftCasefileId: 0 },
    { respondentSurname: '' },
  ])('does not display invalid or foreign success %j', (change) => {
    expect(record(undefined, change)).toBe(false);
    render();
    expect(fixture.componentInstance.successText()).toBeNull();
  });
  it('retains trusted success beside an empty resolved collection and receives fresh rows on the same instance', () => {
    record();
    routeData.next({ allRejectedCasefiles: result(0) });
    const page = render();
    expect(page.successText()).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#cases-draft-all-rejected-empty')).not.toBeNull();
    routeData.next({ allRejectedCasefiles: result(1) });
    fixture.detectChanges();
    expect(fixture.componentInstance).toBe(page);
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(
      fixture.nativeElement.querySelector(
        '#cases-draft-all-rejected-loading, #cases-draft-all-rejected-failure, #cases-draft-all-rejected-retry',
      ),
    ).toBeNull();
  });
  it('sorts and clamps pagination locally with no requests or URL changes', () => {
    const page = render();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl');
    page.changeSort({ key: 'respondent', direction: 'descending' });
    page.changePage(99);
    expect(page.tableSelection()).toEqual({ tab: 'rejected', page: 2, sort: 'respondent', direction: 'descending' });
    page.changePage(-2);
    expect(page.tableSelection().page).toBe(1);
    page.changePage(NaN);
    page.changeSort({ key: 'approved', direction: 'ascending' });
    page.changeSort({ key: 'created', direction: 'none' });
    expect(page.tableSelection().sort).toBe('respondent');
    routeData.next({ allRejectedCasefiles: result(0) });
    fixture.detectChanges();
    expect(page.tableSelection().page).toBe(1);
    expect(navigate).not.toHaveBeenCalled();
    expect(data.getAllRejectedList).not.toHaveBeenCalled();
  });
  it.each([false, true])(
    'restores row and Back focus and memory on rejected navigation (throws=%s)',
    async (throws) => {
      navigation.setAllRejectedSelection(selection);
      const page = render();
      const router = TestBed.inject(Router);
      const navigate = vi.spyOn(router, 'navigateByUrl');
      if (throws) navigate.mockRejectedValue(new Error('Synthetic navigation failure'));
      else navigate.mockResolvedValue(false);
      const dashboardSelection = navigation.selection();
      const link = fixture.nativeElement.querySelector('tbody a');
      link.focus();
      await page.openRow(26);
      expect(document.activeElement).toBe(link);
      expect(navigation.contextForPlaceholder('details', '26')).toBeNull();
      expect(navigation.allRejectedSelection()).toEqual(selection);
      const back = fixture.nativeElement.querySelector('#cases-draft-all-rejected-back');
      back.focus();
      await page.backToYourCases(new MouseEvent('click'));
      expect(document.activeElement).toBe(back);
      expect(navigation.selection()).toEqual(dashboardSelection);
      expect(navigation.allRejectedSelection()).toEqual(selection);
      expect(data.reportError).toHaveBeenCalledTimes(throws ? 2 : 0);
    },
  );
  it('ignores invalid, absent and modified activation and coalesces row navigation', async () => {
    const page = render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    for (const id of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, 99]) await page.openRow(id);
    for (const options of [{ button: 1 }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }])
      await page.backToYourCases(new MouseEvent('click', options));
    expect(navigate).not.toHaveBeenCalled();
    let finish!: (value: boolean) => void;
    navigate.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const pending = page.openRow(1);
    await page.openRow(1);
    expect(navigate).toHaveBeenCalledOnce();
    finish(true);
    await pending;
    routeData.next({});
    page.changePage(2);
    page.changeSort({ key: 'created', direction: 'ascending' });
    await page.openRow(1);
    expect(navigate).toHaveBeenCalledOnce();
  });
  it('hides rows and success synchronously on scope loss then denies access', async () => {
    record();
    const page = render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    scope.set(null);
    expect(page.casefiles()).toBeNull();
    expect(page.successText()).toBeNull();
    await settle();
    expect(navigate).toHaveBeenCalledWith('/access-denied');
    expect(fixture.nativeElement.querySelector('tbody')).toBeNull();
  });
  it('reports denial failures and does not navigate again when already denied', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockRejectedValue(new Error('Synthetic denied'));
    scope.set(null);
    render();
    await settle();
    expect(data.reportError).toHaveBeenCalledOnce();
    vi.spyOn(router, 'url', 'get').mockReturnValue('/access-denied');
    scope.set(identity);
    await settle();
    scope.set(null);
    await settle();
    expect(navigate).toHaveBeenCalledOnce();
  });
  it.each([
    new Error('Synthetic cancelled'),
    new HttpErrorResponse({ status: 403 }),
    new HttpErrorResponse({ status: 400, error: { retriable: false } }),
  ])('reports identity reload failures through the existing error boundary %j', async (error) => {
    record();
    const page = render();
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockRejectedValue(error);
    scope.set({ ...identity, userId: 101, submittedBy: 'BUU-NEW' });
    await settle();
    expect(data.reportError).toHaveBeenCalledWith(error);
    expect(page.casefiles()).toBeNull();
    expect(page.successText()).toBeNull();
    expect(
      fixture.nativeElement.querySelector(
        '#cases-draft-all-rejected-empty, #cases-draft-all-rejected-loading, #cases-draft-all-rejected-failure, #cases-draft-all-rejected-retry',
      ),
    ).toBeNull();
  });
  it('ignores pending identity reload rejection after destruction', async () => {
    render();
    let reject!: (value: unknown) => void;
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockImplementation(
      () =>
        new Promise((_, fail) => {
          reject = fail;
        }),
    );
    scope.set({ ...identity, userId: 101, submittedBy: 'BUU-NEW' });
    fixture.detectChanges();
    expect(reject).toBeDefined();
    fixture.destroy();
    reject(new Error('Synthetic late'));
    await Promise.resolve();
    await Promise.resolve();
    expect(data.reportError).not.toHaveBeenCalled();
  });
  it('ignores a superseded identity reload rejection while the newest scope resolves', async () => {
    render();
    let rejectOld!: (value: unknown) => void;
    const newest = { ...identity, userId: 102, submittedBy: 'BUU-C' };
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectOld = reject;
          }),
      )
      .mockResolvedValueOnce(true);
    scope.set({ ...identity, userId: 101, submittedBy: 'BUU-B' });
    fixture.detectChanges();
    scope.set(newest);
    fixture.detectChanges();
    rejectOld(new Error('Synthetic stale'));
    await settle();
    expect(data.reportError).not.toHaveBeenCalled();
    routeData.next({ allRejectedCasefiles: result(1, newest) });
    await settle();
    expect(fixture.componentInstance.casefiles()?.identity).toEqual(newest);
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(1);
  });
  it('accepts Back without restoring focus or changing list selection', async () => {
    navigation.setAllRejectedSelection(selection);
    const page = render();
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await page.backToYourCases(new MouseEvent('click'));
    expect(navigation.allRejectedSelection()).toEqual(selection);
  });
  it.each(['scope', 'destroy', 'detached'] as const)(
    'does not restore stale row focus after %s invalidation',
    async (invalidation) => {
      const page = render();
      let finish!: (value: boolean) => void;
      vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
      const link = fixture.nativeElement.querySelector('tbody a') as HTMLAnchorElement;
      link.focus();
      const pending = page.openRow(1);
      if (invalidation === 'scope') scope.set({ ...identity, userId: 101 });
      else if (invalidation === 'destroy') fixture.destroy();
      else link.remove();
      finish(false);
      await pending;
      expect(data.reportError).not.toHaveBeenCalled();
    },
  );
  it.each(['row', 'back', 'denial'] as const)(
    'ignores late rejected %s navigation after the page is destroyed',
    async (action) => {
      let reject!: (value: unknown) => void;
      vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockImplementation(
        () =>
          new Promise((_, fail) => {
            reject = fail;
          }),
      );
      if (action === 'denial') scope.set(null);
      const page = render();
      let pending: Promise<void> | undefined;
      if (action === 'row') pending = page.openRow(1);
      else if (action === 'back') pending = page.backToYourCases(new MouseEvent('click'));
      fixture.destroy();
      reject(new Error('Synthetic late failure'));
      await pending;
      await Promise.resolve();
      expect(data.reportError).not.toHaveBeenCalled();
    },
  );
});
