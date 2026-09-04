import { CASES_CREATE_CASEFILE_TASK_STATUSES } from './cases-create-casefile-task-statuses.constant';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import type { ICasesCreateCasefileTaskStatuses } from '../interfaces/cases-create-casefile-task-statuses.interface';

export const CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES: ICasesCreateCasefileTaskStatuses = {
  respondent: CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED,
  applicant: CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED,
  centralAuthority: CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL,
  orderDetails: CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED,
  orderTerms: CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED,
  interestAndIndexation: CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED,
  managingPayments: CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED,
  commentsAndNotes: CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL,
};

export const CASES_CREATE_CASEFILE_STATE: ICasesCreateCasefileState = {
  caseTypeSelection: null,
  applicantDetails: null,
  respondentDetails: null,
  interestAndIndexation: null,
  centralAuthorityDetails: null,
  paymentArrangement: null,
  taskStatuses: { ...CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES },
  unsavedChanges: false,
  stateChanges: false,
};
