import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from '@angular/router';
import { canAccessFinesPrimaryNavigationSection } from '@app/pages/dashboard/utils/dashboard-section-permissions.utils';
import { isDashboardPageType } from '@app/pages/dashboard/constants/dashboard-config.constant';
import { DashboardPageType } from '@app/pages/dashboard/types/dashboard.type';
import { PAGES_ROUTING_PATHS as COMMON_PAGES_ROUTING_PATHS } from '@hmcts/opal-frontend-common/pages/routing/constants';
import { OpalUserService } from '@hmcts/opal-frontend-common/services/opal-user-service';
import { firstValueFrom } from 'rxjs';
import { resolveFeatureFlagGuard } from '@hmcts/opal-frontend-common/guards/feature-flag';
import { RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG } from '@app/flows/cases/constants/release-1c-rm-create-case-files-feature-flag.constant';
import { DASHBOARD_SECTION_FEATURE_FLAGS } from '@app/pages/dashboard/constants/dashboard-section-feature-flags.constant';

const getSectionKey = (route: ActivatedRouteSnapshot): DashboardPageType | null => {
  const routeSectionKey = route.data['sectionKey'];

  if (typeof routeSectionKey === 'string' && isDashboardPageType(routeSectionKey)) {
    return routeSectionKey;
  }

  const dashboardType = route.paramMap.get('dashboardType');

  if (dashboardType && isDashboardPageType(dashboardType)) {
    return dashboardType;
  }

  return null;
};

/** Blocks direct dashboard URLs unless the section is released and the user has access. */
export const dashboardSectionPermissionsGuard: CanActivateFn = async (route, state): Promise<boolean | UrlTree> => {
  const router = inject(Router);
  const opalUserService = inject(OpalUserService);
  const sectionKey = getSectionKey(route);
  const denied = router.createUrlTree([`/${COMMON_PAGES_ROUTING_PATHS.children.accessDenied}`]);
  if (!sectionKey || !DASHBOARD_SECTION_FEATURE_FLAGS[sectionKey]?.length) {
    return denied;
  }
  const enabled = await resolveFeatureFlagGuard(RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG, route, state);
  if (!enabled) {
    return denied;
  }
  try {
    const userState = await firstValueFrom(opalUserService.getLoggedInUserState());
    return canAccessFinesPrimaryNavigationSection(sectionKey, userState, {
      [RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG]: enabled,
    })
      ? true
      : denied;
  } catch {
    return denied;
  }
};
