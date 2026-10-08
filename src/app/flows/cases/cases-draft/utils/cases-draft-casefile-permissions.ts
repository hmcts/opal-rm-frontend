import type { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import type { ICasesDraftIdentity } from '../interfaces/cases-draft-identity.interface';
import type { IOpalMaintenanceDraftCasefileDetail } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-detail.interface';
import { resolveCasesDraftIdentity } from './cases-draft-identity';

/** Read access accepts either released dashboard permission in the owning RM business unit. */
export function resolveCasesDraftReadIdentity(
  user: IOpalUserState | null | undefined,
  released: boolean,
): ICasesDraftIdentity | null {
  return resolveCasesDraftIdentity(user, released, 'inputter') ?? resolveCasesDraftIdentity(user, released, 'checker');
}

/** Review eligibility compares the submitting BU-user identity, independently of the global user ID. */
export function canReviewDraftCasefile(
  draft: IOpalMaintenanceDraftCasefileDetail,
  user: IOpalUserState | null | undefined,
  released: boolean,
): boolean {
  const identity = resolveCasesDraftIdentity(user, released, 'checker');
  return (
    !!identity &&
    identity.businessUnitId === draft.business_unit_id &&
    ['SUBMITTED', 'RESUBMITTED'].includes(draft.casefile_status) &&
    draft.submitted_by !== identity.submittedBy
  );
}
