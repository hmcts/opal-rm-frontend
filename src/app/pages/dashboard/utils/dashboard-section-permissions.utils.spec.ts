import { beforeEach, describe, expect, it } from 'vitest';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { NAVIGATION_BAR_CONFIGURATION } from '@app/constants/navigation-bar-configuration.constant';
import { DASHBOARD_PAGE_DEFAULT_TAB } from '../constants/dashboard-config-default-tab.constant';
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
  beforeEach(() => {
    DASHBOARD_SECTION_PERMISSIONS.administration = [6];
  });

  it('deduplicates user permission ids across business units', () => {
    expect(getUserPermissionIds(createUserStateWithPermissions([1, 6]))).toEqual([1, 6]);
  });

  it('returns false when the user has none of the required permissions', () => {
    expect(hasAnyPermission([14, 15], [1, 6])).toBe(false);
  });

  it('allows access when a section has no configured required permissions', () => {
    DASHBOARD_SECTION_PERMISSIONS.administration = [];

    expect(canAccessFinesPrimaryNavigationSection('administration', createUserStateWithPermissions([]))).toBe(true);
  });

  it('filters the primary navigation down to accessible sections', () => {
    const userState = createUserStateWithPermissions([6, 14]);

    expect(getAccessiblePrimaryNavigationItems(NAVIGATION_BAR_CONFIGURATION, userState)).toEqual([
      { key: 'search', value: 'Search' },
      { key: 'reports', value: 'Reports' },
      { key: 'administration', value: 'Administration' },
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
      { key: 'accounts', value: 'Accounts' },
      { key: 'search', value: 'Search' },
    ] as const;
    const userState = createUserStateWithPermissions([1, 6, 14]);

    expect(getDashboardLandingType(reorderedNavigationItems, userState)).toBe('search');
  });

  it('falls back to the default tab for landing when nothing is accessible', () => {
    expect(getDashboardLandingType(NAVIGATION_BAR_CONFIGURATION, createUserStateWithPermissions([]))).toBe(
      DASHBOARD_PAGE_DEFAULT_TAB,
    );
  });
});
