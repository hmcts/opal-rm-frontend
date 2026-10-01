import { OPAL_MAINTENANCE_RESULTS_MOCK } from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-results.mock';

export const ORDER_TERMS_MOCK = {
  response: OPAL_MAINTENANCE_RESULTS_MOCK,
  empty: { count: 0, refData: [] },
  problem: {
    status: 503,
    title: 'Synthetic internal title',
    detail: 'Synthetic private detail',
    operation_id: 'synthetic-reference',
  },
};
