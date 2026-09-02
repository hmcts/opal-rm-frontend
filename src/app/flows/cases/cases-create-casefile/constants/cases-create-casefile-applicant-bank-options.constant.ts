import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from './cases-create-casefile-applicant-bank-types.constant';

export const CASES_CREATE_CASEFILE_APPLICANT_BANK_OPTIONS = [
  { key: 'UK bank account', value: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK },
  { key: 'Non-UK bank account', value: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK },
  { key: 'None or not applicable', value: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE },
] as const;
