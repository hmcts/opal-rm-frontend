import { IDashboardPageConfiguration } from '@hmcts/opal-frontend-common/pages/dashboard-page/interfaces';
import { CASES_CREATE_RECORDS_DASHBOARD_LINKS } from '../cases-create-records/constants/cases-create-records-dashboard-links.constant';
import { CASES_RESULTING_DASHBOARD_LINKS } from '../cases-resulting/constants/cases-resulting-dashboard-links.constant';
import { CASES_ENQUIRIES_DASHBOARD_LINKS } from '../cases-enquiries/constants/cases-enquiries-dashboard-links.constant';

export const CASES_DASHBOARD_CONFIGURATION: IDashboardPageConfiguration = {
  title: 'Cases',
  highlights: [],
  groups: [
    {
      id: 'create-records',
      title: 'Create records',
      links: [...CASES_CREATE_RECORDS_DASHBOARD_LINKS],
    },
    {
      id: 'resulting',
      title: 'Resulting',
      links: [...CASES_RESULTING_DASHBOARD_LINKS],
    },
    {
      id: 'enquiries',
      title: 'Enquiries',
      links: [...CASES_ENQUIRIES_DASHBOARD_LINKS],
    },
  ],
};
