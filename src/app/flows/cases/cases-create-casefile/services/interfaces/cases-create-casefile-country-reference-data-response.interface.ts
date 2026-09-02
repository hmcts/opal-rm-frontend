import type { ICasesCreateCasefileCountryReferenceDataItem } from './cases-create-casefile-country-reference-data-item.interface';

export interface ICasesCreateCasefileCountryReferenceDataResponse {
  count: number;
  refData: ICasesCreateCasefileCountryReferenceDataItem[];
}
