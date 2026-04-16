import { IDashboardPageConfiguration } from '@hmcts/opal-frontend-common/pages/dashboard-page/interfaces';
import { ACCOUNTS_CREATE_RECORDS_DASHBOARD_LINKS } from '../accounts-create-records/constants/accounts-create-records-dashboard-links.constant';
import { ACCOUNTS_RESULTING_DASHBOARD_LINKS } from '../accounts-resulting/constants/accounts-resulting-dashboard-links.constant';
import { ACCOUNTS_ENQUIRIES_DASHBOARD_LINKS } from '../accounts-enquiries/constants/account-enquiries-dashboard-links.constant';

export const ACCOUNTS_DASHBOARD_CONFIGURATION: IDashboardPageConfiguration = {
  title: 'Accounts',
  highlights: [],
  groups: [
    {
      id: 'create-records',
      title: 'Create records',
      links: [...ACCOUNTS_CREATE_RECORDS_DASHBOARD_LINKS],
    },
    {
      id: 'resulting',
      title: 'Resulting',
      links: [...ACCOUNTS_RESULTING_DASHBOARD_LINKS],
    },
    {
      id: 'enquiries',
      title: 'Enquiries',
      links: [...ACCOUNTS_ENQUIRIES_DASHBOARD_LINKS],
    },
  ],
};
