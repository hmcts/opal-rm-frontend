import { IDashboardPageConfigurationLink } from '@hmcts/opal-frontend-common/pages/dashboard-page/interfaces';

export const ACCOUNTS_CREATE_RECORDS_DASHBOARD_LINKS: IDashboardPageConfigurationLink[] = [
  {
    id: 'accountsEnterOrdersAndApplicationsLink',
    text: 'Enter orders and applications',
    routerLink: ['/'],
    fragment: null,
    permissionIds: [],
    newTab: false,
    style: null,
  },
  {
    id: 'accountsEnterOrdersAndApplicationsAlternativeLink',
    text: 'Enter orders and applications (alternative)',
    routerLink: ['/'],
    fragment: null,
    permissionIds: [],
    newTab: false,
    style: null,
  },
];
