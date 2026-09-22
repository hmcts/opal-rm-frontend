import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { isCasesCreateCasefileIndividualApplicantSelection } from './cases-create-casefile-individual-applicant-selection';
import { isCasesCreateCasefileOrganisationApplicantSelection } from './cases-create-casefile-organisation-applicant-selection';

/** Accepted terms become complete once every term has an applicable creditor. */
export function acceptedOrderTermsComplete(state: ICasesCreateCasefileState): boolean {
  return (
    state.orderTerms.length > 0 &&
    state.orderTerms.every((term) => {
      const creditor = term.creditor;
      if (!creditor) return false;
      if (creditor.type === 'major') return creditor.majorCreditorId > 0;
      if (creditor.type === 'minor')
        return state.minorCreditors.some((item) => item.sequenceNumber === creditor.sequenceNumber);
      const applicant = state.applicantDetails;
      return (
        !!applicant &&
        ('organisationName' in applicant
          ? isCasesCreateCasefileOrganisationApplicantSelection(state.caseTypeSelection)
          : isCasesCreateCasefileIndividualApplicantSelection(state.caseTypeSelection))
      );
    })
  );
}
