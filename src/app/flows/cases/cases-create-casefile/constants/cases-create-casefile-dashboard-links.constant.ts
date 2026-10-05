import { CASES_DRAFT_ROUTING_PATHS } from '../../cases-draft/routing/constants/cases-draft-routing-paths.constant';
import { CASES_PERMISSIONS } from '../../constants/cases-permissions.constant';
import { IDashboardPageConfigurationLink } from '@hmcts/opal-frontend-common/pages/dashboard-page/interfaces';

export const CASES_CREATE_CASEFILE_DASHBOARD_LINKS: IDashboardPageConfigurationLink[] = [
  {
    id: 'casesCreateCasefileLink',
    text: 'Create cases',
    routerLink: ['/' + CASES_DRAFT_ROUTING_PATHS.root + '/' + CASES_DRAFT_ROUTING_PATHS.children.tabs],
    fragment: 'in-review',
    permissionIds: [...CASES_PERMISSIONS],
    newTab: false,
    style: null,
  },
];
