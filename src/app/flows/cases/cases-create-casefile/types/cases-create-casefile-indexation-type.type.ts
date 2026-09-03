import { CASES_CREATE_CASEFILE_INDEXATION_TYPES } from '../constants/cases-create-casefile-indexation-types.constant';

export type CasesCreateCasefileIndexationType =
  (typeof CASES_CREATE_CASEFILE_INDEXATION_TYPES)[keyof typeof CASES_CREATE_CASEFILE_INDEXATION_TYPES];
