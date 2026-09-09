import type { IOpalMaintenanceMajorCreditorReferenceDataItem } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-item.interface';

export interface ICasesCreateCasefileCentralAuthorityDetails {
  remoReference: string | null;
  centralAuthorityReference: string | null;
  majorCreditor: IOpalMaintenanceMajorCreditorReferenceDataItem | null;
}
