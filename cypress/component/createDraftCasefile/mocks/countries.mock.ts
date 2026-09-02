import type { ICasesCreateCasefileCountryReferenceDataResponse } from 'src/app/flows/cases/cases-create-casefile/services/interfaces/cases-create-casefile-country-reference-data-response.interface';

export const COUNTRIES_RESPONSE: ICasesCreateCasefileCountryReferenceDataResponse = {
  count: 2,
  refData: [
    {
      country_id: 826,
      cjs_code: 1,
      international_code: 'GB',
      country_name: 'United Kingdom',
      date_used_from: '2020-01-01',
      active: true,
    },
    {
      country_id: 250,
      cjs_code: 2,
      international_code: 'FR',
      country_name: 'France',
      date_used_from: '2020-01-01',
      active: true,
    },
  ],
};

export const EMPTY_COUNTRIES_RESPONSE: ICasesCreateCasefileCountryReferenceDataResponse = { count: 0, refData: [] };

export const createCountriesUnavailableProblem = (operationId: string) => ({
  title: 'Countries service unavailable',
  status: 503,
  detail: 'Countries could not be loaded',
  operation_id: operationId,
  retriable: true,
});
