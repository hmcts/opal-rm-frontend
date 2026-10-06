import type { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { PERMISSIONS } from '@app/constants/permissions.constant';
import { OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID } from '../../services/opal-maintenance-service/constants/opal-maintenance-business-unit-ids.constant';
import type { CasesDraftDashboardMode } from '../types/cases-draft-dashboard-mode.type';
import type { ICasesDraftIdentity } from '../interfaces/cases-draft-identity.interface';

/** Resolves the BU user scope only for active users permitted in the released RM business unit. */
export function resolveCasesDraftIdentity(
  user: IOpalUserState | null | undefined,
  released: boolean,
  mode: CasesDraftDashboardMode = 'inputter',
): ICasesDraftIdentity | null {
  if (!released || user?.status !== 'active') return null;
  const requiredPermission =
    mode === 'checker'
      ? PERMISSIONS['check-and-validate-draft-casefiles']
      : PERMISSIONS['create-and-manage-draft-casefiles'];
  const unit = user.business_unit_users.find(
    (record) =>
      record.business_unit_id === OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID &&
      record.permissions.some((permission) => permission.permission_id === requiredPermission),
  );
  if (!unit?.business_unit_user_id.trim()) return null;
  return {
    userId: user.user_id,
    businessUnitId: OPAL_MAINTENANCE_RM_BUSINESS_UNIT_ID,
    submittedBy: unit.business_unit_user_id,
  };
}

/** Compares the user and BU-user request scope without retaining personal casefile data. */
export function sameCasesDraftIdentity(
  current: ICasesDraftIdentity | null,
  previous: ICasesDraftIdentity | null,
): boolean {
  if (!current || !previous) return current === previous;
  return (
    current.userId === previous.userId &&
    current.businessUnitId === previous.businessUnitId &&
    current.submittedBy === previous.submittedBy
  );
}
