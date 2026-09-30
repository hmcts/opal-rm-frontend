import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot } from '@angular/router';
import { contentDigestInterceptor } from '@hmcts/opal-frontend-common/interceptors/content-digest';
import { httpErrorInterceptor } from '@hmcts/opal-frontend-common/interceptors/http-error';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { httpRetryInterceptor } from '@hmcts/opal-frontend-common/interceptors/http-retry';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { Observable } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IOpalMaintenanceApplicationReferenceDataResponse } from '../../../../services/opal-maintenance-service/interfaces/opal-maintenance-application-reference-data-response.interface';
import { fetchCasesCreateCasefileApplicationsResolver } from './fetch-cases-create-casefile-applications.resolver';

describe('fetchCasesCreateCasefileApplicationsResolver', () => {
  let http: HttpTestingController;
  const setBannerError = vi.fn();
  const resetBannerError = vi.fn();
  const resolve = () =>
    TestBed.runInInjectionContext(() =>
      fetchCasesCreateCasefileApplicationsResolver({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as Observable<IOpalMaintenanceApplicationReferenceDataResponse>;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([httpErrorInterceptor, contentDigestInterceptor, httpRetryInterceptor])),
        provideHttpClientTesting(),
        { provide: GlobalStore, useValue: { setBannerError, resetBannerError } },
        { provide: AppInsightsService, useValue: { logException: vi.fn() } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('emits no route data while pending or when empty, then permits a fresh attempt', () => {
    const next = vi.fn();
    const complete = vi.fn();
    resolve().subscribe({ next, complete });
    expect(next).not.toHaveBeenCalled();
    http.expectOne((request) => request.url.endsWith('/maintenance-applications')).flush({ count: 0, refData: [] });

    expect(next).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalledOnce();
    expect(setBannerError).toHaveBeenCalledWith(
      expect.objectContaining({
        error: true,
        title: GENERIC_HTTP_ERROR_TITLE,
        message: GENERIC_HTTP_ERROR_MESSAGE,
      }),
    );

    resolve().subscribe(next);
    const record = {
      application_id: 901,
      application_code: 'TEST01',
      application_title: 'Synthetic application',
      application_group: 'Create Casefile',
      active: true,
    };
    http
      .expectOne((request) => request.url.endsWith('/maintenance-applications'))
      .flush({ count: 1, refData: [record] });
    expect(next).toHaveBeenCalledWith({ count: 1, refData: [record] });
  });

  it('uses the shared HTTP error handler and propagates the original failure without fabricating usable route data', () => {
    const next = vi.fn();
    const error = vi.fn();
    resolve().subscribe({ next, error });
    http
      .expectOne((request) => request.url.endsWith('/maintenance-applications'))
      .flush(
        {
          title: 'Internal title',
          detail: 'Internal detail',
          operation_id: 'synthetic-reference',
          retriable: true,
        },
        { status: 503, statusText: 'Unavailable' },
      );

    expect(next).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledOnce();
    expect(error.mock.calls[0][0].error).toEqual({
      title: 'Internal title',
      detail: 'Internal detail',
      operation_id: 'synthetic-reference',
      retriable: true,
    });
    expect(setBannerError).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Internal title',
        message: 'Internal detail',
        operationId: 'synthetic-reference',
      }),
    );
    http.expectNone((request) => request.url.endsWith('/maintenance-applications'));
  });
});
