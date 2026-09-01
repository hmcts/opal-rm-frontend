import type { ValidatorFn } from '@angular/forms';

const NATIONAL_INSURANCE_NUMBER_PATTERN = /^(?:[a-z]{2}\d{6}[a-z]?|\d{2}y\d{5})$/i;

export const casesCreateCasefileRespondentDetailsNationalInsuranceNumberValidator: ValidatorFn = (control) => {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  return typeof value === 'string' && NATIONAL_INSURANCE_NUMBER_PATTERN.test(value)
    ? null
    : { nationalInsuranceNumberPattern: { value } };
};
