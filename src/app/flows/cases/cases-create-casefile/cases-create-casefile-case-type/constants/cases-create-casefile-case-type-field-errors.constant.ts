import { ICasesCreateCasefileCaseTypeFieldErrors } from '../interfaces/cases-create-casefile-case-type-field-errors.interface';

export const CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_ERRORS: ICasesCreateCasefileCaseTypeFieldErrors = {
  caseType: { required: { message: 'Select a case type', priority: 1 } },
  applicantType: { required: { message: 'Select applicant type', priority: 1 } },
};
