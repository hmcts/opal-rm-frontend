import { CASES_CREATE_CASEFILE_INDEXATION_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-indexation-types.constant';
import type { ICasesCreateCasefileInterestIndexation } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-interest-indexation.interface';

export const SAVED_INTEREST_AND_INDEXATION: ICasesCreateCasefileInterestIndexation = {
  interestApplies: true,
  indexationType: CASES_CREATE_CASEFILE_INDEXATION_TYPES.CPI,
};
