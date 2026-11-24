import { isPlatformServer } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { resolveFeatureFlagGuard } from '@hmcts/opal-frontend-common/guards/feature-flag';
import { PAGES_ROUTING_PATHS } from '@hmcts/opal-frontend-common/pages/routing/constants';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { RESPONDENT_ACCOUNT_DETAILS_FLAG, respondentAccountRouteId } from './cases-account-respondent-navigation';

export const respondentAccountDetailsGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const accountId =
    route.paramMap.get('respondentAccountId') ?? route.parent?.paramMap.get('respondentAccountId') ?? null;
  const server = isPlatformServer(inject(PLATFORM_ID));
  const flags: Record<string, unknown> = inject(GlobalStore).featureFlags();
  const enabled = server
    ? flags[RESPONDENT_ACCOUNT_DETAILS_FLAG]
    : await resolveFeatureFlagGuard(RESPONDENT_ACCOUNT_DETAILS_FLAG, route, state);
  if (server && enabled === undefined) return false;
  if (enabled !== true) return router.createUrlTree([`/${PAGES_ROUTING_PATHS.children.accessDenied}`]);
  return (
    respondentAccountRouteId(accountId) !== null ||
    router.createUrlTree([`/${PAGES_ROUTING_PATHS.children.internalServerError}`])
  );
};
