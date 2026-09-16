import type { IOpalMaintenanceResultReferenceDataResponse } from '../interfaces/opal-maintenance-result-reference-data-response.interface';

export const OPAL_MAINTENANCE_RESULTS_MOCK: IOpalMaintenanceResultReferenceDataResponse = {
  count: 2,
  refData: [
    { result_id: 'MOCK01', result_title: 'Example maintenance term' },
    { result_id: 'MOCK02', result_title: 'Example additional term' },
  ],
};
