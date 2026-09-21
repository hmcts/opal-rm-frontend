import { describe, expect, it } from 'vitest';
import type { ICasesCreateCasefileAcceptedOrderTerm } from '../../interfaces/cases-create-casefile-accepted-order-term.interface';
import type { CasesCreateCasefileApplicantBankDetails } from '../../types/cases-create-casefile-applicant-bank-details.type';
import type { CasesCreateCasefileMinorCreditorBank } from '../../types/cases-create-casefile-minor-creditor-bank.type';
import { creditorBankRows, orderTermRows } from './cases-create-casefile-order-terms-summary-rows';

const term = (
  fields: ICasesCreateCasefileAcceptedOrderTerm['presentation']['fields'],
  parameters: ICasesCreateCasefileAcceptedOrderTerm['parameters'],
): ICasesCreateCasefileAcceptedOrderTerm => ({
  termId: 1,
  resultId: 'SYNTHETIC',
  parameters,
  creditor: null,
  presentation: { title: 'Synthetic result', fields },
});

describe('orderTermRows', () => {
  it('preserves metadata order and formats each supported saved value', () => {
    const accepted = term(
      [
        { name: 'expiry', label: 'Expiry', kind: 'date', options: [] },
        { name: 'amount', label: 'Amount', kind: 'money', options: [] },
        { name: 'enabled', label: 'Enabled', kind: 'checkbox', options: [] },
        { name: 'count', label: 'Count', kind: 'integer', options: [] },
        { name: 'child', label: 'Child', kind: 'text', options: [] },
        { name: 'option', label: 'Option', kind: 'select', options: [{ value: 'A', label: 'Option A' }] },
        { name: 'arrears', label: 'Arrears', kind: 'money', options: [] },
      ],
      { expiry: '2026-09-21', amount: '0', enabled: false, count: 0, child: 'Synthetic child', option: 'A' },
    );

    expect(orderTermRows(accepted, 'Weekly').map((row) => [row.label, row.value])).toEqual([
      ['Expiry', '21 September 2026'],
      ['Amount', '£0.00'],
      ['Enabled', 'No'],
      ['Count', '0'],
      ['Child', 'Synthetic child'],
      ['Option', 'Option A'],
    ]);
  });

  it('formats true and preserves long text without interpreting HTML', () => {
    const accepted = term(
      [
        { name: 'enabled', label: 'Enabled', kind: 'checkbox', options: [] },
        { name: 'notes', label: 'Notes', kind: 'long_text', options: [] },
      ],
      { enabled: true, notes: '<strong>Synthetic text</strong>' },
    );

    expect(orderTermRows(accepted, '')).toEqual([
      { id: 'enabled', label: 'Enabled', value: 'Yes' },
      { id: 'notes', label: 'Notes', value: '<strong>Synthetic text</strong>' },
    ]);
  });

  it('omits blank, null and absent parameters', () => {
    const accepted = term(
      [
        { name: 'blank', label: 'Blank', kind: 'text', options: [] },
        { name: 'empty', label: 'Empty', kind: 'text', options: [] },
        { name: 'absent', label: 'Absent', kind: 'text', options: [] },
      ],
      { blank: '   ', empty: null } as unknown as ICasesCreateCasefileAcceptedOrderTerm['parameters'],
    );

    expect(orderTermRows(accepted, '')).toEqual([]);
  });

  it('reads readonly frequency from order details instead of saved parameters', () => {
    const accepted = term([{ name: 'frequency', label: 'Payment frequency', kind: 'readonly', options: [] }], {
      frequency: 'Monthly',
    });

    expect(orderTermRows(accepted, 'Weekly')).toEqual([
      { id: 'frequency', label: 'Payment frequency', value: 'Weekly' },
    ]);
  });

  it('preserves large money values and their saved decimal precision', () => {
    const accepted = term([{ name: 'amount', label: 'Amount', kind: 'money', options: [] }], {
      amount: '9007199254740993.5',
    });

    expect(orderTermRows(accepted, '')).toEqual([
      { id: 'amount', label: 'Amount', value: '£9,007,199,254,740,993.50' },
    ]);
  });
});

describe('creditorBankRows', () => {
  it('projects UK bank details in review order', () => {
    const bank: CasesCreateCasefileMinorCreditorBank = {
      type: 'uk',
      nameOnAccount: 'Synthetic creditor',
      sortCode: '001122',
      accountNumber: '00112233',
      paymentReference: 'Synthetic reference',
    };

    expect(creditorBankRows(bank).map((row) => [row.label, row.value])).toEqual([
      ['Name on account', 'Synthetic creditor'],
      ['Sort code', '001122'],
      ['Account number', '00112233'],
      ['Payment reference', 'Synthetic reference'],
    ]);
  });

  it.each([
    ['BIC', { bicSwiftCode: 'SYNTHGB2L', iban: null }, [['BIC/SWIFT', 'SYNTHGB2L']]],
    ['IBAN', { bicSwiftCode: null, iban: 'GB00SYNTHETIC' }, [['IBAN', 'GB00SYNTHETIC']]],
  ] as const)('projects non-UK %s details without fallback fields', (_name, codes, expected) => {
    const bank: CasesCreateCasefileApplicantBankDetails = {
      type: 'non-uk',
      nameOnAccount: 'Synthetic creditor',
      paymentReference: '',
      accountNumber: 'FALLBACK-ACCOUNT',
      bankName: 'Fallback bank',
      branchSortCode: 'FALLBACK-BRANCH',
      ...codes,
    };

    expect(creditorBankRows(bank).map((row) => [row.label, row.value])).toEqual([
      ['Name on account', 'Synthetic creditor'],
      ...expected,
    ]);
  });

  it('projects non-UK fallback details only when both BIC and IBAN are absent', () => {
    const bank: CasesCreateCasefileMinorCreditorBank = {
      type: 'non-uk',
      nameOnAccount: 'Synthetic creditor',
      paymentReference: 'Synthetic reference',
      bicSwiftCode: null,
      iban: null,
      bankName: 'Synthetic bank',
      branchSortCode: '998877',
      accountNumber: 'NONUK123',
    };

    expect(creditorBankRows(bank).map((row) => [row.label, row.value])).toEqual([
      ['Name on account', 'Synthetic creditor'],
      ['Bank name', 'Synthetic bank'],
      ['Branch/sort code', '998877'],
      ['Account number', 'NONUK123'],
      ['Payment reference', 'Synthetic reference'],
    ]);
  });

  it.each([null, { type: 'none' } as const])('omits absent bank details %#', (bank) => {
    expect(creditorBankRows(bank)).toEqual([]);
  });
});
