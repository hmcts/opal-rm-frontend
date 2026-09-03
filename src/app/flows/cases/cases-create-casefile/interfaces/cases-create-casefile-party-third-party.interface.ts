import type { ICasesCreateCasefilePartyAddress } from './cases-create-casefile-party-address.interface';

export interface ICasesCreateCasefilePartyThirdParty {
  nameOrOrganisation: string;
  relationship: string;
  reference: string | null;
  address: ICasesCreateCasefilePartyAddress;
}
