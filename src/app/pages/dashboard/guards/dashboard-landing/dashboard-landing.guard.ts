import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { NAVIGATION_BAR_CONFIGURATION } from '@app/constants/navigation-bar-configuration.constant';
import { DASHBOARD_ROUTING_PATHS } from '../../../dashboard/constants/dashboard-routing-paths.constant';
import { OpalUserService } from '@hmcts/opal-frontend-common/services/opal-user-service';
import { catchError, map, of } from 'rxjs';
import { getDashboardLandingType } from '../../utils/dashboard-section-permissions.utils';

const getDefaultDashboardType = () => getDashboardLandingType(NAVIGATION_BAR_CONFIGURATION);

const buildDashboardUrlTree = (router: Router, dashboardType: string): UrlTree =>
  router.createUrlTree(['/', DASHBOARD_ROUTING_PATHS.root, dashboardType]);

/**
 * Resolves the first accessible dashboard tab shown when entering `/dashboard`.
 */
export const dashboardLandingGuard: CanActivateFn = () => {
  const opalUserService = inject(OpalUserService);
  const router = inject(Router);

  return opalUserService.getLoggedInUserState().pipe(
    map((userState) => buildDashboardUrlTree(router, getDashboardLandingType(NAVIGATION_BAR_CONFIGURATION, userState))),
    catchError(() => of(buildDashboardUrlTree(router, getDefaultDashboardType()))),
  );
};
