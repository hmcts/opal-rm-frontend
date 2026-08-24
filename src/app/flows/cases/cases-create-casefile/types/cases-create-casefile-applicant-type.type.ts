import type { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from '../constants/cases-create-casefile-applicant-types.constant';

export type CasesCreateCasefileApplicantType =
  (typeof CASES_CREATE_CASEFILE_APPLICANT_TYPES)[keyof typeof CASES_CREATE_CASEFILE_APPLICANT_TYPES];
