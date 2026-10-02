import type { ICasesCreateCasefileMinorCreditorDetails } from '../../interfaces/cases-create-casefile-minor-creditor-details.interface';
import { MINOR_CREDITOR_DETAILS_MOCK } from '../../cases-create-casefile-minor-creditor-details/mocks/cases-create-casefile-minor-creditor.mock';
import { minorCreditorSummaryRows } from './cases-create-casefile-minor-creditor-summary-rows';

const bankRows = (details: ICasesCreateCasefileMinorCreditorDetails) =>
  minorCreditorSummaryRows(details, 'United Kingdom').filter((row) => row.id !== 'name' && row.id !== 'address');

describe('minorCreditorSummaryRows', () => {
  it('changes only removal bank labels', () => {
    const details: ICasesCreateCasefileMinorCreditorDetails = {
      ...structuredClone(MINOR_CREDITOR_DETAILS_MOCK),
      bank: {
        type: 'non-uk',
        nameOnAccount: 'Example',
        paymentReference: 'REF',
        bicSwiftCode: null,
        iban: null,
        bankName: 'Example bank',
        branchSortCode: '0011',
        accountNumber: '000123',
      },
    };
    const summary = minorCreditorSummaryRows(details, 'United Kingdom');
    const removal = minorCreditorSummaryRows(details, 'United Kingdom', 'removal');

    expect(summary.find((row) => row.id === 'bankType')?.label).toBe('Bank account type');
    expect(removal.find((row) => row.id === 'bankType')?.label).toBe('Type of bank account');
    expect(removal.find((row) => row.id === 'bicSwiftCode')?.label).toBe('BIC or SWIFT code');
    expect(removal.find((row) => row.id === 'branchSortCode')?.label).toBe('Branch code or sort code');
    expect(removal.find((row) => row.id === 'address')?.values.at(-1)).toBe('United Kingdom');
  });

  it.each([
    ['BIC', 'IBAN', false],
    ['BIC', null, false],
    [null, 'IBAN', false],
    [null, null, true],
  ] as const)('shows international identifiers %s/%s with fallback=%s', (bicSwiftCode, iban, fallback) => {
    const details: ICasesCreateCasefileMinorCreditorDetails = {
      ...structuredClone(MINOR_CREDITOR_DETAILS_MOCK),
      bank: {
        type: 'non-uk',
        nameOnAccount: 'Example',
        paymentReference: 'REF',
        bicSwiftCode,
        iban,
        bankName: 'Example bank',
        branchSortCode: '0011',
        accountNumber: '000123',
      },
    };

    const rows = minorCreditorSummaryRows(details, 'United Kingdom');

    expect(rows.find((row) => row.id === 'bicSwiftCode')?.values).toEqual([bicSwiftCode ?? '-']);
    expect(rows.find((row) => row.id === 'iban')?.values).toEqual([iban ?? '-']);
    expect(rows.some((row) => row.id === 'bankName')).toBe(fallback);
    expect(rows.some((row) => row.id === 'branchSortCode')).toBe(fallback);
    expect(rows.some((row) => row.id === 'accountNumber')).toBe(fallback);
  });

  it('preserves UK sort code and account number strings', () => {
    const rows = minorCreditorSummaryRows(
      {
        ...structuredClone(MINOR_CREDITOR_DETAILS_MOCK),
        bank: {
          type: 'uk',
          nameOnAccount: 'Example creditor',
          sortCode: '001122',
          accountNumber: '000123',
          paymentReference: 'REF',
        },
      },
      'United Kingdom',
    );

    expect(rows.find((row) => row.id === 'sortCode')?.values).toEqual(['001122']);
    expect(rows.find((row) => row.id === 'accountNumber')?.values).toEqual(['000123']);
  });

  it('shows no banking detail rows when there is no bank account', () => {
    expect(bankRows(MINOR_CREDITOR_DETAILS_MOCK)).toEqual([
      { id: 'bankType', label: 'Bank account type', values: ['None'] },
    ]);
  });

  it.each([
    [{ type: 'individual' as const, title: 'Dr', firstNames: 'Alex', lastName: 'Example' }, 'Name', 'Dr Alex Example'],
    [{ type: 'individual' as const, title: null, firstNames: 'Alex', lastName: 'Example' }, 'Name', 'Alex Example'],
    [{ type: 'organisation' as const, organisationName: 'Example Ltd' }, 'Organisation name', 'Example Ltd'],
  ])('renders the identity %j', (identity, label, value) => {
    const rows = minorCreditorSummaryRows(
      { ...structuredClone(MINOR_CREDITOR_DETAILS_MOCK), identity },
      'United Kingdom',
    );

    expect(rows[0]).toEqual({ id: 'name', label, values: [value] });
  });

  it('omits absent address lines and appends the supplied country label', () => {
    const rows = minorCreditorSummaryRows(
      {
        ...structuredClone(MINOR_CREDITOR_DETAILS_MOCK),
        address: {
          addressLine1: '1 Test Street',
          addressLine2: null,
          addressLine3: 'Test Town',
          addressLine4: '',
          addressLine5: 'Test County',
          postalOrZipCode: null,
          countryId: 826,
        },
      },
      'United Kingdom',
    );

    expect(rows.find((row) => row.id === 'address')?.values).toEqual([
      '1 Test Street',
      'Test Town',
      'Test County',
      'United Kingdom',
    ]);
  });

  it('uses dashes for absent non-UK fallback details', () => {
    const rows = minorCreditorSummaryRows(
      {
        ...structuredClone(MINOR_CREDITOR_DETAILS_MOCK),
        bank: {
          type: 'non-uk',
          nameOnAccount: 'Example',
          paymentReference: 'REF',
          bicSwiftCode: null,
          iban: null,
          bankName: null,
          branchSortCode: null,
          accountNumber: null,
        },
      },
      'United Kingdom',
    );

    expect(rows.filter((row) => ['bankName', 'branchSortCode', 'accountNumber'].includes(row.id))).toEqual([
      { id: 'bankName', label: 'Bank name', values: ['-'] },
      { id: 'branchSortCode', label: 'Branch/sort code', values: ['-'] },
      { id: 'accountNumber', label: 'Account number', values: ['-'] },
    ]);
  });
});
