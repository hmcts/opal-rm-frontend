import type { CasesCreateCasefileIndexationType } from '../../types/cases-create-casefile-indexation-type.type';

export interface ICasesCreateCasefileInterestIndexationFormData {
  interestApplies: boolean | null;
  indexationType: CasesCreateCasefileIndexationType | null;
}
