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

export const MINOR_CREDITOR_NON_UK_MOCK = {
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
} satisfies ICasesCreateCasefileMinorCreditorDetails;

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

export const MINOR_CREDITOR_PENDING_STATE_MOCK: Partial<ICasesCreateCasefileState> = {
  orderTerms: [
    {
      termId: 1,
      resultId: 'MAT',
      parameters: { amount: '12.30' },
      creditor: null,
    },
  ],
  currentOrderTermId: 1,
  minorCreditors: [],
  nextMinorCreditorSequence: 1,
  creditorDraft: {
    termId: 1,
    branch: 'add-new',
    details: MINOR_CREDITOR_UK_MOCK,
    countryName: 'United Kingdom',
  },
};

export const MINOR_CREDITOR_PENDING_INDIVIDUAL_UK_STATE_MOCK: Partial<ICasesCreateCasefileState> = {
  ...MINOR_CREDITOR_PENDING_STATE_MOCK,
  creditorDraft: {
    termId: 1,
    branch: 'add-new',
    details: { ...MINOR_CREDITOR_UK_MOCK, identity: MINOR_CREDITOR_INDIVIDUAL_NONE_MOCK.identity },
    countryName: 'United Kingdom',
  },
};

export const MINOR_CREDITOR_PENDING_NON_UK_STATE_MOCK: Partial<ICasesCreateCasefileState> = {
  ...MINOR_CREDITOR_PENDING_STATE_MOCK,
  creditorDraft: {
    termId: 1,
    branch: 'add-new',
    details: {
      ...MINOR_CREDITOR_NON_UK_MOCK,
      address: { ...MINOR_CREDITOR_NON_UK_MOCK.address, countryId: 250 },
    },
    countryName: 'France',
  },
};

export const MINOR_CREDITOR_PENDING_NONE_STATE_MOCK: Partial<ICasesCreateCasefileState> = {
  ...MINOR_CREDITOR_PENDING_STATE_MOCK,
  creditorDraft: {
    termId: 1,
    branch: 'add-new',
    details: MINOR_CREDITOR_INDIVIDUAL_NONE_MOCK,
    countryName: 'United Kingdom',
  },
};

export const MINOR_CREDITOR_PENDING_REPLACEMENT_STATE_MOCK: Partial<ICasesCreateCasefileState> = {
  ...MINOR_CREDITOR_SAVED_STATE_MOCK,
  creditorDraft: {
    ...MINOR_CREDITOR_PENDING_STATE_MOCK.creditorDraft!,
    details: MINOR_CREDITOR_NON_UK_MOCK,
  },
  commentsAndNotes: { comment: 'Example case comment', note: 'Example case note' },
};
export const MINOR_CREDITOR_BIC_MOCK: ICasesCreateCasefileMinorCreditorDetails = {
  ...structuredClone(MINOR_CREDITOR_NON_UK_MOCK),
  bank: { ...MINOR_CREDITOR_NON_UK_MOCK.bank, type: 'non-uk', bicSwiftCode: 'ABCDEFGH' },
};

export const MINOR_CREDITOR_IBAN_MOCK: ICasesCreateCasefileMinorCreditorDetails = {
  ...structuredClone(MINOR_CREDITOR_NON_UK_MOCK),
  bank: { ...MINOR_CREDITOR_NON_UK_MOCK.bank, type: 'non-uk', iban: 'GB00EXAMPLE00000001' },
};

const individualSavedState: Partial<ICasesCreateCasefileState> = {
  ...structuredClone(MINOR_CREDITOR_SAVED_STATE_MOCK),
  minorCreditors: [
    { sequenceNumber: 1, displayName: 'Dr Example Person', details: MINOR_CREDITOR_INDIVIDUAL_NONE_MOCK },
  ],
};
const nonUkSavedState: Partial<ICasesCreateCasefileState> = {
  ...structuredClone(MINOR_CREDITOR_SAVED_STATE_MOCK),
  minorCreditors: [{ sequenceNumber: 1, displayName: 'Example creditor', details: MINOR_CREDITOR_BIC_MOCK }],
};

export const MINOR_CREDITOR_RESTORATION_CASES = [
  {
    name: 'Individual and None',
    identityRadio: 'individual',
    bankRadio: 'bankNone',
    state: individualSavedState,
    fields: [
      ['title', 'Dr'],
      ['firstNames', 'Example'],
      ['lastName', 'Person'],
    ],
  },
  {
    name: 'Organisation and UK bank',
    identityRadio: 'organisation',
    bankRadio: 'bankUk',
    state: structuredClone(MINOR_CREDITOR_SAVED_STATE_MOCK),
    fields: [
      ['organisationName', 'Example creditor'],
      ['ukNameOnAccount', 'Example creditor'],
      ['ukSortCode', '001122'],
      ['ukAccountNumber', '00112233'],
      ['ukPaymentReference', 'Example reference'],
    ],
  },
  {
    name: 'Organisation and non-UK bank',
    identityRadio: 'organisation',
    bankRadio: 'bankNonUk',
    state: nonUkSavedState,
    fields: [
      ['organisationName', 'Example creditor'],
      ['nonUkNameOnAccount', 'Example creditor'],
      ['nonUkAccountNumber', ''],
      ['nonUkPaymentReference', 'Example reference'],
      ['nonUkBicSwiftCode', 'ABCDEFGH'],
      ['nonUkIban', ''],
      ['nonUkBankName', ''],
      ['nonUkBranchSortCode', ''],
    ],
  },
] as const;

export const MINOR_CREDITOR_RESTORED_ADDRESS_FIELDS = [
  ['addressLine1', '1 Test Street'],
  ['addressLine2', ''],
  ['addressLine3', ''],
  ['addressLine4', ''],
  ['addressLine5', ''],
  ['postalOrZipCode', ''],
  ['countryAutocomplete', 'United Kingdom'],
  ['countryId', '826'],
] as const;
