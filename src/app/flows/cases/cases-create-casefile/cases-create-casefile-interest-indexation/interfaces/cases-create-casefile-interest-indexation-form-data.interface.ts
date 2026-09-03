import type { CasesCreateCasefileIndexationType } from '../../types/cases-create-casefile-indexation-type.type';
import { CASES_CREATE_CASEFILE_INTEREST_INDEXATION_FIELD_NAMES } from '../constants/cases-create-casefile-interest-indexation-field-names.constant';

export interface ICasesCreateCasefileInterestIndexationFormData {
  [CASES_CREATE_CASEFILE_INTEREST_INDEXATION_FIELD_NAMES.interestApplies]: boolean | null;
  [CASES_CREATE_CASEFILE_INTEREST_INDEXATION_FIELD_NAMES.indexationType]: CasesCreateCasefileIndexationType | null;
}
