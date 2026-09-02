import { IDashboardPageConfigurationLink } from '@hmcts/opal-frontend-common/pages/dashboard-page/interfaces';

export const CASES_CREATE_CASEFILE_DASHBOARD_LINKS: IDashboardPageConfigurationLink[] = [
  {
    id: 'casesCreateCasefileLink',
    text: 'Create a case',
    routerLink: ['/cases/create-casefile'],
    fragment: null,
    permissionIds: [],
    newTab: false,
    style: null,
  },
];
