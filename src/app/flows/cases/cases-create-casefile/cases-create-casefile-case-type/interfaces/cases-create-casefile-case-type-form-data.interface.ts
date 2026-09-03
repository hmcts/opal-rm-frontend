import { CasesCreateCasefileApplicantType } from '../../types/cases-create-casefile-applicant-type.type';
import { CasesCreateCasefileCaseType } from '../../types/cases-create-casefile-case-type.type';
import { CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_NAMES } from '../constants/cases-create-casefile-case-type-field-names.constant';

export interface ICasesCreateCasefileCaseTypeFormData {
  [CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_NAMES.caseType]: CasesCreateCasefileCaseType | null;
  [CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_NAMES.applicantType]: CasesCreateCasefileApplicantType | null;
}
