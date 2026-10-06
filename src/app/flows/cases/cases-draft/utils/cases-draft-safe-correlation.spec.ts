import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { safeCasesDraftCorrelation } from './cases-draft-safe-correlation';
describe('safe checker correlation reference', () => {
  it.each(['synthetic-ref', 'a'.repeat(100), '10ea3e5b-13de-44f7-9820-bb25491e504d'])(
    'accepts bounded reference %s',
    (reference) => {
      expect(safeCasesDraftCorrelation(new HttpErrorResponse({ error: { operation_id: reference } }))).toBe(reference);
    },
  );
  it.each([
    undefined,
    null,
    [],
    'text',
    {},
    { operation_id: 42 },
    { operation_id: '' },
    { operation_id: ' a' },
    { operation_id: '<html>' },
    { operation_id: 'a'.repeat(101) },
  ])('rejects unsafe response body %j', (error) => {
    expect(safeCasesDraftCorrelation(new HttpErrorResponse({ error }))).toBeNull();
  });
  it('ignores non-HTTP errors', () => {
    expect(safeCasesDraftCorrelation(new Error('Synthetic failure'))).toBeNull();
  });
});
