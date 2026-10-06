import { PERMISSIONS } from '@app/constants/permissions.constant';
import { IDashboardPageConfigurationLink } from '@hmcts/opal-frontend-common/pages/dashboard-page/interfaces';
import { CASES_DRAFT_CHECKER_ROUTING_PATHS } from '../cases-draft/routing/constants/cases-draft-checker-routing-paths.constant';
export const CASES_CHECKER_DASHBOARD_LINKS: IDashboardPageConfigurationLink[] = [
  {
    id: 'casesReviewCasefilesLink',
    text: 'Review cases',
    routerLink: ['/' + CASES_DRAFT_CHECKER_ROUTING_PATHS.root + '/' + CASES_DRAFT_CHECKER_ROUTING_PATHS.children.tabs],
    fragment: 'to-review',
    permissionIds: [PERMISSIONS['check-and-validate-draft-casefiles']],
    newTab: false,
    style: null,
  },
];
