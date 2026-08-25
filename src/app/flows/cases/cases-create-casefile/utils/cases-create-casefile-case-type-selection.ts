import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from '../constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import type { CasesCreateCasefileCaseTypeSelection } from '../types/cases-create-casefile-case-type-selection.type';

export const isCasesCreateCasefileCaseTypeSelectionValid = (
  selection: unknown,
): selection is CasesCreateCasefileCaseTypeSelection => {
  if (!selection || typeof selection !== 'object' || !('caseType' in selection)) {
    return false;
  }

  const candidate = selection as { caseType?: unknown; applicantType?: unknown };

  if (candidate.caseType === CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN) {
    return Object.values(CASES_CREATE_CASEFILE_APPLICANT_TYPES).includes(
      candidate.applicantType as (typeof CASES_CREATE_CASEFILE_APPLICANT_TYPES)[keyof typeof CASES_CREATE_CASEFILE_APPLICANT_TYPES],
    );
  }

  return (
    (candidate.caseType === CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT ||
      candidate.caseType === CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS) &&
    !('applicantType' in candidate)
  );
};
