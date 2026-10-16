import { createCasesDraftSummary } from '../mocks/cases-draft-summary.mock';
import { mapCasesDraftRows } from './cases-draft-summary';
import { sortCasesDraftRows } from './cases-draft-sort';

const row = (id: number, overrides: Partial<ReturnType<typeof mapCasesDraftRows>[number]> = {}) => ({
  ...mapCasesDraftRows([createCasesDraftSummary({ draft_casefile_id: id })], 'in-review')[0],
  ...overrides,
});

describe('sortCasesDraftRows', () => {
  it('preserves snapshot order when no column is sorted', () => {
    const rows = [row(2), row(1)];
    const sorted = sortCasesDraftRows(rows, 'created', 'none');
    expect(sorted.map(({ id }) => id)).toEqual([2, 1]);
    expect(sorted).not.toBe(rows);
  });
  it.each([
    ['respondent', 'respondent', 'Zed', 'Amy'],
    ['submittedByName', 'submittedByName', 'Synthetic 10', 'Synthetic 2'],
    ['applicant', 'applicant', 'Zed', 'Amy'],
    ['caseType', 'caseType', 'REMO Out', 'REMO In'],
    ['created', 'created', '2026-10-02T00:00:00Z', '2026-10-01T00:00:00Z'],
    ['statusDate', 'statusDate', '2026-10-02T00:00:00Z', '2026-10-01T00:00:00Z'],
    ['respondentAccount', 'respondentAccount', 'A10', 'A2'],
    ['applicantAccount', 'applicantAccount', 'A10', 'A2'],
    ['minorCreditorAccounts', 'minorCreditorAccounts', ['A2', 'B2'], ['A2', 'B1']],
    ['approved', 'approved', '2026-10-02T00:00:00Z', '2026-10-01T00:00:00Z'],
  ] as const)('sorts %s ascending', (_name, column, high, low) => {
    const sorted = sortCasesDraftRows(
      [row(2, { [column]: high } as never), row(1, { [column]: low } as never)],
      column,
      'ascending',
    );
    expect(sorted.map((item) => item.id)).toEqual([1, 2]);
    const descending = sortCasesDraftRows(
      [row(2, { [column]: high } as never), row(1, { [column]: low } as never)],
      column,
      'descending',
    );
    expect(descending.map((item) => item.id)).toEqual([2, 1]);
  });

  it('keeps missing values last, ties by ascending id in either direction, and preserves the input array', () => {
    const rows = [row(3, { respondent: null }), row(2, { respondent: 'A2' }), row(1, { respondent: 'A2' })];
    const sorted = sortCasesDraftRows(rows, 'respondent', 'descending');
    expect(sorted.map(({ id }) => id)).toEqual([1, 2, 3]);
    expect(rows.map(({ id }) => id)).toEqual([3, 2, 1]);
  });

  it('places null and empty values last in ascending and descending order', () => {
    const rows = [row(3, { approved: null }), row(2, { approved: '2026-10-01T00:00:00Z' }), row(1, { approved: null })];
    expect(sortCasesDraftRows(rows, 'approved', 'ascending').map(({ id }) => id)).toEqual([2, 1, 3]);
    const accounts = [row(3), row(2, { minorCreditorAccounts: ['A1'] }), row(1)];
    expect(sortCasesDraftRows(accounts, 'minorCreditorAccounts', 'descending').map(({ id }) => id)).toEqual([2, 1, 3]);
  });

  it.each(['ascending', 'descending'] as const)(
    'sorts submitter name ties by numeric id with missing last in %s',
    (direction) => {
      const rows = [
        row(11, { submittedByName: null }),
        row(10, { submittedByName: 'Synthetic 2' }),
        row(2, { submittedByName: 'Synthetic 2' }),
      ];
      expect(sortCasesDraftRows(rows, 'submittedByName', direction).map(({ id }) => id)).toEqual([2, 10, 11]);
    },
  );

  it('compares account sequences lexicographically without reordering account lists', () => {
    const rows = [row(2, { minorCreditorAccounts: ['A2', 'M10'] }), row(1, { minorCreditorAccounts: ['A2', 'M2'] })];
    expect(sortCasesDraftRows(rows, 'minorCreditorAccounts', 'ascending').map(({ id }) => id)).toEqual([1, 2]);
    expect(rows[0].minorCreditorAccounts).toEqual(['A2', 'M10']);
  });

  it('orders sequences with a shared prefix by sequence length', () => {
    const rows = [row(2, { minorCreditorAccounts: ['A2', 'B1'] }), row(1, { minorCreditorAccounts: ['A2'] })];
    expect(sortCasesDraftRows(rows, 'minorCreditorAccounts', 'ascending').map(({ id }) => id)).toEqual([1, 2]);
  });
});
