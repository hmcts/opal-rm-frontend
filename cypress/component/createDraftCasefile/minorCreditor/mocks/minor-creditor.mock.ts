import type { ICasesCreateCasefileMinorCreditorDetails } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-minor-creditor-details.interface';
import type { ICasesCreateCasefileState } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-state.interface';
import { MINOR_CREDITOR_DETAILS_MOCK } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-minor-creditor-details/mocks/cases-create-casefile-minor-creditor.mock';

export const MINOR_CREDITOR_INDIVIDUAL_NONE_MOCK: ICasesCreateCasefileMinorCreditorDetails = {
  ...structuredClone(MINOR_CREDITOR_DETAILS_MOCK),
  identity: { type: 'individual', title: 'Dr', firstNames: 'Example', lastName: 'Person' },
};

export const MINOR_CREDITOR_UK_MOCK: ICasesCreateCasefileMinorCreditorDetails = {
  ...structuredClone(MINOR_CREDITOR_DETAILS_MOCK),
  bank: {
    type: 'uk',
    nameOnAccount: 'Example creditor',
    sortCode: '001122',
    accountNumber: '00112233',
    paymentReference: 'Example reference',
  },
};

export const MINOR_CREDITOR_NON_UK_MOCK: ICasesCreateCasefileMinorCreditorDetails = {
  ...structuredClone(MINOR_CREDITOR_DETAILS_MOCK),
  bank: {
    type: 'non-uk',
    nameOnAccount: 'Example creditor',
    paymentReference: 'Example reference',
    accountNumber: null,
    bicSwiftCode: null,
    iban: null,
    bankName: null,
    branchSortCode: null,
  },
};

export const MINOR_CREDITOR_SAVED_STATE_MOCK: Partial<ICasesCreateCasefileState> = {
  orderTerms: [
    {
      termId: 1,
      resultId: 'MAT',
      parameters: { amount: '12.30' },
      creditor: { type: 'minor', sequenceNumber: 1 },
    },
  ],
  currentOrderTermId: 1,
  minorCreditors: [{ sequenceNumber: 1, displayName: 'Example creditor', details: MINOR_CREDITOR_UK_MOCK }],
  nextMinorCreditorSequence: 2,
  creditorDraft: null,
};
