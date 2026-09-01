import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { ICasesCreateCasefileCountryReferenceDataResponse } from './interfaces/cases-create-casefile-country-reference-data-response.interface';

@Injectable({ providedIn: 'root' })
export class CasesCreateCasefileCountryService {
  private readonly http = inject(HttpClient);
  private readonly countriesUrl = '/opal-maintenance-service/countries';

  public getCountries(active: boolean): Observable<ICasesCreateCasefileCountryReferenceDataResponse> {
    return this.http.get<ICasesCreateCasefileCountryReferenceDataResponse>(this.countriesUrl, {
      params: { active },
    });
  }
}
