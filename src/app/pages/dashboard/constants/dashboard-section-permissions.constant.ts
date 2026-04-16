import { DashboardPageType } from '@app/pages/dashboard/types/dashboard.type';

import { ADMINISTRATION_PERMISSIONS } from '../../../flows/administration/constants/administration-permissions.constant';
import { SEARCH_PERMISSIONS } from 'src/app/flows/search/constants/search-permissions.constant';
import { REPORTS_PERMISSIONS } from 'src/app/flows/reports/constants/reports-permissions.constant';
import { ACCOUNTS_PERMISSIONS } from 'src/app/flows/accounts/constants/accounts-permissions.constant';

export const DASHBOARD_SECTION_PERMISSIONS: Partial<Record<DashboardPageType, readonly number[]>> = {
  search: SEARCH_PERMISSIONS,
  accounts: ACCOUNTS_PERMISSIONS,
  reports: REPORTS_PERMISSIONS,
  administration: ADMINISTRATION_PERMISSIONS,
};
