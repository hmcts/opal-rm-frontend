import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
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
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
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
    service.getCountries(true).subscribe();
    service.getCountries(false).subscribe();
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
    calls.forEach(({ params }) => service.getMajorCreditors(params).subscribe());
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
});
