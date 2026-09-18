import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import { E2E_MAJOR_CREDITORS_RESPONSE } from './major-creditors.mock';

export const E2E_CREDITOR_MAJOR_RESPONSE: IOpalMaintenanceMajorCreditorReferenceDataResponse = {
  count: 2,
  refData: E2E_MAJOR_CREDITORS_RESPONSE.refData.map((record, index) => ({
    ...record,
    major_creditor_id: 980801 + index,
    major_creditor_code: `M00${index + 1}`,
    name: `Synthetic Major ${index + 1}`,
    central_authority: false,
  })),
};
