import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { httpErrorInterceptor } from '@hmcts/opal-frontend-common/interceptors/http-error';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { httpRetryInterceptor } from '@hmcts/opal-frontend-common/interceptors/http-retry';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { opalMaintenanceApplicationErrorInterceptor } from './opal-maintenance-application-error.interceptor';
import { OpalMaintenanceService } from './opal-maintenance.service';

describe('opalMaintenanceApplicationErrorInterceptor', () => {
  const setBannerError = vi.fn();
  let http: HttpTestingController;

  beforeEach(() => {
    setBannerError.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([httpErrorInterceptor, httpRetryInterceptor, opalMaintenanceApplicationErrorInterceptor]),
        ),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: GlobalStore, useValue: { setBannerError, resetBannerError: vi.fn() } },
        { provide: AppInsightsService, useValue: { logException: vi.fn() } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it.each([400, 401, 403, 500, 503])(
    'sanitises %s responses, preserves transport metadata and does not retry',
    (status) => {
      const onError = vi.fn();
      TestBed.inject(OpalMaintenanceService).getMaintenanceApplications().subscribe({ error: onError });
      const request = http.expectOne((candidate) => candidate.url.endsWith('/maintenance-applications'));
      request.flush(
        {
          title: 'Internal title',
          detail: 'Internal detail',
          operation_id: 'synthetic-op',
          retriable: true,
        },
        {
          status,
          statusText: 'Synthetic error',
          headers: { 'x-correlation-id': 'synthetic-correlation' },
        },
      );

      expect(setBannerError).toHaveBeenCalledWith(
        expect.objectContaining({
          title: GENERIC_HTTP_ERROR_TITLE,
          message: GENERIC_HTTP_ERROR_MESSAGE,
          operationId: 'synthetic-op',
        }),
      );
      expect(onError).toHaveBeenCalledOnce();
      const error = onError.mock.calls[0][0] as HttpErrorResponse;
      expect(error.status).toBe(status);
      expect(error.statusText).toBe('Synthetic error');
      expect(error.headers.get('x-correlation-id')).toBe('synthetic-correlation');
      expect(error.error).toEqual({ operation_id: 'synthetic-op', retriable: true });
      expect(error.error).not.toHaveProperty('title');
      expect(error.error).not.toHaveProperty('detail');
      http.expectNone((candidate) => candidate.url.endsWith('/maintenance-applications'));
    },
  );

  it.each([null, 'malformed problem body', 123, []])(
    'uses a safe minimal error for malformed problem body %j',
    (problem) => {
      const onError = vi.fn();
      TestBed.inject(OpalMaintenanceService).getMaintenanceApplications().subscribe({ error: onError });
      http
        .expectOne((request) => request.url.endsWith('/maintenance-applications'))
        .flush(problem, { status: 500, statusText: 'Server error' });

      expect(setBannerError).toHaveBeenCalledWith(
        expect.objectContaining({
          title: GENERIC_HTTP_ERROR_TITLE,
          message: GENERIC_HTTP_ERROR_MESSAGE,
          operationId: null,
        }),
      );
      expect((onError.mock.calls[0][0] as HttpErrorResponse).error).toEqual({
        operation_id: null,
        retriable: undefined,
      });
    },
  );

  it('uses a null operation reference when the problem omits it', () => {
    const onError = vi.fn();
    TestBed.inject(OpalMaintenanceService).getMaintenanceApplications().subscribe({ error: onError });
    http
      .expectOne((request) => request.url.endsWith('/maintenance-applications'))
      .flush({ retriable: false, detail: 'Internal detail' }, { status: 500, statusText: 'Server error' });

    const error = onError.mock.calls[0][0] as HttpErrorResponse;
    expect(error.error).toEqual({ operation_id: null, retriable: false });
    expect(error.error).not.toHaveProperty('detail');
  });

  it('leaves an unrelated error body unchanged', () => {
    const onError = vi.fn();
    TestBed.inject(HttpClient).get('/unrelated-synthetic-test').subscribe({ error: onError });
    const problem = { title: 'Existing title', detail: 'Existing detail', retriable: true };
    http.expectOne('/unrelated-synthetic-test').flush(problem, { status: 503, statusText: 'Unavailable' });

    expect((onError.mock.calls[0][0] as HttpErrorResponse).error).toEqual(problem);
  });
});
