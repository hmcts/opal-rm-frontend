import type { ValidatorFn } from '@angular/forms';
import type { IAlphagovAccessibleAutocompleteItem } from '@hmcts/opal-frontend-common/components/alphagov/alphagov-accessible-autocomplete/interfaces';

export const createCasesCreateCasefileOrderDetailsApplicationValidator =
  (
    items: readonly (IAlphagovAccessibleAutocompleteItem & { active?: boolean })[],
    enteredText: () => string = () => '',
  ): ValidatorFn =>
  (control) => {
    const value: unknown = control.value;

    if (value === null || value === '') {
      return enteredText().trim() ? { invalidSelection: true } : { required: true };
    }

    return items.some((item) => item.active !== false && (value === item.value || value === String(item.value)))
      ? null
      : { invalidSelection: true };
  };
