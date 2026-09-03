const unresolvedCaseType = 'create_casefile_case_type_case_type';
const applicantTypeSuffix = 'applicant_type';

export const CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_NAMES = {
  caseType: unresolvedCaseType,
  applicantType: `create_casefile_case_type_${applicantTypeSuffix}`,
} as const;
