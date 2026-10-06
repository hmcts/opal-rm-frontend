import { casesDraftCheckerAccessGuard } from '@app/flows/cases/cases-draft/routing/guards/cases-draft-checker-access.guard';
import { CASES_DRAFT_CHECKER_ROUTING_PATHS } from '@app/flows/cases/cases-draft/routing/constants/cases-draft-checker-routing-paths.constant';
import { CASES_DRAFT_DASHBOARD_MODE } from '@app/flows/cases/cases-draft/constants/cases-draft-dashboard-mode.token';
import { CasesDraftDashboardService } from '@app/flows/cases/cases-draft/services/cases-draft-dashboard.service';
import { CasesDraftNavigationService } from '@app/flows/cases/cases-draft/services/cases-draft-navigation.service';
import { CasesDraftCheckerLoadService } from '@app/flows/cases/cases-draft/services/cases-draft-checker-load.service';
import { TitleResolver } from '@hmcts/opal-frontend-common/resolvers/title';
import { casesDraftAccessGuard } from '@app/flows/cases/cases-draft/routing/guards/cases-draft-access.guard';
import { CASES_DRAFT_ROUTING_PATHS } from '@app/flows/cases/cases-draft/routing/constants/cases-draft-routing-paths.constant';
import { inject } from '@angular/core';
import { resolveCreateCaseFilesRelease } from '@app/flows/cases/utils/resolve-create-case-files-release.utils';
import { PAGES_ROUTING_PATHS as COMMON_PAGES_ROUTING_PATHS } from '@hmcts/opal-frontend-common/pages/routing/constants';
import { CanActivateFn, Router, Routes } from '@angular/router';
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

export const release1cRmCreateCaseFilesFeatureFlagGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const enabled = await resolveCreateCaseFilesRelease(route, state);
  if (enabled === null) {
    return false;
  }
  return enabled || router.createUrlTree([`/${COMMON_PAGES_ROUTING_PATHS.children.accessDenied}`]);
};

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
  {
    path: CASES_DRAFT_CHECKER_ROUTING_PATHS.root,
    providers: [
      { provide: CASES_DRAFT_DASHBOARD_MODE, useValue: 'checker' },
      CasesDraftDashboardService,
      CasesDraftNavigationService,
      CasesDraftCheckerLoadService,
    ],
    loadChildren: () =>
      import('../../flows/cases/cases-draft/routing/cases-draft-checker.routes').then((module) => module.routing),
    canActivate: [authGuard, accountGuard, release1cRmCreateCaseFilesFeatureFlagGuard, casesDraftCheckerAccessGuard],
    canActivateChild: [release1cRmCreateCaseFilesFeatureFlagGuard, casesDraftCheckerAccessGuard],
    data: { sectionKey: 'cases' },
  },
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
