import type { ICasesCreateCasefileOrderDetails } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-order-details.interface';
import type { IOpalMaintenanceApplicationReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-application-reference-data-response.interface';

export const ORDER_DETAILS_MOCK = {
  response: {
    count: 1,
    refData: [
      {
        application_id: 901,
        application_code: 'TEST01',
        application_title: 'Synthetic application',
        application_group: 'Create Casefile',
        active: true,
      },
    ],
  } satisfies IOpalMaintenanceApplicationReferenceDataResponse,
  saved: {
    applicationId: 901,
    court: 'Synthetic court',
    dateOrderMade: null,
    paymentFrequency: 'Weekly',
    dateArrearsLastUpdated: '2026-01-01',
  } satisfies ICasesCreateCasefileOrderDetails,
  problem: {
    title: 'Internal backend title',
    detail: 'Internal backend detail',
    operation_id: 'synthetic-operation-9805',
    retriable: true,
  },
} as const;
