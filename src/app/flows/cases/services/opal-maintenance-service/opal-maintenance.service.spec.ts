import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { httpErrorInterceptor } from '@hmcts/opal-frontend-common/interceptors/http-error';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { IOpalMaintenanceCountryReferenceDataResponse } from './interfaces/opal-maintenance-country-reference-data-response.interface';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from './interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import { OpalMaintenanceService } from './opal-maintenance.service';

describe('OpalMaintenanceService', () => {
  let service: OpalMaintenanceService;
  let http: HttpTestingController;
  const countries: IOpalMaintenanceCountryReferenceDataResponse = {
    count: 1,
    refData: [
      { country_id: 826, cjs_code: 1, country_name: 'United Kingdom', date_used_from: '2020-01-01', active: true },
    ],
  };
  const majorCreditors: IOpalMaintenanceMajorCreditorReferenceDataResponse = {
    count: 1,
    refData: [
      {
        major_creditor_id: 901,
        business_unit_id: 77,
        major_creditor_code: '0123',
        name: 'Central Authority One',
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
        central_authority: true,
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: GlobalStore, useValue: new GlobalStore() },
        { provide: AppInsightsService, useValue: { logException: () => undefined } },
      ],
    });
    service = TestBed.inject(OpalMaintenanceService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shares one Countries request for an identical active flag', () => {
    const first = service.getCountries(true);
    const second = service.getCountries(true);
    expect(first).toBe(second);
    first.subscribe();
    second.subscribe();
    http.expectOne('/opal-maintenance-service/countries?active=true').flush(countries);
  });

  it('uses separate Countries cache entries for true and false', () => {
    const activeCountries = service.getCountries(true);
    const inactiveCountries = service.getCountries(false);
    expect(activeCountries).not.toBe(inactiveCountries);
    activeCountries.subscribe();
    inactiveCountries.subscribe();
    http.expectOne('/opal-maintenance-service/countries?active=true').flush(countries);
    http.expectOne('/opal-maintenance-service/countries?active=false').flush(countries);
  });

  it('retries the cached Countries source after an earlier error', () => {
    const result = service.getCountries(true);
    result.subscribe({ error: () => undefined });
    http
      .expectOne('/opal-maintenance-service/countries?active=true')
      .flush({ detail: 'Unavailable' }, { status: 503, statusText: 'Service Unavailable' });
    result.subscribe((response) => expect(response).toEqual(countries));
    http.expectOne('/opal-maintenance-service/countries?active=true').flush(countries);
  });

  it('does not retain an empty Countries response in the cache', () => {
    const first = service.getCountries(true);
    first.subscribe();
    http.expectOne('/opal-maintenance-service/countries?active=true').flush({ count: 0, refData: [] });

    const second = service.getCountries(true);
    expect(second).not.toBe(first);
    second.subscribe((response) => expect(response).toEqual(countries));
    http.expectOne('/opal-maintenance-service/countries?active=true').flush(countries);
  });

  it('does not let an older empty Countries request evict its replacement when it completes', () => {
    let replacement: ReturnType<OpalMaintenanceService['getCountries']> | undefined;
    service.getCountries(true).subscribe({
      next: () => {
        replacement = service.getCountries(true);
        replacement.subscribe();
      },
    });
    http.expectOne('/opal-maintenance-service/countries?active=true').flush({ count: 0, refData: [] });

    expect(replacement).toBeDefined();
    expect(service.getCountries(true)).toBe(replacement);
    http.expectOne('/opal-maintenance-service/countries?active=true').flush(countries);
  });

  it('issues a fresh Countries request after the error interceptor consumes a retriable conflict', () => {
    const first = service.getCountries(true);
    first.subscribe();
    http
      .expectOne('/opal-maintenance-service/countries?active=true')
      .flush(
        { title: 'Countries unavailable', status: 409, detail: 'Try again', retriable: true },
        { status: 409, statusText: 'Conflict' },
      );

    const second = service.getCountries(true);
    expect(second).not.toBe(first);
    second.subscribe((response) => expect(response).toEqual(countries));
    http.expectOne('/opal-maintenance-service/countries?active=true').flush(countries);
  });

  it('serializes all Major Creditor filters and shares the identical observable', () => {
    const params = { business_unit_id: 77, central_authority: true, active: true };
    const first = service.getMajorCreditors(params);
    const second = service.getMajorCreditors({ ...params });
    expect(first).toBe(second);
    first.subscribe();
    second.subscribe();
    http
      .expectOne('/opal-maintenance-service/major-creditors?business_unit_id=77&central_authority=true&active=true')
      .flush(majorCreditors);
  });

  it('omits undefined optional Major Creditor filters', () => {
    service.getMajorCreditors({ business_unit_id: 77, central_authority: undefined, active: undefined }).subscribe();
    const request = http.expectOne('/opal-maintenance-service/major-creditors?business_unit_id=77');
    expect(request.request.params.has('central_authority')).toBe(false);
    expect(request.request.params.has('active')).toBe(false);
    request.flush(majorCreditors);
  });

  it('separates false, true, omitted, and Business Unit Major Creditor cache keys', () => {
    const calls = [
      { params: { business_unit_id: 77 }, url: '/opal-maintenance-service/major-creditors?business_unit_id=77' },
      {
        params: { business_unit_id: 77, central_authority: false },
        url: '/opal-maintenance-service/major-creditors?business_unit_id=77&central_authority=false',
      },
      {
        params: { business_unit_id: 77, central_authority: true },
        url: '/opal-maintenance-service/major-creditors?business_unit_id=77&central_authority=true',
      },
      { params: { business_unit_id: 78 }, url: '/opal-maintenance-service/major-creditors?business_unit_id=78' },
    ] as const;
    const requests = calls.map(({ params }) => service.getMajorCreditors(params));
    expect(new Set(requests).size).toBe(calls.length);
    requests.forEach((request) => request.subscribe());
    calls.forEach(({ url }) => http.expectOne(url).flush(majorCreditors));
  });

  it('retries the cached cold source after an earlier Major Creditor error', () => {
    const result = service.getMajorCreditors({ business_unit_id: 77, active: true });
    result.subscribe({ error: () => undefined });
    http
      .expectOne('/opal-maintenance-service/major-creditors?business_unit_id=77&active=true')
      .flush({ detail: 'Unavailable' }, { status: 503, statusText: 'Service Unavailable' });
    result.subscribe((response) => expect(response).toEqual(majorCreditors));
    http.expectOne('/opal-maintenance-service/major-creditors?business_unit_id=77&active=true').flush(majorCreditors);
  });

  it('does not retain an empty Major Creditor response in the cache', () => {
    const params = { business_unit_id: 77, central_authority: true, active: true };
    const url = '/opal-maintenance-service/major-creditors?business_unit_id=77&central_authority=true&active=true';
    const first = service.getMajorCreditors(params);
    first.subscribe();
    http.expectOne(url).flush({ count: 0, refData: [] });

    const second = service.getMajorCreditors(params);
    expect(second).not.toBe(first);
    second.subscribe((response) => expect(response).toEqual(majorCreditors));
    http.expectOne(url).flush(majorCreditors);
  });

  it('issues a fresh Major Creditor request after the error interceptor consumes a retriable conflict', () => {
    const params = { business_unit_id: 77, central_authority: true, active: true };
    const url = '/opal-maintenance-service/major-creditors?business_unit_id=77&central_authority=true&active=true';
    const first = service.getMajorCreditors(params);
    first.subscribe();
    http
      .expectOne(url)
      .flush(
        { title: 'Major Creditors unavailable', status: 409, detail: 'Try again', retriable: true },
        { status: 409, statusText: 'Conflict' },
      );

    const second = service.getMajorCreditors(params);
    expect(second).not.toBe(first);
    second.subscribe((response) => expect(response).toEqual(majorCreditors));
    http.expectOne(url).flush(majorCreditors);
  });
});
