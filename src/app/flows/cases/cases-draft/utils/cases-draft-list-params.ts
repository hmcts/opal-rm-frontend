import type { IOpalMaintenanceDraftCasefileListParams } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-list-params.interface';
import type { ICasesDraftIdentity } from '../interfaces/cases-draft-identity.interface';
import { getCasesDraftTabMetadata } from './cases-draft-tab-metadata';
import type { CasesDraftDashboardMode } from '../types/cases-draft-dashboard-mode.type';
import type { CasesDraftTab } from '../types/cases-draft-tab.type';

export function buildCasesDraftListParams(
  identity: ICasesDraftIdentity,
  tab: CasesDraftTab,
  range: { from: string; to: string },
  mode: CasesDraftDashboardMode = 'inputter',
): IOpalMaintenanceDraftCasefileListParams {
  const base: IOpalMaintenanceDraftCasefileListParams = {
    business_unit_id: identity.businessUnitId,
    ...(mode === 'checker' ? { not_submitted_by: identity.submittedBy } : { submitted_by: identity.submittedBy }),
    casefile_status: getCasesDraftTabMetadata(tab, mode).statuses,
  };
  const bounded = tab === 'deleted' || (mode === 'inputter' && tab === 'approved');
  if (!bounded) return base;
  return { ...base, casefile_status_from_date: range.from, casefile_status_to_date: range.to };
}
