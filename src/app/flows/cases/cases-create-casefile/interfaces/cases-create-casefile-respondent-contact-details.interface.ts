import type { ICasesCreateCasefileRespondentAddress } from './cases-create-casefile-respondent-address.interface';

export interface ICasesCreateCasefileRespondentContactDetails {
  mainEmailAddress: string | null;
  otherEmailAddress: string | null;
  mainTelephoneNumber: string | null;
  otherTelephoneNumber: string | null;
  address: ICasesCreateCasefileRespondentAddress;
}
