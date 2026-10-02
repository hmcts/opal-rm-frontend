import { describe, expect, it } from 'vitest';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { NAVIGATION_BAR_CONFIGURATION } from '@app/constants/navigation-bar-configuration.constant';
import { DASHBOARD_PAGE_DEFAULT_TAB } from '../constants/dashboard-config-default-tab.constant';
import {
  canAccessFinesPrimaryNavigationSection,
  getAccessiblePrimaryNavigationItems,
  getDashboardLandingType,
  getFirstAccessibleDashboardType,
  getUserPermissionIds,
  hasAnyPermission,
} from './dashboard-section-permissions.utils';

const createUserStateWithPermissions = (permissionIds: readonly number[]): IOpalUserState => {
  const userState = structuredClone(OPAL_USER_STATE_MOCK);
  const [firstBusinessUnit, secondBusinessUnit] = userState.business_unit_users;

  userState.business_unit_users = [
    {
      ...firstBusinessUnit,
      permissions: permissionIds.map((permissionId) => ({
        permission_id: permissionId,
        permission_name: `Permission ${permissionId}`,
      })),
    },
    {
      ...secondBusinessUnit,
      permissions: permissionIds.map((permissionId) => ({
        permission_id: permissionId,
        permission_name: `Permission ${permissionId}`,
      })),
    },
  ];

  return userState;
};

describe('dashboard-section-permissions.utils', () => {
  it.each([
    { businessUnitId: 44, permissionId: 21, allowed: true },
    { businessUnitId: 45, permissionId: 21, allowed: false },
    { businessUnitId: 44, permissionId: 1, allowed: false },
    { businessUnitId: 44, permissionId: 5, allowed: false },
    { businessUnitId: 44, permissionId: 13, allowed: false },
  ])('checks case creation for $businessUnitId / $permissionId', ({ businessUnitId, permissionId, allowed }) => {
    const userState = createUserStateWithPermissions([permissionId]);
    userState.business_unit_users = [{ ...userState.business_unit_users[0], business_unit_id: businessUnitId }];
    expect(canAccessFinesPrimaryNavigationSection('cases', userState)).toBe(allowed);
  });

  it('denies Cases when user state is unavailable', () => {
    expect(canAccessFinesPrimaryNavigationSection('cases', null)).toBe(false);
  });

  it('deduplicates user permission ids across business units', () => {
    expect(getUserPermissionIds(createUserStateWithPermissions([1, 6]))).toEqual([1, 6]);
  });

  it('returns false when the user has none of the required permissions', () => {
    expect(hasAnyPermission([14, 15], [1, 6])).toBe(false);
  });

  it.each(['search', 'reports', 'administration'] as const)('denies %s pending RM permissions', (section) => {
    expect(canAccessFinesPrimaryNavigationSection(section, createUserStateWithPermissions([1, 6, 14, 15, 21]))).toBe(
      false,
    );
  });

  it('shows only Cases for a user with the RM permission', () => {
    const state = createUserStateWithPermissions([6, 14, 21]);
    state.business_unit_users[0].business_unit_id = 44;
    expect(getAccessiblePrimaryNavigationItems(NAVIGATION_BAR_CONFIGURATION, state)).toEqual([
      { key: 'cases', value: 'Cases' },
    ]);
  });

  it('falls back to the default tab when no navigation items are accessible', () => {
    expect(getFirstAccessibleDashboardType(NAVIGATION_BAR_CONFIGURATION, createUserStateWithPermissions([]))).toBe(
      DASHBOARD_PAGE_DEFAULT_TAB,
    );
  });

  it('uses the defined landing priority instead of the input order', () => {
    const reorderedNavigationItems = [
      { key: 'reports', value: 'Reports' },
      { key: 'cases', value: 'Cases' },
      { key: 'search', value: 'Search' },
    ] as const;
    const userState = createUserStateWithPermissions([6, 14, 21]);
    userState.business_unit_users[0].business_unit_id = 44;

    expect(getDashboardLandingType(reorderedNavigationItems, userState)).toBe('cases');
  });

  it('falls back to the default tab for landing when nothing is accessible', () => {
    expect(getDashboardLandingType(NAVIGATION_BAR_CONFIGURATION, createUserStateWithPermissions([]))).toBe(
      DASHBOARD_PAGE_DEFAULT_TAB,
    );
  });
});
