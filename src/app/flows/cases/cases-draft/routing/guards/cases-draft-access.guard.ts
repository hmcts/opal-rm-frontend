import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PAGES_ROUTING_PATHS as COMMON_PAGES_ROUTING_PATHS } from '@hmcts/opal-frontend-common/pages/routing/constants';
import { OpalUserService } from '@hmcts/opal-frontend-common/services/opal-user-service';
import { firstValueFrom } from 'rxjs';
import { resolveCreateCaseFilesRelease } from '../../../utils/resolve-create-case-files-release.utils';
import { resolveCasesDraftIdentity } from '../../utils/cases-draft-identity';

/** Denies draft collection routes without the released, active and authorised RM identity. */
export const casesDraftAccessGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const users = inject(OpalUserService);
  const denied = router.createUrlTree([`/${COMMON_PAGES_ROUTING_PATHS.children.accessDenied}`]);
  const released = await resolveCreateCaseFilesRelease(route, state);
  if (released === null) return false;
  if (!released) return denied;
  try {
    const user = await firstValueFrom(users.getLoggedInUserState());
    return resolveCasesDraftIdentity(user, released) ? true : denied;
  } catch {
    return denied;
  }
};
