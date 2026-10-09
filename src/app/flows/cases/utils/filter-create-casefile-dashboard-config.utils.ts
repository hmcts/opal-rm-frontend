import { IDashboardPageConfiguration } from '@hmcts/opal-frontend-common/pages/dashboard-page/interfaces';
import { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { resolveCasesDraftIdentity } from '../cases-draft/utils/cases-draft-identity';

/** Filters released Cases entries by the exact BU identity without mutating shared configuration. */
export const filterCreateCasefileDashboardConfig = (
  config: IDashboardPageConfiguration,
  enabled: boolean,
  user?: IOpalUserState | null,
): IDashboardPageConfiguration => {
  const groups = config.groups.filter((group) => {
    if (group.id !== 'create-cases' && group.id !== 'review-cases') return true;
    const mode = group.id === 'create-cases' ? 'inputter' : 'checker';
    return enabled && (user === undefined || resolveCasesDraftIdentity(user, enabled, mode) !== null);
  });
  return groups.length === config.groups.length ? config : { ...config, groups };
};
