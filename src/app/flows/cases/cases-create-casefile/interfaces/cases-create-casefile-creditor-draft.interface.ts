import type { ICasesCreateCasefileMinorCreditorDetails } from './cases-create-casefile-minor-creditor-details.interface';

export interface ICasesCreateCasefileCreditorDraft {
  termId: number;
  branch: 'add-new';
  details?: ICasesCreateCasefileMinorCreditorDetails;
  countryName?: string;
  existingSequenceNumber?: number;
}
