import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';

export type CasesCreateCasefileAcceptedSnapshot = Pick<
  ICasesCreateCasefileState,
  | 'caseTypeSelection'
  | 'respondentDetails'
  | 'applicantDetails'
  | 'orderDetails'
  | 'orderTerms'
  | 'minorCreditors'
  | 'centralAuthorityDetails'
  | 'interestAndIndexation'
  | 'paymentArrangement'
  | 'commentsAndNotes'
>;
