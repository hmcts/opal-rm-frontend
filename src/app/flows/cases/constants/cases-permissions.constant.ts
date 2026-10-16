import { PERMISSIONS } from 'src/app/constants/permissions.constant';

export const CASES_PERMISSIONS = [
  PERMISSIONS['create-and-manage-draft-casefiles'],
  PERMISSIONS['check-and-validate-draft-casefiles'],
] as const;
