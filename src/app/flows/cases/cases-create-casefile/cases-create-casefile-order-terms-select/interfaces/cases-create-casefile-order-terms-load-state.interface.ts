import type { IOpalMaintenanceResultReferenceDataItem } from '../../../services/opal-maintenance-service/interfaces/opal-maintenance-result-reference-data-item.interface';

export interface ICasesCreateCasefileOrderTermsLoadState {
  status: 'loading' | 'ready' | 'empty' | 'error';
  records: readonly IOpalMaintenanceResultReferenceDataItem[];
  correlationReference: string | null;
}
