import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationCancel, NavigationError, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import { EMPTY, Observable, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IOpalMaintenanceResultDetail } from '../../../../services/opal-maintenance-service/interfaces/opal-maintenance-result-detail.interface';
import { OPAL_MAINTENANCE_RESULT_DETAILS_MOCK } from '../../../../services/opal-maintenance-service/mocks/opal-maintenance-result-details.mock';
import { OpalMaintenanceService } from '../../../../services/opal-maintenance-service/opal-maintenance.service';
import type { ICasesCreateCasefileOrderTermField } from '../../../cases-create-casefile-order-terms-input/interfaces/cases-create-casefile-order-term-field.interface';
import type { ICasesCreateCasefileOrderTermPage } from '../../../cases-create-casefile-order-terms-input/interfaces/cases-create-casefile-order-term-page.interface';
import { CasesCreateCasefileOrderTermLookupsService } from '../../../cases-create-casefile-order-terms-input/services/cases-create-casefile-order-term-lookups.service';
import { mapOrderTermParameters } from '../../../cases-create-casefile-order-terms-input/utils/cases-create-casefile-order-term-metadata';
import { CasesCreateCasefileStore } from '../../../stores/cases-create-casefile.store';
import { fetchCasesCreateCasefileOrderTermResolver } from './fetch-cases-create-casefile-order-term.resolver';

@Component({ selector: 'app-test-selection', template: '<h1>Selection</h1>' })
class TestSelectionComponent {}

@Component({ selector: 'app-test-input', template: '<h1>Input</h1>' })
class TestInputComponent {
  public readonly page = inject(ActivatedRoute).snapshot.data['orderTerm'] as ICasesCreateCasefileOrderTermPage;
}

const matDetail = (): IOpalMaintenanceResultDetail => structuredClone(OPAL_MAINTENANCE_RESULT_DETAILS_MOCK['MAT']);

const choiceDetail = (mandatory: boolean): IOpalMaintenanceResultDetail => ({
  result_id: 'MAT',
  result_title: 'Lookup term',
  active: true,
  order_term: true,
  result_parameters: JSON.stringify([
    {
      name: 'choice',
      prompt: 'Choice',
      type: 'select',
      mandatory,
      language_dependent: false,
      options: [{ value: 'a', label: 'A' }],
    },
  ]),
});

describe('fetchCasesCreateCasefileOrderTermResolver', () => {
  let router: Router;
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  let detailsSource: Observable<IOpalMaintenanceResultDetail | null>;
  let lookupSource: Observable<ICasesCreateCasefileOrderTermField[]> | null;
  let getResult: ReturnType<typeof vi.fn>;
  let resolveLookups: ReturnType<typeof vi.fn>;
  let setBannerError: ReturnType<typeof vi.fn>;
  let routeEvents: (NavigationCancel | NavigationError)[];
  let draftSnapshot: ReturnType<InstanceType<typeof CasesCreateCasefileStore>['orderTermDraft']>;

  const configure = async () => {
    getResult = vi.fn(() => detailsSource);
    resolveLookups = vi.fn((fields: ICasesCreateCasefileOrderTermField[]) => lookupSource ?? of(fields));
    setBannerError = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        CasesCreateCasefileStore,
        { provide: OpalMaintenanceService, useValue: { getResult } },
        { provide: CasesCreateCasefileOrderTermLookupsService, useValue: { resolve: resolveLookups } },
        { provide: GlobalStore, useValue: { setBannerError } },
        provideRouter([
          { path: 'selection', component: TestSelectionComponent },
          {
            path: 'input/:resultId',
            component: TestInputComponent,
            resolve: { orderTerm: fetchCasesCreateCasefileOrderTermResolver },
          },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create('/selection');
    TestBed.inject(Title).setTitle('Selection');
    router = TestBed.inject(Router);
    store = TestBed.inject(CasesCreateCasefileStore);
    routeEvents = [];
    router.events.subscribe((event) => {
      if (event instanceof NavigationCancel || event instanceof NavigationError) routeEvents.push(event);
    });
    store.setOrderDetails({
      applicationId: 1,
      court: null,
      dateOrderMade: null,
      paymentFrequency: 'Monthly',
      dateArrearsLastUpdated: '2026-09-17',
    });
    store.setPendingOrderTermResultId('MAT');
    store.prepareOrderTermDraft({
      resultId: 'MAT',
      title: 'Maintenance',
      fields: mapOrderTermParameters(matDetail().result_parameters),
    });
    store.updateOrderTermDraft({ amount: '12.34', expiry_date: '', arrears: '' }, true);
    draftSnapshot = structuredClone(store.orderTermDraft());
    return harness;
  };

  const expectRejectedNavigation = async () => {
    await expect(router.navigateByUrl('/input/MAT')).resolves.toBe(false);
    expect(router.url).toBe('/selection');
    expect(routeEvents.filter((event) => event instanceof NavigationCancel)).toHaveLength(1);
    expect(routeEvents.filter((event) => event instanceof NavigationError)).toHaveLength(0);
    expect(store.orderTermDraft()).toEqual(draftSnapshot);
    expect(TestBed.inject(Title).getTitle()).toBe('Selection');
  };

  beforeEach(() => {
    detailsSource = of(matDetail());
    lookupSource = null;
  });

  it('waits for both detail and lookup data before activating the route', async () => {
    const details = new Subject<IOpalMaintenanceResultDetail | null>();
    const lookups = new Subject<ICasesCreateCasefileOrderTermField[]>();
    detailsSource = details;
    lookupSource = lookups;
    await configure();

    const navigation = router.navigateByUrl('/input/MAT');
    await vi.waitFor(() => expect(getResult).toHaveBeenCalledOnce());
    expect(router.url).toBe('/selection');

    details.next(matDetail());
    await vi.waitFor(() => expect(resolveLookups).toHaveBeenCalledOnce());
    expect(router.url).toBe('/selection');

    const fields = mapOrderTermParameters(matDetail().result_parameters);
    lookups.next(fields);
    expect(await navigation).toBe(true);
    expect(router.url).toBe('/input/MAT');
  });

  it('returns complete route data for a result that requires no lookup options', async () => {
    const harness = await configure();

    const component = await harness.navigateByUrl('/input/MAT', TestInputComponent);

    expect(component.page).toEqual({
      resultId: 'MAT',
      title: 'Maintenance',
      fields: mapOrderTermParameters(matDetail().result_parameters),
    });
    expect(resolveLookups).toHaveBeenCalledOnce();
    expect(setBannerError).not.toHaveBeenCalled();
  });

  it.each([
    ['null detail', of(null)],
    ['empty detail response', EMPTY],
  ])('cancels activation for a %s', async (_name, source) => {
    detailsSource = source;
    await configure();

    await expectRejectedNavigation();
    expect(setBannerError).toHaveBeenCalledOnce();
  });

  it.each([
    ['a mismatched result ID', { result_id: 'MCHILD' }],
    ['an inactive result', { active: false }],
    ['a non-order-term result', { order_term: false }],
    ['a blank title', { result_title: '   ' }],
    ['nonstring parameters', { result_parameters: [] }],
  ])('cancels activation for %s', async (_name, overrides) => {
    detailsSource = of({ ...matDetail(), ...overrides } as IOpalMaintenanceResultDetail);
    await configure();

    await expectRejectedNavigation();
    expect(resolveLookups).not.toHaveBeenCalled();
    expect(setBannerError).toHaveBeenCalledOnce();
  });

  it.each([
    ['malformed metadata', '['],
    [
      'unsupported metadata',
      JSON.stringify([{ name: 'x', prompt: 'X', type: 'unknown', mandatory: true, language_dependent: false }]),
    ],
  ])('cancels activation for %s', async (_name, resultParameters) => {
    detailsSource = of({ ...matDetail(), result_parameters: resultParameters });
    await configure();

    await expectRejectedNavigation();
    expect(resolveLookups).not.toHaveBeenCalled();
    expect(setBannerError).toHaveBeenCalledOnce();
  });

  it.each([null, 'Every decade'])('cancels activation when inherited frequency is %s', async (frequency) => {
    await configure();
    if (frequency === null) {
      store.resetStore();
      store.setPendingOrderTermResultId('MAT');
      store.prepareOrderTermDraft({
        resultId: 'MAT',
        title: 'Maintenance',
        fields: mapOrderTermParameters(matDetail().result_parameters),
      });
      store.updateOrderTermDraft({ amount: '12.34', expiry_date: '', arrears: '' }, true);
      draftSnapshot = structuredClone(store.orderTermDraft());
    } else {
      store.setOrderDetails({
        ...store.orderDetails()!,
        paymentFrequency: frequency as 'Monthly',
      });
    }

    await expectRejectedNavigation();
    expect(setBannerError).toHaveBeenCalledOnce();
  });

  it.each([true, false])('rejects empty resolved choices when mandatory is %s', async (mandatory) => {
    detailsSource = of(choiceDetail(mandatory));
    lookupSource = of([
      {
        ...mapOrderTermParameters(choiceDetail(mandatory).result_parameters)[0],
        options: [],
      },
    ]);
    await configure();

    await expectRejectedNavigation();
    expect(setBannerError).toHaveBeenCalledOnce();
  });

  it.each([
    ['an empty lookup response', EMPTY],
    ['a failed lookup', throwError(() => new Error('Lookup unavailable'))],
  ])('cancels activation for %s', async (_name, source) => {
    lookupSource = source;
    await configure();

    await expectRejectedNavigation();
    expect(setBannerError).toHaveBeenCalledOnce();
  });

  it('does not duplicate the shared banner for an HTTP failure and settles navigation', async () => {
    detailsSource = throwError(() => new HttpErrorResponse({ status: 503, statusText: 'Unavailable' }));
    await configure();

    await expectRejectedNavigation();
    expect(setBannerError).not.toHaveBeenCalled();
  });

  it('allows a fresh successful navigation after a failed attempt', async () => {
    await configure();
    getResult.mockReturnValueOnce(of(null)).mockReturnValueOnce(of(matDetail()));

    await expectRejectedNavigation();
    routeEvents = [];

    await expect(router.navigateByUrl('/input/MAT')).resolves.toBe(true);
    expect(router.url).toBe('/input/MAT');
    expect(getResult).toHaveBeenCalledTimes(2);
    expect(store.orderTermDraft()).toEqual(draftSnapshot);
  });

  it('tears down pending detail work when navigation is cancelled', async () => {
    const teardown = vi.fn();
    detailsSource = new Observable(() => teardown);
    await configure();

    const pendingNavigation = router.navigateByUrl('/input/MAT');
    await vi.waitFor(() => expect(getResult).toHaveBeenCalledOnce());
    await router.navigateByUrl('/selection?cancelled=1');

    await expect(pendingNavigation).resolves.toBe(false);
    expect(teardown).toHaveBeenCalledOnce();
    expect(store.orderTermDraft()).toEqual(draftSnapshot);
  });

  it('tears down pending lookup work when navigation is cancelled', async () => {
    const teardown = vi.fn();
    lookupSource = new Observable(() => teardown);
    await configure();

    const pendingNavigation = router.navigateByUrl('/input/MAT');
    await vi.waitFor(() => expect(resolveLookups).toHaveBeenCalledOnce());
    await router.navigateByUrl('/selection?cancelled=1');

    await expect(pendingNavigation).resolves.toBe(false);
    expect(teardown).toHaveBeenCalledOnce();
    expect(store.orderTermDraft()).toEqual(draftSnapshot);
  });

  it('uses the shared generic banner shape for unusable local data', async () => {
    detailsSource = of(null);
    await configure();

    await expectRejectedNavigation();
    expect(setBannerError).toHaveBeenCalledWith({
      ...GLOBAL_ERROR_STATE,
      error: true,
      title: GENERIC_HTTP_ERROR_TITLE,
      message: GENERIC_HTTP_ERROR_MESSAGE,
    });
  });
});
