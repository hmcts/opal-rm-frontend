import { describe, expect, it } from 'vitest';
import { CASES_DASHBOARD_CONFIGURATION } from '../constants/cases-dashboard-configuration.constant';
import { filterCreateCasefileDashboardConfig } from './filter-create-casefile-dashboard-config.utils';

describe('filterCreateCasefileDashboardConfig', () => {
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
