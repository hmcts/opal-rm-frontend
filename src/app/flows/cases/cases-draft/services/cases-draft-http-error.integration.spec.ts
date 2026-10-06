import { Component, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NavigationStart, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applicationHttpErrorInterceptor } from '../../../../interceptors/application-http-error.interceptor';
import { httpRetryInterceptor } from '@hmcts/opal-frontend-common/interceptors/http-retry';
import { contentDigestInterceptor } from '@hmcts/opal-frontend-common/interceptors/content-digest';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { LaunchDarklyService } from '@hmcts/opal-frontend-common/services/launch-darkly-service';
import { SessionService } from '@hmcts/opal-frontend-common/services/session-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { AppComponent } from '../../../../app.component';
import { CASES_DRAFT_DASHBOARD_MODE } from '../constants/cases-draft-dashboard-mode.token';
import { CasesDraftCreateAndManageTabsComponent } from '../cases-draft-create-and-manage-tabs/cases-draft-create-and-manage-tabs.component';
import { CasesDraftDashboardService } from './cases-draft-dashboard.service';
import { CasesDraftCheckerLoadService } from './cases-draft-checker-load.service';
import { CasesDraftNavigationService } from './cases-draft-navigation.service';

@Component({ template: '<h1>Access denied</h1>' })
class DeniedComponent {}
const dashboard = '/cases/draft/check-and-validate/tabs';
const identity = { userId: 100, businessUnitId: 44 as const, submittedBy: 'BUU-SYNTHETIC' };

describe('checker HTTP boundary through production interceptors and application shell', () => {
  let fixture: ComponentFixture<AppComponent>;
  let http: HttpTestingController;
  let router: Router;
  let owner: CasesDraftCheckerLoadService;
  const logException = vi.fn();
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([
          { path: 'cases/draft/check-and-validate/tabs', component: CasesDraftCreateAndManageTabsComponent },
          { path: 'access-denied', component: DeniedComponent },
          { path: 'error/:kind', component: DeniedComponent },
        ]),
        provideHttpClient(
          withInterceptors([applicationHttpErrorInterceptor, contentDigestInterceptor, httpRetryInterceptor]),
        ),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: CASES_DRAFT_DASHBOARD_MODE, useValue: 'checker' },
        CasesDraftDashboardService,
        CasesDraftCheckerLoadService,
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
    owner = TestBed.inject(CasesDraftCheckerLoadService);
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
  it.each(['<unsafe-reference>', 'x'.repeat(101), 'safe-reference_42'])(
    'keeps a later list failure generic with bounded reference %s',
    async (operationId) => {
      await router.navigateByUrl(dashboard + '#deleted');
      await settle();
      http
        .expectOne((request) => request.params.get('casefile_status') === 'DELETED')
        .flush(
          {
            title: 'Synthetic provider title',
            detail: 'Synthetic provider detail',
            operation_id: operationId,
          },
          { status: 503, statusText: 'Unavailable' },
        );
      await settle();
      const text = fixture.nativeElement.textContent;
      expect(text).not.toContain('Synthetic provider');
      expect(text).toContain('There was a problem');
      expect(text.includes(operationId)).toBe(operationId === 'safe-reference_42');
      expect(owner.listState()?.status).toBe('failure');
      expect(router.url).toBe(dashboard + '#deleted');
    },
  );
  it('keeps a later independent count retry generic after other requests settle', async () => {
    owner.retryCount('failed');
    http
      .expectOne((request) => request.params.get('restrict') === 'counts')
      .flush(
        {
          title: 'Synthetic provider title',
          detail: 'Synthetic provider detail',
          operation_id: '<unsafe-reference>',
        },
        { status: 500, statusText: 'Failure' },
      );
    await settle();
    expect(fixture.nativeElement.textContent).not.toContain('Synthetic provider');
    expect(fixture.nativeElement.textContent).not.toContain('<unsafe-reference>');
    expect(owner.counts().failed.status).toBe('failure');
  });
  it.each([500, 409])('retains local Retry for non-access status %s even retriable false', async (status) => {
    owner.retryList();
    http
      .expectOne((request) => !request.params.has('restrict'))
      .flush({ retriable: false }, { status, statusText: 'Failure' });
    await settle();
    expect(router.url).toBe(dashboard);
    expect(owner.listState()?.status).toBe('failure');
    expect(fixture.nativeElement.textContent).toContain('Retry');
  });
  it('delivers retriable 409 to the owner as an HTTP failure', async () => {
    owner.retryList();
    http
      .expectOne((request) => !request.params.has('restrict'))
      .flush({ operation_id: 'conflict-42' }, { status: 409, statusText: 'Conflict' });
    await settle();
    expect(owner.listState()).toMatchObject({ status: 'failure', correlationReference: 'conflict-42' });
  });
  it.each([401, 403])('uses one terminal access-denied navigation for %s', async (status) => {
    const destinations: string[] = [];
    const subscription = router.events.subscribe((event) => {
      if (event instanceof NavigationStart) destinations.push(event.url);
    });
    owner.retryList();
    http
      .expectOne((request) => !request.params.has('restrict'))
      .flush({ retriable: false }, { status, statusText: 'Denied' });
    await settle();
    subscription.unsubscribe();
    expect(destinations).toEqual(['/access-denied']);
    expect(owner.denied()).toBe(true);
    owner.retryList();
    owner.retryCount('failed');
    http.expectNone((request) => request.url.includes('/draft-casefiles'));
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
});
