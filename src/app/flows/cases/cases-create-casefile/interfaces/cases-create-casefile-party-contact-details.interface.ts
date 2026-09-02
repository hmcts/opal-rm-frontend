import type { ICasesCreateCasefilePartyAddress } from './cases-create-casefile-party-address.interface';

export interface ICasesCreateCasefilePartyContactDetails {
  mainEmailAddress: string | null;
  otherEmailAddress: string | null;
  mainTelephoneNumber: string | null;
  otherTelephoneNumber: string | null;
  address: ICasesCreateCasefilePartyAddress;
}
