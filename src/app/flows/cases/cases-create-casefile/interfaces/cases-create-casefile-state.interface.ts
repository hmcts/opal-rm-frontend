import { CasesCreateCasefileCaseTypeSelection } from '../types/cases-create-casefile-case-type-selection.type';

export interface ICasesCreateCasefileState {
  caseTypeSelection: CasesCreateCasefileCaseTypeSelection | null;
  unsavedChanges: boolean;
  stateChanges: boolean;
}
