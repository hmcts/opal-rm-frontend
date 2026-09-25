import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { withoutHttpRetry } from '@hmcts/opal-frontend-common/interceptors/http-retry';
import { defer, of, Observable, shareReplay, tap } from 'rxjs';
import type { IOpalMaintenanceApplicationReferenceDataResponse } from './interfaces/opal-maintenance-application-reference-data-response.interface';
import type { IOpalMaintenanceCasefileSubmissionResult } from './interfaces/opal-maintenance-casefile-submission-result.interface';
import type { IOpalMaintenanceCountryReferenceDataResponse } from './interfaces/opal-maintenance-country-reference-data-response.interface';
import type { IOpalMaintenanceMajorCreditorParams } from './interfaces/opal-maintenance-major-creditor-params.interface';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from './interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import type { IOpalMaintenanceResultDetail } from './interfaces/opal-maintenance-result-detail.interface';
import type { IOpalMaintenanceResultParams } from './interfaces/opal-maintenance-result-params.interface';
import type { IOpalMaintenanceResultReferenceDataResponse } from './interfaces/opal-maintenance-result-reference-data-response.interface';

@Injectable({ providedIn: 'root' })
export class OpalMaintenanceService {
  private readonly http = inject(HttpClient);
  private readonly countriesUrl = '/opal-maintenance-service/countries';
  private readonly majorCreditorsUrl = '/opal-maintenance-service/major-creditors';
  private readonly countriesCache = new Map<boolean, Observable<IOpalMaintenanceCountryReferenceDataResponse>>();
  private readonly majorCreditorsCache = new Map<
    string,
    Observable<IOpalMaintenanceMajorCreditorReferenceDataResponse>
  >();

  private cacheRequest<TKey, TResponse extends { refData: unknown[] }>(
    cache: Map<TKey, Observable<TResponse>>,
    cacheKey: TKey,
    source: Observable<TResponse>,
  ): Observable<TResponse> {
    let hasUsableResponse = false;
    let request: Observable<TResponse>;
    const evictIfCurrent = () => {
      if (cache.get(cacheKey) === request) cache.delete(cacheKey);
    };

    request = source.pipe(
      tap({
        next: (response) => {
          hasUsableResponse ||= response.refData.length > 0;
          if (!hasUsableResponse) evictIfCurrent();
        },
        complete: () => {
          if (!hasUsableResponse) evictIfCurrent();
        },
      }),
      shareReplay(1),
    );
    cache.set(cacheKey, request);
    return request;
  }

  public getMaintenanceApplications(): Observable<IOpalMaintenanceApplicationReferenceDataResponse> {
    return this.http.get<IOpalMaintenanceApplicationReferenceDataResponse>(
      '/opal-maintenance-service/maintenance-applications',
      {
        params: { application_group: 'Create Casefile', active: true },
        context: withoutHttpRetry(),
      },
    );
  }

  public getResults(params: IOpalMaintenanceResultParams): Observable<IOpalMaintenanceResultReferenceDataResponse> {
    return this.http.get<IOpalMaintenanceResultReferenceDataResponse>('/opal-maintenance-service/results', {
      params: { order_term: params.order_term, active: params.active },
      context: withoutHttpRetry(),
    });
  }

  public getResult(resultId: string): Observable<IOpalMaintenanceResultDetail | null> {
    return this.http.get<IOpalMaintenanceResultDetail>(
      `/opal-maintenance-service/results/${encodeURIComponent(resultId)}`,
      { context: withoutHttpRetry() },
    );
  }

  /** Temporary mock response; no backend case is created or saved. */
  public submitCasefile(): Observable<IOpalMaintenanceCasefileSubmissionResult> {
    return defer(() => of({ draft_casefile_id: globalThis.crypto.randomUUID() }));
  }

  public getCountries(active: boolean): Observable<IOpalMaintenanceCountryReferenceDataResponse> {
    const cached = this.countriesCache.get(active);
    if (cached) return cached;

    return this.cacheRequest(
      this.countriesCache,
      active,
      this.http.get<IOpalMaintenanceCountryReferenceDataResponse>(this.countriesUrl, { params: { active } }),
    );
  }

  public getMajorCreditors(
    params: IOpalMaintenanceMajorCreditorParams,
  ): Observable<IOpalMaintenanceMajorCreditorReferenceDataResponse> {
    const cacheKey = JSON.stringify({
      business_unit_id: params.business_unit_id,
      central_authority: params.central_authority ?? null,
      active: params.active ?? null,
    });
    const cached = this.majorCreditorsCache.get(cacheKey);
    if (cached) return cached;

    let httpParams = new HttpParams().set('business_unit_id', params.business_unit_id);
    if (params.central_authority !== undefined) {
      httpParams = httpParams.set('central_authority', params.central_authority);
    }
    if (params.active !== undefined) {
      httpParams = httpParams.set('active', params.active);
    }

    let emitted = false;
    let request: Observable<IOpalMaintenanceMajorCreditorReferenceDataResponse>;
    const evictIfCurrent = () => {
      if (this.majorCreditorsCache.get(cacheKey) === request) this.majorCreditorsCache.delete(cacheKey);
    };

    request = defer(() =>
      this.http.get<IOpalMaintenanceMajorCreditorReferenceDataResponse>(this.majorCreditorsUrl, {
        params: httpParams,
      }),
    ).pipe(
      tap({
        next: (response) => {
          emitted = true;
          if (this.majorCreditorsCache.get(cacheKey) !== request) return;
          const hasUsableRecord = response.refData.some(
            (record) =>
              record.business_unit_id === params.business_unit_id &&
              (params.active === undefined || record.active === params.active) &&
              (params.central_authority === undefined || record.central_authority === params.central_authority) &&
              Number.isInteger(record.major_creditor_id) &&
              record.major_creditor_id > 0,
          );
          if (hasUsableRecord) this.majorCreditorsCache.set(cacheKey, of(response));
          else this.majorCreditorsCache.delete(cacheKey);
        },
        error: evictIfCurrent,
        complete: () => {
          if (!emitted) evictIfCurrent();
        },
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.majorCreditorsCache.set(cacheKey, request);
    return request;
  }
}
