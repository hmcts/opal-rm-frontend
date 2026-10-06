import { routing as casesDraftCheckerRouting } from '@app/flows/cases/cases-draft/routing/cases-draft-checker.routes';
import { release1cRmCreateCaseFilesFeatureFlagGuard } from '@app/flows/cases/utils/resolve-create-case-files-release.utils';
import { TitleResolver } from '@hmcts/opal-frontend-common/resolvers/title';
import { casesDraftAccessGuard } from '@app/flows/cases/cases-draft/routing/guards/cases-draft-access.guard';
import { CASES_DRAFT_ROUTING_PATHS } from '@app/flows/cases/cases-draft/routing/constants/cases-draft-routing-paths.constant';
import { Routes } from '@angular/router';
import { PAGES_ROUTING_PATHS } from './constants/routing-paths.constant';
import { DASHBOARD_ROUTING_PATHS } from '../dashboard/constants/dashboard-routing-paths.constant';
import { accountGuard } from '@hmcts/opal-frontend-common/guards/account';
import { authGuard } from '@hmcts/opal-frontend-common/guards/auth';
import { dashboardLandingGuard } from '../dashboard/guards/dashboard-landing/dashboard-landing.guard';
import { dashboardTypeGuard } from '../dashboard/guards/dashboard-type/dashboard-type.guard';
import { dashboardSectionPermissionsGuard } from '../dashboard/guards/dashboard-section-permissions/dashboard-section-permissions.guard';
import { canDeactivateGuard } from '@hmcts/opal-frontend-common/guards/can-deactivate';
import { PRIMARY_NAV_HIDDEN_ROUTE_DATA } from '@app/constants/route-data.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '@app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { routing as casesCreateCasefileRouting } from '@app/flows/cases/cases-create-casefile/routing/cases-create-casefile.routes';

export const routing: Routes = [
  { path: '', redirectTo: PAGES_ROUTING_PATHS.children.dashboard, pathMatch: 'full' },
  {
    path: DASHBOARD_ROUTING_PATHS.root,
    loadComponent: () => import('../dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard, accountGuard, dashboardLandingGuard],
    pathMatch: 'full',
  },
  {
    path: `${DASHBOARD_ROUTING_PATHS.root}/:dashboardType`,
    loadComponent: () => import('../dashboard/dashboard.component').then((c) => c.DashboardComponent),
    canActivate: [authGuard, accountGuard, dashboardTypeGuard, dashboardSectionPermissionsGuard],
  },
  ...casesDraftCheckerRouting,
  {
    path: CASES_DRAFT_ROUTING_PATHS.root,
    loadChildren: () =>
      import('../../flows/cases/cases-draft/routing/cases-draft.routes').then((module) => module.routing),
    canActivate: [authGuard, accountGuard, release1cRmCreateCaseFilesFeatureFlagGuard, casesDraftAccessGuard],
    canActivateChild: [release1cRmCreateCaseFilesFeatureFlagGuard, casesDraftAccessGuard],
    data: { sectionKey: 'cases' },
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.root,
    canActivate: [authGuard, accountGuard, release1cRmCreateCaseFilesFeatureFlagGuard, casesDraftAccessGuard],
    canActivateChild: [release1cRmCreateCaseFilesFeatureFlagGuard, casesDraftAccessGuard],
    data: { ...PRIMARY_NAV_HIDDEN_ROUTE_DATA, sectionKey: 'cases' },
    children: [
      {
        path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.checkCaseDetails + '/:draftCasefileId',
        loadComponent: () =>
          import('../../flows/cases/cases-draft/cases-draft-placeholder/cases-draft-placeholder.component').then(
            (module) => module.CasesDraftPlaceholderComponent,
          ),
        data: { title: 'Check case details', placeholderKind: 'details' },
        resolve: { title: TitleResolver },
      },
      {
        path: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList + '/:draftCasefileId',
        loadComponent: () =>
          import('../../flows/cases/cases-draft/cases-draft-placeholder/cases-draft-placeholder.component').then(
            (module) => module.CasesDraftPlaceholderComponent,
          ),
        data: { title: 'Amend case', placeholderKind: 'amendment' },
        resolve: { title: TitleResolver },
      },
    ],
  },
  {
    path: CASES_CREATE_CASEFILE_ROUTING_PATHS.root,
    loadComponent: () =>
      import('../../flows/cases/cases-create-casefile/cases-create-casefile.component').then(
        (component) => component.CasesCreateCasefileComponent,
      ),
    children: casesCreateCasefileRouting,
    canActivate: [authGuard, accountGuard, release1cRmCreateCaseFilesFeatureFlagGuard, casesDraftAccessGuard],
    canActivateChild: [release1cRmCreateCaseFilesFeatureFlagGuard, casesDraftAccessGuard],
    canDeactivate: [canDeactivateGuard],
    data: {
      ...PRIMARY_NAV_HIDDEN_ROUTE_DATA,
      sectionKey: 'cases',
    },
  },
];
