import { describe, expect, it } from 'vitest';
import type { ICasesCreateCasefileMinorCreditorDetails } from '../../interfaces/cases-create-casefile-minor-creditor-details.interface';
import { MINOR_CREDITOR_DETAILS_MOCK } from '../mocks/cases-create-casefile-minor-creditor.mock';
import { CASES_CREATE_CASEFILE_MINOR_CREDITOR_FIELD_NAMES as F } from '../constants/cases-create-casefile-minor-creditor-field-names.constant';
import type { ICasesCreateCasefileMinorCreditorFormData } from '../interfaces/cases-create-casefile-minor-creditor-form-data.interface';
import { toMinorCreditorDetails, toMinorCreditorFormData } from './cases-create-casefile-minor-creditor-mapper';

const canonicalFormData = (): ICasesCreateCasefileMinorCreditorFormData => ({
  [F.creditorType]: 'individual',
  [F.title]: ' Dr ',
  [F.firstNames]: ' Example ',
  [F.lastName]: ' Person ',
  [F.organisationName]: ' Hidden organisation ',
  [F.addressLine1]: ' 1 Test Street ',
  [F.addressLine2]: ' ',
  [F.addressLine3]: ' District ',
  [F.addressLine4]: null,
  [F.addressLine5]: null,
  [F.postalOrZipCode]: ' TE1 1ST ',
  [F.countryId]: '826',
  [F.bankType]: 'uk',
  [F.ukNameOnAccount]: ' Example Account ',
  [F.ukSortCode]: '00-11-22',
  [F.ukAccountNumber]: '00112233',
  [F.ukPaymentReference]: ' Reference ',
  [F.nonUkNameOnAccount]: 'Hidden account',
  [F.nonUkAccountNumber]: '000001',
  [F.nonUkPaymentReference]: 'Hidden reference',
  [F.nonUkBicSwiftCode]: 'ABCD1234',
  [F.nonUkIban]: 'HIDDEN',
  [F.nonUkBankName]: 'Hidden bank',
  [F.nonUkBranchSortCode]: '000123',
});

describe('toMinorCreditorDetails', () => {
  it('maps an individual with UK bank details and excludes inactive values', () => {
    expect(toMinorCreditorDetails(canonicalFormData())).toEqual({
      identity: { type: 'individual', title: 'Dr', firstNames: 'Example', lastName: 'Person' },
      address: {
        addressLine1: '1 Test Street',
        addressLine2: null,
        addressLine3: 'District',
        addressLine4: null,
        addressLine5: null,
        postalOrZipCode: 'TE1 1ST',
        countryId: 826,
      },
      bank: {
        type: 'uk',
        nameOnAccount: 'Example Account',
        sortCode: '001122',
        accountNumber: '00112233',
        paymentReference: 'Reference',
      },
    });
  });

  it('maps an organisation with non-UK bank details and preserves leading zeros', () => {
    const raw = canonicalFormData();
    raw[F.creditorType] = 'organisation';
    raw[F.organisationName] = ' Example creditor ';
    raw[F.bankType] = 'non-uk';
    expect(toMinorCreditorDetails(raw)).toEqual({
      identity: { type: 'organisation', organisationName: 'Example creditor' },
      address: {
        addressLine1: '1 Test Street',
        addressLine2: null,
        addressLine3: 'District',
        addressLine4: null,
        addressLine5: null,
        postalOrZipCode: 'TE1 1ST',
        countryId: 826,
      },
      bank: {
        type: 'non-uk',
        nameOnAccount: 'Hidden account',
        accountNumber: '000001',
        paymentReference: 'Hidden reference',
        bicSwiftCode: 'ABCD1234',
        iban: 'HIDDEN',
        bankName: 'Hidden bank',
        branchSortCode: '000123',
      },
    });
  });

  it('maps blank optional non-UK fields to null', () => {
    const raw = canonicalFormData();
    raw[F.bankType] = 'non-uk';
    raw[F.nonUkAccountNumber] = '';
    raw[F.nonUkBicSwiftCode] = ' ';
    raw[F.nonUkIban] = null;
    raw[F.nonUkBankName] = '';
    raw[F.nonUkBranchSortCode] = ' ';
    expect(toMinorCreditorDetails(raw).bank).toEqual({
      type: 'non-uk',
      nameOnAccount: 'Hidden account',
      accountNumber: null,
      paymentReference: 'Hidden reference',
      bicSwiftCode: null,
      iban: null,
      bankName: null,
      branchSortCode: null,
    });
  });

  it('maps None without hidden bank values', () => {
    const raw = canonicalFormData();
    raw[F.bankType] = 'none';
    expect(toMinorCreditorDetails(raw).bank).toEqual({ type: 'none' });
  });
});

describe('toMinorCreditorFormData', () => {
  it('returns every canonical field as null for empty entry restoration', () => {
    const restored = toMinorCreditorFormData(null);
    expect(Object.keys(restored)).toEqual(Object.values(F));
    expect(Object.values(restored).every((value) => value === null)).toBe(true);
  });

  it.each<ICasesCreateCasefileMinorCreditorDetails>([
    MINOR_CREDITOR_DETAILS_MOCK,
    {
      identity: { type: 'individual', title: null, firstNames: 'Example', lastName: 'Person' },
      address: { ...MINOR_CREDITOR_DETAILS_MOCK.address, addressLine2: 'District' },
      bank: {
        type: 'uk',
        nameOnAccount: 'Example account',
        sortCode: '001122',
        accountNumber: '00112233',
        paymentReference: 'Reference',
      },
    },
    {
      identity: { type: 'organisation', organisationName: 'Example creditor' },
      address: MINOR_CREDITOR_DETAILS_MOCK.address,
      bank: {
        type: 'non-uk',
        nameOnAccount: 'Example account',
        accountNumber: '000001',
        paymentReference: 'Reference',
        bicSwiftCode: null,
        iban: 'A',
        bankName: null,
        branchSortCode: '000123',
      },
    },
  ])('round trips the saved $identity.type / $bank.type branches', (details) => {
    expect(toMinorCreditorDetails(toMinorCreditorFormData(details))).toEqual(details);
  });

  it('round trips saved None details without hidden banks', () => {
    const raw = toMinorCreditorFormData(MINOR_CREDITOR_DETAILS_MOCK);
    raw[F.ukAccountNumber] = '00112233';
    raw[F.nonUkIban] = 'HIDDEN';
    expect(toMinorCreditorDetails(raw)).toEqual(MINOR_CREDITOR_DETAILS_MOCK);
  });
});
