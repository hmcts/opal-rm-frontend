import type { ICasesCreateCasefileRespondentAddress } from './cases-create-casefile-respondent-address.interface';

export interface ICasesCreateCasefileRespondentThirdParty {
  nameOrOrganisation: string;
  relationship: string;
  reference: string | null;
  address: ICasesCreateCasefileRespondentAddress;
}
