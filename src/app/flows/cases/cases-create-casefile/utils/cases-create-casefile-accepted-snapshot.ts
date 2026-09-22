import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import type { CasesCreateCasefileAcceptedSnapshot } from '../types/cases-create-casefile-accepted-snapshot.type';

/** Detaches accepted review data, retaining term presentation but excluding editor bookkeeping. */
export function acceptedCasefileSnapshot(state: ICasesCreateCasefileState): CasesCreateCasefileAcceptedSnapshot {
  return structuredClone({
    caseTypeSelection: state.caseTypeSelection,
    respondentDetails: state.respondentDetails,
    applicantDetails: state.applicantDetails,
    orderDetails: state.orderDetails,
    orderTerms: state.orderTerms,
    minorCreditors: state.minorCreditors,
    centralAuthorityDetails: state.centralAuthorityDetails,
    interestAndIndexation: state.interestAndIndexation,
    paymentArrangement: state.paymentArrangement,
    commentsAndNotes: state.commentsAndNotes,
  });
}
