import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, provideRouter, Router, withRouterConfig } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { contentDigestInterceptor } from '@hmcts/opal-frontend-common/interceptors/content-digest';
import { httpErrorInterceptor } from '@hmcts/opal-frontend-common/interceptors/http-error';
import { httpRetryInterceptor } from '@hmcts/opal-frontend-common/interceptors/http-retry';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { AuthService } from '@hmcts/opal-frontend-common/services/auth-service';
import { OpalUserService } from '@hmcts/opal-frontend-common/services/opal-user-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { filter, firstValueFrom, of } from 'rxjs';
import {
  RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK,
  RESPONDENT_ACCOUNT_HEADER_MOCK,
} from '../../services/opal-maintenance-service/mocks/opal-maintenance-respondent-account.mock';
import { casesAccountRespondentRoutes } from './cases-account-respondent.routes';

@Component({ selector: 'app-test-respondent-permission-denied', template: '<h1>Permission denied</h1>' })
class PermissionDeniedPage {}

describe('Respondent account reads through the common HTTP interceptors', () => {
  const details = '/cases/account/respondent/11748/details';
  const reads = '/opal-maintenance-service/respondent-accounts/11748';
  const headerUrl = reads + '/header-summary';
  const summaryUrl = reads + '/at-a-glance';

  async function openDetails(loadError = async () => PermissionDeniedPage) {
    TestBed.configureTestingModule({
      providers: [
        provideLocationMocks(),
        provideRouter(
          [...casesAccountRespondentRoutes, { path: 'error/permission-denied', loadComponent: loadError }],
          withRouterConfig({ canceledNavigationResolution: 'computed' }),
        ),
        provideHttpClient(withInterceptors([httpErrorInterceptor, contentDigestInterceptor, httpRetryInterceptor])),
        provideHttpClientTesting(),
        { provide: AppInsightsService, useValue: { logException: vi.fn() } },
        { provide: AuthService, useValue: { checkAuthenticated: () => of(true) } },
        { provide: OpalUserService, useValue: { getLoggedInUserState: () => of({ status: 'active' }) } },
      ],
    });
    const global = TestBed.inject(GlobalStore);
    global.setFeatureFlags({ 'release-1c-rm-account-details': true });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(details);
    return { harness, global, http: TestBed.inject(HttpTestingController) };
  }

  async function openStaleAccount() {
    const { harness, http } = await openDetails();
    http.expectOne(headerUrl).flush(RESPONDENT_ACCOUNT_HEADER_MOCK, { headers: { ETag: '"v1"' } });
    http.expectOne(summaryUrl).flush(RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, { headers: { ETag: '"v2"' } });
    TestBed.tick();
    const page = harness.routeNativeElement!;
    const refresh = page.querySelector<HTMLButtonElement>('#respondent-account-refresh')!;
    refresh.focus();
    refresh.click();
    TestBed.tick();
    return { http, page, refresh };
  }

  it('focuses the confirmation only after both Refresh reads settle and restores heading focus on Dismiss', async () => {
    const { http, page, refresh } = await openStaleAccount();
    expect(refresh.getAttribute('aria-disabled')).toBe('true');
    refresh.click();
    http.expectOne(headerUrl).flush(RESPONDENT_ACCOUNT_HEADER_MOCK, { headers: { ETag: '"v3"' } });
    TestBed.tick();
    expect(document.activeElement).toBe(refresh);
    expect(page.querySelector('#respondent-account-freshness-confirmation')).toBeNull();

    http.expectOne(summaryUrl).flush(RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, { headers: { ETag: '"v3"' } });
    TestBed.tick();
    const confirmation = page.querySelector<HTMLElement>('#respondent-account-freshness-confirmation')!;
    expect(document.activeElement).toBe(confirmation);
    const dismiss = confirmation.querySelector<HTMLButtonElement>('button')!;
    dismiss.focus();
    dismiss.click();
    TestBed.tick();
    expect(confirmation.isConnected).toBe(false);
    expect(document.activeElement).toBe(page.querySelector('h1'));
    http.verify();
  });

  it('restores Refresh focus after an incomplete pair without taking focus from another control', async () => {
    const { http, page, refresh } = await openStaleAccount();
    refresh.blur();
    http.expectOne(headerUrl).flush(RESPONDENT_ACCOUNT_HEADER_MOCK, { headers: { ETag: '"v3"' } });
    http.expectOne(summaryUrl).flush(RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK);
    TestBed.tick();
    expect(document.activeElement).toBe(refresh);

    refresh.click();
    TestBed.tick();
    const tab = page.querySelector<HTMLAnchorElement>('#respondent-account-tab-authority')!;
    tab.focus();
    http.expectOne(headerUrl).flush(RESPONDENT_ACCOUNT_HEADER_MOCK, { headers: { ETag: '"v4"' } });
    http.expectOne(summaryUrl).flush(RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, { headers: { ETag: '"v4"' } });
    TestBed.tick();
    expect(page.querySelector('#respondent-account-freshness-confirmation')).not.toBeNull();
    expect(document.activeElement).toBe(tab);
    http.verify();
  });

  it('returns focus to Retry after a repeated read failure and to the account heading after recovery', async () => {
    const { harness, http } = await openDetails();
    const page = harness.routeNativeElement!;
    http.expectOne(headerUrl).flush(RESPONDENT_ACCOUNT_HEADER_MOCK);
    http.expectOne(summaryUrl).flush(null, { status: 204, statusText: 'No content' });
    TestBed.tick();

    const retry = () => page.querySelector<HTMLButtonElement>('#respondent-account-retry-summary')!;
    const firstRetry = retry();
    firstRetry.focus();
    firstRetry.click();
    // Both clicks can reach the same control before the next render removes it.
    firstRetry.click();
    TestBed.tick();
    expect(page.querySelector('#respondent-account-retry-summary')).toBeNull();
    http.expectOne(summaryUrl).flush(null, { status: 204, statusText: 'No content' });
    TestBed.tick();
    expect(document.activeElement).toBe(retry());

    retry().click();
    TestBed.tick();
    http.expectOne(summaryUrl).flush(RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK);
    TestBed.tick();
    expect(page.querySelector('#respondent-account-retry-summary')).toBeNull();
    expect(document.activeElement).toBe(page.querySelector('h1'));
    http.verify();
  });

  it('lets the shared permission-denied redirect finish when a tab is clicked as the read fails', async () => {
    let finishErrorLoad!: (page: typeof PermissionDeniedPage) => void;
    const errorPage = new Promise<typeof PermissionDeniedPage>((resolve) => {
      finishErrorLoad = resolve;
    });
    const { harness, http } = await openDetails(() => errorPage);
    const router = TestBed.inject(Router);
    const page = harness.routeNativeElement!;
    http.expectOne(headerUrl).flush(RESPONDENT_ACCOUNT_HEADER_MOCK, { headers: { ETag: '"v1"' } });
    http.expectOne(summaryUrl).flush(RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, { headers: { ETag: '"v2"' } });
    harness.detectChanges();

    page.querySelector<HTMLButtonElement>('#respondent-account-refresh')!.click();
    const respondentTab = page.querySelector<HTMLAnchorElement>('#respondent-account-tab-respondent')!;
    const pendingHeader = http.expectOne(headerUrl);
    const navigation = firstValueFrom(router.events.pipe(filter((event) => event instanceof NavigationEnd)));
    http.expectOne(summaryUrl).flush({ retriable: false }, { status: 403, statusText: 'Forbidden' });
    // Click the existing link before Angular renders the terminal read state.
    expect(respondentTab.isConnected).toBe(true);
    respondentTab.click();
    harness.detectChanges();
    const textWhileRedirecting = page.textContent;
    finishErrorLoad(PermissionDeniedPage);
    await navigation;
    harness.detectChanges();

    expect(router.url).toBe('/error/permission-denied');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Permission denied');
    expect(pendingHeader.cancelled).toBe(true);
    expect(textWhileRedirecting).not.toContain('Loading account details');
    expect(textWhileRedirecting).not.toContain(RESPONDENT_ACCOUNT_HEADER_MOCK.accountNumber);
    expect(textWhileRedirecting).not.toContain('Account details are unavailable');
    http.expectNone((request) => request.url.startsWith(reads));
    http.verify();
  });

  it.each([
    { status: 503, statusText: 'Service unavailable', attempts: 2 },
    { status: 409, statusText: 'Conflict', attempts: 1 },
  ])(
    'keeps the $status error code beside Retry after the sibling succeeds',
    async ({ status, statusText, attempts }) => {
      const { harness, global, http } = await openDetails();
      const pendingHeader = http.expectOne(headerUrl);
      const problem = {
        retriable: true,
        title: 'Summary unavailable',
        detail: 'Try again or contact the service desk.',
        operation_id: 'reference-11748',
      };
      for (let attempt = 0; attempt < attempts; attempt++) {
        http.expectOne(summaryUrl).flush(problem, { status, statusText });
      }
      expect(global.bannerError().error).toBeNull();
      pendingHeader.flush(RESPONDENT_ACCOUNT_HEADER_MOCK);
      harness.detectChanges();

      const alert = harness.routeNativeElement?.querySelector('#respondent-account-read-error-summary');
      expect(alert?.textContent).toContain(problem.title);
      expect(alert?.textContent).toContain(problem.detail);
      expect(alert?.textContent).toContain(`Error code: ${problem.operation_id}`);
      alert?.querySelector<HTMLButtonElement>('button')?.click();
      http.expectOne(summaryUrl).flush(RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK);
      http.expectNone(headerUrl);
      http.verify();
    },
  );
});
