import { IChildRoutingPaths } from '@hmcts/opal-frontend-common/pages/routing/interfaces';

export interface IDashboardRoutingPaths extends IChildRoutingPaths {
  children: {
    search: string;
    accounts: string;
    reports: string;
    administration: string;
  };
}
