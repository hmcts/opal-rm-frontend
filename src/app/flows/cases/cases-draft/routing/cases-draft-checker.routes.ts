import { inject } from '@angular/core';
import {
  BUSINESS_UNIT_ID_RESOLVER,
  businessUnitRoutePermissionsGuard,
} from '@hmcts/opal-frontend-common/guards/business-unit-route-permissions';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { authGuard } from '@hmcts/opal-frontend-common/guards/auth';
import { accountGuard } from '@hmcts/opal-frontend-common/guards/account';
import { release1cRmCreateCaseFilesFeatureFlagGuard } from '../../utils/resolve-create-case-files-release.utils';
import { resolveCasesDraftIdentity } from '../utils/cases-draft-identity';
import { CASES_DRAFT_DASHBOARD_MODE } from '../constants/cases-draft-dashboard-mode.token';
import { CasesDraftDashboardService } from '../services/cases-draft-dashboard.service';
import { CasesDraftNavigationService } from '../services/cases-draft-navigation.service';
import { casesDraftTabResolver } from './resolvers/cases-draft-tab.resolver';
import { casesDraftCountResolver } from './resolvers/cases-draft-count.resolver';
import { Routes } from '@angular/router';
import { TitleResolver } from '@hmcts/opal-frontend-common/resolvers/title';
import { PRIMARY_NAV_HIDDEN_ROUTE_DATA } from '@app/constants/route-data.constant';
import { CASES_DRAFT_CHECKER_ROUTING_PATHS } from './constants/cases-draft-checker-routing-paths.constant';

const children: Routes = [
  { path: '', pathMatch: 'full', redirectTo: CASES_DRAFT_CHECKER_ROUTING_PATHS.children.tabs },
  {
    path: CASES_DRAFT_CHECKER_ROUTING_PATHS.children.tabs,
    loadComponent: () =>
      import('../cases-draft-check-and-validate-tabs/cases-draft-check-and-validate-tabs.component').then(
        (module) => module.CasesDraftCheckAndValidateTabsComponent,
      ),
    data: { title: 'Review cases' },
    resolve: {
      title: TitleResolver,
      draftCasefiles: casesDraftTabResolver,
      rejectedCount: casesDraftCountResolver(),
      failedCount: casesDraftCountResolver('failed'),
    },
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

export const routing: Routes = [
  {
    path: CASES_DRAFT_CHECKER_ROUTING_PATHS.root,
    providers: [
      { provide: CASES_DRAFT_DASHBOARD_MODE, useValue: 'checker' },
      CasesDraftDashboardService,
      CasesDraftNavigationService,
      {
        provide: BUSINESS_UNIT_ID_RESOLVER,
        useFactory: () => {
          const store = inject(GlobalStore);
          return {
            resolveBusinessUnitId: () =>
              resolveCasesDraftIdentity(store.userState(), true, 'checker')?.businessUnitId ?? null,
          };
        },
      },
    ],
    children,
    canActivate: [
      authGuard,
      accountGuard,
      release1cRmCreateCaseFilesFeatureFlagGuard,
      businessUnitRoutePermissionsGuard,
    ],
    canActivateChild: [release1cRmCreateCaseFilesFeatureFlagGuard, businessUnitRoutePermissionsGuard],
    data: { sectionKey: 'cases', routePermissionId: 22 },
  },
];
