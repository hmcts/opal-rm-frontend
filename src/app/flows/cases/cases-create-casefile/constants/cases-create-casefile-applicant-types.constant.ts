export const CASES_CREATE_CASEFILE_APPLICANT_TYPES = {
  INDIVIDUAL: 'Individual',
  ORGANISATION: 'Organisation',
} as const;

export type CasesCreateCasefileApplicantType =
  (typeof CASES_CREATE_CASEFILE_APPLICANT_TYPES)[keyof typeof CASES_CREATE_CASEFILE_APPLICANT_TYPES];
