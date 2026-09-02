import type { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../constants/cases-create-casefile-applicant-bank-types.constant';

export type CasesCreateCasefileApplicantBankType =
  (typeof CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES)[keyof typeof CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES];
