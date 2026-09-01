import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ICasesCreateCasefileCountryReferenceDataResponse } from './interfaces/cases-create-casefile-country-reference-data-response.interface';
import { CasesCreateCasefileCountryService } from './cases-create-casefile-country.service';

describe('CasesCreateCasefileCountryService', () => {
  let service: CasesCreateCasefileCountryService;
  let httpTestingController: HttpTestingController;

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(CasesCreateCasefileCountryService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('gets active Countries from the maintenance proxy', () => {
    service.getCountries(true).subscribe((response) => expect(response).toEqual(countriesResponse));

    const request = httpTestingController.expectOne('/opal-maintenance-service/countries?active=true');
    expect(request.request.method).toBe('GET');
    request.flush(countriesResponse);
  });
});
