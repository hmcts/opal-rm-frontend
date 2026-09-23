import { isPlatformServer } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { resolveFeatureFlagGuard } from '@hmcts/opal-frontend-common/guards/feature-flag';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG } from '../constants/release-1c-rm-create-case-files-feature-flag.constant';

/**
 * Returns null when SSR cannot resolve the release. Callers must cancel navigation
 * without redirecting or activating content, so browser initial navigation can
 * evaluate LaunchDarkly at the original URL. Never initialize its browser SDK on SSR.
 */
export const resolveCreateCaseFilesRelease = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): Promise<boolean | null> => {
  if (isPlatformServer(inject(PLATFORM_ID))) {
    const flags: Record<string, unknown> = inject(GlobalStore).featureFlags();
    const enabled = flags[RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG];
    return Promise.resolve(enabled === undefined ? null : enabled === true);
  }
  return resolveFeatureFlagGuard(RELEASE_1C_RM_CREATE_CASE_FILES_FEATURE_FLAG, route, state);
};
