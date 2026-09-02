import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from '../constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import type { CasesCreateCasefileCaseTypeSelection } from '../types/cases-create-casefile-case-type-selection.type';
import { isCasesCreateCasefileCaseTypeSelectionValid } from './cases-create-casefile-case-type-selection';

export const isCasesCreateCasefileOrganisationApplicantSelection = (
  selection: unknown,
): selection is CasesCreateCasefileCaseTypeSelection => {
  if (!isCasesCreateCasefileCaseTypeSelectionValid(selection)) return false;

  return (
    selection.caseType === CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN &&
    selection.applicantType === CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION
  );
};
