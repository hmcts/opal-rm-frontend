import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { NAVIGATION_BAR_CONFIGURATION } from '@app/constants/navigation-bar-configuration.constant';
import { DASHBOARD_ROUTING_PATHS } from '../../../dashboard/constants/dashboard-routing-paths.constant';
import { OpalUserService } from '@hmcts/opal-frontend-common/services/opal-user-service';
import { firstValueFrom } from 'rxjs';
import { resolveCreateCaseFilesRelease } from '@app/flows/cases/utils/resolve-create-case-files-release.utils';
import { RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG } from '@app/flows/cases/constants/release-1c-rm-create-case-files-feature-flag.constant';
import { PAGES_ROUTING_PATHS as COMMON_PAGES_ROUTING_PATHS } from '@hmcts/opal-frontend-common/pages/routing/constants';
import { getDashboardLandingType } from '../../utils/dashboard-section-permissions.utils';

const buildDashboardUrlTree = (router: Router, dashboardType: string): UrlTree =>
  router.createUrlTree(['/', DASHBOARD_ROUTING_PATHS.root, dashboardType]);

/**
 * Resolves the first accessible dashboard tab shown when entering `/dashboard`.
 */
export const dashboardLandingGuard: CanActivateFn = async (route, state): Promise<boolean | UrlTree> => {
  const opalUserService = inject(OpalUserService);
  const router = inject(Router);
  const denied = router.createUrlTree([`/${COMMON_PAGES_ROUTING_PATHS.children.accessDenied}`]);
  const enabled = await resolveCreateCaseFilesRelease(route, state);
  if (enabled === null) {
    return false;
  }
  if (!enabled) {
    return denied;
  }
  try {
    const userState = await firstValueFrom(opalUserService.getLoggedInUserState());
    const destination = getDashboardLandingType(NAVIGATION_BAR_CONFIGURATION, userState, {
      [RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG]: enabled,
    });
    return destination ? buildDashboardUrlTree(router, destination) : denied;
  } catch {
    return denied;
  }
};
