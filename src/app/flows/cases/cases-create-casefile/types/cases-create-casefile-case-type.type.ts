import type { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';

export type CasesCreateCasefileCaseType =
  (typeof CASES_CREATE_CASEFILE_CASE_TYPES)[keyof typeof CASES_CREATE_CASEFILE_CASE_TYPES];
