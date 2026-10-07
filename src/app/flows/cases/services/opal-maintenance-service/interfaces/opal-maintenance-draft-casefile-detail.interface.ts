import type { IOpalMaintenanceDraftCasefileRequest } from './opal-maintenance-draft-casefile-request.interface';
import type { OpalMaintenanceDraftCasefileStatus } from '../types/opal-maintenance-draft-casefile-status.type';

export interface IOpalMaintenanceDraftCasefileDetail {
  draft_casefile_id: number;
  business_unit_id: number;
  created_date: string;
  submitted_by: string;
  submitted_by_name: string;
  casefile: IOpalMaintenanceDraftCasefileRequest['casefile'];
  casefile_snapshot: {
    respondent_account: { account_id: number | null; account_number: string | null; respondent_name: string };
    applicant_account: { account_id: number | null; account_number: string | null; applicant_name: string };
    minor_creditor_accounts: {
      creditor_sequence: number;
      account_id: number | null;
      account_number: string | null;
      name: string;
    }[];
  };
  casefile_type: IOpalMaintenanceDraftCasefileRequest['casefile_type'];
  casefile_status: OpalMaintenanceDraftCasefileStatus;
  casefile_status_name: string;
  casefile_status_date: string;
  timeline_data: {
    username: string;
    status: 'Submitted' | 'Resubmitted' | 'Rejected' | 'Approved' | 'Deleted';
    status_date: string;
    reason_text?: string;
  }[];
  validated_date?: string | null;
  validated_by?: string | null;
  validated_by_name?: string | null;
  status_message?: string | null;
}
