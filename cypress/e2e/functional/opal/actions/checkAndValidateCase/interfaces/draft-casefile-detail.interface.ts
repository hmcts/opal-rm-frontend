import type { IOpalMaintenanceDraftCasefileRequest } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';

/** Persisted fields used by QA, including operations supplied by the lifecycle foundation PRs. */
export interface IDraftCasefileDetail {
  draft_casefile_id: number;
  business_unit_id: number;
  created_date: string;
  submitted_by: string;
  submitted_by_name: string;
  casefile: IOpalMaintenanceDraftCasefileRequest['casefile'];
  casefile_snapshot: Record<string, unknown>;
  casefile_type: string;
  casefile_status: string;
  casefile_status_date: string;
  timeline_data: {
    username: string;
    status: 'Submitted' | 'Resubmitted' | 'Approved' | 'Rejected' | 'Deleted';
    status_date: string;
    reason_text?: string | null;
  }[];
}
