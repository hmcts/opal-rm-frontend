import { IDashboardPageConfiguration } from '@hmcts/opal-frontend-common/pages/dashboard-page/interfaces';

/** Removes the create-casefile entry when its release is unavailable, without changing shared configuration. */
export const filterCreateCasefileDashboardConfig = (
  config: IDashboardPageConfiguration,
  enabled: boolean,
): IDashboardPageConfiguration => {
  if (enabled) {
    return config;
  }
  const groups = config.groups.filter((group) => group.id !== 'create-cases');
  return groups.length === config.groups.length ? config : { ...config, groups };
};
