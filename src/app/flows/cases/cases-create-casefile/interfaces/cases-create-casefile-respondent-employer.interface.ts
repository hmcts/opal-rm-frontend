import type { ICasesCreateCasefilePartyAddress } from './cases-create-casefile-party-address.interface';

export interface ICasesCreateCasefileRespondentEmployer {
  employerName: string;
  employeeReference: string | null;
  emailAddress: string | null;
  telephoneNumber: string | null;
  address: ICasesCreateCasefilePartyAddress;
}
