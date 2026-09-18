import type { IOpalMaintenanceMajorCreditorReferenceDataItem } from '../../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-item.interface';

export interface ICasesCreateCasefileMajorCreditorsLoadState {
  status: 'loading' | 'ready' | 'empty' | 'error';
  records: IOpalMaintenanceMajorCreditorReferenceDataItem[];
  correlationReference: string | null;
}
