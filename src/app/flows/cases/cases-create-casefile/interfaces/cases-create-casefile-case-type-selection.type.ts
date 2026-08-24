import { CasesCreateCasefileApplicantType } from '../constants/cases-create-casefile-applicant-types.constant';
import {
  CASES_CREATE_CASEFILE_CASE_TYPES,
  CasesCreateCasefileCaseType,
} from '../constants/cases-create-casefile-case-types.constant';

export type CasesCreateCasefileCaseTypeSelection =
  | {
      caseType: typeof CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN;
      applicantType: CasesCreateCasefileApplicantType;
    }
  | {
      caseType: Exclude<CasesCreateCasefileCaseType, typeof CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN>;
    };
