import type { IOpalMaintenanceDraftCasefileListParams } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-list-params.interface';
import type { ICasesDraftIdentity } from '../interfaces/cases-draft-identity.interface';
import { CASES_DRAFT_TABS } from '../constants/cases-draft-tabs.constant';
import type { CasesDraftTab } from '../types/cases-draft-tab.type';

export function buildCasesDraftListParams(
  identity: ICasesDraftIdentity,
  tab: CasesDraftTab,
  range: { from: string; to: string },
): IOpalMaintenanceDraftCasefileListParams {
  const base: IOpalMaintenanceDraftCasefileListParams = {
    business_unit_id: 44,
    submitted_by: identity.submittedBy,
    casefile_status: CASES_DRAFT_TABS[tab].statuses,
  };
  if (tab !== 'approved' && tab !== 'deleted') return base;
  return { ...base, casefile_status_from_date: range.from, casefile_status_to_date: range.to };
}
