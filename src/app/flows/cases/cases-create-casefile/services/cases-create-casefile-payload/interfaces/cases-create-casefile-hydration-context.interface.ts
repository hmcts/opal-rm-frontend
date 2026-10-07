import type { IOpalMaintenanceCountryReferenceDataItem } from '../../../../services/opal-maintenance-service/interfaces/opal-maintenance-country-reference-data-item.interface';
import type { IOpalMaintenanceApplicationReferenceDataItem } from '../../../../services/opal-maintenance-service/interfaces/opal-maintenance-application-reference-data-item.interface';
import type { IOpalMaintenanceMajorCreditorReferenceDataItem } from '../../../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-item.interface';
import type { ICasesCreateCasefileOrderTermPage } from '../../../cases-create-casefile-order-terms-input/interfaces/cases-create-casefile-order-term-page.interface';

export interface ICasesCreateCasefileHydrationContext {
  countries: readonly IOpalMaintenanceCountryReferenceDataItem[];
  applications: readonly IOpalMaintenanceApplicationReferenceDataItem[];
  majorCreditors: readonly IOpalMaintenanceMajorCreditorReferenceDataItem[];
  resultPages: Readonly<Record<string, ICasesCreateCasefileOrderTermPage>>;
}
