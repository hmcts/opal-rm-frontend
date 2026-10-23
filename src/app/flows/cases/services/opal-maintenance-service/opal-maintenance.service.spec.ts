import { CasesCreateCasefilePayloadService } from '../../cases-create-casefile/services/cases-create-casefile-payload/cases-create-casefile-payload.service';
import { createCasesCreateCasefileReviewState } from '../../cases-create-casefile/mocks/cases-create-casefile-review-state.mock';
import { withoutHttpRetry } from '@hmcts/opal-frontend-common/interceptors/http-retry';
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
        business_unit_id: 44,
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
  const clearMajorCreditorCache = () =>
    (
      service as unknown as {
        majorCreditorsCache: Map<string, unknown>;
      }
    ).majorCreditorsCache.clear();

  it('posts the mapped casefile once and returns the server receipt', async () => {
    const request = TestBed.inject(CasesCreateCasefilePayloadService).buildAddCasefilePayload(
      createCasesCreateCasefileReviewState(),
      {
        countries: [{ country_id: 1, cjs_code: 101, active: true }],
        applications: [{ application_id: 901, application_code: 'TEST', active: true }],
        majorCreditors: [],
      },
      44,
    );
    const response = firstValueFrom(service.createDraftCasefile(request));
    const post = http.expectOne('/opal-maintenance-service/draft-casefiles');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(request);
    for (const key of withoutHttpRetry().keys())
      expect(post.request.context.get(key)).toEqual(withoutHttpRetry().get(key));
    post.flush({ draft_casefile_id: 123, casefile_status: 'SUBMITTED' }, { status: 201, statusText: 'Created' });
    expect((await response).body).toEqual({ draft_casefile_id: 123, casefile_status: 'SUBMITTED' });
    http.expectNone('/opal-maintenance-service/draft-casefiles');
  });

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

  describe('draft casefile collections', () => {
    const params = {
      business_unit_id: 44 as const,
      submitted_by: 'BUU-SYNTHETIC',
      casefile_status: 'SUBMITTED,RESUBMITTED',
    };
    const identity = { userId: 7, businessUnitId: 44 as const, submittedBy: 'BUU-SYNTHETIC' };
    const expectCollection = () =>
      http.expectOne((request) => request.url === '/opal-maintenance-service/draft-casefiles');
    const expectManualRetry = (context: ReturnType<typeof withoutHttpRetry>) => {
      for (const key of withoutHttpRetry().keys()) expect(context.get(key)).toEqual(withoutHttpRetry().get(key));
    };

    it('consults the full selected list with BU user scope and manual retry only', async () => {
      const pending = firstValueFrom(service.getDraftCasefiles(params));
      const get = expectCollection();
      expect(get.request.method).toBe('GET');
      expect(get.request.params.keys().sort()).toEqual(['business_unit_id', 'casefile_status', 'submitted_by']);
      expect(get.request.params.get('business_unit_id')).toBe('44');
      expect(get.request.params.get('submitted_by')).toBe('BUU-SYNTHETIC');
      expect(get.request.params.get('casefile_status')).toBe('SUBMITTED,RESUBMITTED');
      expectManualRetry(get.request.context);
      get.flush({ count: 0, summaries: [] });
      expect(await pending).toEqual({ count: 0, summaries: [] });
    });

    it.each([
      { casefile_status_from_date: '2026-09-01T00:00:00Z' },
      { casefile_status_to_date: '2026-10-01T00:00:00Z' },
      { casefile_status_from_date: '2026-09-01T00:00:00Z', casefile_status_to_date: '2026-10-01T00:00:00Z' },
    ])('includes only provided optional date filters: %j', async (dates) => {
      const pending = firstValueFrom(service.getDraftCasefiles({ ...params, ...dates }));
      const get = expectCollection();
      expect(get.request.params.keys().sort()).toEqual([...Object.keys(params), ...Object.keys(dates)].sort());
      for (const [key, value] of Object.entries(dates)) expect(get.request.params.get(key)).toBe(value);
      get.flush({ count: 0, summaries: [] });
      await pending;
    });

    it('counts rejected work without retrieving summaries', async () => {
      const pending = firstValueFrom(service.getRejectedDraftCasefileCount(identity));
      const get = expectCollection();
      expect(get.request.method).toBe('GET');
      expect(get.request.params.keys().sort()).toEqual([
        'business_unit_id',
        'casefile_status',
        'restrict',
        'submitted_by',
      ]);
      expect(get.request.params.get('business_unit_id')).toBe('44');
      expect(get.request.params.get('submitted_by')).toBe('BUU-SYNTHETIC');
      expect(get.request.params.get('casefile_status')).toBe('REJECTED');
      expect(get.request.params.get('restrict')).toBe('counts');
      expectManualRetry(get.request.context);
      get.flush({ count: 107 });
      expect(await pending).toEqual({ count: 107 });
    });

    it.each(['list', 'count'])('fetches %s afresh for each subscription', async (operation) => {
      const source =
        operation === 'list' ? service.getDraftCasefiles(params) : service.getRejectedDraftCasefileCount(identity);
      for (let attempt = 0; attempt < 2; attempt++) {
        const pending = firstValueFrom(source);
        const response = operation === 'list' ? { count: 0, summaries: [] } : { count: 0 };
        expectCollection().flush(response);
        expect(await pending).toEqual(response);
      }
    });

    it.each([401, 403, 500])('propagates HTTP %s from both collection operations without retry', async (status) => {
      for (const source of [service.getDraftCasefiles(params), service.getRejectedDraftCasefileCount(identity)]) {
        const pending = firstValueFrom(source);
        const assertion = expect(pending).rejects.toMatchObject({ status });
        expectCollection().flush({ detail: 'Unavailable' }, { status, statusText: 'Unavailable' });
        await assertion;
        http.expectNone((request) => request.url === '/opal-maintenance-service/draft-casefiles');
      }
    });

    it('rejects malformed wrappers from both HTTP boundaries', async () => {
      for (const source of [service.getDraftCasefiles(params), service.getRejectedDraftCasefileCount(identity)]) {
        const pending = firstValueFrom(source);
        const assertion = expect(pending).rejects.toThrow('Invalid draft casefile');
        expectCollection().flush({ count: -1 });
        await assertion;
      }
    });
  });

  it('requests active order terms afresh for each subscription and preserves server ordering', () => {
    const results = {
      count: 2,
      refData: [
        { result_id: 'TERM02', result_title: 'Additional maintenance' },
        { result_id: 'TERM01', result_title: 'Maintenance' },
      ],
    };
    const source = service.getResults({ order_term: true, active: true });
    for (let attempt = 0; attempt < 2; attempt++) {
      source.subscribe((response) => expect(response).toEqual(results));
      const request = http.expectOne('/opal-maintenance-service/results?order_term=true&active=true');
      expect(request.request.method).toBe('GET');
      const noRetry = withoutHttpRetry();
      for (const token of noRetry.keys()) {
        expect(request.request.context.get(token)).toEqual(noRetry.get(token));
      }
      request.flush(results);
    }
  });

  it('returns an empty Results response without fixture fallback and fetches again on re-entry', () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      service.getResults({ order_term: true, active: true }).subscribe((response) => {
        expect(response).toEqual({ count: 0, refData: [] });
      });
      http.expectOne('/opal-maintenance-service/results?order_term=true&active=true').flush({ count: 0, refData: [] });
    }
  });

  it('propagates Results failures and allows an explicit retry', () => {
    let failed = false;
    service.getResults({ order_term: true, active: true }).subscribe({
      error: (error) => {
        failed = true;
        expect(error.status).toBe(503);
      },
    });
    http
      .expectOne('/opal-maintenance-service/results?order_term=true&active=true')
      .flush({ detail: 'Unavailable' }, { status: 503, statusText: 'Service Unavailable' });
    expect(failed).toBe(true);
    service.getResults({ order_term: true, active: true }).subscribe((response) => {
      expect(response).toEqual({ count: 0, refData: [] });
    });
    http.expectOne('/opal-maintenance-service/results?order_term=true&active=true').flush({ count: 0, refData: [] });
  });

  it('requests Result detail afresh with an encoded identifier and no automatic retry', () => {
    const detail = { result_id: 'A/B', result_title: 'Maintenance', result_parameters: '[]' };
    const source = service.getResult('A/B');
    for (let attempt = 0; attempt < 2; attempt++) {
      source.subscribe((response) => expect(response).toEqual(detail));
      const request = http.expectOne('/opal-maintenance-service/results/A%2FB');
      expect(request.request.method).toBe('GET');
      for (const token of withoutHttpRetry().keys()) {
        expect(request.request.context.get(token)).toEqual(withoutHttpRetry().get(token));
      }
      request.flush(detail);
    }
  });

  it('preserves null metadata without substituting a fixture', () => {
    const detail = { result_id: 'MAT', result_title: 'Maintenance', result_parameters: null };
    service.getResult('MAT').subscribe((response) => expect(response).toEqual(detail));
    http.expectOne('/opal-maintenance-service/results/MAT').flush(detail);
  });

  it.each([404, 503])('propagates detail HTTP %s and allows a fresh request', (status) => {
    let failure: number | undefined;
    service.getResult('MAT').subscribe({ error: (error) => (failure = error.status) });
    http
      .expectOne('/opal-maintenance-service/results/MAT')
      .flush({ detail: 'Unavailable' }, { status, statusText: 'Unavailable' });
    expect(failure).toBe(status);
    const detail = { result_id: 'MAT', result_title: 'Maintenance', result_parameters: '[]' };
    service.getResult('MAT').subscribe((response) => expect(response).toEqual(detail));
    http.expectOne('/opal-maintenance-service/results/MAT').flush(detail);
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
    const params = { business_unit_id: 44, central_authority: true, active: true };
    const first = service.getMajorCreditors(params);
    const second = service.getMajorCreditors({ ...params });
    expect(first).toBe(second);
    first.subscribe();
    second.subscribe();
    http
      .expectOne('/opal-maintenance-service/major-creditors?business_unit_id=44&central_authority=true&active=true')
      .flush(majorCreditors);
  });

  it('serializes false Major Creditor filters explicitly', () => {
    service.getMajorCreditors({ business_unit_id: 44, central_authority: false, active: false }).subscribe();
    const request = http.expectOne(
      '/opal-maintenance-service/major-creditors?business_unit_id=44&central_authority=false&active=false',
    );
    expect(request.request.params.get('central_authority')).toBe('false');
    expect(request.request.params.get('active')).toBe('false');
    request.flush(majorCreditors);
  });

  it('omits undefined optional Major Creditor filters', () => {
    service.getMajorCreditors({ business_unit_id: 44, central_authority: undefined, active: undefined }).subscribe();
    const request = http.expectOne('/opal-maintenance-service/major-creditors?business_unit_id=44');
    expect(request.request.params.has('central_authority')).toBe(false);
    expect(request.request.params.has('active')).toBe(false);
    request.flush(majorCreditors);
  });

  it('separates false, true, omitted, and Business Unit Major Creditor cache keys', () => {
    const calls = [
      { params: { business_unit_id: 44 }, url: '/opal-maintenance-service/major-creditors?business_unit_id=44' },
      {
        params: { business_unit_id: 44, central_authority: false },
        url: '/opal-maintenance-service/major-creditors?business_unit_id=44&central_authority=false',
      },
      {
        params: { business_unit_id: 44, central_authority: true },
        url: '/opal-maintenance-service/major-creditors?business_unit_id=44&central_authority=true',
      },
      { params: { business_unit_id: 78 }, url: '/opal-maintenance-service/major-creditors?business_unit_id=78' },
    ] as const;
    const requests = calls.map(({ params }) => service.getMajorCreditors(params));
    expect(new Set(requests).size).toBe(calls.length);
    requests.forEach((request) => request.subscribe());
    calls.forEach(({ url }) => http.expectOne(url).flush(majorCreditors));
  });

  it('retries the cached cold source after an earlier Major Creditor error', () => {
    const result = service.getMajorCreditors({ business_unit_id: 44, active: true });
    result.subscribe({ error: () => undefined });
    http
      .expectOne('/opal-maintenance-service/major-creditors?business_unit_id=44&active=true')
      .flush({ detail: 'Unavailable' }, { status: 503, statusText: 'Service Unavailable' });
    const retry = service.getMajorCreditors({ business_unit_id: 44, active: true });
    expect(retry).not.toBe(result);
    retry.subscribe((response) => expect(response).toEqual(majorCreditors));
    http.expectOne('/opal-maintenance-service/major-creditors?business_unit_id=44&active=true').flush(majorCreditors);
  });

  it('preserves a successful Major Creditor response after a take-one consumer unsubscribes', async () => {
    const params = { business_unit_id: 44, central_authority: false, active: true };
    const nonCentralMajorCreditors = {
      count: 1,
      refData: [{ ...majorCreditors.refData[0], central_authority: false }],
    };
    const responsePromise = firstValueFrom(service.getMajorCreditors(params).pipe(take(1)));
    http
      .expectOne('/opal-maintenance-service/major-creditors?business_unit_id=44&central_authority=false&active=true')
      .flush(nonCentralMajorCreditors);
    expect(await responsePromise).toEqual(nonCentralMajorCreditors);

    expect(await firstValueFrom(service.getMajorCreditors(params))).toEqual(nonCentralMajorCreditors);
    http.expectNone((request) => request.url === '/opal-maintenance-service/major-creditors');
  });

  it('cancels a pending Major Creditor request when its final subscriber unsubscribes', () => {
    const result = service.getMajorCreditors({ business_unit_id: 44, central_authority: false, active: true });
    const first = result.subscribe();
    const second = result.subscribe();
    const request = http.expectOne(
      '/opal-maintenance-service/major-creditors?business_unit_id=44&central_authority=false&active=true',
    );
    first.unsubscribe();
    expect(request.cancelled).toBe(false);
    second.unsubscribe();
    expect(request.cancelled).toBe(true);
  });

  it('evicts a Major Creditor source that completes without a response', () => {
    vi.spyOn(TestBed.inject(HttpClient), 'get').mockReturnValue(EMPTY);
    const params = { business_unit_id: 44, central_authority: false, active: true };
    const first = service.getMajorCreditors(params);
    first.subscribe();
    expect(service.getMajorCreditors(params)).not.toBe(first);
  });

  it('does not retain an empty Major Creditor response in the cache', () => {
    const params = { business_unit_id: 44, central_authority: true, active: true };
    const url = '/opal-maintenance-service/major-creditors?business_unit_id=44&central_authority=true&active=true';
    const first = service.getMajorCreditors(params);
    first.subscribe();
    http.expectOne(url).flush({ count: 0, refData: [] });

    const second = service.getMajorCreditors(params);
    expect(second).not.toBe(first);
    second.subscribe((response) => expect(response).toEqual(majorCreditors));
    http.expectOne(url).flush(majorCreditors);
  });

  it('issues a fresh Major Creditor request after the error interceptor consumes a retriable conflict', () => {
    const params = { business_unit_id: 44, central_authority: true, active: true };
    const url = '/opal-maintenance-service/major-creditors?business_unit_id=44&central_authority=true&active=true';
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

  it('does not let an original Major Creditor response overwrite its replacement after cache clear', async () => {
    const params = { business_unit_id: 44, central_authority: true, active: true };
    const url = '/opal-maintenance-service/major-creditors?business_unit_id=44&central_authority=true&active=true';
    const originalResponse = structuredClone(majorCreditors);
    originalResponse.refData[0].name = 'Stale original';
    const replacementResponse = structuredClone(majorCreditors);
    replacementResponse.refData[0].name = 'Current replacement';
    service.getMajorCreditors(params).subscribe();
    clearMajorCreditorCache();
    service.getMajorCreditors(params).subscribe();
    const requests = http.match(url);

    requests[1].flush(replacementResponse);
    requests[0].flush(originalResponse);

    expect(await firstValueFrom(service.getMajorCreditors(params))).toEqual(replacementResponse);
    http.expectNone(url);
  });

  it('does not let an original Major Creditor error evict its replacement after cache clear', () => {
    const params = { business_unit_id: 44, central_authority: true, active: true };
    const url = '/opal-maintenance-service/major-creditors?business_unit_id=44&central_authority=true&active=true';
    service.getMajorCreditors(params).subscribe({ error: () => undefined });
    clearMajorCreditorCache();
    const replacement = service.getMajorCreditors(params);
    replacement.subscribe();
    const requests = http.match(url);

    requests[0].flush({ title: 'Stale failure' }, { status: 503, statusText: 'Service Unavailable' });

    expect(service.getMajorCreditors(params)).toBe(replacement);
    requests[1].flush(majorCreditors);
  });
});
