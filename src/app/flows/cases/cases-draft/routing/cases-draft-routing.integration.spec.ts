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
import { createCasesDraftSummary } from '../mocks/cases-draft-summary.mock';

@Component({ template: '<p>Denied</p>' })
class DeniedComponent {}
const key = 'release-1c-rm-create-case-files';
const dashboard = '/cases/draft/create-and-manage/tabs';
const details = '/cases/create-casefile/check-case-details/123';
const amendment = '/cases/create-casefile/task-list/123';
const rejections = '/cases/draft/create-and-manage/rejections';
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
        { provide: GlobalStore, useValue: { userState, featureFlags, authenticated } },
        { provide: LaunchDarklyService, useValue: { initializeLaunchDarklyFlags: initializeFlags } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it.each([
    [details, 'Check case details', 'Case details will be available here.', 'govuk-grid-column-two-thirds'],
    [amendment, 'Amend case', 'Case amendment will be available here.', 'govuk-grid-column-two-thirds'],
    [
      rejections,
      'View all rejected cases',
      'The complete list of rejected cases will be available here.',
      'govuk-grid-column-full',
    ],
  ])('allows %s with no local create state or API request', async (url, heading, body, grid) => {
    const harness = await RouterTestingHarness.create(url + '?tab=rejected&page=2&sort=created&direction=descending');
    const element = harness.routeNativeElement!;
    expect(element.querySelector('h1')?.textContent?.trim()).toBe(heading);
    expect(document.title).toBe('OPAL - ' + heading);
    expect(element.textContent).toContain(body);
    expect(element.querySelector('.govuk-grid-row > div')?.className).toBe(grid);
    expect(element.querySelector('h1')?.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(element.querySelector('h1'));
    expect(element.querySelector('a')?.getAttribute('href')).toBe(
      dashboard + '?page=2&sort=created&direction=descending#rejected',
    );
    http.expectNone((request) => request.url.startsWith('/opal-maintenance-service/'));
    expect(getState(TestBed.inject(CasesCreateCasefileStore))).toEqual(CASES_CREATE_CASEFILE_STATE);
    const parent = TestBed.inject(Router).routerState.snapshot.root.firstChild!;
    expect(parent.component).toBeNull();
    expect(parent.firstChild?.data['hidePrimaryNav']).toBe(url !== rejections ? true : undefined);
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
      '/cases/create-casefile/check-case-details/0?tab=approved&page=3&sort=approved&direction=descending',
    );
    expect(harness.routeDebugElement?.componentInstance).toBe(first);
    expect(harness.routeNativeElement?.textContent).toContain('This case could not be opened.');
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toContain(
      'page=3&sort=approved&direction=descending#approved',
    );
    await harness.navigateByUrl(
      '/cases/create-casefile/check-case-details/9007199254740991?tab=wrong&page=0&returnUrl=https://example.test',
    );
    expect(harness.routeNativeElement?.textContent).toContain('Case details will be available here.');
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe(
      dashboard + '?page=1&sort=created&direction=ascending#in-review',
    );
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
          { provide: GlobalStore, useValue: { userState, featureFlags, authenticated } },
          { provide: LaunchDarklyService, useValue: { initializeLaunchDarklyFlags: initializeFlags } },
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
  it('returns through a fresh dashboard owner, retaining sort and clamping a shrinking list', async () => {
    const harness = await RouterTestingHarness.create(
      dashboard + '?page=2&sort=respondent&direction=descending#rejected',
    );
    const original = harness.routeDebugElement?.componentInstance as CasesDraftCreateAndManageTabsComponent;
    http
      .expectOne((request) => request.params.get('casefile_status') === 'REJECTED')
      .flush({
        count: 26,
        summaries: Array.from({ length: 26 }, (_, index) =>
          createCasesDraftSummary({ draft_casefile_id: index + 1, casefile_status: 'REJECTED' }),
        ),
      });
    await harness.fixture.whenStable();
    expect(original.navigation.selection().page).toBe(2);
    await harness.navigateByUrl(details + '?tab=rejected&page=2&sort=respondent&direction=descending');
    expect(original.data.list().status).toBe('idle');
    harness.routeNativeElement!.querySelector('a')!.click();
    await harness.fixture.whenStable();
    http
      .expectOne((request) => request.params.get('casefile_status') === 'REJECTED')
      .flush({ count: 1, summaries: [createCasesDraftSummary({ casefile_status: 'REJECTED' })] });
    harness.detectChanges();
    await harness.fixture.whenStable();
    const current = harness.routeDebugElement?.componentInstance as CasesDraftCreateAndManageTabsComponent;
    expect(current).not.toBe(original);
    expect(current.data).not.toBe(original.data);
    expect(current.navigation.selection()).toEqual({
      tab: 'rejected',
      page: 1,
      sort: 'respondent',
      direction: 'descending',
    });
    expect(TestBed.inject(Router).url).toBe(dashboard + '?page=1&sort=respondent&direction=descending#rejected');
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
  it('redirects only the empty dashboard root and loads the real dashboard provider', async () => {
    const harness = await RouterTestingHarness.create('/cases/draft/create-and-manage');
    expect(TestBed.inject(Router).url).toBe(dashboard);
    http.expectOne((request) => request.params.get('restrict') === 'counts').flush({ count: 0 });
    http
      .expectOne((request) => request.params.get('casefile_status') === 'SUBMITTED,RESUBMITTED')
      .flush({ count: 0, summaries: [] });
    harness.detectChanges();
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.textContent).toContain('You have no cases in review.');
  });
});
