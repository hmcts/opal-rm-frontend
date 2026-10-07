import { Component, PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { getState } from '@ngrx/signals';
import { of } from 'rxjs';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '@hmcts/opal-frontend-common/services/auth-service';
import { OpalUserService } from '@hmcts/opal-frontend-common/services/opal-user-service';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { LaunchDarklyService } from '@hmcts/opal-frontend-common/services/launch-darkly-service';
import { routing } from '@app/pages/routing/pages.routes';
import { CasesCreateCasefileStore } from '../../cases-create-casefile/stores/cases-create-casefile.store';
import { CASES_CREATE_CASEFILE_STATE } from '../../cases-create-casefile/constants/cases-create-casefile-state.constant';
import { CasesCreateCasefileComponent } from '../../cases-create-casefile/cases-create-casefile.component';
import { CasesDraftCreateAndManageTabsComponent } from '../cases-draft-create-and-manage-tabs/cases-draft-create-and-manage-tabs.component';
import { CasesDraftCreateAndManageViewAllRejectedComponent } from '../cases-draft-create-and-manage-tabs/cases-draft-create-and-manage-view-all-rejected/cases-draft-create-and-manage-view-all-rejected.component';
import { CasesDraftNavigationService } from '../services/cases-draft-navigation.service';
import { CASES_DRAFT_TABS } from '../constants/cases-draft-tabs.constant';
import { createCasesDraftSummary } from '../mocks/cases-draft-summary.mock';

@Component({ template: '<p>Denied</p>' })
class DeniedComponent {}
const key = 'release-1c-rm-create-case-files';
const dashboard = '/cases/draft/create-and-manage/tabs';
const details = '/cases/create-casefile/check-case-details/123';
const amendment = '/cases/create-casefile/task-list/123';
const rejections = '/cases/draft/create-and-manage/rejections';
const permittedUser = (): typeof OPAL_USER_STATE_MOCK => ({
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

describe('draft production route boundaries', () => {
  const userState = signal(permittedUser());
  const featureFlags = signal<Record<string, boolean>>({ [key]: true });
  const authenticated = signal(true);
  const initializeFlags = vi.fn().mockResolvedValue(undefined);
  let http: HttpTestingController;
  beforeEach(() => {
    userState.set(permittedUser());
    featureFlags.set({ [key]: true });
    authenticated.set(true);
    initializeFlags.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          ...routing,
          { path: 'access-denied', component: DeniedComponent },
          { path: 'account-created', component: DeniedComponent },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { checkAuthenticated: () => of(authenticated()) } },
        { provide: OpalUserService, useValue: { getLoggedInUserState: () => of(userState()) } },
        { provide: GlobalStore, useValue: { userState, featureFlags, authenticated, setBannerError: vi.fn() } },
        {
          provide: LaunchDarklyService,
          useValue: { initializeLaunchDarklyFlags: initializeFlags, initializeLaunchDarklyClient: vi.fn() },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it.each([
    [details, 'Check case details', 'Case details will be available here.', 'govuk-grid-column-two-thirds'],
    [amendment, 'Amend case', 'Case amendment will be available here.', 'govuk-grid-column-two-thirds'],
  ])('allows %s with no local create state or API request', async (url, heading, body, grid) => {
    const harness = await RouterTestingHarness.create(
      url + '?tab=approved&page=2&sort=created&direction=descending#rejected',
    );
    const element = harness.routeNativeElement!;
    expect(element.querySelector('h1')?.textContent?.trim()).toBe(heading);
    expect(document.title).toBe('OPAL - ' + heading);
    expect(element.textContent).toContain(body);
    expect(element.querySelector(':scope > div')?.className).toBe(grid);
    expect(element.querySelector('h1')?.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(element.querySelector('h1'));
    expect(element.querySelector('a')?.getAttribute('href')).toBe(dashboard + '#rejected');
    http.expectNone((request) => request.url.startsWith('/opal-maintenance-service/'));
    expect(getState(TestBed.inject(CasesCreateCasefileStore))).toEqual(CASES_CREATE_CASEFILE_STATE);
    const parent = TestBed.inject(Router).routerState.snapshot.root.firstChild!;
    expect(parent.component).toBeNull();
    expect(parent.firstChild?.data['hidePrimaryNav']).toBe(url !== rejections ? true : undefined);
  });
  it('activates the full-width list after one exclusive resolved consultation', async () => {
    const harness = await RouterTestingHarness.create();
    const arrival = harness.navigateByUrl(rejections);
    await vi.waitFor(() => {
      const request = http.expectOne(
        (request) =>
          request.url === '/opal-maintenance-service/draft-casefiles' &&
          request.params.get('not_submitted_by') === 'BUU-SYNTHETIC',
      );
      expect(request.request.params.keys().sort()).toEqual(['business_unit_id', 'casefile_status', 'not_submitted_by']);
      expect(request.request.params.get('business_unit_id')).toBe('44');
      expect(request.request.params.get('casefile_status')).toBe('REJECTED');
      request.flush({
        count: 1,
        summaries: [
          createCasesDraftSummary({
            casefile_status: 'REJECTED',
            submitted_by: 'BUU-OTHER',
            submitted_by_name: 'Synthetic submitter',
          }),
        ],
      });
    });
    await arrival;
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent?.trim()).toBe('All rejected cases');
    expect(document.title).toBe('OPAL - All rejected cases');
    expect(harness.routeNativeElement?.querySelector('.govuk-grid-column-full')).not.toBeNull();
    expect(harness.routeNativeElement?.querySelector('#cases-draft-tabs')).toBeNull();
    http.expectNone((request) => request.url.startsWith('/opal-maintenance-service/'));
  });

  it.each(['0', '-1', '9007199254740992', '1.5', '01', '1e2', 'not-a-number'])(
    'safely rejects draft ID %s',
    async (id) => {
      const harness = await RouterTestingHarness.create('/cases/create-casefile/task-list/' + id);
      expect(harness.routeNativeElement?.textContent).toContain(
        'This case could not be opened. Return to Create cases.',
      );
      expect(harness.routeNativeElement?.querySelector('a')).not.toBeNull();
      http.expectNone((request) => request.url.startsWith('/opal-maintenance-service/'));
    },
  );
  it('updates a reused shell for valid and malformed route IDs and origin metadata', async () => {
    const harness = await RouterTestingHarness.create(details);
    const first = harness.routeDebugElement?.componentInstance;
    await harness.navigateByUrl(
      '/cases/create-casefile/check-case-details/0?tab=rejected&page=3&sort=approved&direction=descending#approved',
    );
    expect(harness.routeDebugElement?.componentInstance).toBe(first);
    expect(harness.routeNativeElement?.textContent).toContain('This case could not be opened.');
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toContain('#approved');
    await harness.navigateByUrl(
      '/cases/create-casefile/check-case-details/9007199254740991?tab=approved&page=0&returnUrl=https://example.test#wrong',
    );
    expect(harness.routeNativeElement?.textContent).toContain('Case details will be available here.');
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe(dashboard + '#in-review');
  });
  it.each([dashboard, rejections, details, amendment])(
    'denies %s before any maintenance request when permission is absent',
    async (url) => {
      const user = permittedUser();
      user.business_unit_users[0].permissions = [];
      userState.set(user);
      await RouterTestingHarness.create(url);
      expect(TestBed.inject(Router).url).toBe('/access-denied');
      http.expectNone((request) => request.url.startsWith('/opal-maintenance-service/'));
    },
  );
  it.each([dashboard, rejections, details, amendment])('denies unreleased %s', async (url) => {
    featureFlags.set({ [key]: false });
    await RouterTestingHarness.create(url);
    expect(TestBed.inject(Router).url).toBe('/access-denied');
    http.expectNone((request) => request.url.startsWith('/opal-maintenance-service/'));
  });
  it.each([dashboard, rejections, details, amendment])(
    'cancels unresolved SSR %s without browser flag SDK',
    async (url) => {
      // All providers must be arranged before TestBed creates the harness.
      TestBed.resetTestingModule();
      featureFlags.set({});
      TestBed.configureTestingModule({
        providers: [
          provideRouter(routing),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: AuthService, useValue: { checkAuthenticated: () => of(true) } },
          { provide: OpalUserService, useValue: { getLoggedInUserState: () => of(userState()) } },
          { provide: GlobalStore, useValue: { userState, featureFlags, authenticated, setBannerError: vi.fn() } },
          {
            provide: LaunchDarklyService,
            useValue: { initializeLaunchDarklyFlags: initializeFlags, initializeLaunchDarklyClient: vi.fn() },
          },
        ],
      });
      http = TestBed.inject(HttpTestingController);
      const harness = await RouterTestingHarness.create(url);
      expect(harness.routeNativeElement).toBeNull();
      expect(initializeFlags).not.toHaveBeenCalled();
      http.expectNone((request) => request.url.startsWith('/opal-maintenance-service/'));
    },
  );
  it.each([
    'case-type',
    'task-list',
    'check-case-details',
    'cancel',
    'order-terms/add/SYNTHETIC',
    'order-terms/remove/0',
  ])('falls through the ID-only group for ordinary create route %s and retains local-state guards', async (child) => {
    const harness = await RouterTestingHarness.create('/cases/create-casefile/' + child);
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(CasesCreateCasefileComponent);
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/case-type');
    expect(harness.routeNativeElement?.querySelector('app-cases-draft-placeholder')).toBeNull();
    http.expectNone((request) => request.url.startsWith('/opal-maintenance-service/'));
  });

  const exclusive = (request: import('@angular/common/http').HttpRequest<unknown>) =>
    request.url === '/opal-maintenance-service/draft-casefiles' && request.params.has('not_submitted_by');
  async function flushExclusive(count = 1, submittedBy = 'BUU-SYNTHETIC') {
    await vi.waitFor(() =>
      http
        .expectOne((request) => exclusive(request) && request.params.get('not_submitted_by') === submittedBy)
        .flush({
          count,
          summaries: Array.from({ length: count }, (_, index) =>
            createCasesDraftSummary({
              draft_casefile_id: index + 1,
              casefile_status: 'REJECTED',
              submitted_by: 'BUU-OTHER',
            }),
          ),
        }),
    );
  }
  it.each(['populated', 'empty'] as const)(
    'activates only the successfully resolved %s collection without local status controls',
    async (completion) => {
      const harness = await RouterTestingHarness.create();
      const arrival = harness.navigateByUrl(rejections);
      await flushExclusive(completion === 'empty' ? 0 : 1);
      await arrival;
      harness.detectChanges();
      const page = harness.routeDebugElement!.componentInstance as CasesDraftCreateAndManageViewAllRejectedComponent;
      expect(page.casefiles()?.rows).toHaveLength(completion === 'empty' ? 0 : 1);
      expect(
        harness.routeNativeElement!.querySelector(
          '#cases-draft-all-rejected-loading, #cases-draft-all-rejected-failure, #cases-draft-all-rejected-retry',
        ),
      ).toBeNull();
      expect(document.activeElement).toBe(harness.routeNativeElement!.querySelector('h1'));
      http.expectNone(exclusive);
    },
  );
  it.each(['decoder', 'network', 'server'] as const)(
    'propagates initial %s failure without activating or rendering an empty list',
    async (failure) => {
      const harness = await RouterTestingHarness.create(details);
      const arrival = harness.navigateByUrl(rejections);
      const rejected = expect(arrival).rejects.toBeTruthy();
      await vi.waitFor(() => {
        const request = http.expectOne(exclusive);
        if (failure === 'decoder') request.flush({ count: 1, summaries: 'invalid' });
        else if (failure === 'network') request.error(new ProgressEvent('error'));
        else request.flush({}, { status: 500, statusText: 'Failure' });
      });
      await rejected;
      harness.detectChanges();
      expect(TestBed.inject(Router).url).toBe(details);
      expect(
        harness.routeNativeElement!.querySelector(
          '#cases-draft-all-rejected-heading, #cases-draft-all-rejected-empty, #cases-draft-all-rejected-loading, #cases-draft-all-rejected-failure, #cases-draft-all-rejected-retry',
        ),
      ).toBeNull();
    },
  );
  it('does not activate pending arrival and defensively excludes own, foreign and wrong-status rows', async () => {
    const harness = await RouterTestingHarness.create(details);
    const arrival = harness.navigateByUrl(rejections);
    let pending!: import('@angular/common/http/testing').TestRequest;
    await vi.waitFor(() => {
      pending = http.expectOne(exclusive);
    });
    expect(
      harness.routeNativeElement!.querySelector(
        '#cases-draft-all-rejected-heading, #cases-draft-all-rejected-loading, #cases-draft-all-rejected-retry',
      ),
    ).toBeNull();
    pending.flush({
      count: 4,
      summaries: [
        createCasesDraftSummary({ casefile_status: 'REJECTED', submitted_by: 'BUU-OTHER' }),
        createCasesDraftSummary({ draft_casefile_id: 124, casefile_status: 'REJECTED', submitted_by: 'BUU-SYNTHETIC' }),
        createCasesDraftSummary({
          draft_casefile_id: 125,
          casefile_status: 'REJECTED',
          submitted_by: 'BUU-OTHER',
          business_unit_id: 45,
        }),
        createCasesDraftSummary({ draft_casefile_id: 126, casefile_status: 'PUBLISHED', submitted_by: 'BUU-OTHER' }),
      ],
    });
    await arrival;
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelectorAll('tbody tr')).toHaveLength(1);
    http.expectNone(exclusive);
  });
  it('cancels B while resolving newest C and hides old success and rows synchronously', async () => {
    const harness = await RouterTestingHarness.create();
    const arrival = harness.navigateByUrl(rejections);
    await flushExclusive();
    await arrival;
    const page = harness.routeDebugElement!.componentInstance as CasesDraftCreateAndManageViewAllRejectedComponent;
    const replacement = permittedUser();
    replacement.user_id += 1;
    replacement.business_unit_users[0].business_unit_user_id = 'BUU-B';
    userState.set(replacement);
    expect(page.casefiles()).toBeNull();
    expect(page.successText()).toBeNull();
    harness.detectChanges();
    let pending!: import('@angular/common/http/testing').TestRequest;
    await vi.waitFor(() => {
      pending = http.expectOne((request) => exclusive(request) && request.params.get('not_submitted_by') === 'BUU-B');
    });
    const newest = structuredClone(replacement);
    newest.user_id += 1;
    newest.business_unit_users[0].business_unit_user_id = 'BUU-C';
    userState.set(newest);
    harness.detectChanges();
    await flushExclusive(1, 'BUU-C');
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(pending.cancelled).toBe(true);
    expect(page.casefiles()?.identity.submittedBy).toBe('BUU-C');
    expect(harness.routeDebugElement!.componentInstance).toBe(page);
    http.expectNone(exclusive);
  });
  it('hides trusted success names and rows synchronously when live access is removed', async () => {
    const harness = await RouterTestingHarness.create();
    const navigation = TestBed.inject(CasesDraftNavigationService);
    expect(
      navigation.recordAllRejectedResubmission({
        origin: 'all-rejected',
        identity: { userId: userState().user_id, businessUnitId: 44, submittedBy: 'BUU-SYNTHETIC' },
        draftCasefileId: 1,
        respondentForename: 'Synthetic',
        respondentSurname: 'Respondent',
      }),
    ).toBe(true);
    const arrival = harness.navigateByUrl(rejections);
    await flushExclusive();
    await arrival;
    harness.detectChanges();
    const page = harness.routeDebugElement!.componentInstance as CasesDraftCreateAndManageViewAllRejectedComponent;
    expect(page.successText()).toContain('Synthetic Respondent');
    expect(harness.routeNativeElement!.querySelector('tbody')).not.toBeNull();
    featureFlags.set({ [key]: false });
    expect(page.casefiles()).toBeNull();
    expect(page.successText()).toBeNull();
    harness.detectChanges();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/access-denied');
    http.expectNone(exclusive);
  });
  it.each(['permission', 'flag', 'authentication'] as const)(
    'hides rows synchronously and cancels pending exclusive list on %s loss',
    async (loss) => {
      const harness = await RouterTestingHarness.create();
      const arrival = harness.navigateByUrl(rejections);
      await flushExclusive();
      await arrival;
      const page = harness.routeDebugElement!.componentInstance as CasesDraftCreateAndManageViewAllRejectedComponent;
      const replacement = permittedUser();
      replacement.user_id += 1;
      replacement.business_unit_users[0].business_unit_user_id = 'BUU-B';
      userState.set(replacement);
      harness.detectChanges();
      let pending!: import('@angular/common/http/testing').TestRequest;
      await vi.waitFor(() => {
        pending = http.expectOne(exclusive);
      });
      if (loss === 'permission') {
        replacement.business_unit_users[0].permissions = [];
        userState.set({ ...replacement });
      } else if (loss === 'flag') featureFlags.set({ [key]: false });
      else authenticated.set(false);
      expect(page.casefiles()).toBeNull();
      expect(page.successText()).toBeNull();
      harness.detectChanges();
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(pending.cancelled).toBe(true);
      expect(TestBed.inject(Router).url).toBe('/access-denied');
    },
  );
  it('returns from protected row Back through one fresh list and clamps remembered selection', async () => {
    const harness = await RouterTestingHarness.create();
    const arrival = harness.navigateByUrl(rejections);
    await flushExclusive(26);
    await arrival;
    const page = harness.routeDebugElement!.componentInstance as CasesDraftCreateAndManageViewAllRejectedComponent;
    page.changeSort({ key: 'respondent', direction: 'descending' });
    page.changePage(2);
    await page.openRow(26);
    expect(TestBed.inject(Router).url).toBe(details.replace('123', '26'));
    harness.detectChanges();
    harness.routeNativeElement!.querySelector('a')!.click();
    await flushExclusive(1);
    await harness.fixture.whenStable();
    harness.detectChanges();
    const returned = harness.routeDebugElement!.componentInstance as CasesDraftCreateAndManageViewAllRejectedComponent;
    expect(returned.navigation.allRejectedSelection()).toEqual({
      page: 1,
      sort: 'respondent',
      direction: 'descending',
    });
    expect(TestBed.inject(Router).url).toBe(rejections);
    http.expectNone(exclusive);
  });
  it.each(['inactive', 'missing-identity', 'other-BU', 'checker-only', 'missing-flag'] as const)(
    'denies direct exclusive access for %s without request',
    async (missing) => {
      const user = permittedUser();
      if (missing === 'inactive') user.status = 'suspended';
      if (missing === 'missing-identity') user.business_unit_users[0].business_unit_user_id = '';
      if (missing === 'other-BU') user.business_unit_users[0].business_unit_id = 45;
      if (missing === 'checker-only')
        user.business_unit_users[0].permissions = [{ permission_id: 22, permission_name: 'Checker' }];
      if (missing === 'missing-flag') featureFlags.set({});
      userState.set(user);
      await RouterTestingHarness.create(rejections);
      expect(TestBed.inject(Router).url).toBe(missing === 'inactive' ? '/account-created' : '/access-denied');
      http.expectNone(exclusive);
    },
  );
  it('permits a dual-role user in the inputter list scope', async () => {
    const user = permittedUser();
    user.business_unit_users[0].permissions.push({ permission_id: 22, permission_name: 'Checker' });
    userState.set(user);
    const harness = await RouterTestingHarness.create();
    const arrival = harness.navigateByUrl(rejections);
    await flushExclusive();
    await arrival;
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('All rejected cases');
  });

  async function flushList(status: string, count: number) {
    await vi.waitFor(() => {
      http
        .expectOne(
          (request) => request.params.get('casefile_status') === status && request.params.get('restrict') !== 'counts',
        )
        .flush({
          count,
          summaries: Array.from({ length: count }, (_, index) =>
            createCasesDraftSummary({
              draft_casefile_id: index + 1,
              casefile_status: status as 'REJECTED' | 'PUBLISHED' | 'SUBMITTED',
            }),
          ),
        });
    });
  }
  it('returns through fresh resolver data, retaining sort and clamping a shrinking list', async () => {
    const harness = await RouterTestingHarness.create();
    const arrival = harness.navigateByUrl(dashboard + '#rejected');
    await flushList('REJECTED', 26);
    await arrival;
    const original = harness.routeDebugElement?.componentInstance as CasesDraftCreateAndManageTabsComponent;
    original.changeSort({ key: 'respondent', direction: 'descending' });
    original.changePage(2);
    expect(original.navigation.selection().page).toBe(2);
    expect(TestBed.inject(Router).url).toBe(dashboard + '#rejected');
    await harness.navigateByUrl(details + '#rejected');
    harness.routeNativeElement!.querySelector('a')!.click();
    await flushList('REJECTED', 1);
    harness.detectChanges();
    await harness.fixture.whenStable();
    harness.detectChanges();
    const current = harness.routeDebugElement?.componentInstance as CasesDraftCreateAndManageTabsComponent;
    expect(current).not.toBe(original);
    expect(current.navigation.selection()).toEqual({
      tab: 'rejected',
      page: 1,
      sort: 'respondent',
      direction: 'descending',
    });
    expect(TestBed.inject(Router).url).toBe(dashboard + '#rejected');
  });
  it('resolves a non-default initial fragment once and ignores added query state', async () => {
    const harness = await RouterTestingHarness.create();
    const arrival = harness.navigateByUrl(dashboard + '#approved');
    await vi.waitFor(() =>
      http.expectOne((request) => request.params.get('restrict') === 'counts').flush({ count: 7 }),
    );
    await flushList('PUBLISHED', 1);
    await arrival;
    expect(harness.routeNativeElement?.querySelector('tbody')).not.toBeNull();
    await harness.navigateByUrl(dashboard + '?page=8&sort=respondentAccount&direction=descending#approved');
    expect(
      (harness.routeDebugElement?.componentInstance as CasesDraftCreateAndManageTabsComponent).navigation.selection(),
    ).toEqual({
      tab: 'approved',
      page: 1,
      sort: 'approved',
      direction: 'ascending',
    });
    http.expectNone((request) => request.url.startsWith('/opal-maintenance-service/'));
  });
  it('arrives with successful rows and a global banner after independent count decoding fails', async () => {
    const harness = await RouterTestingHarness.create();
    const banner = TestBed.inject(GlobalStore).setBannerError;
    const arrival = harness.navigateByUrl(dashboard + '#approved');
    await vi.waitFor(() =>
      http.expectOne((request) => request.params.get('restrict') === 'counts').flush({ count: 'invalid' }),
    );
    await flushList('PUBLISHED', 1);
    await arrival;
    expect(harness.routeNativeElement?.querySelector('tbody')).not.toBeNull();
    expect(harness.routeNativeElement?.querySelectorAll('#cases-draft-tabs a')).toHaveLength(4);
    expect(harness.routeNativeElement?.querySelector('opal-lib-moj-notification-badge')).toBeNull();
    expect(banner).toHaveBeenCalledWith(expect.objectContaining({ error: true }));
  });
  it.each([
    ['approved', 'PUBLISHED'],
    ['rejected', 'REJECTED'],
    ['deleted', 'DELETED'],
  ] as const)(
    'keeps URL, heading and fresh rows aligned after authorised identity replacement on %s',
    async (tab, status) => {
      const harness = await RouterTestingHarness.create();
      const router = TestBed.inject(Router);
      const url = dashboard + '#' + tab;
      const arrival = harness.navigateByUrl(url);
      if (tab !== 'rejected')
        await vi.waitFor(() =>
          http.expectOne((request) => request.params.get('restrict') === 'counts').flush({ count: 7 }),
        );
      await vi.waitFor(() =>
        http
          .expectOne(
            (request) =>
              request.params.get('casefile_status') === status && request.params.get('restrict') !== 'counts',
          )
          .flush({
            count: 1,
            summaries: [createCasesDraftSummary({ casefile_status: status })],
          }),
      );
      await arrival;
      expect(harness.routeNativeElement?.querySelector('tbody tr')?.getAttribute('data-draft-id')).toBe('123');
      const navigation = TestBed.inject(CasesDraftNavigationService);
      navigation.rememberCreateOrigin();
      const replacement = permittedUser();
      replacement.user_id += 1;
      replacement.business_unit_users[0].business_unit_user_id = 'BUU-REPLACEMENT';
      userState.set(replacement);
      harness.detectChanges();
      expect(harness.routeNativeElement?.querySelector('tbody')).toBeNull();
      await vi.waitFor(() =>
        http
          .expectOne(
            (request) =>
              request.params.get('submitted_by') === 'BUU-REPLACEMENT' &&
              request.params.get('casefile_status') === status &&
              request.params.get('restrict') !== 'counts',
          )
          .flush({
            count: 2,
            summaries: [
              createCasesDraftSummary({
                draft_casefile_id: 456,
                casefile_status: status,
                submitted_by: 'BUU-REPLACEMENT',
              }),
              createCasesDraftSummary({ casefile_status: status }),
            ],
          }),
      );
      if (tab !== 'rejected')
        http
          .expectOne(
            (request) =>
              request.params.get('restrict') === 'counts' && request.params.get('submitted_by') === 'BUU-REPLACEMENT',
          )
          .flush({ count: 3 });
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(router.url).toBe(url);
      expect(navigation.selection().tab).toBe(tab);
      expect(harness.routeNativeElement?.querySelector('#cases-draft-selected-heading')?.textContent?.trim()).toBe(
        CASES_DRAFT_TABS[tab].label,
      );
      expect(harness.routeNativeElement?.querySelector('tbody tr')?.getAttribute('data-draft-id')).toBe('456');
      expect(harness.routeNativeElement?.querySelector('[data-draft-id="123"]')).toBeNull();
      expect(router.serializeUrl(navigation.creationReturnUrl())).toBe(dashboard + '#in-review');
    },
  );
  it('cancels a pending replacement consultation when its authorisation is removed', async () => {
    const harness = await RouterTestingHarness.create();
    const arrival = harness.navigateByUrl(dashboard + '#rejected');
    await flushList('REJECTED', 1);
    await arrival;
    const replacement = permittedUser();
    replacement.user_id += 1;
    replacement.business_unit_users[0].business_unit_user_id = 'BUU-REPLACEMENT';
    userState.set(replacement);
    harness.detectChanges();
    const pending = http.expectOne((request) => request.params.get('submitted_by') === 'BUU-REPLACEMENT');
    expect(harness.routeNativeElement?.querySelector('tbody')).toBeNull();
    replacement.business_unit_users[0].permissions = [];
    userState.set({ ...replacement });
    harness.detectChanges();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(pending.cancelled).toBe(true);
    expect(TestBed.inject(Router).url).toBe('/access-denied');
    expect(harness.routeNativeElement?.querySelector('tbody')).toBeNull();
  });
  it('cancels resolver arrival on failed list without rendering a successful empty table', async () => {
    const harness = await RouterTestingHarness.create(details);
    const arrival = harness.navigateByUrl(dashboard + '#rejected');
    await vi.waitFor(() =>
      http
        .expectOne((request) => request.params.get('casefile_status') === 'REJECTED')
        .flush({ message: 'Synthetic failure' }, { status: 500, statusText: 'Failure' }),
    );
    await expect(arrival).rejects.toBeTruthy();
    expect(TestBed.inject(Router).url).toBe(details);
    expect(harness.routeNativeElement?.querySelector('#cases-draft-empty')).toBeNull();
  });
  it('denies Back after permission is removed without consulting a collection', async () => {
    const harness = await RouterTestingHarness.create(details);
    const user = permittedUser();
    user.business_unit_users[0].permissions = [];
    userState.set(user);
    harness.routeNativeElement!.querySelector('a')!.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/access-denied');
    http.expectNone((request) => request.url.startsWith('/opal-maintenance-service/'));
  });
  it('redirects only the empty dashboard root and resolves before dashboard arrival', async () => {
    const harness = await RouterTestingHarness.create();
    const arrival = harness.navigateByUrl('/cases/draft/create-and-manage');
    await vi.waitFor(() =>
      http.expectOne((request) => request.params.get('restrict') === 'counts').flush({ count: 0 }),
    );
    await vi.waitFor(() =>
      http
        .expectOne((request) => request.params.get('casefile_status') === 'SUBMITTED,RESUBMITTED')
        .flush({ count: 0, summaries: [] }),
    );
    await arrival;
    expect(TestBed.inject(Router).url).toBe(dashboard);
    expect(harness.routeNativeElement?.textContent).toContain('You have no cases in review.');
  });
});
