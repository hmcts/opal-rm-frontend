import { CASES_DRAFT_ROUTING_PATHS } from '../../cases-draft/routing/constants/cases-draft-routing-paths.constant';
import { PERMISSIONS } from '@app/constants/permissions.constant';
import { IDashboardPageConfigurationLink } from '@hmcts/opal-frontend-common/pages/dashboard-page/interfaces';

export const CASES_CREATE_CASEFILE_DASHBOARD_LINKS: IDashboardPageConfigurationLink[] = [
  {
    id: 'casesCreateCasefileLink',
    text: 'Create cases',
    routerLink: ['/' + CASES_DRAFT_ROUTING_PATHS.root + '/' + CASES_DRAFT_ROUTING_PATHS.children.tabs],
    fragment: 'in-review',
    permissionIds: [PERMISSIONS['create-and-manage-draft-casefiles']],
    newTab: false,
    style: null,
  },
];
