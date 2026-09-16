import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { createCasesCreateCasefileOrderDetailsApplicationValidator } from './cases-create-casefile-order-details-application.validator';

describe('Order Details application validation', () => {
  const options = [{ name: 'TEST01 - Synthetic application', value: 901 }];

  it.each([901, '901'])('accepts current canonical ID %s', (value) => {
    expect(createCasesCreateCasefileOrderDetailsApplicationValidator(options)(new FormControl(value))).toBeNull();
  });

  it.each([999, 'TEST01 - Synthetic application', ' 901', '901x'])('rejects non-ID or stale value %s', (value) => {
    expect(createCasesCreateCasefileOrderDetailsApplicationValidator(options)(new FormControl(value))).toEqual({
      invalidSelection: true,
    });
  });

  it('distinguishes empty input from unmatched text cleared by autocomplete', () => {
    const empty = new FormControl(null);

    expect(createCasesCreateCasefileOrderDetailsApplicationValidator(options)(empty)).toEqual({ required: true });
    expect(
      createCasesCreateCasefileOrderDetailsApplicationValidator(options, () => 'Unknown application')(empty),
    ).toEqual({ invalidSelection: true });
  });
});
