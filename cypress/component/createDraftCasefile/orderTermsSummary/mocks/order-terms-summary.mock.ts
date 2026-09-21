import type { ICasesCreateCasefileAcceptedOrderTerm } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-accepted-order-term.interface';
import type { ICasesCreateCasefileMinorCreditor } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-minor-creditor.interface';
import {
  MINOR_CREDITOR_INDIVIDUAL_NONE_MOCK,
  MINOR_CREDITOR_NON_UK_MOCK,
  MINOR_CREDITOR_UK_MOCK,
} from '../../minorCreditor/mocks/minor-creditor.mock';

export const SUMMARY_CREDITORS: ICasesCreateCasefileMinorCreditor[] = [
  {
    sequenceNumber: 1,
    displayName: 'Synthetic creditor',
    details: MINOR_CREDITOR_UK_MOCK,
  },
  {
    sequenceNumber: 2,
    displayName: 'Synthetic international creditor with a deliberately long label and reference',
    details: {
      ...MINOR_CREDITOR_NON_UK_MOCK,
      bank: {
        type: 'non-uk',
        nameOnAccount: 'Synthetic international account holder',
        bicSwiftCode: null,
        iban: null,
        bankName: 'Synthetic international bank with a deliberately long descriptive name',
        branchSortCode: 'SYNTHETIC-LONG-BRANCH-REFERENCE-00000001',
        accountNumber: '000000001234567890',
        paymentReference: 'SYNTHETIC-LONG-PAYMENT-REFERENCE-00000001',
      },
    },
  },
  {
    sequenceNumber: 3,
    displayName: 'Synthetic no-bank creditor',
    details: MINOR_CREDITOR_INDIVIDUAL_NONE_MOCK,
  },
];

export const SUMMARY_TERMS: ICasesCreateCasefileAcceptedOrderTerm[] = [1, 2].map((termId) => ({
  termId,
  resultId: 'MAT',
  parameters: { amount: termId === 1 ? '10.00' : '20.00' },
  creditor: { type: 'minor', sequenceNumber: 1 },
  presentation: {
    title: 'Maintenance',
    fields: [{ name: 'amount', label: 'Amount', kind: 'money', options: [] }],
  },
}));
