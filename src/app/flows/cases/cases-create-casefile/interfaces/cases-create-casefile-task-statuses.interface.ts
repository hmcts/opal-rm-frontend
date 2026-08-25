import type { CasesCreateCasefileTaskStatus } from '../types/cases-create-casefile-task-status.type';

export interface ICasesCreateCasefileTaskStatuses {
  respondent: CasesCreateCasefileTaskStatus;
  applicant: CasesCreateCasefileTaskStatus;
  centralAuthority: CasesCreateCasefileTaskStatus;
  orderDetails: CasesCreateCasefileTaskStatus;
  orderTerms: CasesCreateCasefileTaskStatus;
  interestAndIndexation: CasesCreateCasefileTaskStatus;
  managingPayments: CasesCreateCasefileTaskStatus;
  commentsAndNotes: CasesCreateCasefileTaskStatus;
}
