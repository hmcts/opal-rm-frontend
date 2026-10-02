import { DashboardPageType } from '@app/pages/dashboard/types/dashboard.type';
import { CASES_PERMISSIONS } from 'src/app/flows/cases/constants/cases-permissions.constant';

// Sections without RM permissions remain inaccessible until their permissions are defined.
export const DASHBOARD_SECTION_PERMISSIONS: Partial<Record<DashboardPageType, readonly number[]>> = {
  cases: CASES_PERMISSIONS,
};
