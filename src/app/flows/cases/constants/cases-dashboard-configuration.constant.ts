import { IDashboardPageConfiguration } from '@hmcts/opal-frontend-common/pages/dashboard-page/interfaces';
import { CASES_CREATE_CASEFILE_DASHBOARD_LINKS } from '../cases-create-casefile/constants/cases-create-casefile-dashboard-links.constant';

export const CASES_DASHBOARD_CONFIGURATION: IDashboardPageConfiguration = {
  title: 'Cases',
  highlights: [],
  groups: [
    {
      id: 'create-cases',
      title: 'Create cases',
      links: [...CASES_CREATE_CASEFILE_DASHBOARD_LINKS],
    },
  ],
};
