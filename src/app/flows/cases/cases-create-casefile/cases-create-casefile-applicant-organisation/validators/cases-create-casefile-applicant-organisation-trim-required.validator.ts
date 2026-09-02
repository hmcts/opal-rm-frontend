import type { ValidatorFn } from '@angular/forms';

export const casesCreateCasefileApplicantOrganisationTrimRequiredValidator: ValidatorFn = (control) => {
  const value = control.value;

  return typeof value === 'string' && value.trim().length > 0 ? null : { required: true };
};
