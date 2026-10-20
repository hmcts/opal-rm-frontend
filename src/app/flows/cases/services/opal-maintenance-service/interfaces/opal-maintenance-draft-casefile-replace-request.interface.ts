import type { IOpalMaintenanceDraftCasefileRequest } from './opal-maintenance-draft-casefile-request.interface';

export interface IOpalMaintenanceDraftCasefileReplaceRequest {
  business_unit_id: number;
  casefile: IOpalMaintenanceDraftCasefileRequest['casefile'];
}
