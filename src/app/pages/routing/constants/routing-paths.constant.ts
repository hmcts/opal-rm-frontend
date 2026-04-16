import { IPagesRoutingPaths } from '@routing/pages/interfaces/routing-paths.interface';
import { DASHBOARD_ROUTING_PATHS } from '../../dashboard/constants/dashboard-routing-paths.constant';

export const PAGES_ROUTING_PATHS: IPagesRoutingPaths = {
  root: '',
  children: {
    dashboard: `/${DASHBOARD_ROUTING_PATHS.root}`,
  },
};
