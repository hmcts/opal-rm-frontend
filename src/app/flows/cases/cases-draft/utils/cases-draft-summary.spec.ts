import { createCasesDraftSummary } from '../mocks/cases-draft-summary.mock';
import { sortCasesDraftRows } from './cases-draft-sort';
import { mapCasesDraftRows } from './cases-draft-summary';

describe('mapCasesDraftRows', () => {
  it('keeps original creation dates and supplied top-level submitter display', () => {
    const rows = mapCasesDraftRows(
      [
        createCasesDraftSummary({
          draft_casefile_id: 2,
          casefile_status: 'RESUBMITTED',
          created_date: '2026-09-01T10:00:00Z',
          submitted_by_name: 'Synthetic submitter',
        }),
        createCasesDraftSummary({ draft_casefile_id: 1, created_date: '2026-09-02T10:00:00Z' }),
        createCasesDraftSummary({ draft_casefile_id: 3, casefile_status: 'PUBLISHING_PENDING' }),
      ],
      'to-review',
      'checker',
    );
    expect(sortCasesDraftRows(rows, 'created', 'ascending').map((row) => row.id)).toEqual([2, 1]);
    expect(rows[0].submittedByName).toBe('Synthetic submitter');
    expect(rows[0].statusDate).toBe('2026-10-05T10:00:00Z');
    expect(rows[1].submittedByName).toBeNull();
  });
  it.each([undefined, null, '', ' '])('maps absent or blank submitter %s to null', (submitted_by_name) => {
    expect(
      mapCasesDraftRows([createCasesDraftSummary({ submitted_by_name })], 'to-review', 'checker')[0].submittedByName,
    ).toBeNull();
  });
  it.each([
    ['rejected', 'REJECTED'],
    ['deleted', 'DELETED'],
    ['failed', 'PUBLISHING_FAILED'],
  ] as const)('keeps only the checker %s status', (tab, status) => {
    expect(
      mapCasesDraftRows(
        [createCasesDraftSummary({ casefile_status: status }), createCasesDraftSummary()],
        tab,
        'checker',
      ),
    ).toHaveLength(1);
  });
  it('excludes pending publication and retains populated account strings in source order', () => {
    const published = createCasesDraftSummary({
      casefile_status: 'PUBLISHED',
      validated_date: '2026-09-01T10:00:00Z',
      casefile_snapshot: {
        respondent_account: { account_number: '000123A' },
        applicant_account: { account_number: null },
        minor_creditor_accounts: [
          { account_number: 'M10' },
          { account_number: ' ' },
          { account_number: 'M2' },
          { account_number: 'M10' },
        ],
      },
    });
    const rows = mapCasesDraftRows(
      [published, createCasesDraftSummary({ casefile_status: 'PUBLISHING_PENDING' })],
      'approved',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      respondentAccount: '000123A',
      applicantAccount: null,
      submittedByName: null,
      minorCreditorAccounts: ['M10', 'M2', 'M10'],
      approved: '2026-09-01T10:00:00Z',
      created: published.created_date,
    });
  });

  it('maps absent snapshot account data to null and filters rows by tab status', () => {
    const summary = createCasesDraftSummary({ casefile_status: 'RESUBMITTED', casefile_snapshot: {} });
    const rows = mapCasesDraftRows([summary, createCasesDraftSummary({ casefile_status: 'REJECTED' })], 'in-review');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      respondent: null,
      applicant: null,
      respondentAccount: null,
      applicantAccount: null,
      submittedByName: null,
      minorCreditorAccounts: [],
      created: summary.created_date,
    });
  });
});
