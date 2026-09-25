import type { AbstractControl } from '@angular/forms';
import { describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_MINOR_CREDITOR_FIELD_ERRORS } from '../constants/cases-create-casefile-minor-creditor-field-errors.constant';
import { CASES_CREATE_CASEFILE_MINOR_CREDITOR_FIELD_NAMES as F } from '../constants/cases-create-casefile-minor-creditor-field-names.constant';
import { applyMinorCreditorBranches, createMinorCreditorForm } from './cases-create-casefile-minor-creditor-form';

const countries = [{ value: 826 }, { value: '840' }] as const;

const setIdentity = (type: 'individual' | 'organisation') => {
  const form = createMinorCreditorForm(countries);
  form.controls[F.creditorType].setValue(type);
  applyMinorCreditorBranches(form, () => undefined);
  return form;
};

const setBank = (type: 'uk' | 'non-uk' | 'none') => {
  const form = createMinorCreditorForm(countries);
  form.controls[F.bankType].setValue(type);
  applyMinorCreditorBranches(form, () => undefined);
  return form;
};

describe('minor creditor form rules', () => {
  it.each([
    [F.creditorType, ['individual', 'organisation'], [null, 'company']],
    [F.bankType, ['uk', 'non-uk', 'none'], [null, 'international']],
  ] as const)('accepts only the listed values for %s', (name, validValues, invalidValues) => {
    for (const value of validValues) {
      const form = createMinorCreditorForm(countries);
      const control: AbstractControl = form.controls[name];
      control.setValue(value);
      expect(control.valid).toBe(true);
    }
    for (const value of invalidValues) {
      const form = createMinorCreditorForm(countries);
      const control: AbstractControl = form.controls[name];
      control.setValue(value);
      expect(control.invalid).toBe(true);
    }
  });

  it.each([
    [F.title, ['', 'A'.repeat(20)], ['A'.repeat(21)]],
    [F.firstNames, ['A', 'A'.repeat(40)], ['', '   ', 'A'.repeat(41)]],
    [F.lastName, ['A', 'A'.repeat(40)], ['', '   ', 'A'.repeat(41)]],
  ] as const)('applies the individual text boundaries for %s', (name, validValues, invalidValues) => {
    for (const value of validValues) {
      const form = setIdentity('individual');
      form.controls[name].setValue(value);
      expect(form.controls[name].valid).toBe(true);
    }
    for (const value of invalidValues) {
      const form = setIdentity('individual');
      form.controls[name].setValue(value);
      expect(form.controls[name].invalid).toBe(true);
    }
  });

  it.each([
    [F.organisationName, ['A', 'A'.repeat(40)], ['', '   ', 'A'.repeat(41)]],
    [F.addressLine1, ['A', 'A'.repeat(40)], ['', '   ', 'A'.repeat(41)]],
    [F.addressLine2, ['', 'A'.repeat(30)], ['A'.repeat(31)]],
    [F.addressLine3, ['', 'A'.repeat(30)], ['A'.repeat(31)]],
    [F.addressLine4, ['', 'A'.repeat(30)], ['A'.repeat(31)]],
    [F.addressLine5, ['', 'A'.repeat(30)], ['A'.repeat(31)]],
    [F.postalOrZipCode, ['', 'A'.repeat(10)], ['A'.repeat(11)]],
  ] as const)('applies the text boundaries for %s', (name, validValues, invalidValues) => {
    for (const value of validValues) {
      const form = setIdentity('organisation');
      form.controls[name].setValue(value);
      expect(form.controls[name].valid).toBe(true);
    }
    for (const value of invalidValues) {
      const form = setIdentity('organisation');
      form.controls[name].setValue(value);
      expect(form.controls[name].invalid).toBe(true);
    }
  });

  it.each([826, '826', 840, '840'])('accepts the configured country ID %j', (value) => {
    const form = createMinorCreditorForm(countries);
    form.controls[F.countryId].setValue(value);
    expect(form.controls[F.countryId].valid).toBe(true);
  });

  it.each([null, '', 999, 'United Kingdom'])('rejects the unavailable country value %j', (value) => {
    const form = createMinorCreditorForm(countries);
    form.controls[F.countryId].setValue(value);
    expect(form.controls[F.countryId].invalid).toBe(true);
  });

  it.each([
    [F.ukNameOnAccount, 'uk'],
    [F.ukPaymentReference, 'uk'],
    [F.nonUkNameOnAccount, 'non-uk'],
    [F.nonUkPaymentReference, 'non-uk'],
  ] as const)('requires %s and limits it to 18 characters', (name, bankType) => {
    for (const value of ['A', 'A'.repeat(18)]) {
      const form = setBank(bankType);
      form.controls[name].setValue(value);
      expect(form.controls[name].valid).toBe(true);
    }
    for (const value of ['', '   ', 'A'.repeat(19)]) {
      const form = setBank(bankType);
      form.controls[name].setValue(value);
      expect(form.controls[name].invalid).toBe(true);
    }
  });

  it.each(['001122', '00-11-22'])('accepts the UK sort code %s', (value) => {
    const form = setBank('uk');
    form.controls[F.ukSortCode].setValue(value);
    expect(form.controls[F.ukSortCode].valid).toBe(true);
  });

  it.each(['00AA22', '0-01-122', '00112', '0011223'])('rejects the UK sort code %s', (value) => {
    const form = setBank('uk');
    form.controls[F.ukSortCode].setValue(value);
    expect(form.controls[F.ukSortCode].invalid).toBe(true);
  });

  it.each(['001122', '0011223', '00112233'])('accepts the UK account number %s', (value) => {
    const form = setBank('uk');
    form.controls[F.ukAccountNumber].setValue(value);
    expect(form.controls[F.ukAccountNumber].valid).toBe(true);
  });

  it.each(['', '00112', '001122334', '00112A'])('rejects the UK account number %j', (value) => {
    const form = setBank('uk');
    form.controls[F.ukAccountNumber].setValue(value);
    expect(form.controls[F.ukAccountNumber].invalid).toBe(true);
  });

  it.each(['', 'A', 'A'.repeat(34)])('permits optional IBAN %j without checksum rules', (iban) => {
    const form = setBank('non-uk');
    form.controls[F.nonUkIban].setValue(iban);
    form.controls[F.nonUkBicSwiftCode].setValue('');
    expect(form.controls[F.nonUkIban].valid).toBe(true);
    expect(form.controls[F.nonUkBicSwiftCode].valid).toBe(true);
    expect(form.controls[F.nonUkPaymentReference].hasError('required')).toBe(true);
  });

  it.each(['A'.repeat(35), 'GB82-WEST'])('rejects the invalid IBAN %j', (iban) => {
    const form = setBank('non-uk');
    form.controls[F.nonUkIban].setValue(iban);
    expect(form.controls[F.nonUkIban].invalid).toBe(true);
  });

  it.each(['', 'ABCD1234', 'ABCD1234567'])('accepts the optional BIC or SWIFT value %j', (value) => {
    const form = setBank('non-uk');
    form.controls[F.nonUkBicSwiftCode].setValue(value);
    expect(form.controls[F.nonUkBicSwiftCode].valid).toBe(true);
  });

  it.each(['ABC1234', 'ABCD12345678', 'ABCD-123'])('rejects the invalid BIC or SWIFT value %j', (value) => {
    const form = setBank('non-uk');
    form.controls[F.nonUkBicSwiftCode].setValue(value);
    expect(form.controls[F.nonUkBicSwiftCode].invalid).toBe(true);
  });

  it.each([
    [F.nonUkAccountNumber, ['', '1', '1'.repeat(20)], ['1'.repeat(21), '12A']],
    [F.nonUkBranchSortCode, ['', '1', '1'.repeat(12)], ['1'.repeat(13), '12A']],
  ] as const)('applies the optional numeric boundaries for %s', (name, validValues, invalidValues) => {
    for (const value of validValues) {
      const form = setBank('non-uk');
      form.controls[name].setValue(value);
      expect(form.controls[name].valid).toBe(true);
    }
    for (const value of invalidValues) {
      const form = setBank('non-uk');
      form.controls[name].setValue(value);
      expect(form.controls[name].invalid).toBe(true);
    }
  });

  it('does not impose an unapproved length limit on the optional non-UK bank name', () => {
    const form = setBank('non-uk');
    form.controls[F.nonUkBankName].setValue('A bank name '.repeat(100));
    expect(form.controls[F.nonUkBankName].valid).toBe(true);
  });
});

describe('minor creditor conditional branches', () => {
  it('clears deselected identity while preserving address and bank details', () => {
    const form = createMinorCreditorForm(countries);
    form.patchValue({ [F.creditorType]: 'individual', [F.bankType]: 'uk' });
    applyMinorCreditorBranches(form, () => undefined);
    form.patchValue({ [F.firstNames]: 'Example', [F.addressLine1]: '1 Test Street', [F.ukSortCode]: '001122' });
    form.controls[F.creditorType].setValue('organisation');
    applyMinorCreditorBranches(form, () => undefined);
    expect(form.controls[F.firstNames].value).toBeNull();
    expect(form.controls[F.firstNames].disabled).toBe(true);
    expect(form.controls[F.addressLine1].value).toBe('1 Test Street');
    expect(form.controls[F.ukSortCode].value).toBe('001122');
  });

  it('does not restore a deselected identity branch when switching back', () => {
    const form = setIdentity('individual');
    form.patchValue({ [F.firstNames]: 'Example', [F.lastName]: 'Person' });
    form.controls[F.creditorType].setValue('organisation');
    applyMinorCreditorBranches(form, () => undefined);
    form.controls[F.creditorType].setValue('individual');
    applyMinorCreditorBranches(form, () => undefined);
    expect(form.controls[F.firstNames].value).toBeNull();
    expect(form.controls[F.lastName].value).toBeNull();
    expect(form.controls[F.firstNames].enabled).toBe(true);
  });

  it('clears both bank branches when None is selected', () => {
    const form = setBank('uk');
    form.patchValue({ [F.ukAccountNumber]: '00112233', [F.addressLine1]: '1 Test Street' });
    form.controls[F.bankType].setValue('non-uk');
    applyMinorCreditorBranches(form, () => undefined);
    form.controls[F.nonUkIban].setValue('GB82WEST');
    form.controls[F.bankType].setValue('none');
    applyMinorCreditorBranches(form, () => undefined);
    expect(form.controls[F.ukAccountNumber].value).toBeNull();
    expect(form.controls[F.nonUkIban].value).toBeNull();
    expect(form.controls[F.ukAccountNumber].disabled).toBe(true);
    expect(form.controls[F.nonUkIban].disabled).toBe(true);
    expect(form.controls[F.addressLine1].value).toBe('1 Test Street');
  });

  it('does not restore a deselected UK bank branch when switching back', () => {
    const form = setBank('uk');
    form.controls[F.ukAccountNumber].setValue('00112233');
    form.controls[F.bankType].setValue('non-uk');
    applyMinorCreditorBranches(form, () => undefined);
    form.controls[F.bankType].setValue('uk');
    applyMinorCreditorBranches(form, () => undefined);
    expect(form.controls[F.ukAccountNumber].value).toBeNull();
    expect(form.controls[F.ukAccountNumber].enabled).toBe(true);
  });

  it('preserves restored values when applying their selected branches for the first time', () => {
    const form = createMinorCreditorForm(countries);
    form.patchValue({
      [F.creditorType]: 'organisation',
      [F.organisationName]: 'Example creditor',
      [F.addressLine1]: '1 Test Street',
      [F.countryId]: 826,
      [F.bankType]: 'non-uk',
      [F.nonUkNameOnAccount]: 'Example account',
      [F.nonUkPaymentReference]: 'Reference',
      [F.nonUkIban]: 'A',
    });
    applyMinorCreditorBranches(form, () => undefined);
    expect(form.controls[F.organisationName].value).toBe('Example creditor');
    expect(form.controls[F.nonUkIban].value).toBe('A');
    expect(form.controls[F.organisationName].enabled).toBe(true);
    expect(form.controls[F.nonUkIban].enabled).toBe(true);
  });

  it('clears inactive control errors and emitted error messages', () => {
    const form = setBank('uk');
    const clearErrors = vi.fn();
    form.controls[F.ukSortCode].setValue('invalid');
    expect(form.controls[F.ukSortCode].invalid).toBe(true);
    form.controls[F.bankType].setValue('none');
    applyMinorCreditorBranches(form, clearErrors);
    expect(form.controls[F.ukSortCode].errors).toBeNull();
    expect(clearErrors).toHaveBeenCalledWith([
      F.ukNameOnAccount,
      F.ukSortCode,
      F.ukAccountNumber,
      F.ukPaymentReference,
    ]);
  });

  it('makes a newly selected required branch invalid until populated', () => {
    const form = createMinorCreditorForm(countries);
    form.patchValue({
      [F.creditorType]: 'organisation',
      [F.organisationName]: 'Example creditor',
      [F.addressLine1]: '1 Test Street',
      [F.countryId]: 826,
      [F.bankType]: 'uk',
    });
    applyMinorCreditorBranches(form, () => undefined);
    expect(form.invalid).toBe(true);
    expect(form.controls[F.ukNameOnAccount].hasError('required')).toBe(true);
    expect(form.controls[F.ukSortCode].hasError('required')).toBe(true);
  });
});

describe('minor creditor error configuration', () => {
  it('uses the approved sort-code messages and priorities', () => {
    expect(CASES_CREATE_CASEFILE_MINOR_CREDITOR_FIELD_ERRORS[F.ukSortCode]).toEqual({
      required: { message: 'Enter sort code', priority: 1 },
      sortCodeFormat: { message: 'Enter correct sort code', priority: 2 },
      sortCodeLength: { message: 'Sort code must only contain 6 numbers', priority: 3 },
    });
  });

  it('does not require either international identifier', () => {
    expect(CASES_CREATE_CASEFILE_MINOR_CREDITOR_FIELD_ERRORS[F.nonUkBicSwiftCode]).toEqual({
      pattern: { message: 'Enter correct BIC or SWIFT code or IBAN number', priority: 2 },
    });
    expect(CASES_CREATE_CASEFILE_MINOR_CREDITOR_FIELD_ERRORS[F.nonUkIban]).toEqual({
      pattern: { message: 'Enter correct BIC or SWIFT code or IBAN number', priority: 2 },
    });
  });
});
