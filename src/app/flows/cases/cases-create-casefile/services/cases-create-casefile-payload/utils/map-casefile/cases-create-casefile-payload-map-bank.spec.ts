import { mapSavedBank } from './cases-create-casefile-payload-map-bank';
import type { IOpalMaintenanceDraftCasefileRequest } from '../../../../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';
type Bank = IOpalMaintenanceDraftCasefileRequest['casefile']['applicant']['bank_account_details'];
describe('mapSavedBank', () => {
  it('restores the none branch', () => {
    expect(mapSavedBank({ bank_account_type: 'None or not applicable' })).toEqual({ type: 'none' });
  });
  it('preserves UK bank details including leading zeroes without mutation', () => {
    const value: Bank = {
      bank_account_type: 'UK Bank',
      uk_bank_details: {
        account_name: 'Synthetic',
        sort_code: '001122',
        account_number: '00123456',
        payment_reference: 'TEST',
      },
    };
    const before = structuredClone(value);
    expect(mapSavedBank(value)).toEqual({
      type: 'uk',
      nameOnAccount: 'Synthetic',
      sortCode: '001122',
      accountNumber: '00123456',
      paymentReference: 'TEST',
    });
    expect(value).toEqual(before);
  });
  it('preserves every non-UK bank field', () => {
    expect(
      mapSavedBank({
        bank_account_type: 'Non-UK Bank',
        non_uk_bank_details: {
          account_name: 'Synthetic',
          payment_reference: 'TEST',
          bic_or_swift_code: 'BIC',
          iban: 'IBAN',
          bank_name: 'Test Bank',
          branch_code_or_sort_code: '01',
          account_number: '002',
        },
      }),
    ).toEqual({
      type: 'non-uk',
      nameOnAccount: 'Synthetic',
      paymentReference: 'TEST',
      bicSwiftCode: 'BIC',
      iban: 'IBAN',
      bankName: 'Test Bank',
      branchSortCode: '01',
      accountNumber: '002',
    });
  });
  it('restores absent non-UK optional fields as null', () => {
    expect(
      mapSavedBank({
        bank_account_type: 'Non-UK Bank',
        non_uk_bank_details: { account_name: 'Synthetic', payment_reference: 'TEST' },
      }),
    ).toEqual({
      type: 'non-uk',
      nameOnAccount: 'Synthetic',
      paymentReference: 'TEST',
      bicSwiftCode: null,
      iban: null,
      bankName: null,
      branchSortCode: null,
      accountNumber: null,
    });
  });
  it.each([
    { bank_account_type: 'None or not applicable', non_uk_bank_details: {} },
    {
      bank_account_type: 'Non-UK Bank',
      uk_bank_details: {},
      non_uk_bank_details: { account_name: 'Test', payment_reference: 'REF' },
    },
    {
      bank_account_type: 'Non-UK Bank',
      non_uk_bank_details: { account_name: 'Test', payment_reference: 'REF', iban: 1 },
    },
    {
      bank_account_type: 'UK Bank',
      uk_bank_details: { account_name: ' ', sort_code: '1', account_number: '2', payment_reference: '3' },
    },
    null,
    {},
    { bank_account_type: 'unknown' },
    { bank_account_type: 'UK Bank' },
    { bank_account_type: 'Non-UK Bank' },
    { bank_account_type: 'None or not applicable', uk_bank_details: {} },
    { bank_account_type: 'UK Bank', uk_bank_details: { account_name: 'Test' } },
    { bank_account_type: 'Non-UK Bank', non_uk_bank_details: { account_name: 'Test', payment_reference: 42 } },
    {
      bank_account_type: 'UK Bank',
      uk_bank_details: { account_name: 'Test', sort_code: '1', account_number: '2', payment_reference: '3' },
      non_uk_bank_details: {},
    },
  ])('rejects malformed or conflicting bank branches %# with a safe error', (value) => {
    expect(() => mapSavedBank(value as Bank)).toThrow('Unusable saved bank');
  });
});
