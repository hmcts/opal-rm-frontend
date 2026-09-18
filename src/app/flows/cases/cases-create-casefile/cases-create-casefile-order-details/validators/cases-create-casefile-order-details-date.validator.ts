import type { ValidatorFn } from '@angular/forms';
import type { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import type { DateTime } from 'luxon';

export const createCasesCreateCasefileOrderDetailsDateValidator =
  (dateService: DateService, today: () => DateTime = () => dateService.getDateNow()): ValidatorFn =>
  (control) => {
    const value: unknown = control.value;

    if (value === null || value === '') {
      return null;
    }

    if (typeof value !== 'string' || !/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      return { invalidDate: true };
    }

    const date = dateService.getFromFormat(value, 'dd/MM/yyyy');

    if (!date.isValid) {
      return { invalidDate: true };
    }

    return date.toFormat('yyyy-MM-dd') > today().toFormat('yyyy-MM-dd') ? { invalidFutureDate: true } : null;
  };
