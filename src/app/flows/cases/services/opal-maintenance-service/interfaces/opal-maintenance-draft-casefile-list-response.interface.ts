import type { IOpalMaintenanceDraftCasefileSummary } from './opal-maintenance-draft-casefile-summary.interface';

export interface IOpalMaintenanceDraftCasefileListResponse {
  count: number;
  summaries: IOpalMaintenanceDraftCasefileSummary[];
}
