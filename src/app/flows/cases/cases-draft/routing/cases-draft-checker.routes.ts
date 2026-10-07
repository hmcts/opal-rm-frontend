import { resolveCasesDraftReadIdentity } from '../utils/cases-draft-casefile-permissions';
import { casesDraftCasefileResolver } from './resolvers/cases-draft-casefile.resolver';
import { CasesCreateCasefileOrderTermLookupsService } from '../../cases-create-casefile/cases-create-casefile-order-terms-input/services/cases-create-casefile-order-term-lookups.service';
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

const dashboardChildren: Routes = [
  { path: '', pathMatch: 'full', redirectTo: CASES_DRAFT_CHECKER_ROUTING_PATHS.children.tabs },
  {
    path: CASES_DRAFT_CHECKER_ROUTING_PATHS.children.tabs,
    loadComponent: () =>
      import('../cases-draft-check-and-validate-tabs/cases-draft-check-and-validate-tabs.component').then(
        (m) => m.CasesDraftCheckAndValidateTabsComponent,
      ),
    data: { title: 'Review cases' },
    resolve: {
      title: TitleResolver,
      draftCasefiles: casesDraftTabResolver,
      rejectedCount: casesDraftCountResolver(),
      failedCount: casesDraftCountResolver('failed'),
    },
  },
];
const businessUnitProvider = (read: boolean) => ({
  provide: BUSINESS_UNIT_ID_RESOLVER,
  useFactory: () => {
    const store = inject(GlobalStore);
    return {
      resolveBusinessUnitId: () =>
        (read
          ? resolveCasesDraftReadIdentity(store.userState(), true)
          : resolveCasesDraftIdentity(store.userState(), true, 'checker')
        )?.businessUnitId ?? null,
    };
  },
});
const children: Routes = [
  {
    path: '',
    providers: [businessUnitProvider(false)],
    canActivate: [businessUnitRoutePermissionsGuard],
    canActivateChild: [businessUnitRoutePermissionsGuard],
    data: { routePermissionId: 22 },
    children: dashboardChildren,
  },
  {
    path: '',
    loadComponent: () =>
      import('../../cases-create-casefile/cases-create-casefile.component').then((m) => m.CasesCreateCasefileComponent),
    providers: [businessUnitProvider(true), CasesCreateCasefileOrderTermLookupsService],
    canActivate: [businessUnitRoutePermissionsGuard],
    canActivateChild: [businessUnitRoutePermissionsGuard],
    data: { ...PRIMARY_NAV_HIDDEN_ROUTE_DATA, routePermissionId: [21, 22] },
    children: [
      {
        path: CASES_DRAFT_CHECKER_ROUTING_PATHS.children.review + '/:draftCasefileId',
        loadComponent: () =>
          import('../../cases-create-casefile/cases-create-casefile-check-details/cases-create-casefile-check-details.component').then(
            (m) => m.CasesCreateCasefileCheckDetailsComponent,
          ),
        data: { title: 'Review case', casefileIntent: 'checker-review' },
        resolve: { title: TitleResolver, draftCasefile: casesDraftCasefileResolver },
      },
      {
        path: CASES_DRAFT_CHECKER_ROUTING_PATHS.children.view + '/:draftCasefileId',
        loadComponent: () =>
          import('../../cases-create-casefile/cases-create-casefile-check-details/cases-create-casefile-check-details.component').then(
            (m) => m.CasesCreateCasefileCheckDetailsComponent,
          ),
        data: { title: 'View case details', casefileIntent: 'checker-view' },
        resolve: { title: TitleResolver, draftCasefile: casesDraftCasefileResolver },
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
    ],
    children,
    canActivate: [authGuard, accountGuard, release1cRmCreateCaseFilesFeatureFlagGuard],
    canActivateChild: [release1cRmCreateCaseFilesFeatureFlagGuard],
    data: { sectionKey: 'cases' },
  },
];
