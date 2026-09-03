import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface ICasesCreateCasefileCountryOption {
  value: string | number;
}

export const createCasesCreateCasefileCountrySelectionValidator =
  (options: readonly ICasesCreateCasefileCountryOption[]): ValidatorFn =>
  (control: AbstractControl): ValidationErrors | null => {
    const selected = control.value;
    return selected !== null && selected !== '' && options.some((option) => String(option.value) === String(selected))
      ? null
      : { required: true };
  };
