import type { IOpalMaintenanceResultReferenceDataResponse } from '../interfaces/opal-maintenance-result-reference-data-response.interface';

export const OPAL_MAINTENANCE_RESULTS_MOCK: IOpalMaintenanceResultReferenceDataResponse = {
  count: 2,
  refData: [
    { result_id: 'MAT', result_title: 'Maintenance' },
    { result_id: 'MCHILD', result_title: 'Child maintenance' },
  ],
};
