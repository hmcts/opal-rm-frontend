import type { IOpalMaintenanceResultReferenceDataItem } from './opal-maintenance-result-reference-data-item.interface';

export interface IOpalMaintenanceResultReferenceDataResponse {
  count: number;
  refData: IOpalMaintenanceResultReferenceDataItem[];
}
