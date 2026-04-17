import { IDashboardRoutingPaths } from '../interfaces/dashboard-routing-paths.interface';

export const DASHBOARD_ROUTING_PATHS: IDashboardRoutingPaths = {
  root: 'dashboard',
  children: {
    search: 'search',
    cases: 'cases',
    reports: 'reports',
    administration: 'administration',
  },
};
