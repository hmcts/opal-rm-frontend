import type { IOpalMaintenanceCountryReferenceDataItem } from '@app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-country-reference-data-item.interface';
import type { IOpalMaintenanceApplicationReferenceDataItem } from '@app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-application-reference-data-item.interface';
import type { IOpalMaintenanceMajorCreditorReferenceDataItem } from '@app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-item.interface';
export interface ICasesCreateCasefilePayloadReferences {
  countries: readonly Pick<IOpalMaintenanceCountryReferenceDataItem, 'country_id' | 'cjs_code' | 'active'>[];
  applications: readonly Pick<
    IOpalMaintenanceApplicationReferenceDataItem,
    'application_id' | 'application_code' | 'active'
  >[];
  majorCreditors: readonly Pick<
    IOpalMaintenanceMajorCreditorReferenceDataItem,
    'major_creditor_id' | 'major_creditor_code' | 'business_unit_id' | 'active' | 'central_authority'
  >[];
}
