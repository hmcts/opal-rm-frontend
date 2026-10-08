import {
  createPersistedCasefileDetail,
  PERSISTED_CASEFILE_REFERENCES,
  PERSISTED_CASEFILE_RESULT_DETAIL,
} from '../../services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import type { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { Component, signal } from '@angular/core';
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
import { CasesDraftCheckAndValidateTabsComponent } from '../cases-draft-check-and-validate-tabs/cases-draft-check-and-validate-tabs.component';
import { CasesDraftNavigationService } from '../services/cases-draft-navigation.service';
import { CasesDraftCasefileStore } from '../stores/cases-draft-casefile.store';
import { CasesCreateCasefileComponent } from '../../cases-create-casefile/cases-create-casefile.component';
import { By } from '@angular/platform-browser';
import { createCasesDraftSummary } from '../mocks/cases-draft-summary.mock';

@Component({ template: '<p>Denied</p>' })
class DeniedComponent {}
const key = 'release-1c-rm-create-case-files';
const dashboard = '/cases/draft/check-and-validate/tabs';
const details = '/cases/create-casefile/check-case-details/123';
const amendment = '/cases/create-casefile/task-list/123';
const permittedUser = (): IOpalUserState => ({
  ...structuredClone(OPAL_USER_STATE_MOCK),
  status: 'active' as const,
  business_unit_users: [
    {
      business_unit_id: 44,
      business_unit_user_id: 'BUU-SYNTHETIC',
      permissions: [{ permission_id: 22, permission_name: 'Check and Validate Draft Casefiles' }],
    },
  ],
});

describe('checker production route boundaries', () => {
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
          { path: 'error/permission-denied', component: DeniedComponent },
          { path: 'account-created', component: DeniedComponent },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { checkAuthenticated: () => of(authenticated()) } },
        { provide: OpalUserService, useValue: { getLoggedInUserState: () => of(userState()) } },
        {
          provide: GlobalStore,
          useValue: { userState, featureFlags, authenticated, setBannerError: vi.fn(), resetBannerError: vi.fn() },
        },
        { provide: LaunchDarklyService, useValue: { initializeLaunchDarklyFlags: initializeFlags } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  async function flushPersisted(id = 123, status: 'SUBMITTED' | 'RESUBMITTED' = 'SUBMITTED') {
    await vi.waitFor(() => {
      const draft = createPersistedCasefileDetail();
      draft.draft_casefile_id = id;
      draft.casefile_status = status;
      http.expectOne('/opal-maintenance-service/draft-casefiles/' + id).flush(draft, { headers: { ETag: '"0"' } });
    });
    await vi.waitFor(() =>
      http
        .expectOne((request) => request.url === '/opal-maintenance-service/maintenance-applications')
        .flush({ refData: PERSISTED_CASEFILE_REFERENCES.applications }),
    );
    for (const request of http.match((request) => request.url === '/opal-maintenance-service/countries'))
      request.flush({ refData: PERSISTED_CASEFILE_REFERENCES.countries });
    for (const request of http.match((request) => request.url === '/opal-maintenance-service/major-creditors'))
      request.flush({ refData: [] });
    http.expectOne('/opal-maintenance-service/results/TEST01').flush(PERSISTED_CASEFILE_RESULT_DETAIL);
  }
  async function openPersisted(url = details, id = 123) {
    const arrival = RouterTestingHarness.create(url);
    await flushPersisted(id);
    return arrival;
  }

  const deleteUrl = '/cases/draft/check-and-validate/delete/123';
  it.each(['SUBMITTED', 'RESUBMITTED'] as const)(
    'loads an eligible %s Delete deep link with its complete saved envelope',
    async (status) => {
      const arrival = RouterTestingHarness.create(deleteUrl);
      await flushPersisted(123, status);
      const harness = await arrival;
      const shell = harness.fixture.debugElement.query(By.directive(CasesCreateCasefileComponent));
      const store = shell.injector.get(CasesDraftCasefileStore);
      expect(harness.routeNativeElement?.querySelector('h1')?.textContent?.trim()).toBe('Delete casefile');
      expect(harness.routeNativeElement?.querySelector('#create_casefile_delete_return')).not.toBeNull();
      expect(document.activeElement).toBe(harness.routeNativeElement?.querySelector('h1'));
      expect(store.draft()?.casefile_status).toBe(status);
      expect(store.etag()).toBe('"0"');
      expect(harness.routeNativeElement?.querySelector('form, input, textarea, select')).toBeNull();
      http.expectNone((request) => request.method !== 'GET');
    },
  );
  it('keeps review and Delete in the same persisted shell and returns to fresh review cases', async () => {
    const harness = await openPersisted('/cases/draft/check-and-validate/review/123');
    const shell = harness.fixture.debugElement.query(By.directive(CasesCreateCasefileComponent));
    const owner = shell.componentInstance;
    const store = shell.injector.get(CasesDraftCasefileStore);
    const before = structuredClone(getState(store));
    const deleteLink = harness.routeNativeElement!.querySelector<HTMLAnchorElement>('a#create_casefile_review_delete')!;
    expect(deleteLink.getAttribute('href')).toBe(deleteUrl);
    deleteLink.click();
    await flushPersisted();
    await settle(harness);
    expect(TestBed.inject(Router).url).toBe(deleteUrl);
    expect(harness.fixture.debugElement.query(By.directive(CasesCreateCasefileComponent)).componentInstance).toBe(
      owner,
    );
    expect(getState(store)).toEqual(before);
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('#create_casefile_delete_return')!.click();
    await vi.waitFor(() => flushList('SUBMITTED', 1));
    await settle(harness);
    expect(TestBed.inject(Router).url).toBe(dashboard + '#to-review');
    expect(store.draft()).toBeNull();
    expect(getState(TestBed.inject(CasesCreateCasefileStore))).toEqual(CASES_CREATE_CASEFILE_STATE);
    http.expectNone((request) => request.method !== 'GET');
  });
  it.each(['own submission', '21-only', 'published', 'loaded other BU'])(
    'denies direct Delete after permitted read for %s',
    async (condition) => {
      if (condition === '21-only') {
        const user = permittedUser();
        user.business_unit_users[0].permissions = [{ permission_id: 21, permission_name: 'Create' }];
        userState.set(user);
      }
      const arrival = RouterTestingHarness.create(deleteUrl);
      await vi.waitFor(() => {
        const draft = createPersistedCasefileDetail();
        draft.draft_casefile_id = 123;
        if (condition === 'own submission') draft.submitted_by = 'BUU-SYNTHETIC';
        if (condition === 'published') draft.casefile_status = 'PUBLISHED';
        if (condition === 'loaded other BU') {
          draft.business_unit_id = 45;
          draft.casefile.respondent_account.business_unit_id = 45;
        }
        http.expectOne('/opal-maintenance-service/draft-casefiles/123').flush(draft, { headers: { ETag: '"0"' } });
      });
      const harness = await arrival;
      await settle(harness);
      expect(TestBed.inject(Router).url).toBe('/error/permission-denied');
      expect(harness.routeNativeElement?.querySelector('#create_casefile_delete_return')).toBeNull();
      http.expectNone((request) => request.url.startsWith('/opal-maintenance-service/'));
    },
  );
  it.each(['cross BU', 'no read permission'])('denies direct Delete before selected GET for %s', async (condition) => {
    const user = permittedUser();
    if (condition === 'cross BU') user.business_unit_users[0].business_unit_id = 45;
    else user.business_unit_users[0].permissions = [];
    userState.set(user);
    await RouterTestingHarness.create(deleteUrl);
    expect(TestBed.inject(Router).url).toBe('/access-denied');
    http.expectNone((request) => request.url.startsWith('/opal-maintenance-service/'));
  });
  it.each(['0', '-1', '01', '1.5', '9007199254740992', 'invalid'])('keeps malformed Delete ID %s local', async (id) => {
    const harness = await RouterTestingHarness.create('/cases/draft/check-and-validate/delete/' + id);
    expect(harness.routeNativeElement).toBeNull();
    http.expectNone((request) => request.url.startsWith('/opal-maintenance-service/'));
  });
  it('replaces Delete with shared permission denial on live 22-to-21 loss while retaining read access', async () => {
    const harness = await openPersisted(deleteUrl);
    const user = permittedUser();
    user.business_unit_users[0].permissions = [{ permission_id: 21, permission_name: 'Create' }];
    userState.set(user);
    await settle(harness);
    expect(harness.routeNativeElement?.textContent).toContain('Denied');
    expect(harness.routeNativeElement?.querySelector('#create_casefile_delete_return')).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/error/permission-denied');
    expect(getState(TestBed.inject(CasesCreateCasefileStore))).toEqual(CASES_CREATE_CASEFILE_STATE);
    http.expectNone((request) => request.url.startsWith('/opal-maintenance-service/'));
  });

  it.each([dashboard])('denies inputter-only %s without traffic', async (url) => {
    const user = permittedUser();
    user.business_unit_users[0].permissions[0].permission_id = 21;
    userState.set(user);
    await RouterTestingHarness.create(url);
    expect(TestBed.inject(Router).url).toBe('/access-denied');
    http.expectNone((request) => request.url.includes('/draft-casefiles'));
  });
  it.each([dashboard, '/cases/draft/check-and-validate/review/123', '/cases/draft/check-and-validate/view/123'])(
    'does not aggregate permission 22 from another BU for %s',
    async (url) => {
      const user = permittedUser();
      user.business_unit_users[0].permissions = [];
      user.business_unit_users.push({
        business_unit_id: 45,
        business_unit_user_id: 'BUU-OTHER',
        permissions: [{ permission_id: 22, permission_name: 'Check' }],
      });
      userState.set(user);
      await RouterTestingHarness.create(url);
      expect(TestBed.inject(Router).url).toBe('/access-denied');
      http.expectNone((request) => request.url.includes('/draft-casefiles'));
    },
  );
  it.each(['/cases/create-casefile/case-type', amendment])('denies checker-only creation %s', async (url) => {
    await RouterTestingHarness.create(url);
    expect(TestBed.inject(Router).url).toBe('/access-denied');
    http.expectNone((request) => request.url.startsWith('/opal-maintenance-service/'));
    expect(getState(TestBed.inject(CasesCreateCasefileStore))).toEqual(CASES_CREATE_CASEFILE_STATE);
  });
  it.each(['review', 'view'] as const)(
    'resolves the %s summary before mounting without creation controls',
    async (kind) => {
      const harness = await openPersisted('/cases/draft/check-and-validate/' + kind + '/123?mode=amendment#rejected');
      expect(harness.routeNativeElement?.querySelector('h1#review-heading')?.textContent?.trim()).toBe(
        'Synthetic Respondent',
      );
      expect(harness.routeNativeElement?.querySelector('#create_casefile_review_submit')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('#review-term-change-1')).toBeNull();
      expect(harness.routeNativeElement?.textContent).toContain('Test Country One');
      expect(document.activeElement).toBe(harness.routeNativeElement?.querySelector('h1'));
      http.expectNone((request) => request.url.includes('/opal-maintenance-service/'));
    },
  );
  it.each(['review', 'view'] as const)(
    'allows 21-only persisted %s as read-only with inputter dashboard fallback',
    async (kind) => {
      const user = permittedUser();
      user.business_unit_users[0].permissions = [{ permission_id: 21, permission_name: 'Create' }];
      userState.set(user);
      const harness = await openPersisted('/cases/draft/check-and-validate/' + kind + '/123');
      expect(harness.routeNativeElement?.textContent).toContain('Test Country One');
      expect(harness.routeNativeElement?.querySelector('#create_casefile_review_submit')).toBeNull();
    },
  );
  it('allows checker-only inputter persisted details without enabling creation', async () => {
    const harness = await openPersisted(details);
    expect(harness.routeNativeElement?.textContent).toContain('Test Country One');
    expect(harness.routeNativeElement?.querySelector('#review-term-change-1')).toBeNull();
  });
  it.each(['blank', 'inactive', 'other BU', 'flag', 'authentication'])(
    'blocks invalid checker access %s',
    async (condition) => {
      const user = permittedUser();
      if (condition === 'blank') user.business_unit_users[0].business_unit_user_id = ' ';
      if (condition === 'inactive') user.status = 'suspended';
      if (condition === 'other BU') user.business_unit_users[0].business_unit_id = 45;
      if (condition === 'flag') featureFlags.set({ [key]: false });
      if (condition === 'authentication') authenticated.set(false);
      userState.set(user);
      await RouterTestingHarness.create('/cases/draft/check-and-validate/review/123');
      let destination = '/access-denied';
      if (condition === 'authentication') destination = '/';
      if (condition === 'inactive') destination = '/account-created';
      expect(TestBed.inject(Router).url).toBe(destination);
      http.expectNone((request) => request.url.includes('/draft-casefiles'));
    },
  );
  it.each(['0', '-1', '01', '1.5', '9007199254740992', 'invalid'])(
    'keeps malformed checker ID %s local',
    async (id) => {
      const harness = await RouterTestingHarness.create('/cases/draft/check-and-validate/review/' + id);
      expect(harness.routeNativeElement).toBeNull();
      http.expectNone((request) => request.url.startsWith('/opal-maintenance-service/'));
    },
  );
  function flushCounts() {
    for (const request of http.match((request) => request.params.get('restrict') === 'counts'))
      request.flush({ count: 3 });
  }
  async function settle(harness: RouterTestingHarness) {
    harness.detectChanges();
    await harness.fixture.whenStable();
    harness.detectChanges();
  }
  function flushList(status: 'REJECTED' | 'SUBMITTED', count: number) {
    http
      .expectOne(
        (request) =>
          request.params.get('restrict') !== 'counts' &&
          request.params.get('casefile_status') === (status === 'SUBMITTED' ? 'SUBMITTED,RESUBMITTED' : status),
      )
      .flush({
        count,
        summaries: Array.from({ length: count }, (_, index) =>
          createCasesDraftSummary({ draft_casefile_id: index + 1, casefile_status: status, submitted_by: 'BUU-OTHER' }),
        ),
      });
    flushCounts();
  }
  it.each([
    ['rejected', 'REJECTED', 'view'],
    ['to-review', 'SUBMITTED', 'review'],
  ] as const)('fetches fresh %s rows on Back and clamps page retaining sort', async (tab, status, shell) => {
    const dualUser = permittedUser();
    dualUser.business_unit_users[0].permissions.push({ permission_id: 21, permission_name: 'Create' });
    userState.set(dualUser);
    const pending = RouterTestingHarness.create(dashboard + '#' + tab);
    await vi.waitFor(() => flushList(status, 26));
    const harness = await pending;
    await settle(harness);
    const original = harness.routeDebugElement?.componentInstance as CasesDraftCheckAndValidateTabsComponent;
    original.changeSort({ key: 'applicant', direction: 'descending' });
    original.changePage(2);
    await settle(harness);
    expect(original.navigation.selection().page).toBe(2);
    const rootNavigation = TestBed.inject(CasesDraftNavigationService);
    rootNavigation.setSelection({ tab: 'rejected', page: 3, sort: 'applicant', direction: 'descending' });
    rootNavigation.rememberCreateOrigin();
    const rootSelection = rootNavigation.selection();
    const rootOrigin = TestBed.inject(Router).serializeUrl(rootNavigation.creationReturnUrl());
    expect(original.navigation).not.toBe(rootNavigation);
    harness.routeNativeElement!.querySelector<HTMLAnchorElement>('tbody a')!.click();
    await flushPersisted(26);
    await settle(harness);
    expect(TestBed.inject(Router).url).toContain('/cases/draft/check-and-validate/' + shell + '/');
    harness.routeNativeElement!.querySelector('a')!.click();
    await vi.waitFor(() => {
      flushList(status, 1);
    });
    await settle(harness);
    const current = harness.routeDebugElement?.componentInstance as CasesDraftCheckAndValidateTabsComponent;
    expect(current).not.toBe(original);
    expect(current.navigation).toBe(original.navigation);
    expect(current.navigation.selection()).toEqual({ tab, page: 1, sort: 'applicant', direction: 'descending' });
    expect(TestBed.inject(Router).url).toBe(dashboard + '#' + tab);
    expect(harness.routeNativeElement?.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(document.activeElement).toBe(harness.routeNativeElement?.querySelector('h1'));
    expect(rootNavigation.selection()).toEqual(rootSelection);
    expect(TestBed.inject(Router).serializeUrl(rootNavigation.creationReturnUrl())).toBe(rootOrigin);
    expect(getState(TestBed.inject(CasesCreateCasefileStore))).toEqual(CASES_CREATE_CASEFILE_STATE);
    await harness.navigateByUrl(dashboard + '?page=1&sort=respondent&direction=ascending#' + tab);
    http.expectNone((request) => request.url.includes('/draft-casefiles'));
  });
  it('ignores injected table query metadata and generates only fragment links', async () => {
    const pending = RouterTestingHarness.create(dashboard + '?page=9&sort=applicant&direction=descending#rejected');
    await vi.waitFor(() => flushList('REJECTED', 26));
    const harness = await pending;
    await settle(harness);
    const component = harness.routeDebugElement?.componentInstance as CasesDraftCheckAndValidateTabsComponent;
    expect(component.navigation.selection()).toEqual({
      tab: 'rejected',
      page: 1,
      sort: 'statusDate',
      direction: 'ascending',
    });
    component.changeSort({ key: 'applicant', direction: 'descending' });
    component.changePage(2);
    await settle(harness);
    expect(component.navigation.selection()).toEqual({
      tab: 'rejected',
      page: 2,
      sort: 'applicant',
      direction: 'descending',
    });
    expect(harness.routeNativeElement?.querySelector('output')?.textContent).toContain('Page 2 of 2');
    expect(TestBed.inject(Router).serializeUrl(component.navigation.dashboardUrl())).toBe(dashboard + '#rejected');
    expect(TestBed.inject(Router).serializeUrl(component.navigation.placeholderUrl('view', 123))).toBe(
      '/cases/draft/check-and-validate/view/123#rejected',
    );
    http.expectNone((request) => request.url.includes('/draft-casefiles'));
  });
  it('propagates initial resolver failure without rendering a successful checker arrival', async () => {
    const harness = await RouterTestingHarness.create();
    const arrival = harness.navigateByUrl(dashboard);
    const rejected = expect(arrival).rejects.toBeDefined();
    await vi.waitFor(() =>
      http
        .expectOne((request) => request.params.get('restrict') !== 'counts')
        .flush({}, { status: 500, statusText: 'Failure' }),
    );
    for (const request of http.match((request) => request.params.has('restrict'))) {
      if (!request.cancelled) request.flush({ count: 0 });
    }
    await rejected;
    expect(harness.routeNativeElement?.querySelector('tbody')).toBeFalsy();
    expect(TestBed.inject(Router).url).toBe('/');
  });
  it('uses exact BU exclusion for both roles without altering inputter creation origin', async () => {
    const user = permittedUser();
    user.business_unit_users[0].permissions.push({ permission_id: 21, permission_name: 'Create' });
    userState.set(user);
    const arrival = RouterTestingHarness.create(dashboard);
    let list: ReturnType<HttpTestingController['expectOne']> | undefined;
    await vi.waitFor(() => {
      list = http.expectOne((request) => !request.params.has('restrict'));
    });
    const requests = [list!, ...http.match((request) => request.url.includes('/draft-casefiles'))];
    expect(requests).toHaveLength(3);
    for (const request of requests) {
      expect(request.request.params.get('business_unit_id')).toBe('44');
      expect(request.request.params.get('not_submitted_by')).toBe('BUU-SYNTHETIC');
      expect(request.request.params.has('submitted_by')).toBe(false);
      if (request.request.params.has('restrict')) request.flush({ count: 0 });
      else
        request.flush({
          count: 2,
          summaries: [
            createCasesDraftSummary({ submitted_by: 'BUU-SYNTHETIC' }),
            createCasesDraftSummary({ draft_casefile_id: 456, submitted_by: 'BUU-OTHER' }),
          ],
        });
    }
    const harness = await arrival;
    await settle(harness);
    expect(harness.routeNativeElement?.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(harness.routeNativeElement?.querySelector('tbody tr')?.getAttribute('data-draft-id')).toBe('456');
    expect(getState(TestBed.inject(CasesCreateCasefileStore))).toEqual(CASES_CREATE_CASEFILE_STATE);
  });
  it('keeps successful list beside independent count failure', async () => {
    const arrival = RouterTestingHarness.create(dashboard);
    await vi.waitFor(() =>
      http
        .expectOne(
          (request) =>
            request.params.get('restrict') === 'counts' && request.params.get('casefile_status') === 'REJECTED',
        )
        .flush({}, { status: 500, statusText: 'Failure' }),
    );
    flushList('SUBMITTED', 1);
    const harness = await arrival;
    await settle(harness);
    expect(harness.routeNativeElement?.querySelector('tbody')).not.toBeNull();
    expect(harness.routeNativeElement?.querySelector('#cases-draft-rejected-count')).toBeNull();
  });
  it.each(['permission', 'flag'])('cancels pending rows and counts on %s loss', async (condition) => {
    const arrival = RouterTestingHarness.create(dashboard);
    await vi.waitFor(() => flushList('SUBMITTED', 1));
    const harness = await arrival;
    await harness.navigateByUrl(dashboard + '#deleted');
    await settle(harness);
    const pending = http.match((request) => request.url.includes('/draft-casefiles'));
    expect(pending.length).toBeGreaterThan(0);
    if (condition === 'flag') featureFlags.set({ [key]: false });
    else {
      const user = permittedUser();
      user.business_unit_users[0].permissions = [];
      userState.set(user);
    }
    await settle(harness);
    expect(pending.every((request) => request.cancelled)).toBe(true);
    expect(TestBed.inject(Router).url).toBe('/access-denied');
    expect(harness.routeNativeElement?.querySelector('tbody')).toBeNull();
  });
});
