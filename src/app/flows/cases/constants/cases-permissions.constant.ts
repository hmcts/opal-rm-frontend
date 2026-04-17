import { PERMISSIONS } from 'src/app/constants/permissions.constant';

export const CASES_PERMISSIONS = [
  PERMISSIONS['create-and-manage-draft-accounts'],
  PERMISSIONS['check-and-validate-draft-accounts'],
  PERMISSIONS['consolidate'],
] as const;
