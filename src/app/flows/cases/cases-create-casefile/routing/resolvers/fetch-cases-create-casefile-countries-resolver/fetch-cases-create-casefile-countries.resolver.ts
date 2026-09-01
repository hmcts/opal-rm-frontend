import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Observable } from 'rxjs';
import { CasesCreateCasefileCountryService } from '../../../services/cases-create-casefile-country.service';
import type { ICasesCreateCasefileCountryReferenceDataResponse } from '../../../services/interfaces/cases-create-casefile-country-reference-data-response.interface';

export const fetchCasesCreateCasefileCountriesResolver: ResolveFn<
  ICasesCreateCasefileCountryReferenceDataResponse
> = (): Observable<ICasesCreateCasefileCountryReferenceDataResponse> =>
  inject(CasesCreateCasefileCountryService).getCountries(true);
