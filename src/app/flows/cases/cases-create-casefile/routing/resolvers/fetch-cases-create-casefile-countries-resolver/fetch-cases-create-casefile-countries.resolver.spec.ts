import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { OpalMaintenanceService } from '../../../../services/opal-maintenance-service/opal-maintenance.service';
import type { IOpalMaintenanceCountryReferenceDataResponse } from '../../../../services/opal-maintenance-service/interfaces/opal-maintenance-country-reference-data-response.interface';
import { fetchCasesCreateCasefileCountriesResolver } from './fetch-cases-create-casefile-countries.resolver';

describe('fetchCasesCreateCasefileCountriesResolver', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;
  const countriesResponse: IOpalMaintenanceCountryReferenceDataResponse = {
    count: 1,
    refData: [
      {
        country_id: 1,
        cjs_code: 1,
        country_name: 'England',
        date_used_from: '2020-01-01',
        active: true,
      },
    ],
  };
  const countryService = { getCountries: vi.fn() };
  const globalStore = { setBannerError: vi.fn() };

  const executeResolver = (activatedRoute: ActivatedRouteSnapshot, routerState: RouterStateSnapshot) =>
    TestBed.runInInjectionContext(() => fetchCasesCreateCasefileCountriesResolver(activatedRoute, routerState));

  beforeEach(() => {
    vi.clearAllMocks();
    countryService.getCountries.mockReturnValue(of(countriesResponse));
    TestBed.configureTestingModule({
      providers: [
        { provide: OpalMaintenanceService, useValue: countryService },
        { provide: GlobalStore, useValue: globalStore },
      ],
    });
  });

  it('resolves the unmodified active-Countries response', async () => {
    await expect(
      firstValueFrom(executeResolver(route, state) as Observable<IOpalMaintenanceCountryReferenceDataResponse>),
    ).resolves.toEqual(countriesResponse);
    expect(countryService.getCountries).toHaveBeenCalledWith(true);
  });

  it('propagates service failures so route activation is cancelled', async () => {
    const problem = new HttpErrorResponse({ status: 503, error: { detail: 'Countries unavailable' } });
    countryService.getCountries.mockReturnValue(throwError(() => problem));

    await expect(firstValueFrom(executeResolver(route, state) as Observable<never>)).rejects.toBe(problem);
  });

  it('cancels route activation and sets the generic banner when Countries resolves empty', async () => {
    countryService.getCountries.mockReturnValue(of({ count: 0, refData: [] }));

    const result = await firstValueFrom(
      executeResolver(route, state) as Observable<IOpalMaintenanceCountryReferenceDataResponse>,
      { defaultValue: null },
    );

    expect(result).toBeNull();
    expect(globalStore.setBannerError).toHaveBeenCalledOnce();
    expect(globalStore.setBannerError).toHaveBeenCalledWith({
      ...GLOBAL_ERROR_STATE,
      error: true,
      title: GENERIC_HTTP_ERROR_TITLE,
      message: GENERIC_HTTP_ERROR_MESSAGE,
    });
  });
});
