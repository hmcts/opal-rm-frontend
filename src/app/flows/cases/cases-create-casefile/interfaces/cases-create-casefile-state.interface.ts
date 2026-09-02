import type { CasesCreateCasefileCaseTypeSelection } from '../types/cases-create-casefile-case-type-selection.type';
import type { ICasesCreateCasefileApplicantIndividual } from './cases-create-casefile-applicant-individual.interface';
import type { ICasesCreateCasefileRespondentDetails } from './cases-create-casefile-respondent-details.interface';
import type { ICasesCreateCasefileTaskStatuses } from './cases-create-casefile-task-statuses.interface';

export interface ICasesCreateCasefileState {
  caseTypeSelection: CasesCreateCasefileCaseTypeSelection | null;
  applicantDetails: ICasesCreateCasefileApplicantIndividual | null;
  respondentDetails: ICasesCreateCasefileRespondentDetails | null;
  taskStatuses: ICasesCreateCasefileTaskStatuses;
  unsavedChanges: boolean;
  stateChanges: boolean;
}
