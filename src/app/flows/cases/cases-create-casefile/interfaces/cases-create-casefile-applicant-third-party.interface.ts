import type { ICasesCreateCasefileApplicantAddress } from './cases-create-casefile-applicant-address.interface';

export interface ICasesCreateCasefileApplicantThirdParty {
  nameOrOrganisation: string;
  relationship: string;
  reference: string | null;
  address: ICasesCreateCasefileApplicantAddress;
}
