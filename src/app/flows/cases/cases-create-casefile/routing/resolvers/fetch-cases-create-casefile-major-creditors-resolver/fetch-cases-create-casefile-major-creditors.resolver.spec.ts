import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { contentDigestInterceptor } from '@hmcts/opal-frontend-common/interceptors/content-digest';
import { httpErrorInterceptor } from '@hmcts/opal-frontend-common/interceptors/http-error';
import { httpRetryInterceptor } from '@hmcts/opal-frontend-common/interceptors/http-retry';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { AuthService } from '@hmcts/opal-frontend-common/services/auth-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { EMPTY, Observable, of, Subject, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from '../../../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import { OpalMaintenanceService } from '../../../../services/opal-maintenance-service/opal-maintenance.service';
import type { CasesCreateCasefileMajorCreditorsLoadService } from '../../../cases-create-casefile-order-term-creditor/services/cases-create-casefile-major-creditors-load.service';
import { fetchCasesCreateCasefileMajorCreditorsResolver } from './fetch-cases-create-casefile-major-creditors.resolver';

const response: IOpalMaintenanceMajorCreditorReferenceDataResponse = {
  count: 1,
  refData: [
    {
      major_creditor_id: 901,
      business_unit_id: 77,
      major_creditor_code: '0123',
      name: 'Synthetic creditor',
      address_line_1: '1 Test Street',
      address_line_2: null,
      address_line_3: null,
      address_line_4: null,
      address_line_5: null,
      postcode: null,
      country_id: null,
      country_name: null,
      contact_name: null,
      contact_email: null,
      active: true,
      central_authority: false,
    },
  ],
};

@Component({ template: '<h1>Test destination</h1>' })
class TestDestinationComponent {
  public readonly owner = inject(ActivatedRoute).snapshot.data[
    'majorCreditors'
  ] as CasesCreateCasefileMajorCreditorsLoadService;
}

describe('Major creditors resolver activation lifecycle', () => {
  it('returns an owner before its request emits', async () => {
    const pending = new Subject<IOpalMaintenanceMajorCreditorReferenceDataResponse>();
    const getMajorCreditors = vi.fn(() => pending);
    TestBed.configureTestingModule({
      providers: [
        { provide: OpalMaintenanceService, useValue: { getMajorCreditors } },
        provideRouter([
          {
            path: 'creditor',
            component: TestDestinationComponent,
            resolve: { majorCreditors: fetchCasesCreateCasefileMajorCreditorsResolver },
          },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create('/creditor');
    const component = harness.routeDebugElement?.componentInstance as TestDestinationComponent;
    expect(component.owner.state().status).toBe('loading');
    expect(getMajorCreditors).toHaveBeenCalledExactlyOnceWith({
      business_unit_id: 77,
      active: true,
      central_authority: false,
    });
    component.owner.dispose();
  });

  it('disposes the pending request if another resolver cancels activation', async () => {
    const teardown = vi.fn();
    const getMajorCreditors = vi.fn(
      () => new Observable<IOpalMaintenanceMajorCreditorReferenceDataResponse>(() => teardown),
    );
    TestBed.configureTestingModule({
      providers: [
        { provide: OpalMaintenanceService, useValue: { getMajorCreditors } },
        provideRouter([
          { path: 'start', component: TestDestinationComponent },
          {
            path: 'creditor',
            component: TestDestinationComponent,
            resolve: { majorCreditors: fetchCasesCreateCasefileMajorCreditorsResolver, cancelled: () => EMPTY },
          },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create('/start');
    await harness.navigateByUrl('/creditor');
    expect(teardown).toHaveBeenCalledTimes(1);
  });

  it('disposes the pending request when another resolver errors', async () => {
    const teardown = vi.fn();
    const getMajorCreditors = vi.fn(
      () => new Observable<IOpalMaintenanceMajorCreditorReferenceDataResponse>(() => teardown),
    );
    TestBed.configureTestingModule({
      providers: [
        { provide: OpalMaintenanceService, useValue: { getMajorCreditors } },
        provideRouter([
          { path: 'start', component: TestDestinationComponent },
          {
            path: 'creditor',
            component: TestDestinationComponent,
            resolve: {
              majorCreditors: fetchCasesCreateCasefileMajorCreditorsResolver,
              failed: () => throwError(() => new Error('Synthetic resolver failure')),
            },
          },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create('/start');
    await expect(harness.navigateByUrl('/creditor')).rejects.toThrow('Synthetic resolver failure');
    expect(teardown).toHaveBeenCalledTimes(1);
  });

  it('creates independent owners for separate activations', async () => {
    const getMajorCreditors = vi.fn(() => of(structuredClone(response)));
    TestBed.configureTestingModule({
      providers: [
        { provide: OpalMaintenanceService, useValue: { getMajorCreditors } },
        provideRouter([
          { path: 'start', component: TestDestinationComponent },
          {
            path: 'creditor',
            component: TestDestinationComponent,
            resolve: { majorCreditors: fetchCasesCreateCasefileMajorCreditorsResolver },
          },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create('/creditor');
    const first = (harness.routeDebugElement?.componentInstance as TestDestinationComponent).owner;
    await harness.navigateByUrl('/start');
    await harness.navigateByUrl('/creditor');
    const second = (harness.routeDebugElement?.componentInstance as TestDestinationComponent).owner;
    expect(second).not.toBe(first);
    expect(getMajorCreditors).toHaveBeenCalledTimes(2);
    second.dispose();
  });
});

describe('Major creditors resolver HTTP integration', () => {
  let http: HttpTestingController;

  afterEach(() => http?.verify());

  it('keeps a 503 local, exposes its reference and permits one explicit retry', async () => {
    const setBannerError = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([httpErrorInterceptor, contentDigestInterceptor, httpRetryInterceptor])),
        provideHttpClientTesting(),
        { provide: GlobalStore, useValue: { setBannerError, resetBannerError: vi.fn() } },
        { provide: AppInsightsService, useValue: { logException: vi.fn() } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');
    const owner = TestBed.runInInjectionContext(() =>
      fetchCasesCreateCasefileMajorCreditorsResolver({} as never, {} as never),
    ) as CasesCreateCasefileMajorCreditorsLoadService;
    http
      .expectOne('/opal-maintenance-service/major-creditors?business_unit_id=77&central_authority=false&active=true')
      .flush(
        { title: 'Internal title', detail: 'Internal detail', operation_id: 'synthetic-reference' },
        { status: 503, statusText: 'Unavailable' },
      );
    expect(owner.state()).toEqual({ status: 'error', records: [], correlationReference: 'synthetic-reference' });
    expect(setBannerError).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    http.expectNone((request) => request.url.endsWith('/major-creditors'));

    owner.load();
    http
      .expectOne('/opal-maintenance-service/major-creditors?business_unit_id=77&central_authority=false&active=true')
      .flush(response);
    expect(owner.state().status).toBe('ready');
    owner.dispose();
  });

  it('retains authentication failure handling for a 401 response', () => {
    const setAuthenticated = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([httpErrorInterceptor, contentDigestInterceptor, httpRetryInterceptor])),
        provideHttpClientTesting(),
        {
          provide: GlobalStore,
          useValue: { setAuthenticated, setBannerError: vi.fn(), resetBannerError: vi.fn() },
        },
        { provide: AppInsightsService, useValue: { logException: vi.fn() } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const error = vi.fn();
    TestBed.inject(AuthService).checkAuthenticated().subscribe({ error });
    http.expectOne('/sso/authenticated').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(setAuthenticated).toHaveBeenCalledExactlyOnceWith(false);
    expect(error).toHaveBeenCalledOnce();
  });
});
