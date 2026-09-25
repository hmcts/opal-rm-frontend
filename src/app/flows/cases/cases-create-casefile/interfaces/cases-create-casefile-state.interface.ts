import type { CasesCreateCasefileCaseTypeSelection } from '../types/cases-create-casefile-case-type-selection.type';
import type { CasesCreateCasefileApplicantDetails } from '../types/cases-create-casefile-applicant-details.type';
import type { CasesCreateCasefilePaymentArrangement } from '../types/cases-create-casefile-payment-arrangement.type';
import type { ICasesCreateCasefileCommentsNotes } from './cases-create-casefile-comments-notes.interface';
import type { ICasesCreateCasefileInterestIndexation } from './cases-create-casefile-interest-indexation.interface';
import type { ICasesCreateCasefileCentralAuthorityDetails } from './cases-create-casefile-central-authority-details.interface';
import type { ICasesCreateCasefileRespondentDetails } from './cases-create-casefile-respondent-details.interface';
import type { ICasesCreateCasefileOrderDetails } from './cases-create-casefile-order-details.interface';
import type { ICasesCreateCasefileTaskStatuses } from './cases-create-casefile-task-statuses.interface';

export interface ICasesCreateCasefileState {
  caseTypeSelection: CasesCreateCasefileCaseTypeSelection | null;
  applicantDetails: CasesCreateCasefileApplicantDetails | null;
  respondentDetails: ICasesCreateCasefileRespondentDetails | null;
  orderDetails: ICasesCreateCasefileOrderDetails | null;
  interestAndIndexation: ICasesCreateCasefileInterestIndexation | null;
  centralAuthorityDetails: ICasesCreateCasefileCentralAuthorityDetails | null;
  paymentArrangement: CasesCreateCasefilePaymentArrangement | null;
  commentsAndNotes: ICasesCreateCasefileCommentsNotes | null;
  pendingOrderTermResultId: string | null;
  taskStatuses: ICasesCreateCasefileTaskStatuses;
  unsavedChanges: boolean;
  stateChanges: boolean;
}
