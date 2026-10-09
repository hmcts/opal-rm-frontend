import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { describe, expect, it } from 'vitest';
import { CASES_DASHBOARD_CONFIGURATION } from '../constants/cases-dashboard-configuration.constant';
import { filterCreateCasefileDashboardConfig } from './filter-create-casefile-dashboard-config.utils';

describe('filterCreateCasefileDashboardConfig', () => {
  it.each([
    [21, ['create-cases']],
    [22, ['review-cases']],
    [0, []],
  ])('filters entries for exact BU permission %s', (permission, groups) => {
    const user = structuredClone(OPAL_USER_STATE_MOCK);
    user.status = 'active';
    user.business_unit_users = [
      {
        business_unit_id: 44,
        business_unit_user_id: 'BUU-SYNTHETIC',
        permissions: [{ permission_id: permission, permission_name: 'Synthetic' }],
      },
    ];
    expect(
      filterCreateCasefileDashboardConfig(CASES_DASHBOARD_CONFIGURATION, true, user).groups.map((group) => group.id),
    ).toEqual(groups);
  });
  it('does not combine permissions across business units for either entry', () => {
    const user = structuredClone(OPAL_USER_STATE_MOCK);
    user.status = 'active';
    user.business_unit_users = [
      { business_unit_id: 44, business_unit_user_id: 'BUU-RM', permissions: [] },
      {
        business_unit_id: 45,
        business_unit_user_id: 'BUU-OTHER',
        permissions: [
          { permission_id: 21, permission_name: 'Create' },
          { permission_id: 22, permission_name: 'Check' },
        ],
      },
    ];
    expect(filterCreateCasefileDashboardConfig(CASES_DASHBOARD_CONFIGURATION, true, user).groups).toEqual([]);
  });
  it('preserves the original configuration when enabled', () => {
    expect(filterCreateCasefileDashboardConfig(CASES_DASHBOARD_CONFIGURATION, true)).toBe(
      CASES_DASHBOARD_CONFIGURATION,
    );
  });

  it('removes only the create group without mutating the source', () => {
    const otherGroup = { id: 'other', title: 'Other', links: [] };
    const config = { ...CASES_DASHBOARD_CONFIGURATION, groups: [...CASES_DASHBOARD_CONFIGURATION.groups, otherGroup] };
    const result = filterCreateCasefileDashboardConfig(config, false);
    expect(result.groups).toEqual([otherGroup]);
    expect(result.highlights).toBe(config.highlights);
    expect(config.groups.some((group) => group.id === 'create-cases')).toBe(true);
  });
  it('preserves a dashboard with no create group', () => {
    const config = { ...CASES_DASHBOARD_CONFIGURATION, groups: [] };
    expect(filterCreateCasefileDashboardConfig(config, false)).toBe(config);
  });
});
