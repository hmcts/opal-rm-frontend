import { Component, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NavigationStart, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appConfig } from '../../../../app.config';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { LaunchDarklyService } from '@hmcts/opal-frontend-common/services/launch-darkly-service';
import { SessionService } from '@hmcts/opal-frontend-common/services/session-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { AppComponent } from '../../../../app.component';
import { CASES_DRAFT_DASHBOARD_MODE } from '../constants/cases-draft-dashboard-mode.token';
import { CasesDraftCheckAndValidateTabsComponent } from '../cases-draft-check-and-validate-tabs/cases-draft-check-and-validate-tabs.component';
import { CasesDraftDashboardService } from './cases-draft-dashboard.service';
import { CasesDraftCreateAndManageViewAllRejectedComponent } from '../cases-draft-create-and-manage-tabs/cases-draft-create-and-manage-view-all-rejected/cases-draft-create-and-manage-view-all-rejected.component';
import { casesDraftAllRejectedResolver } from '../routing/resolvers/cases-draft-all-rejected.resolver';
import { CasesDraftNavigationService } from './cases-draft-navigation.service';

@Component({ template: '<h1>Access denied</h1>' })
class DeniedComponent {}
const dashboard = '/cases/draft/check-and-validate/tabs';
const identity = { userId: 100, businessUnitId: 44 as const, submittedBy: 'BUU-SYNTHETIC' };

describe('checker HTTP boundary through production interceptors and application shell', () => {
  let fixture: ComponentFixture<AppComponent>;
  let http: HttpTestingController;
  let router: Router;
  const logException = vi.fn();
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        // Install the actual production HTTP provider without SSR hydration or app startup.
        appConfig.providers[2],
        provideRouter([
          { path: 'cases/draft/check-and-validate/tabs', component: CasesDraftCheckAndValidateTabsComponent },
          { path: 'access-denied', component: DeniedComponent },
          { path: 'error/:kind', component: DeniedComponent },
        ]),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: CASES_DRAFT_DASHBOARD_MODE, useValue: 'checker' },
        CasesDraftDashboardService,
        CasesDraftNavigationService,
        { provide: AppInsightsService, useValue: { logException, logPageView: vi.fn() } },
        {
          provide: LaunchDarklyService,
          useValue: {
            initializeLaunchDarklyClient: vi.fn(),
            initializeLaunchDarklyFlags: () => Promise.resolve(),
            initializeLaunchDarklyChangeListener: vi.fn(),
          },
        },
        { provide: SessionService, useValue: { getTokenExpiry: () => of({ expiry: null }) } },
      ],
    });
    const store = TestBed.inject(GlobalStore);
    const user = structuredClone(OPAL_USER_STATE_MOCK);
    user.status = 'active';
    user.business_unit_users = [
      {
        business_unit_id: 44,
        business_unit_user_id: identity.submittedBy,
        permissions: [{ permission_id: 22, permission_name: 'Check and Validate Draft Casefiles' }],
      },
    ];
    store.setUserState(user);
    store.setAuthenticated(true);
    store.setFeatureFlags({ 'release-1c-rm-create-case-files': true });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await router.navigateByUrl(dashboard);
    await settle();
    http
      .expectOne((request) => request.url.includes('/draft-casefiles') && !request.params.has('restrict'))
      .flush({ count: 0, summaries: [] });
    for (const request of http.match((request) => request.params.has('restrict'))) request.flush({ count: 2 });
    await settle();
  });
  afterEach(() => http.verify());
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  it.each([
    [403, '/error/permission-denied'],
    [500, '/error/internal-server'],
  ])('preserves common error routing for checker status %s', async (status, destination) => {
    const destinations: string[] = [];
    const subscription = router.events.subscribe((event) => {
      if (event instanceof NavigationStart) destinations.push(event.url);
    });
    await router.navigateByUrl(dashboard + '#deleted');
    await settle();
    for (const request of http.match((request) => request.params.has('restrict'))) request.flush({ count: 2 });
    http
      .expectOne((request) => request.params.get('casefile_status') === 'DELETED')
      .flush({ retriable: false }, { status: Number(status), statusText: 'Failure' });
    await settle();
    subscription.unsubscribe();
    expect(router.url).toBe(destination);
    expect(destinations).not.toContain('/access-denied');
  });
  it('uses the common banner for checker list failures', async () => {
    await router.navigateByUrl(dashboard + '#deleted');
    await settle();
    for (const request of http.match((request) => request.params.has('restrict'))) request.flush({ count: 2 });
    http
      .expectOne((request) => request.params.get('casefile_status') === 'DELETED')
      .flush(
        { title: 'Existing error title', detail: 'Existing error detail' },
        { status: 500, statusText: 'Failure' },
      );
    await settle();
    expect(fixture.nativeElement.textContent).toContain('Existing error detail');
    expect(fixture.nativeElement.textContent).not.toContain('Retry loading');
  });
  it('keeps a list failure visible when badge requests would finish later', async () => {
    await router.navigateByUrl(dashboard + '#deleted');
    await settle();
    const pendingCounts = http.match((request) => request.params.has('restrict'));
    http
      .expectOne((request) => request.params.get('casefile_status') === 'DELETED')
      .flush(
        { title: 'Queue unavailable', detail: 'The deleted queue could not be loaded' },
        { status: 500, statusText: 'Failure' },
      );
    await settle();
    expect(fixture.nativeElement.textContent).toContain('The deleted queue could not be loaded');
    for (const request of pendingCounts) request.flush({ count: 2 });
    await settle();
    expect(fixture.nativeElement.textContent).toContain('The deleted queue could not be loaded');
  });
  it('starts badges only after the current queue loads successfully', async () => {
    await router.navigateByUrl(dashboard + '#deleted');
    await settle();
    http.expectNone((request) => request.params.has('restrict'));
    http.expectOne((request) => request.params.get('casefile_status') === 'DELETED').flush({ count: 0, summaries: [] });
    const counts = http.match((request) => request.params.has('restrict'));
    expect(counts).toHaveLength(2);
    for (const request of counts) request.flush({ count: 3 });
    await settle();
    expect(fixture.nativeElement.textContent).toContain('Rejected 3');
    expect(fixture.nativeElement.textContent).toContain('Failed 3');
    expect(fixture.nativeElement.textContent).toContain('No cases have been deleted in the past 7 days.');
  });
  it('cancels previous queue badges before a new queue fails', async () => {
    await router.navigateByUrl(dashboard + '#deleted');
    await settle();
    http.expectOne((request) => request.params.get('casefile_status') === 'DELETED').flush({ count: 0, summaries: [] });
    const pendingCounts = http.match((request) => request.params.has('restrict'));
    expect(pendingCounts).toHaveLength(2);
    await router.navigateByUrl(dashboard + '#rejected');
    await settle();
    expect(pendingCounts.every((request) => request.cancelled)).toBe(true);
    http.expectNone((request) => request.params.has('restrict'));
    http
      .expectOne((request) => request.params.get('casefile_status') === 'REJECTED')
      .flush(
        { title: 'Queue unavailable', detail: 'The rejected queue could not be loaded' },
        { status: 500, statusText: 'Failure' },
      );
    await settle();
    expect(fixture.nativeElement.textContent).toContain('The rejected queue could not be loaded');
  });
  it('clears a resolved list failure when the next queue loads successfully', async () => {
    await router.navigateByUrl(dashboard + '#deleted');
    await settle();
    http
      .expectOne((request) => request.params.get('casefile_status') === 'DELETED')
      .flush(
        { title: 'Queue unavailable', detail: 'The deleted queue could not be loaded' },
        { status: 500, statusText: 'Failure' },
      );
    await settle();
    expect(fixture.nativeElement.textContent).toContain('The deleted queue could not be loaded');
    await router.navigateByUrl(dashboard + '#rejected');
    await settle();
    http
      .expectOne((request) => request.params.get('casefile_status') === 'REJECTED')
      .flush({ count: 0, summaries: [] });
    const counts = http.match((request) => request.params.has('restrict'));
    expect(counts).toHaveLength(1);
    for (const request of counts) request.flush({ count: 2 });
    await settle();
    expect(fixture.nativeElement.textContent).not.toContain('The deleted queue could not be loaded');
    expect(fixture.nativeElement.textContent).toContain('There are no rejected cases');
  });
  it('preserves the installed common banner behaviour for unmarked requests', async () => {
    TestBed.inject(HttpClient)
      .get('/inputter-request')
      .subscribe({ error: () => undefined });
    http
      .expectOne('/inputter-request')
      .flush(
        { title: 'Existing inputter title', detail: 'Existing inputter detail' },
        { status: 500, statusText: 'Failure' },
      );
    await settle();
    expect(fixture.nativeElement.textContent).toContain('Existing inputter detail');
  });
  it('preserves common non-retriable navigation for unmarked inputter requests', async () => {
    TestBed.inject(HttpClient)
      .get('/inputter-request')
      .subscribe({ error: () => undefined });
    http.expectOne('/inputter-request').flush({ retriable: false }, { status: 500, statusText: 'Failure' });
    await settle();
    expect(router.url).toBe('/error/internal-server');
  });
  it('preserves common retriable conflict completion for unmarked inputter requests', async () => {
    const error = vi.fn();
    const complete = vi.fn();
    TestBed.inject(HttpClient).get('/inputter-request').subscribe({ error, complete });
    http.expectOne('/inputter-request').flush({ retriable: true }, { status: 409, statusText: 'Conflict' });
    await settle();
    expect(error).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalledOnce();
    expect(router.url).toBe(dashboard);
  });
});

const allRejected = '/cases/draft/create-and-manage/rejections';
describe('inputter all-rejected HTTP through production interceptors and application shell', () => {
  let fixture: ComponentFixture<AppComponent>;
  let http: HttpTestingController;
  let router: Router;
  const exclusive = (request: import('@angular/common/http').HttpRequest<unknown>) =>
    request.url === '/opal-maintenance-service/draft-casefiles';
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        appConfig.providers[2],
        provideRouter([
          {
            path: 'cases/draft/create-and-manage/rejections',
            component: CasesDraftCreateAndManageViewAllRejectedComponent,
            resolve: { allRejectedCasefiles: casesDraftAllRejectedResolver },
            runGuardsAndResolvers: 'always',
          },
          { path: 'error/:kind', component: DeniedComponent },
          { path: 'access-denied', component: DeniedComponent },
        ]),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: AppInsightsService, useValue: { logException: vi.fn(), logPageView: vi.fn() } },
        {
          provide: LaunchDarklyService,
          useValue: {
            initializeLaunchDarklyClient: vi.fn(),
            initializeLaunchDarklyFlags: () => Promise.resolve(),
            initializeLaunchDarklyChangeListener: vi.fn(),
          },
        },
        { provide: SessionService, useValue: { getTokenExpiry: () => of({ expiry: null }) } },
      ],
    });
    const store = TestBed.inject(GlobalStore);
    const user = structuredClone(OPAL_USER_STATE_MOCK);
    user.status = 'active';
    user.user_id = 100;
    user.business_unit_users = [
      {
        business_unit_id: 44,
        business_unit_user_id: identity.submittedBy,
        permissions: [{ permission_id: 21, permission_name: 'Create and Manage Draft Casefiles' }],
      },
    ];
    store.setUserState(user);
    store.setAuthenticated(true);
    store.setFeatureFlags({ 'release-1c-rm-create-case-files': true });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });
  afterEach(() => http.verify());
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  async function pendingRequest() {
    let request!: import('@angular/common/http/testing').TestRequest;
    await vi.waitFor(() => {
      request = http.expectOne(exclusive);
    });
    expect(request.request.params.keys().sort()).toEqual(['business_unit_id', 'casefile_status', 'not_submitted_by']);
    expect(request.request.params.get('business_unit_id')).toBe('44');
    expect(request.request.params.get('casefile_status')).toBe('REJECTED');
    expect(request.request.params.get('not_submitted_by')).toBe(identity.submittedBy);
    return request;
  }
  it('keeps recoverable HTTP failure in the common banner without activating the rejected screen', async () => {
    const previous = router.url;
    const arrival = router.navigateByUrl(allRejected);
    const rejected = expect(arrival).rejects.toBeTruthy();
    const pending = await pendingRequest();
    expect(
      fixture.nativeElement.querySelector(
        '#cases-draft-all-rejected-heading, #cases-draft-all-rejected-loading, #cases-draft-all-rejected-retry',
      ),
    ).toBeNull();
    pending.flush(
      { title: 'Synthetic error title', detail: 'Synthetic error detail' },
      { status: 500, statusText: 'Failure' },
    );
    await rejected;
    await settle();
    expect(router.url).toBe(previous);
    expect(fixture.nativeElement.textContent).toContain('Synthetic error detail');
    expect(
      fixture.nativeElement.querySelector(
        '#cases-draft-all-rejected-heading, #cases-draft-all-rejected-failure, #cases-draft-all-rejected-retry, #cases-draft-all-rejected-empty',
      ),
    ).toBeNull();
    http.expectNone(exclusive);
  });
  it('uses generic service reporting for decoder failure without exposing its raw body or activating an empty page', async () => {
    const arrival = router.navigateByUrl(allRejected);
    const rejected = expect(arrival).rejects.toBeTruthy();
    (await pendingRequest()).flush({ count: 1, summaries: 'Synthetic private decoder body' });
    await rejected;
    await settle();
    expect(
      fixture.nativeElement.querySelector(
        '#cases-draft-all-rejected-heading, #cases-draft-all-rejected-retry, #cases-draft-all-rejected-empty',
      ),
    ).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Synthetic private decoder body');
    expect(TestBed.inject(GlobalStore).bannerError().error).toBe(true);
  });
  it('propagates network failure without activating the rejected screen or a fabricated empty result', async () => {
    const previous = router.url;
    const arrival = router.navigateByUrl(allRejected);
    const rejected = expect(arrival).rejects.toBeTruthy();
    (await pendingRequest()).error(new ProgressEvent('error'));
    await rejected;
    await settle();
    expect(router.url).toBe(previous);
    expect(
      fixture.nativeElement.querySelector(
        '#cases-draft-all-rejected-heading, #cases-draft-all-rejected-retry, #cases-draft-all-rejected-empty',
      ),
    ).toBeNull();
  });
  it.each([
    [400, 'internal-server'],
    [401, 'internal-server'],
    [403, 'permission-denied'],
    [404, 'internal-server'],
    [409, 'concurrency-failure'],
    [500, 'internal-server'],
  ])('preserves common non-retriable status %s navigation ownership', async (status, destination) => {
    const destinations: string[] = [];
    const subscription = router.events.subscribe((event) => {
      if (event instanceof NavigationStart) destinations.push(event.url);
    });
    const arrival = router.navigateByUrl(allRejected);
    (await pendingRequest()).flush({ retriable: false }, { status: Number(status), statusText: 'Failure' });
    await arrival.catch(() => false);
    await settle();
    subscription.unsubscribe();
    expect(router.url).toBe('/error/' + destination);
    expect(destinations).toContain('/error/' + destination);
    expect(destinations).not.toContain('/access-denied');
    expect(fixture.nativeElement.querySelector('#cases-draft-all-rejected-retry')).toBeNull();
    expect(fixture.nativeElement.querySelector('#cases-draft-all-rejected-success')).toBeNull();
  });
  it('preserves common retriable conflict completion and reports incomplete resolution globally without activation', async () => {
    const previous = router.url;
    const arrival = router.navigateByUrl(allRejected);
    const cancelled = expect(arrival).resolves.toBe(false);
    (await pendingRequest()).flush({ retriable: true }, { status: 409, statusText: 'Conflict' });
    await cancelled;
    await settle();
    expect(router.url).toBe(previous);
    expect(TestBed.inject(GlobalStore).bannerError().error).toBe(true);
    expect(
      fixture.nativeElement.querySelector(
        '#cases-draft-all-rejected-heading, #cases-draft-all-rejected-retry, #cases-draft-all-rejected-empty',
      ),
    ).toBeNull();
  });
});
