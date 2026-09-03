import { Validators } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import {
  createCasesCreateCasefileAddressControls,
  createCasesCreateCasefileApplicantBankControls,
  createCasesCreateCasefileContactControls,
} from './cases-create-casefile-form-control-builders';

describe('casefile form-control builders', () => {
  it('creates typed contact controls with the supplied validators', () => {
    const emailValidator = Validators.email;
    const telephoneValidator = Validators.maxLength(35);

    const controls = createCasesCreateCasefileContactControls({
      emailValidators: [emailValidator],
      telephoneValidators: [telephoneValidator],
    });

    expect(Object.keys(controls)).toEqual([
      'mainEmailAddress',
      'otherEmailAddress',
      'mainTelephoneNumber',
      'otherTelephoneNumber',
    ]);
    expect(controls.mainEmailAddress.hasValidator(emailValidator)).toBe(true);
    expect(controls.otherEmailAddress.hasValidator(emailValidator)).toBe(true);
    expect(controls.mainTelephoneNumber.hasValidator(telephoneValidator)).toBe(true);
    expect(controls.otherTelephoneNumber.hasValidator(telephoneValidator)).toBe(true);
  });

  it('creates typed address controls with supplied required and country validators', () => {
    const requiredTextValidator = Validators.required;
    const countryValidator = Validators.required;

    const controls = createCasesCreateCasefileAddressControls({
      requiredTextValidator,
      countryValidators: [countryValidator],
    });

    expect(Object.keys(controls)).toEqual([
      'addressLine1',
      'addressLine2',
      'addressLine3',
      'addressLine4',
      'addressLine5',
      'postalOrZipCode',
      'countryId',
    ]);
    expect(controls.addressLine1.hasValidator(requiredTextValidator)).toBe(true);
    expect(controls.countryId.hasValidator(countryValidator)).toBe(true);
    expect(controls.addressLine2.value).toBeNull();
  });

  it('creates disabled applicant-bank controls with supplied validators preserved on the non-UK account number', () => {
    const bankTypeValidator = Validators.required;
    const nonUkAccountNumberValidator = Validators.maxLength(20);

    const controls = createCasesCreateCasefileApplicantBankControls({
      bankTypeValidators: [bankTypeValidator],
      nonUkAccountNumberValidators: [nonUkAccountNumberValidator],
    });

    expect(controls.bankType.hasValidator(bankTypeValidator)).toBe(true);
    expect(controls.ukBankNameOnAccount.disabled).toBe(true);
    expect(controls.nonUkBankBicSwiftCode.disabled).toBe(true);
    expect(controls.nonUkBankAccountNumber.disabled).toBe(true);
    expect(controls.nonUkBankAccountNumber.hasValidator(nonUkAccountNumberValidator)).toBe(true);
  });
});
