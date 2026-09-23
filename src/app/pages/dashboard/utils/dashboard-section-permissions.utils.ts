import { INavigationBarConfiguration } from '@app/interfaces/navigation-bar-configuration.interface';
import { DASHBOARD_SECTION_FEATURE_FLAGS } from '../constants/dashboard-section-feature-flags.constant';
import { DashboardPageType } from '@app/pages/dashboard/types/dashboard.type';
import { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { DASHBOARD_SECTION_PERMISSIONS } from '../constants/dashboard-section-permissions.constant';

const DASHBOARD_LANDING_PRIORITY: DashboardPageType[] = ['search', 'cases', 'reports', 'administration'];

export const getUserPermissionIds = (userState?: IOpalUserState | null): number[] => {
  const permissionIds = (userState?.business_unit_users ?? []).flatMap((businessUnitUser) =>
    businessUnitUser.permissions.map((permission) => permission.permission_id),
  );

  return [...new Set(permissionIds)];
};

export const hasAnyPermission = (
  requiredPermissionIds: readonly number[],
  userPermissionIds: readonly number[],
): boolean => requiredPermissionIds.some((permissionId) => userPermissionIds.includes(permissionId));

/** Requires an explicit enabled release mapping before applying the existing section permissions. */
export const canAccessFinesPrimaryNavigationSection = (
  sectionKey: DashboardPageType,
  userState?: IOpalUserState | null,
  featureFlags: Record<string, unknown> | null = null,
): boolean => {
  const requiredFlags = DASHBOARD_SECTION_FEATURE_FLAGS[sectionKey];
  if (!requiredFlags?.length || !requiredFlags.every((key) => featureFlags?.[key] === true)) {
    return false;
  }
  const requiredPermissionIds = DASHBOARD_SECTION_PERMISSIONS[sectionKey];

  if (!requiredPermissionIds?.length) {
    return true;
  }

  return hasAnyPermission(requiredPermissionIds, getUserPermissionIds(userState));
};

export const getAccessiblePrimaryNavigationItems = (
  navigationItems: readonly INavigationBarConfiguration[],
  userState?: IOpalUserState | null,
  featureFlags: Record<string, unknown> | null = null,
): INavigationBarConfiguration[] =>
  navigationItems.filter((navigationItem) =>
    canAccessFinesPrimaryNavigationSection(navigationItem.key, userState, featureFlags),
  );

/** Returns null when no released section is accessible; callers must not select a hidden fallback. */
export const getFirstAccessibleDashboardType = (
  navigationItems: readonly INavigationBarConfiguration[],
  userState?: IOpalUserState | null,
  featureFlags: Record<string, unknown> | null = null,
): DashboardPageType | null =>
  getAccessiblePrimaryNavigationItems(navigationItems, userState, featureFlags)[0]?.key ?? null;

/** Selects a released, permitted landing section, or null for Access Denied. */
export const getDashboardLandingType = (
  navigationItems: readonly INavigationBarConfiguration[],
  userState?: IOpalUserState | null,
  featureFlags: Record<string, unknown> | null = null,
): DashboardPageType | null => {
  const accessibleNavigationItems = getAccessiblePrimaryNavigationItems(navigationItems, userState, featureFlags);
  const accessibleNavigationKeys = new Set(accessibleNavigationItems.map((navigationItem) => navigationItem.key));

  return (
    DASHBOARD_LANDING_PRIORITY.find((dashboardType) => accessibleNavigationKeys.has(dashboardType)) ??
    accessibleNavigationItems[0]?.key ??
    null
  );
};
