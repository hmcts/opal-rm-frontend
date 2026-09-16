import type { IOpalMaintenanceApplicationReferenceDataItem } from './opal-maintenance-application-reference-data-item.interface';

export interface IOpalMaintenanceApplicationReferenceDataResponse {
  count: number;
  refData: IOpalMaintenanceApplicationReferenceDataItem[];
}
