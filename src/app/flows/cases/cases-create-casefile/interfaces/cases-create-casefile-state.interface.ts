import type { CasesCreateCasefileCaseTypeSelection } from '../types/cases-create-casefile-case-type-selection.type';
import type { ICasesCreateCasefileTaskStatuses } from './cases-create-casefile-task-statuses.interface';

export interface ICasesCreateCasefileState {
  caseTypeSelection: CasesCreateCasefileCaseTypeSelection | null;
  taskStatuses: ICasesCreateCasefileTaskStatuses;
  unsavedChanges: boolean;
  stateChanges: boolean;
}
