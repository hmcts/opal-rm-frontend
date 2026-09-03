import type { ICasesCreateCasefileInterestIndexationFieldErrors } from '../interfaces/cases-create-casefile-interest-indexation-field-errors.interface';
import { CASES_CREATE_CASEFILE_INTEREST_INDEXATION_FIELD_NAMES } from './cases-create-casefile-interest-indexation-field-names.constant';

export const CASES_CREATE_CASEFILE_INTEREST_INDEXATION_FIELD_ERRORS: ICasesCreateCasefileInterestIndexationFieldErrors =
  {
    [CASES_CREATE_CASEFILE_INTEREST_INDEXATION_FIELD_NAMES.interestApplies]: {
      required: { message: 'Choose whether interest applies', priority: 1 },
    },
    [CASES_CREATE_CASEFILE_INTEREST_INDEXATION_FIELD_NAMES.indexationType]: {
      required: { message: 'Select what type of indexation applies', priority: 1 },
    },
  };
