import type { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';

export type CasesCreateCasefileTaskStatus =
  (typeof CASES_CREATE_CASEFILE_TASK_STATUSES)[keyof typeof CASES_CREATE_CASEFILE_TASK_STATUSES];
