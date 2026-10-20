export interface IOpalMaintenanceDraftCasefileDeleteRequest {
  business_unit_id: number;
  casefile_status: 'DELETED';
  status_message: string;
}
