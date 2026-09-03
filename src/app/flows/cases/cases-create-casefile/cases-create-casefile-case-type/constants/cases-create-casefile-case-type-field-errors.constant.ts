import { ICasesCreateCasefileCaseTypeFieldErrors } from '../interfaces/cases-create-casefile-case-type-field-errors.interface';
import { CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_NAMES } from './cases-create-casefile-case-type-field-names.constant';

export const CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_ERRORS: ICasesCreateCasefileCaseTypeFieldErrors = {
  [CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_NAMES.caseType]: {
    required: { message: 'Select a case type', priority: 1 },
  },
  [CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_NAMES.applicantType]: {
    required: { message: 'Select applicant type', priority: 1 },
  },
};
