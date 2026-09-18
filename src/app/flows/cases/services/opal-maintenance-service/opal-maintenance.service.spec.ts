import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { httpErrorInterceptor } from '@hmcts/opal-frontend-common/interceptors/http-error';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { EMPTY, firstValueFrom, take } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IOpalMaintenanceCountryReferenceDataResponse } from './interfaces/opal-maintenance-country-reference-data-response.interface';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from './interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import { CasesCreateCasefileMajorCreditorsLoadService } from '../../cases-create-casefile/cases-create-casefile-order-term-creditor/services/cases-create-casefile-major-creditors-load.service';
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

  it('returns filtered synthetic Results without HTTP and clones each subscription', async () => {
    const request = service.getResults({ order_term: true, active: true });
    const first = await firstValueFrom(request);
    first.refData[0].result_title = 'Changed by test';
    const second = await firstValueFrom(request);
    expect(second).toEqual({
      count: 2,
      refData: [
        { result_id: 'MAT', result_title: 'Maintenance' },
        { result_id: 'MCHILD', result_title: 'Child maintenance' },
      ],
    });
    expect(second).not.toBe(first);
    expect(Number.isInteger(second.count)).toBe(true);
    expect(second.count).toBe(second.refData.length);
    for (const record of second.refData) {
      expect(Object.keys(record).sort()).toEqual(['result_id', 'result_title']);
      expect(record.result_id.length).toBeLessThanOrEqual(6);
      expect(record.result_title.length).toBeLessThanOrEqual(60);
    }
    TestBed.inject(HttpTestingController).expectNone('/opal-maintenance-service/results');
  });

  it('resolves every selectable mock Result without HTTP', async () => {
    const list = await firstValueFrom(service.getResults({ order_term: true, active: true }));
    for (const item of list.refData) {
      expect(await firstValueFrom(service.getResult(item.result_id))).toMatchObject({
        ...item,
        active: true,
        order_term: true,
      });
    }
    expect(await firstValueFrom(service.getResult('unknown'))).toBeNull();
    expect(await firstValueFrom(service.getResult('__proto__'))).toBeNull();
    http.expectNone((request) => request.url.includes('/results'));
  });

  it('returns a distinct Result detail that cannot mutate the fixture', async () => {
    const request = service.getResult('MAT');
    const first = await firstValueFrom(request);
    const second = await firstValueFrom(request);

    expect(first).not.toBe(second);
    expect(first).not.toBeNull();
    if (first) first.result_title = 'Changed by test';
    expect(await firstValueFrom(service.getResult('MAT'))).toMatchObject({
      result_id: 'MAT',
      result_title: 'Maintenance',
    });
    http.expectNone((request) => request.url.includes('/results'));
  });

  it('rejects filters outside the synthetic list contract', async () => {
    const params = { order_term: true as const, active: true as const };
    Reflect.set(params, 'active', false);
    await expect(firstValueFrom(service.getResults(params))).rejects.toThrow(
      'Results mock requires active order terms',
    );
    TestBed.inject(HttpTestingController).expectNone('/opal-maintenance-service/results');
  });

  it('requests active Create Casefile applications afresh on each entry', () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      service.getMaintenanceApplications().subscribe((response) => expect(response.refData).toEqual([]));
      const request = http.expectOne((req) => req.url === '/opal-maintenance-service/maintenance-applications');
      expect(request.request.method).toBe('GET');
      expect(request.request.params.get('application_group')).toBe('Create Casefile');
      expect(request.request.params.get('active')).toBe('true');
      request.flush({ count: 0, refData: [] });
    }
  });

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

  it('serializes false Major Creditor filters explicitly', () => {
    service.getMajorCreditors({ business_unit_id: 77, central_authority: false, active: false }).subscribe();
    http
      .expectOne('/opal-maintenance-service/major-creditors?business_unit_id=77&central_authority=false&active=false')
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
    const retry = service.getMajorCreditors({ business_unit_id: 77, active: true });
    expect(retry).not.toBe(result);
    retry.subscribe((response) => expect(response).toEqual(majorCreditors));
    http.expectOne('/opal-maintenance-service/major-creditors?business_unit_id=77&active=true').flush(majorCreditors);
  });

  it('preserves a successful Major Creditor response after a take-one consumer unsubscribes', async () => {
    const params = { business_unit_id: 77, central_authority: false, active: true };
    const nonCentralMajorCreditors = {
      count: 1,
      refData: [{ ...majorCreditors.refData[0], central_authority: false }],
    };
    const responsePromise = firstValueFrom(service.getMajorCreditors(params).pipe(take(1)));
    http
      .expectOne('/opal-maintenance-service/major-creditors?business_unit_id=77&central_authority=false&active=true')
      .flush(nonCentralMajorCreditors);
    expect(await responsePromise).toEqual(nonCentralMajorCreditors);

    expect(await firstValueFrom(service.getMajorCreditors(params))).toEqual(nonCentralMajorCreditors);
    http.expectNone((request) => request.url === '/opal-maintenance-service/major-creditors');
  });

  it('cancels a pending Major Creditor request when its final subscriber unsubscribes', () => {
    const result = service.getMajorCreditors({ business_unit_id: 77, central_authority: false, active: true });
    const first = result.subscribe();
    const second = result.subscribe();
    const request = http.expectOne(
      '/opal-maintenance-service/major-creditors?business_unit_id=77&central_authority=false&active=true',
    );
    first.unsubscribe();
    expect(request.cancelled).toBe(false);
    second.unsubscribe();
    expect(request.cancelled).toBe(true);
  });

  it('evicts a Major Creditor source that completes without a response', () => {
    vi.spyOn(TestBed.inject(HttpClient), 'get').mockReturnValue(EMPTY);
    const params = { business_unit_id: 77, central_authority: false, active: true };
    const first = service.getMajorCreditors(params);
    first.subscribe();
    expect(service.getMajorCreditors(params)).not.toBe(first);
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

  it('permits an owner retry when a non-empty response contains no usable Major Creditors', () => {
    const owner = new CasesCreateCasefileMajorCreditorsLoadService(service, 77);
    const url = '/opal-maintenance-service/major-creditors?business_unit_id=77&central_authority=false&active=true';
    owner.load();
    http.expectOne(url).flush({
      count: 1,
      refData: [majorCreditors.refData[0]],
    });
    expect(owner.state().status).toBe('empty');

    owner.load();
    http.expectOne(url).flush({ count: 0, refData: [] });
    expect(owner.state().status).toBe('empty');
    owner.dispose();
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
