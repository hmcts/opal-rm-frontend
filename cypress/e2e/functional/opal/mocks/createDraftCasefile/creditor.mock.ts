import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';

export const E2E_CREDITOR_MAJOR_RESPONSE: IOpalMaintenanceMajorCreditorReferenceDataResponse = {
  count: 2,
  refData: [1, 2].map((sequence, index) => ({
    business_unit_id: 44,
    major_creditor_id: 980801 + index,
    major_creditor_code: `M00${sequence}`,
    name: `Synthetic Major ${sequence}`,
    address_line_1: `${sequence} Synthetic Street`,
    address_line_2: null,
    address_line_3: null,
    address_line_4: null,
    address_line_5: null,
    postcode: 'TE1 1ST',
    country_id: 826,
    country_name: 'United Kingdom',
    contact_name: `Synthetic Contact ${sequence}`,
    contact_email: `major.${sequence}@example.test`,
    active: true,
    central_authority: false,
  })),
};
