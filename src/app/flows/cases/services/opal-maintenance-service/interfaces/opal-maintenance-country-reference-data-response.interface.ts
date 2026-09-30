import type { IOpalMaintenanceCountryReferenceDataItem } from './opal-maintenance-country-reference-data-item.interface';

export interface IOpalMaintenanceCountryReferenceDataResponse {
  count: number;
  refData: IOpalMaintenanceCountryReferenceDataItem[];
}
