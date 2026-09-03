import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const UK_SORT_CODE_PATTERN = /^(?:\d{6}|\d{2}-\d{2}-\d{2})$/;
const NUMERIC_PATTERN = /^\d+$/;
const BIC_SWIFT_PATTERN = /^[A-Za-z]{4}[A-Za-z]{2}[A-Za-z0-9]{2}(?:[A-Za-z0-9]{3})?$/;
const IBAN_PATTERN = /^[A-Za-z]{2}\d{2}[A-Za-z0-9]{11,30}$/;

// SWIFT ISO 13616 IBAN Registry, release 102 (June 2026).
const IBAN_LENGTH_BY_COUNTRY: Readonly<Record<string, number>> = {
  AD: 24,
  AE: 23,
  AL: 28,
  AT: 20,
  AZ: 28,
  BA: 20,
  BE: 16,
  BG: 22,
  BH: 22,
  BI: 27,
  BR: 29,
  BY: 28,
  CH: 21,
  CR: 22,
  CY: 28,
  CZ: 24,
  DE: 22,
  DJ: 27,
  DK: 18,
  DO: 28,
  EE: 20,
  EG: 29,
  ES: 24,
  FI: 18,
  FK: 18,
  FO: 18,
  FR: 27,
  GB: 22,
  GE: 22,
  GI: 23,
  GL: 18,
  GR: 27,
  GT: 28,
  HN: 28,
  HR: 21,
  HU: 28,
  IE: 22,
  IL: 23,
  IQ: 23,
  IS: 26,
  IT: 27,
  JO: 30,
  KW: 30,
  KZ: 20,
  LB: 28,
  LC: 32,
  LI: 21,
  LT: 20,
  LU: 20,
  LV: 21,
  LY: 25,
  MC: 27,
  MD: 24,
  ME: 22,
  MK: 19,
  MN: 20,
  MR: 27,
  MT: 31,
  MU: 30,
  NI: 28,
  NL: 18,
  NO: 15,
  OM: 23,
  PK: 24,
  PL: 28,
  PS: 29,
  PT: 25,
  QA: 29,
  RO: 24,
  RS: 22,
  RU: 33,
  SA: 24,
  SC: 31,
  SD: 18,
  SE: 24,
  SI: 19,
  SK: 24,
  SM: 27,
  SO: 23,
  ST: 25,
  SV: 28,
  TL: 23,
  TN: 24,
  TR: 26,
  UA: 29,
  VA: 22,
  VG: 24,
  XK: 20,
  YE: 30,
};

const stringValue = (control: AbstractControl): string => (typeof control.value === 'string' ? control.value : '');

const hasValidIbanChecksum = (value: string): boolean => {
  const rearrangedValue = `${value.slice(4)}${value.slice(0, 4)}`.toUpperCase();
  let remainder = 0;

  for (const character of rearrangedValue) {
    const numericCharacter = character >= '0' && character <= '9' ? character : String(character.codePointAt(0)! - 55);

    for (const digit of numericCharacter) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }

  return remainder === 1;
};

export const casesCreateCasefileApplicantUkSortCodeValidator: ValidatorFn = (control) => {
  const value = stringValue(control);
  const digitsOnly = value.replaceAll('-', '');

  if (!NUMERIC_PATTERN.test(digitsOnly)) {
    return { ukSortCodePattern: true };
  }

  if (digitsOnly.length !== 6) {
    return { ukSortCodeLength: true };
  }

  return UK_SORT_CODE_PATTERN.test(value) ? null : { ukSortCodePattern: true };
};

export const casesCreateCasefileApplicantUkAccountNumberValidator: ValidatorFn = (control) => {
  const value = stringValue(control);

  if (!NUMERIC_PATTERN.test(value)) {
    return { ukAccountNumberPattern: true };
  }

  return value.length >= 6 && value.length <= 8 ? null : { ukAccountNumberLength: true };
};

export const casesCreateCasefileApplicantBicSwiftValidator: ValidatorFn = (control) => {
  const value = stringValue(control);

  return value.trim() === '' || BIC_SWIFT_PATTERN.test(value) ? null : { internationalIdentifierPattern: true };
};

export const casesCreateCasefileApplicantIbanValidator: ValidatorFn = (control) => {
  const value = stringValue(control);

  if (value.trim() === '') {
    return null;
  }

  if (!IBAN_PATTERN.test(value)) {
    return { internationalIdentifierPattern: true };
  }

  const expectedLength = IBAN_LENGTH_BY_COUNTRY[value.slice(0, 2).toUpperCase()];

  return expectedLength === value.length && hasValidIbanChecksum(value)
    ? null
    : { internationalIdentifierPattern: true };
};

export const casesCreateCasefileApplicantBranchSortCodeValidator: ValidatorFn = (control) => {
  const value = stringValue(control);

  if (value.trim() === '') {
    return null;
  }

  if (!NUMERIC_PATTERN.test(value)) {
    return { branchSortCodePattern: true };
  }

  return value.length <= 12 ? null : { branchSortCodeLength: true };
};

export const casesCreateCasefileApplicantInternationalIdentifierRequiredValidator =
  (ibanControl: AbstractControl): ValidatorFn =>
  (bicSwiftControl): ValidationErrors | null =>
    (bicSwiftControl.value?.trim() ?? '') === '' && (ibanControl.value?.trim() ?? '') === ''
      ? { internationalIdentifierRequired: true }
      : null;
