export interface IOpalMaintenanceDraftCasefilePatchRequest {
  business_unit_id: number;
  casefile_status: 'PUBLISHING_PENDING' | 'REJECTED' | 'DELETED';
  status_message?: string;
}
