import { CASES_PERMISSIONS } from '../../constants/cases-permissions.constant';
import { IDashboardPageConfigurationLink } from '@hmcts/opal-frontend-common/pages/dashboard-page/interfaces';

export const CASES_CREATE_CASEFILE_DASHBOARD_LINKS: IDashboardPageConfigurationLink[] = [
  {
    id: 'casesCreateCasefileLink',
    text: 'Create a case',
    routerLink: ['/cases/create-casefile'],
    fragment: null,
    permissionIds: [...CASES_PERMISSIONS],
    newTab: false,
    style: null,
  },
];
