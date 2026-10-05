import type { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { PERMISSIONS } from '@app/constants/permissions.constant';
import { OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID } from '../../services/opal-maintenance-service/constants/opal-maintenance-business-unit-ids.constant';
import type { ICasesDraftIdentity } from '../interfaces/cases-draft-identity.interface';

/** Resolves the BU user scope only for active users permitted in the released RM business unit. */
export function resolveCasesDraftIdentity(
  user: IOpalUserState | null | undefined,
  released: boolean,
): ICasesDraftIdentity | null {
  if (!released || user?.status !== 'active') return null;
  const unit = user.business_unit_users.find(
    (record) =>
      record.business_unit_id === OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID &&
      record.permissions.some(
        (permission) => permission.permission_id === PERMISSIONS['create-and-manage-draft-casefiles'],
      ),
  );
  if (!unit?.business_unit_user_id.trim()) return null;
  return {
    userId: user.user_id,
    businessUnitId: OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID,
    submittedBy: unit.business_unit_user_id,
  };
}
