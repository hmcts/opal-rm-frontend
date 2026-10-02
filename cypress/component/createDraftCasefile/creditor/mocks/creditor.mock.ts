import type { ICasesCreateCasefileAcceptedOrderTerm } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-accepted-order-term.interface';
import type { ICasesCreateCasefileMinorCreditor } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-minor-creditor.interface';
import { MINOR_CREDITOR_DETAILS_MOCK } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-minor-creditor-details/mocks/cases-create-casefile-minor-creditor.mock';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import { FIRST_MAJOR_CREDITOR } from '../../centralAuthority/mocks/major-creditors.mock';

export const CREDITOR_MAJOR_RESPONSE: IOpalMaintenanceMajorCreditorReferenceDataResponse = {
  count: 2,
  refData: [
    {
      ...FIRST_MAJOR_CREDITOR,
      major_creditor_id: 980801,
      major_creditor_code: 'M001',
      name: 'Synthetic Major One',
      address_line_1: '1 Synthetic Street',
      contact_name: 'Synthetic Contact One',
      contact_email: 'major.one@example.test',
      central_authority: false,
    },
    {
      ...FIRST_MAJOR_CREDITOR,
      major_creditor_id: 980802,
      major_creditor_code: 'M002',
      name: 'Synthetic Major Two',
      address_line_1: '2 Synthetic Street',
      contact_name: 'Synthetic Contact Two',
      contact_email: 'major.two@example.test',
      central_authority: false,
    },
  ],
};

const minorCreditor = (sequenceNumber: number, displayName: string): ICasesCreateCasefileMinorCreditor => ({
  sequenceNumber,
  displayName,
  details: {
    ...MINOR_CREDITOR_DETAILS_MOCK,
    identity: { type: 'organisation', organisationName: displayName },
  },
});

export const CREDITOR_MINOR_CREDITORS: ICasesCreateCasefileMinorCreditor[] = [
  minorCreditor(1, 'Synthetic Minor One'),
  minorCreditor(2, 'Duplicate Synthetic Name'),
  minorCreditor(3, 'Synthetic Minor Three'),
  minorCreditor(4, 'Duplicate Synthetic Name'),
  minorCreditor(5, 'Synthetic Minor Five'),
];

export const CREDITOR_ACCEPTED_TERMS: ICasesCreateCasefileAcceptedOrderTerm[] = [
  {
    termId: 1,
    resultId: 'MAT',
    parameters: { amount: '1.00' },
    creditor: { type: 'minor', sequenceNumber: 1 },
  },
  {
    termId: 2,
    resultId: 'MAT',
    parameters: { amount: '2.00' },
    creditor: { type: 'minor', sequenceNumber: 2 },
  },
  {
    termId: 3,
    resultId: 'MAT',
    parameters: { amount: '3.00' },
    creditor: { type: 'minor', sequenceNumber: 3 },
  },
  {
    termId: 4,
    resultId: 'MAT',
    parameters: { amount: '4.00' },
    creditor: { type: 'minor', sequenceNumber: 4 },
  },
  {
    termId: 5,
    resultId: 'MAT',
    parameters: { amount: '5.00' },
    creditor: { type: 'minor', sequenceNumber: 5 },
  },
  { termId: 6, resultId: 'MAT', parameters: { amount: '12.30' }, creditor: null },
];
