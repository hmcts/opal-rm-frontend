import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../constants/cases-create-casefile-applicant-bank-types.constant';

export interface ICasesCreateCasefileApplicantNonUkBankDetails {
  type: typeof CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK;
  nameOnAccount: string;
  accountNumber: string | null;
  paymentReference: string | null;
  bicSwiftCode: string | null;
  iban: string | null;
  bankName: string | null;
  branchSortCode: string | null;
}
