import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { casesDraftErrorReference, formatCasesDraftRejectedCount } from './cases-draft-error';

describe('casesDraftErrorReference', () => {
  it.each([
    null,
    'Synthetic backend detail',
    [],
    {},
    { operation_id: '' },
    { operation_id: '   ' },
    { operation_id: 123 },
  ])('does not expose messages or invalid references from %j', (body) => {
    expect(casesDraftErrorReference(new HttpErrorResponse({ status: 500, error: body }))).toBeNull();
  });
  it('extracts only a valid operation reference', () => {
    expect(
      casesDraftErrorReference(
        new HttpErrorResponse({
          status: 500,
          error: { operation_id: 'synthetic-reference', detail: 'Do not display synthetic backend detail' },
        }),
      ),
    ).toBe('synthetic-reference');
  });
  it.each([null, new Error('Synthetic detail'), { error: { operation_id: 'synthetic-reference' } }])(
    'ignores non-HTTP errors',
    (error) => {
      expect(casesDraftErrorReference(error)).toBeNull();
    },
  );
});
describe('formatCasesDraftRejectedCount', () => {
  it.each([
    [0, null],
    [1, '1'],
    [99, '99'],
    [100, '99+'],
    [102, '99+'],
  ] as const)('formats %s as %s', (count, label) => {
    expect(formatCasesDraftRejectedCount(count)).toBe(label);
  });
});
