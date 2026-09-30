import type { IOpalMaintenanceMajorCreditorReferenceDataItem } from './opal-maintenance-major-creditor-reference-data-item.interface';

export interface IOpalMaintenanceMajorCreditorReferenceDataResponse {
  count: number;
  refData: IOpalMaintenanceMajorCreditorReferenceDataItem[];
}
