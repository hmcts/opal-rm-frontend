import { Routes } from '@angular/router';
import { PAGES_ROUTING_PATHS } from './constants/routing-paths.constant';
import { DASHBOARD_ROUTING_PATHS } from '../dashboard/constants/dashboard-routing-paths.constant';
import { accountGuard } from '@hmcts/opal-frontend-common/guards/account';
import { authGuard } from '@hmcts/opal-frontend-common/guards/auth';
import { dashboardLandingGuard } from '../dashboard/guards/dashboard-landing/dashboard-landing.guard';
import { dashboardTypeGuard } from '../dashboard/guards/dashboard-type/dashboard-type.guard';
import { dashboardSectionPermissionsGuard } from '../dashboard/guards/dashboard-section-permissions/dashboard-section-permissions.guard';

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
];
