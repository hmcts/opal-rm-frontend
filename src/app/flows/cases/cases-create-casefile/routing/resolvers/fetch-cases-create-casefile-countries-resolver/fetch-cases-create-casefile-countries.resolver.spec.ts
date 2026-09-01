import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { CasesCreateCasefileCountryService } from '../../../services/cases-create-casefile-country.service';
import type { ICasesCreateCasefileCountryReferenceDataResponse } from '../../../services/interfaces/cases-create-casefile-country-reference-data-response.interface';
import { fetchCasesCreateCasefileCountriesResolver } from './fetch-cases-create-casefile-countries.resolver';

describe('fetchCasesCreateCasefileCountriesResolver', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;
  const countriesResponse: ICasesCreateCasefileCountryReferenceDataResponse = {
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

  const executeResolver = (activatedRoute: ActivatedRouteSnapshot, routerState: RouterStateSnapshot) =>
    TestBed.runInInjectionContext(() => fetchCasesCreateCasefileCountriesResolver(activatedRoute, routerState));

  beforeEach(() => {
    countryService.getCountries.mockReturnValue(of(countriesResponse));
    TestBed.configureTestingModule({
      providers: [{ provide: CasesCreateCasefileCountryService, useValue: countryService }],
    });
  });

  it('resolves the unmodified active-Countries response', async () => {
    await expect(
      firstValueFrom(executeResolver(route, state) as Observable<ICasesCreateCasefileCountryReferenceDataResponse>),
    ).resolves.toEqual(countriesResponse);
    expect(countryService.getCountries).toHaveBeenCalledWith(true);
  });

  it('propagates service failures so route activation is cancelled', async () => {
    const problem = new HttpErrorResponse({ status: 503, error: { detail: 'Countries unavailable' } });
    countryService.getCountries.mockReturnValue(throwError(() => problem));

    await expect(firstValueFrom(executeResolver(route, state) as Observable<never>)).rejects.toBe(problem);
  });

  it('allows an empty successful response to resolve', async () => {
    countryService.getCountries.mockReturnValue(of({ count: 0, refData: [] }));

    await expect(
      firstValueFrom(executeResolver(route, state) as Observable<ICasesCreateCasefileCountryReferenceDataResponse>),
    ).resolves.toEqual({ count: 0, refData: [] });
  });
});
