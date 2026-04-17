import { IDashboardPageConfiguration } from '@hmcts/opal-frontend-common/pages/dashboard-page/interfaces';
import { DASHBOARD_CONFIG_DEFAULT_DASHBOARD } from './dashboard-config-default-dashboard.constant';
import { DashboardPageType } from '../types/dashboard.type';
import { DASHBOARD_TYPES } from './dashboard-types.constant';
import { SEARCH_DASHBOARD_CONFIGURATION } from 'src/app/flows/search/constants/search-dashboard-configuration.constant';
import { REPORTS_DASHBOARD_CONFIGURATION } from 'src/app/flows/reports/constants/reports-dashboard-configuration.constant';
import { ADMINISTRATION_DASHBOARD_CONFIGURATION } from 'src/app/flows/administration/constants/administration-dashboard-configuration.constant';

export const DASHBOARD_PAGE_CONFIGURATION_MAP: Record<DashboardPageType, IDashboardPageConfiguration> = {
  search: SEARCH_DASHBOARD_CONFIGURATION,
  cases: DASHBOARD_CONFIG_DEFAULT_DASHBOARD,
  reports: REPORTS_DASHBOARD_CONFIGURATION,
  administration: ADMINISTRATION_DASHBOARD_CONFIGURATION,
};

export const isDashboardPageType = (dashboardType: string): dashboardType is DashboardPageType =>
  DASHBOARD_TYPES.includes(dashboardType as DashboardPageType);
