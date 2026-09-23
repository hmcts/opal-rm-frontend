import { afterEach, describe, expect, it } from 'vitest';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { NAVIGATION_BAR_CONFIGURATION } from '@app/constants/navigation-bar-configuration.constant';
import { DASHBOARD_SECTION_PERMISSIONS } from '../constants/dashboard-section-permissions.constant';
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
  const originalCasesPermissions = DASHBOARD_SECTION_PERMISSIONS.cases;
  afterEach(() => {
    DASHBOARD_SECTION_PERMISSIONS.cases = originalCasesPermissions;
  });

  it('deduplicates user permission ids across business units', () => {
    expect(getUserPermissionIds(createUserStateWithPermissions([1, 6]))).toEqual([1, 6]);
  });

  it('returns false when the user has none of the required permissions', () => {
    expect(hasAnyPermission([14, 15], [1, 6])).toBe(false);
  });

  it('returns no sections when release flags are unavailable', () => {
    const user = createUserStateWithPermissions([1, 6, 14]);
    expect(getAccessiblePrimaryNavigationItems(NAVIGATION_BAR_CONFIGURATION, user)).toEqual([]);
    expect(getDashboardLandingType(NAVIGATION_BAR_CONFIGURATION, user)).toBeNull();
    expect(getFirstAccessibleDashboardType(NAVIGATION_BAR_CONFIGURATION, user)).toBeNull();
  });
  const createFlag = 'release-1c-rm-create-case-files';

  it('shows only Cases when its release is enabled', () => {
    const user = createUserStateWithPermissions(Object.values(DASHBOARD_SECTION_PERMISSIONS).flat());
    const flags = { [createFlag]: true, 'release-1a': true, 'release-1b': true };
    expect(getAccessiblePrimaryNavigationItems(NAVIGATION_BAR_CONFIGURATION, user, flags)).toEqual([
      { key: 'cases', value: 'Cases' },
    ]);
    expect(getDashboardLandingType(NAVIGATION_BAR_CONFIGURATION, user, flags)).toBe('cases');
  });

  it.each([{}, { [createFlag]: false }, { [createFlag]: 'true' }])(
    'exposes no sections unless the release is boolean true: %j',
    (flags) => {
      const user = createUserStateWithPermissions(Object.values(DASHBOARD_SECTION_PERMISSIONS).flat());
      expect(getAccessiblePrimaryNavigationItems(NAVIGATION_BAR_CONFIGURATION, user, flags)).toEqual([]);
      expect(getDashboardLandingType(NAVIGATION_BAR_CONFIGURATION, user, flags)).toBeNull();
      expect(getFirstAccessibleDashboardType(NAVIGATION_BAR_CONFIGURATION, user, flags)).toBeNull();
    },
  );

  it('does not grant Cases permissions through the release flag', () => {
    const user = createUserStateWithPermissions([]);
    expect(getAccessiblePrimaryNavigationItems(NAVIGATION_BAR_CONFIGURATION, user, { [createFlag]: true })).toEqual([]);
  });

  it('returns no permissions when user state is missing', () => {
    expect(getUserPermissionIds()).toEqual([]);
  });
  it.each([undefined, []])('retains unrestricted permission semantics for released Cases (%j)', (permissions) => {
    DASHBOARD_SECTION_PERMISSIONS.cases = permissions;
    expect(canAccessFinesPrimaryNavigationSection('cases', null, { [createFlag]: true })).toBe(true);
  });
  it('selects the first accessible item when released', () => {
    expect(
      getFirstAccessibleDashboardType(NAVIGATION_BAR_CONFIGURATION, createUserStateWithPermissions([1]), {
        [createFlag]: true,
      }),
    ).toBe('cases');
  });
});
