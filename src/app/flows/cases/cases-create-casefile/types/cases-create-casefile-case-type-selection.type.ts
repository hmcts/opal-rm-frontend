import type { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import type { CasesCreateCasefileApplicantType } from './cases-create-casefile-applicant-type.type';
import type { CasesCreateCasefileCaseType } from './cases-create-casefile-case-type.type';

export type CasesCreateCasefileCaseTypeSelection =
  | {
      caseType: typeof CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN;
      applicantType: CasesCreateCasefileApplicantType;
    }
  | {
      caseType: Exclude<CasesCreateCasefileCaseType, typeof CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN>;
    };
