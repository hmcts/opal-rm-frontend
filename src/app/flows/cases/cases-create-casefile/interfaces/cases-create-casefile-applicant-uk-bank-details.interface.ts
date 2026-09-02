import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../constants/cases-create-casefile-applicant-bank-types.constant';

export interface ICasesCreateCasefileApplicantUkBankDetails {
  type: typeof CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK;
  nameOnAccount: string;
  sortCode: string;
  accountNumber: string;
  paymentReference: string;
}
