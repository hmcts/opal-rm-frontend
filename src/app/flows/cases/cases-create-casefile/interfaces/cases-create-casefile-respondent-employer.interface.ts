import type { ICasesCreateCasefileRespondentAddress } from './cases-create-casefile-respondent-address.interface';

export interface ICasesCreateCasefileRespondentEmployer {
  employerName: string;
  employeeReference: string | null;
  emailAddress: string | null;
  telephoneNumber: string | null;
  address: ICasesCreateCasefileRespondentAddress;
}
