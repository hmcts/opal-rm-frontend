import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { Component, PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routing as commonRouting } from '@hmcts/opal-frontend-common/pages';
import { AuthService } from '@hmcts/opal-frontend-common/services/auth-service';
import { LaunchDarklyService } from '@hmcts/opal-frontend-common/services/launch-darkly-service';
import { OpalUserService } from '@hmcts/opal-frontend-common/services/opal-user-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { of } from 'rxjs';
import { routing } from '@routing/pages/pages.routes';
import {
  RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK,
  RESPONDENT_ACCOUNT_ETAG,
  RESPONDENT_ACCOUNT_HEADER_MOCK,
} from '../../services/opal-maintenance-service/mocks/opal-maintenance-respondent-account.mock';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
import { RESPONDENT_ACCOUNT_ROUTE } from './cases-account-respondent-navigation';

@Component({ selector: 'app-test-respondent-access-denied', template: 'Access denied' })
class AccessDeniedPage {}

@Component({ selector: 'app-test-respondent-account-created', template: 'Account created' })
class AccountCreatedPage {}

describe('Respondent account routes', () => {
  const key = 'release-1c-rm-account-details';
  const root = '/cases/account/respondent/11748';
  const destinations = ['details', 'note/add', 'case-type/change', 'comment/change'];
  const flags = signal<Record<string, boolean>>({});
  const initializeFlags = vi.fn<() => Promise<void>>();
  const initializeClient = vi.fn();
  const authenticated = vi.fn(() => of(true));
  const userState = vi.fn(() => of({ status: 'active' }));
  const getHeader = vi.fn(() => of({ body: RESPONDENT_ACCOUNT_HEADER_MOCK, etag: RESPONDENT_ACCOUNT_ETAG }));
  const getSummary = vi.fn(() => of({ body: RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, etag: RESPONDENT_ACCOUNT_ETAG }));

  beforeEach(() => {
    flags.set({});
    initializeFlags.mockReset().mockResolvedValue(undefined);
    initializeClient.mockClear();
    authenticated.mockReset().mockReturnValue(of(true));
    userState.mockReset().mockReturnValue(of({ status: 'active' }));
    getHeader.mockClear();
    getSummary.mockClear();

    const account = routing.find((route) => route.path === RESPONDENT_ACCOUNT_ROUTE.slice(1) + '/:respondentAccountId');
    const error = commonRouting.find((route) => route.path === 'error/internal-server')!;
    TestBed.configureTestingModule({
      providers: [
        provideLocationMocks(),
        { provide: AuthService, useValue: { checkAuthenticated: authenticated } },
        { provide: OpalUserService, useValue: { getLoggedInUserState: userState } },
        { provide: GlobalStore, useValue: { featureFlags: flags } },
        {
          provide: LaunchDarklyService,
          useValue: {
            initializeLaunchDarklyFlags: initializeFlags,
            initializeLaunchDarklyClient: initializeClient,
          },
        },
        {
          provide: OpalMaintenanceService,
          useValue: {
            getRespondentAccountHeaderSummary: getHeader,
            getRespondentAccountAtAGlance: getSummary,
          },
        },
        provideRouter([
          ...(account ? [account] : []),
          { path: 'access-denied', component: AccessDeniedPage },
          { path: 'account-created', component: AccountCreatedPage },
          error,
        ]),
      ],
    });
  });

  function expectNoAccountReads(): void {
    expect(getHeader).not.toHaveBeenCalled();
    expect(getSummary).not.toHaveBeenCalled();
  }

  it.each(destinations)('blocks direct %s when the flag is false or unresolved', async (child) => {
    const harness = await RouterTestingHarness.create();
    for (const value of [false, undefined]) {
      flags.set(value === undefined ? {} : { [key]: value });
      await harness.navigateByUrl(root + '/' + child);
      expect(TestBed.inject(Router).url).toBe('/access-denied');
      expectNoAccountReads();
    }
  });

  it('cancels unresolved SSR entry before the SDK or account reads start', async () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    await RouterTestingHarness.create();
    const router = TestBed.inject(Router);
    expect(await router.navigateByUrl(root + '/details#authority')).toBe(false);
    expect(router.url).toBe('/');
    expect(initializeFlags).not.toHaveBeenCalled();
    expect(initializeClient).not.toHaveBeenCalled();
    expectNoAccountReads();
  });

  it.each([true, false])('uses the resolved SSR flag %s without starting the SDK', async (enabled) => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    flags.set({ [key]: enabled });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(root + '/note/add');
    expect(TestBed.inject(Router).url).toBe(enabled ? root + '/note/add' : '/access-denied');
    expect(initializeFlags).not.toHaveBeenCalled();
    expect(initializeClient).not.toHaveBeenCalled();
    expectNoAccountReads();
  });

  it.each([
    ['', 'at-a-glance'],
    ['#respondent', 'respondent'],
    ['#authority', 'authority'],
    ['#not-a-tab', 'at-a-glance'],
  ])('opens details with %s and selects the %s panel', async (fragment, tab) => {
    flags.set({ [key]: true });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(root + '/details' + fragment);
    const page = harness.routeNativeElement;
    expect(page?.querySelector('a[aria-current="page"]')?.id).toBe('respondent-account-tab-' + tab);
    expect(page?.querySelector('#respondent-account-panel-' + tab)).toBeTruthy();
    expect(getHeader).toHaveBeenCalledExactlyOnceWith(11748);
    expect(getSummary).toHaveBeenCalledExactlyOnceWith(11748);
  });

  it('opens an action and builds Cancel from the account and validated origin', async () => {
    flags.set({ [key]: true });
    const harness = await RouterTestingHarness.create();
    const router = TestBed.inject(Router);
    await router.navigateByUrl(root + '/note/add', { info: { returnTab: 'authority' } });
    harness.detectChanges();
    await harness.fixture.whenStable();
    const cancel = () => harness.routeNativeElement?.querySelector('#respondent-account-placeholder-cancel');
    expect(cancel()?.getAttribute('href')).toBe(root + '/details#authority');
    expect(document.activeElement).toBe(harness.routeNativeElement?.querySelector('h1'));

    await router.navigateByUrl(root + '/case-type/change', { info: { returnTab: 'invalid' } });
    harness.detectChanges();
    expect(cancel()?.getAttribute('href')).toBe(root + '/details');

    await harness.navigateByUrl(root + '/comment/change');
    expect(cancel()?.getAttribute('href')).toBe(root + '/details');
    expectNoAccountReads();
  });

  it.each([
    ['note/add', '#authority', '#respondent-account-add-note', 'Add account note'],
    ['case-type/change', '#authority', '#respondent-account-change-case-type', 'Change case type'],
    ['comment/change', '', '#respondent-account-change-comment', 'Change comment'],
  ])('restores the action context on browser Back and Forward for %s', async (child, origin, link, heading) => {
    flags.set({ [key]: true });
    const detailsUrl = root + '/details' + origin;
    const actionUrl = root + '/' + child;
    const harness = await RouterTestingHarness.create(detailsUrl);
    await harness.fixture.whenStable();
    harness.detectChanges();
    const router = TestBed.inject(Router);
    const location = TestBed.inject(Location);
    router.setUpLocationChangeListener();

    const action = harness.routeNativeElement?.querySelector<HTMLAnchorElement>(link);
    expect(action?.getAttribute('href')).toBe(actionUrl);
    action!.click();
    await vi.waitFor(() => expect(router.url).toBe(actionUrl));
    harness.detectChanges();
    const cancel = () =>
      harness.routeNativeElement?.querySelector<HTMLAnchorElement>('#respondent-account-placeholder-cancel');
    expect(cancel()?.getAttribute('href')).toBe(detailsUrl);

    location.back();
    await vi.waitFor(() => expect(router.url).toBe(detailsUrl));
    location.forward();
    await vi.waitFor(() => expect(router.url).toBe(actionUrl));
    harness.detectChanges();
    expect(cancel()?.getAttribute('href')).toBe(detailsUrl);
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe(heading);

    cancel()!.click();
    await vi.waitFor(() => expect(router.url).toBe(detailsUrl));
    location.back();
    await vi.waitFor(() => expect(router.url).toBe(actionUrl));
    harness.detectChanges();
    expect(cancel()?.getAttribute('href')).toBe(detailsUrl);
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe(heading);
  });

  it('uses the bare details URL on initial navigation with an existing browser history state', async () => {
    flags.set({ [key]: true });
    const actionUrl = root + '/comment/change';
    TestBed.inject(Location).replaceState(actionUrl, '', { returnTab: 'authority', comment: 'add' });
    const harness = await RouterTestingHarness.create();
    const router = TestBed.inject(Router);
    router.initialNavigation();
    await vi.waitFor(() => expect(router.url).toBe(actionUrl));
    harness.detectChanges();

    const cancel = harness.routeNativeElement?.querySelector('#respondent-account-placeholder-cancel');
    expect(cancel?.getAttribute('href')).toBe(root + '/details');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Add or change comment');
    expectNoAccountReads();
  });

  it('uses the current account ID when reusing an action route', async () => {
    flags.set({ [key]: true });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(root + '/note/add');
    await harness.navigateByUrl('/cases/account/respondent/11749/note/add');
    const cancel = harness.routeNativeElement?.querySelector('#respondent-account-placeholder-cancel');
    expect(cancel?.getAttribute('href')).toBe('/cases/account/respondent/11749/details');
    expectNoAccountReads();
  });

  it.each([
    ['add', 'Add comment'],
    ['change', 'Change comment'],
  ])('uses the %s action as the comment heading and browser title', async (comment, heading) => {
    flags.set({ [key]: true });
    const harness = await RouterTestingHarness.create();
    await TestBed.inject(Router).navigateByUrl(root + '/comment/change', {
      info: { returnTab: 'respondent', comment },
    });
    harness.detectChanges();
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe(heading);
    expect(TestBed.inject(Title).getTitle()).toBe('OPAL - ' + heading);
  });

  it('uses the application Error route for an invalid ID', async () => {
    flags.set({ [key]: true });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/cases/account/respondent/invalid/details');
    expect(TestBed.inject(Router).url).toBe('/error/internal-server');
    expectNoAccountReads();
  });

  it('checks the release again when navigating from details to an action', async () => {
    flags.set({ [key]: true });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(root + '/details');
    expect(TestBed.inject(Router).url).toBe(root + '/details');
    getHeader.mockClear();
    getSummary.mockClear();

    flags.set({ [key]: false });
    await harness.navigateByUrl(root + '/note/add');
    expect(TestBed.inject(Router).url).toBe('/access-denied');
    expectNoAccountReads();
  });

  it('redirects an authenticated inactive user before account reads', async () => {
    flags.set({ [key]: true });
    userState.mockReturnValue(of({ status: 'created' }));
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(root + '/details');
    expect(TestBed.inject(Router).url).toBe('/account-created');
    expectNoAccountReads();
  });

  it('cancels an unauthenticated navigation before account reads', async () => {
    flags.set({ [key]: true });
    authenticated.mockReturnValue(of(false));
    await RouterTestingHarness.create();
    const router = TestBed.inject(Router);
    expect(await router.navigateByUrl(root + '/details')).toBe(false);
    expect(router.url).toBe('/');
    expectNoAccountReads();
  });
});
