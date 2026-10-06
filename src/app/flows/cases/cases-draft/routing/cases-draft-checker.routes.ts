import { Routes } from '@angular/router';
import { TitleResolver } from '@hmcts/opal-frontend-common/resolvers/title';
import { PRIMARY_NAV_HIDDEN_ROUTE_DATA } from '@app/constants/route-data.constant';
import { CASES_DRAFT_CHECKER_ROUTING_PATHS } from './constants/cases-draft-checker-routing-paths.constant';

export const routing: Routes = [
  { path: '', pathMatch: 'full', redirectTo: CASES_DRAFT_CHECKER_ROUTING_PATHS.children.tabs },
  {
    path: CASES_DRAFT_CHECKER_ROUTING_PATHS.children.tabs,
    loadComponent: () =>
      import('../cases-draft-create-and-manage-tabs/cases-draft-create-and-manage-tabs.component').then(
        (module) => module.CasesDraftCreateAndManageTabsComponent,
      ),
    data: { title: 'Review cases' },
    resolve: { title: TitleResolver },
  },
  {
    path: '',
    data: { ...PRIMARY_NAV_HIDDEN_ROUTE_DATA },
    children: [
      {
        path: CASES_DRAFT_CHECKER_ROUTING_PATHS.children.review + '/:draftCasefileId',
        loadComponent: () =>
          import('../cases-draft-placeholder/cases-draft-placeholder.component').then(
            (module) => module.CasesDraftPlaceholderComponent,
          ),
        data: { title: 'Review case', placeholderKind: 'review' },
        resolve: { title: TitleResolver },
      },
      {
        path: CASES_DRAFT_CHECKER_ROUTING_PATHS.children.view + '/:draftCasefileId',
        loadComponent: () =>
          import('../cases-draft-placeholder/cases-draft-placeholder.component').then(
            (module) => module.CasesDraftPlaceholderComponent,
          ),
        data: { title: 'View case details', placeholderKind: 'view' },
        resolve: { title: TitleResolver },
      },
    ],
  },
];
