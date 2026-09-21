import type { ICasesCreateCasefileMinorCreditorDetails } from './cases-create-casefile-minor-creditor-details.interface';

export interface ICasesCreateCasefileMinorCreditor {
  sequenceNumber: number;
  displayName: string;
  details: ICasesCreateCasefileMinorCreditorDetails;
}
