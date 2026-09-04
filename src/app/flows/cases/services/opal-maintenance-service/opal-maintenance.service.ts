import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';
import type { IOpalMaintenanceCountryReferenceDataResponse } from './interfaces/opal-maintenance-country-reference-data-response.interface';
import type { IOpalMaintenanceMajorCreditorParams } from './interfaces/opal-maintenance-major-creditor-params.interface';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from './interfaces/opal-maintenance-major-creditor-reference-data-response.interface';

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

    return this.cacheRequest(
      this.majorCreditorsCache,
      cacheKey,
      this.http.get<IOpalMaintenanceMajorCreditorReferenceDataResponse>(this.majorCreditorsUrl, {
        params: httpParams,
      }),
    );
  }
}
