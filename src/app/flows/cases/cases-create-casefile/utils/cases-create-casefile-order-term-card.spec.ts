import { describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS } from '../cases-create-casefile-applicant-individual/mocks/cases-create-casefile-applicant-individual.mock';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS } from '../cases-create-casefile-applicant-organisation/mocks/cases-create-casefile-applicant-organisation.mock';
import { MINOR_CREDITOR_DETAILS_MOCK } from '../cases-create-casefile-minor-creditor-details/mocks/cases-create-casefile-minor-creditor.mock';
import type { ICasesCreateCasefileAcceptedOrderTerm } from '../interfaces/cases-create-casefile-accepted-order-term.interface';
import { buildOrderTermCard } from './cases-create-casefile-order-term-card';

describe('buildOrderTermCard', () => {
  const term: ICasesCreateCasefileAcceptedOrderTerm = {
    termId: 7,
    resultId: 'MAT',
    parameters: { amount: '10.00' },
    creditor: { type: 'major', majorCreditorId: 101, displayName: 'Synthetic creditor' },
    presentation: {
      title: 'Maintenance',
      fields: [{ name: 'amount', label: 'Amount', kind: 'money', options: [] }],
    },
  };

  it('renders the selected term and its captured creditor', () => {
    const card = buildOrderTermCard(term, {
      applicantDetails: null,
      minorCreditors: [],
      orderDetails: null,
    });

    expect(card.title).toBe('Maintenance');
    expect(card.rows).toEqual([
      { id: 'amount', label: 'Amount', value: '£10.00' },
      { id: 'assigned-creditor', label: 'Creditor', value: 'Synthetic creditor' },
    ]);
    expect(card.bankRows).toEqual([]);
  });

  it.each([
    [
      'individual applicant with UK bank details',
      CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.saved,
      'Mr Test Applicant',
      [
        { id: 'nameOnAccount', label: 'Name on account', value: 'Test Applicant' },
        { id: 'sortCode', label: 'Sort code', value: '123456' },
        { id: 'accountNumber', label: 'Account number', value: '12345678' },
        { id: 'paymentReference', label: 'Payment reference', value: 'PAY-123' },
      ],
    ],
    [
      'organisation applicant with international bank details',
      CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedNonUk,
      'Example Organisation',
      [
        { id: 'nameOnAccount', label: 'Name on account', value: 'Example Organisation International' },
        { id: 'bicSwiftCode', label: 'BIC/SWIFT', value: 'EXAMGB2L' },
        { id: 'iban', label: 'IBAN', value: 'GB29NWBK60161331926819' },
        { id: 'paymentReference', label: 'Payment reference', value: 'INTL-9803' },
      ],
    ],
    [
      'organisation applicant without bank details',
      CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedNone,
      'Example Organisation',
      [],
    ],
  ])('renders an %s', (_description, applicantDetails, creditorName, bankRows) => {
    const card = buildOrderTermCard(
      { ...term, creditor: { type: 'applicant' } },
      {
        applicantDetails,
        minorCreditors: [],
        orderDetails: null,
      },
    );

    expect(card.rows.at(-1)).toEqual({ id: 'assigned-creditor', label: 'Creditor', value: creditorName });
    expect(card.bankRows).toEqual(bankRows);
  });

  it('renders the same saved minor creditor for every term that shares its assignment', () => {
    const minorCreditors = [
      {
        sequenceNumber: 3,
        displayName: 'Shared creditor',
        details: {
          ...structuredClone(MINOR_CREDITOR_DETAILS_MOCK),
          bank: {
            type: 'uk' as const,
            nameOnAccount: 'Shared creditor',
            sortCode: '001122',
            accountNumber: '00112233',
            paymentReference: 'SHARED',
          },
        },
      },
    ];
    const context = { applicantDetails: null, minorCreditors, orderDetails: null };
    const sharedTerm = { ...term, creditor: { type: 'minor' as const, sequenceNumber: 3 } };

    const cards = [sharedTerm, { ...sharedTerm, termId: 8 }].map((item) => buildOrderTermCard(item, context));

    expect(cards.map((card) => card.rows.at(-1)?.value)).toEqual(['Shared creditor', 'Shared creditor']);
    expect(cards.map((card) => card.bankRows)).toEqual([
      [
        { id: 'nameOnAccount', label: 'Name on account', value: 'Shared creditor' },
        { id: 'sortCode', label: 'Sort code', value: '001122' },
        { id: 'accountNumber', label: 'Account number', value: '00112233' },
        { id: 'paymentReference', label: 'Payment reference', value: 'SHARED' },
      ],
      [
        { id: 'nameOnAccount', label: 'Name on account', value: 'Shared creditor' },
        { id: 'sortCode', label: 'Sort code', value: '001122' },
        { id: 'accountNumber', label: 'Account number', value: '00112233' },
        { id: 'paymentReference', label: 'Payment reference', value: 'SHARED' },
      ],
    ]);
  });

  it.each([
    ['no assignment', null],
    ['an unavailable minor creditor', { type: 'minor' as const, sequenceNumber: 999 }],
  ])('omits creditor presentation for %s', (_description, creditor) => {
    const card = buildOrderTermCard(
      { ...term, creditor },
      {
        applicantDetails: null,
        minorCreditors: [],
        orderDetails: null,
      },
    );

    expect(card.rows).toEqual([{ id: 'amount', label: 'Amount', value: '£10.00' }]);
    expect(card.bankRows).toEqual([]);
  });
});
