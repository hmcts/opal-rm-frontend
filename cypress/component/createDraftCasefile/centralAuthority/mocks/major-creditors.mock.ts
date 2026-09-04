import type { IOpalMaintenanceMajorCreditorReferenceDataItem } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-item.interface';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';

export const FIRST_MAJOR_CREDITOR: IOpalMaintenanceMajorCreditorReferenceDataItem = {
  major_creditor_id: 901,
  business_unit_id: 77,
  major_creditor_code: '0123',
  name: 'Central Authority One',
  address_line_1: '1 Test Street',
  address_line_2: null,
  address_line_3: null,
  address_line_4: null,
  address_line_5: null,
  postcode: 'TE1 1ST',
  country_id: 826,
  country_name: 'United Kingdom',
  contact_name: 'Test Contact One',
  contact_email: 'authority.one@example.test',
  active: true,
  central_authority: true,
};

export const SECOND_MAJOR_CREDITOR: IOpalMaintenanceMajorCreditorReferenceDataItem = {
  ...FIRST_MAJOR_CREDITOR,
  major_creditor_id: 902,
  major_creditor_code: '0456',
  name: 'Central Authority Two',
  address_line_1: '2 Test Street',
  contact_name: 'Test Contact Two',
  contact_email: 'authority.two@example.test',
};

export const MISSING_MAJOR_CREDITOR: IOpalMaintenanceMajorCreditorReferenceDataItem = {
  ...FIRST_MAJOR_CREDITOR,
  major_creditor_id: 999,
  major_creditor_code: '0999',
  name: 'Inactive Central Authority',
  active: false,
};

export const MAJOR_CREDITORS_RESPONSE: IOpalMaintenanceMajorCreditorReferenceDataResponse = {
  count: 2,
  refData: [FIRST_MAJOR_CREDITOR, SECOND_MAJOR_CREDITOR],
};

export const SAVED_DETAILS_WITH_STALE_COPY = {
  remoReference: 'REMO-1',
  centralAuthorityReference: 'CA-1',
  majorCreditor: { ...FIRST_MAJOR_CREDITOR, name: 'Stale name' },
};

export const SAVED_DETAILS_WITH_MISSING_RECORD = {
  remoReference: 'REMO-1',
  centralAuthorityReference: 'CA-1',
  majorCreditor: MISSING_MAJOR_CREDITOR,
};
