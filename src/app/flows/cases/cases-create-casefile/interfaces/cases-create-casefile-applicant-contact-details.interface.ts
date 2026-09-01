import type { ICasesCreateCasefileApplicantAddress } from './cases-create-casefile-applicant-address.interface';

export interface ICasesCreateCasefileApplicantContactDetails {
  mainEmailAddress: string | null;
  otherEmailAddress: string | null;
  mainTelephoneNumber: string | null;
  otherTelephoneNumber: string | null;
  address: ICasesCreateCasefileApplicantAddress;
}
