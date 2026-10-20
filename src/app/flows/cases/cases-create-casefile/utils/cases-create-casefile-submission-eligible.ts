import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import { isCasesCreateCasefileCaseTypeSelectionValid } from './cases-create-casefile-case-type-selection';
import { acceptedOrderTermsComplete } from './cases-create-casefile-order-terms-complete';

/** Requires accepted mandatory sections and no unfinished editing context before submission. */
export function isCasesCreateCasefileSubmissionEligible(state: ICasesCreateCasefileState): boolean {
  const required = [
    'respondent',
    'applicant',
    'orderDetails',
    'orderTerms',
    'interestAndIndexation',
    'managingPayments',
  ] as const;
  return (
    isCasesCreateCasefileCaseTypeSelectionValid(state.caseTypeSelection) &&
    required.every((task) => state.taskStatuses[task] === CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED) &&
    state.respondentDetails !== null &&
    state.applicantDetails !== null &&
    state.orderDetails !== null &&
    state.interestAndIndexation !== null &&
    state.paymentArrangement !== null &&
    acceptedOrderTermsComplete(state) &&
    !state.unsavedChanges &&
    state.pendingOrderTermResultId === null &&
    state.orderTermDraft === null &&
    state.orderTermAmendment === null &&
    state.orderTermRemoval === null &&
    state.creditorDraft === null &&
    state.minorCreditorRemoval === null
  );
}
