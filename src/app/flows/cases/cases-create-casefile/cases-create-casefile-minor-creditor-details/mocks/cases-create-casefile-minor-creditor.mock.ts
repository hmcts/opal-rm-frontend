import type { ICasesCreateCasefileMinorCreditorDetails } from '../../interfaces/cases-create-casefile-minor-creditor-details.interface';

export const MINOR_CREDITOR_DETAILS_MOCK: ICasesCreateCasefileMinorCreditorDetails = {
  identity: { type: 'organisation', organisationName: 'Example creditor' },
  address: {
    addressLine1: '1 Test Street',
    addressLine2: null,
    addressLine3: null,
    addressLine4: null,
    addressLine5: null,
    postalOrZipCode: null,
    countryId: 826,
  },
  bank: { type: 'none' },
};
