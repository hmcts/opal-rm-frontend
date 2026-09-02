import type { ICasesCreateCasefileInterestIndexationFieldErrors } from '../interfaces/cases-create-casefile-interest-indexation-field-errors.interface';

export const CASES_CREATE_CASEFILE_INTEREST_INDEXATION_FIELD_ERRORS: ICasesCreateCasefileInterestIndexationFieldErrors =
  {
    interestApplies: { required: { message: 'Choose whether interest applies', priority: 1 } },
    indexationType: { required: { message: 'Select what type of indexation applies', priority: 1 } },
  };
