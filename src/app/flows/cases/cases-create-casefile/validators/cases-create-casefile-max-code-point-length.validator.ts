import type { ValidatorFn } from '@angular/forms';

export const maxCodePointLengthValidator =
  (requiredLength: number): ValidatorFn =>
  (control) => {
    const value = control.value;
    if (typeof value !== 'string') return null;

    const actualLength = [...value].length;
    return actualLength > requiredLength ? { maxlength: { requiredLength, actualLength } } : null;
  };
