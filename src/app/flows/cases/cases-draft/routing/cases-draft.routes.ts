import { Routes } from '@angular/router';
import { TitleResolver } from '@hmcts/opal-frontend-common/resolvers/title';
import { casesDraftAllRejectedResolver } from './resolvers/cases-draft-all-rejected.resolver';
import { casesDraftTabResolver } from './resolvers/cases-draft-tab.resolver';
import { casesDraftCountResolver } from './resolvers/cases-draft-count.resolver';
import { CASES_DRAFT_ROUTING_PATHS } from './constants/cases-draft-routing-paths.constant';

export const routing: Routes = [
  { path: '', pathMatch: 'full', redirectTo: CASES_DRAFT_ROUTING_PATHS.children.tabs },
  {
    path: CASES_DRAFT_ROUTING_PATHS.children.tabs,
    loadComponent: () =>
      import('../cases-draft-create-and-manage-tabs/cases-draft-create-and-manage-tabs.component').then(
        (module) => module.CasesDraftCreateAndManageTabsComponent,
      ),
    data: { title: 'Create cases' },
    resolve: { title: TitleResolver, draftCasefiles: casesDraftTabResolver, rejectedCount: casesDraftCountResolver() },
  },
  {
    path: CASES_DRAFT_ROUTING_PATHS.children.rejections,
    loadComponent: () =>
      import('../cases-draft-create-and-manage-tabs/cases-draft-create-and-manage-view-all-rejected/cases-draft-create-and-manage-view-all-rejected.component').then(
        (module) => module.CasesDraftCreateAndManageViewAllRejectedComponent,
      ),
    data: { title: 'All rejected cases' },
    resolve: { title: TitleResolver, allRejectedCasefiles: casesDraftAllRejectedResolver },
    runGuardsAndResolvers: 'always',
  },
];
