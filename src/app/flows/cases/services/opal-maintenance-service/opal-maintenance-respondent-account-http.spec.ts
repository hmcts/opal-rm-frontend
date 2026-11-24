import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { appConfig } from '../../../../app.config';
import {
  RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK,
  RESPONDENT_ACCOUNT_ETAG,
  RESPONDENT_ACCOUNT_HEADER_MOCK,
} from './mocks/opal-maintenance-respondent-account.mock';
import { OpalMaintenanceService } from './opal-maintenance.service';

const accountUrl = '/opal-maintenance-service/respondent-accounts/11748';
const headerUrl = `${accountUrl}/header-summary`;
const glanceUrl = `${accountUrl}/at-a-glance`;

let service: OpalMaintenanceService;
let http: HttpTestingController;
let navigate: MockInstance<Router['navigate']>;
const logException = vi.fn();

beforeEach(() => {
  logException.mockClear();
  TestBed.configureTestingModule({
    providers: [
      appConfig.providers[2],
      provideRouter([]),
      provideHttpClientTesting(),
      { provide: AppInsightsService, useValue: { logException } },
    ],
  });
  service = TestBed.inject(OpalMaintenanceService);
  http = TestBed.inject(HttpTestingController);
  navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
});

afterEach(() => {
  http.verify();
  vi.restoreAllMocks();
});

describe('Respondent account reads', () => {
  it('returns the two scoped bodies and preserves quoted or absent HTTP version metadata', async () => {
    const header = firstValueFrom(service.getRespondentAccountHeaderSummary(11748));
    const glance = firstValueFrom(service.getRespondentAccountAtAGlance(11748));
    const request = http.expectOne({ method: 'GET', url: headerUrl });
    expect(request.request.cache).toBe('no-store');
    expect(request.request.transferCache).toBe(false);
    expect(request.request.headers.has('If-None-Match')).toBe(false);
    request.flush(RESPONDENT_ACCOUNT_HEADER_MOCK, { headers: { eTaG: RESPONDENT_ACCOUNT_ETAG } });
    http.expectOne({ method: 'GET', url: glanceUrl }).flush(RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK);
    await expect(header).resolves.toEqual({ body: RESPONDENT_ACCOUNT_HEADER_MOCK, etag: RESPONDENT_ACCOUNT_ETAG });
    await expect(glance).resolves.toEqual({ body: RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK, etag: null });

    const nextHeader = firstValueFrom(service.getRespondentAccountHeaderSummary(11748));
    http.expectOne({ method: 'GET', url: headerUrl }).flush(RESPONDENT_ACCOUNT_HEADER_MOCK);
    await expect(nextHeader).resolves.toEqual({ body: RESPONDENT_ACCOUNT_HEADER_MOCK, etag: null });
  });

  it('accepts an otherwise valid summary with optional fields missing', async () => {
    const body = {
      ...RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK,
      respondent: { name: RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK.respondent.name },
      applicant: null,
      comment: null,
    };
    const result = firstValueFrom(service.getRespondentAccountAtAGlance(11748));
    http.expectOne(glanceUrl).flush(body);
    await expect(result).resolves.toEqual({ body, etag: null });
  });

  it.each([
    null,
    {},
    { ...RESPONDENT_ACCOUNT_HEADER_MOCK, respondentAccountId: 11749 },
    { ...RESPONDENT_ACCOUNT_HEADER_MOCK, arrears: '125.50' },
    { ...RESPONDENT_ACCOUNT_HEADER_MOCK, arrearsUpdatedDate: '2026-02-30' },
  ])('allows manual recovery from an invalid 2xx header without auto-retrying', async (body) => {
    const result = firstValueFrom(service.getRespondentAccountHeaderSummary(11748)).catch((error: unknown) => error);
    http.expectOne(headerUrl).flush(body, { status: 200, statusText: 'OK' });
    await expect(result).resolves.toMatchObject({
      failure: {
        kind: 'retryable',
        title: 'There was a problem',
        message: 'You can try again. If the problem persists, contact the service desk.',
      },
    });
    http.expectNone(headerUrl);
    expect(logException).not.toHaveBeenCalled();
  });

  it('allows manual recovery from invalid nested At a glance data', async () => {
    const result = firstValueFrom(service.getRespondentAccountAtAGlance(11748)).catch((error: unknown) => error);
    http.expectOne(glanceUrl).flush({
      ...RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK,
      respondent: { ...RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK.respondent, age: -1 },
    });
    await expect(result).resolves.toMatchObject({ failure: { kind: 'retryable' } });
    http.expectNone(glanceUrl);
  });

  it.each([408, 502, 503, 504])('retries transient status %i once and can recover', async (status) => {
    const result = firstValueFrom(service.getRespondentAccountAtAGlance(11748));
    http.expectOne(glanceUrl).flush(null, { status, statusText: 'Fixture transient failure' });
    http.expectOne({ method: 'GET', url: glanceUrl }).flush(RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK);
    await expect(result).resolves.toMatchObject({ body: RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK });
    http.expectNone(headerUrl);
    http.expectNone(glanceUrl);
  });

  it('offers a manual Retry with the final problem copy after one network retry', async () => {
    const global = TestBed.inject(GlobalStore);
    const existingBanner = { error: true, title: 'Another request', message: 'Existing banner', operationId: null };
    global.setBannerError(existingBanner);
    const result = firstValueFrom(service.getRespondentAccountAtAGlance(11748)).catch((error: unknown) => error);
    http.expectOne(glanceUrl).error(new ProgressEvent('error'));
    http.expectOne(glanceUrl).flush(
      {
        status: 503,
        retriable: true,
        title: 'Account summary unavailable',
        detail: 'Try the account summary again.',
      },
      { status: 503, statusText: 'Service Unavailable' },
    );
    await expect(result).resolves.toMatchObject({
      failure: { kind: 'retryable', title: 'Account summary unavailable', message: 'Try the account summary again.' },
    });
    http.expectNone(glanceUrl);
    expect(navigate).not.toHaveBeenCalled();
    expect(logException).not.toHaveBeenCalled();
    expect(global.bannerError()).toEqual(existingBanner);
  });

  it.each([
    [403, true, '/error/permission-denied'],
    [404, false, '/error/internal-server'],
    [409, false, '/error/concurrency-failure'],
    [500, undefined, '/error/internal-server'],
    [503, false, '/error/internal-server'],
  ] as const)(
    'returns a route decision for terminal status %i without navigating or forwarding the body',
    async (status, retriable, path) => {
      const result = firstValueFrom(service.getRespondentAccountHeaderSummary(11748)).catch((error: unknown) => error);
      http
        .expectOne(headerUrl)
        .flush(
          { status, retriable, operation_id: 'SYNTHETIC-OPERATION', detail: 'Synthetic raw detail' },
          { status, statusText: 'Fixture terminal failure' },
        );
      const error = await result;
      expect(error).toMatchObject({ failure: { kind: 'route', path, operationId: 'SYNTHETIC-OPERATION' } });
      expect(error).not.toHaveProperty('error');
      expect(error).not.toHaveProperty('cause');
      http.expectNone(headerUrl);
      expect(navigate).not.toHaveBeenCalled();
      expect(logException).not.toHaveBeenCalled();
    },
  );

  it('preserves the shared handling of unrelated HTTP calls', async () => {
    const result = firstValueFrom(TestBed.inject(HttpClient).get('/unrelated')).catch((error: unknown) => error);
    http.expectOne('/unrelated').flush({ retriable: false }, { status: 403, statusText: 'Forbidden' });
    expect(await result).toHaveProperty('status', 403);
    expect(navigate).toHaveBeenCalledWith(['/error/permission-denied']);
    expect(logException).toHaveBeenCalledOnce();
  });
});
