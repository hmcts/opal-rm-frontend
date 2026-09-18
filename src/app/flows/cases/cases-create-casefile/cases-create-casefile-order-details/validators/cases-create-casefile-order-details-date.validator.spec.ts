import { FormControl } from '@angular/forms';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import { createCasesCreateCasefileOrderDetailsDateValidator } from './cases-create-casefile-order-details-date.validator';

describe('Order Details calendar validation', () => {
  const service = new DateService();
  const today = () => DateTime.fromISO('2026-09-16');
  const validate = createCasesCreateCasefileOrderDetailsDateValidator(service, today);

  it.each([null, '', '15/09/2026', '16/09/2026', '29/02/2024'])('accepts %s', (value) => {
    expect(validate(new FormControl(value))).toBeNull();
  });

  it.each(['1/09/2026', '16/09', '31/02/2026', '29/02/2025', 'text', '00/01/2026'])(
    'rejects malformed or impossible %s',
    (value) => {
      expect(validate(new FormControl(value))).toEqual({ invalidDate: true });
    },
  );

  it('rejects tomorrow', () => {
    expect(validate(new FormControl('17/09/2026'))).toEqual({ invalidFutureDate: true });
  });

  it('rejects a non-string value', () => {
    expect(validate(new FormControl(20260916))).toEqual({ invalidDate: true });
  });
});
