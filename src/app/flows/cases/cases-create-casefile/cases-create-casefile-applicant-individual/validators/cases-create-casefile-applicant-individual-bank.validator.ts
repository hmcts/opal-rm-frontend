import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const UK_SORT_CODE_PATTERN = /^(?:\d{6}|\d{2}-\d{2}-\d{2})$/;
const NUMERIC_PATTERN = /^\d+$/;
const BIC_SWIFT_PATTERN = /^[A-Za-z0-9]{8,11}$/;
const IBAN_PATTERN = /^[A-Za-z0-9]{1,34}$/;

const trimmedValue = (control: AbstractControl): string =>
  typeof control.value === 'string' ? control.value.trim() : '';

export const casesCreateCasefileApplicantIndividualUkSortCodeValidator: ValidatorFn = (control) => {
  const value = trimmedValue(control);
  const digitsOnly = value.replaceAll('-', '');

  if (!NUMERIC_PATTERN.test(digitsOnly)) {
    return { ukSortCodePattern: true };
  }

  if (digitsOnly.length !== 6) {
    return { ukSortCodeLength: true };
  }

  return UK_SORT_CODE_PATTERN.test(value) ? null : { ukSortCodePattern: true };
};

export const casesCreateCasefileApplicantIndividualUkAccountNumberValidator: ValidatorFn = (control) => {
  const value = trimmedValue(control);

  if (!NUMERIC_PATTERN.test(value)) {
    return { ukAccountNumberPattern: true };
  }

  return value.length >= 6 && value.length <= 8 ? null : { ukAccountNumberLength: true };
};

export const casesCreateCasefileApplicantIndividualBicSwiftValidator: ValidatorFn = (control) => {
  const value = trimmedValue(control);

  return value === '' || BIC_SWIFT_PATTERN.test(value) ? null : { internationalIdentifierPattern: true };
};

export const casesCreateCasefileApplicantIndividualIbanValidator: ValidatorFn = (control) => {
  const value = trimmedValue(control);

  return value === '' || IBAN_PATTERN.test(value) ? null : { internationalIdentifierPattern: true };
};

export const casesCreateCasefileApplicantIndividualBranchSortCodeValidator: ValidatorFn = (control) => {
  const value = trimmedValue(control);

  if (value === '') {
    return null;
  }

  if (!NUMERIC_PATTERN.test(value)) {
    return { branchSortCodePattern: true };
  }

  return value.length <= 12 ? null : { branchSortCodeLength: true };
};

export const casesCreateCasefileApplicantIndividualInternationalIdentifierRequiredValidator =
  (ibanControl: AbstractControl): ValidatorFn =>
  (bicSwiftControl): ValidationErrors | null =>
    (bicSwiftControl.value?.trim() ?? '') === '' && (ibanControl.value?.trim() ?? '') === ''
      ? { internationalIdentifierRequired: true }
      : null;
