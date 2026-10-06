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
    for (const request of http.match((request) => request.url.includes('/draft-casefiles'))) {
      request.flush(request.request.params.has('restrict') ? { count: 2 } : { count: 0, summaries: [] });
    }
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
