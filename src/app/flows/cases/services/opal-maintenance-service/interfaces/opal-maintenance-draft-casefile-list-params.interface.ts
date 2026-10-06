export type IOpalMaintenanceDraftCasefileListParams = {
  business_unit_id: 44;
  casefile_status: string;
  casefile_status_from_date?: string;
  casefile_status_to_date?: string;
} & ({ submitted_by: string; not_submitted_by?: never } | { not_submitted_by: string; submitted_by?: never });
