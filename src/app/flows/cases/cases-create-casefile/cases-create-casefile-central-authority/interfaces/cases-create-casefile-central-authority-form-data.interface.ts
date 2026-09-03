import { CASES_CREATE_CASEFILE_CENTRAL_AUTHORITY_FIELD_NAMES as FIELD_NAMES } from '../constants/cases-create-casefile-central-authority-field-names.constant';

export interface ICasesCreateCasefileCentralAuthorityFormData {
  [FIELD_NAMES.remoReference]: string | null;
  [FIELD_NAMES.centralAuthorityReference]: string | null;
  [FIELD_NAMES.majorCreditorId]: number | null;
}
