import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../constants/cases-create-casefile-applicant-bank-types.constant';
import type { ICasesCreateCasefileApplicantNonUkBankDetails } from '../interfaces/cases-create-casefile-applicant-non-uk-bank-details.interface';
import type { ICasesCreateCasefileApplicantUkBankDetails } from '../interfaces/cases-create-casefile-applicant-uk-bank-details.interface';

export type CasesCreateCasefileApplicantBankDetails =
  | ICasesCreateCasefileApplicantUkBankDetails
  | ICasesCreateCasefileApplicantNonUkBankDetails
  | { type: typeof CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE };
