import { PERMISSIONS } from 'src/app/constants/permissions.constant';

export const REPORTS_PERMISSIONS = [
  PERMISSIONS['operational-report-by-enforcement'],
  PERMISSIONS['operational-report-by-payments'],
] as const;
