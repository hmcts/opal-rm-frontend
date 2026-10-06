import { createCasesDraftSummary } from '../mocks/cases-draft-summary.mock';
import { mapCasesDraftRows } from './cases-draft-summary';

describe('mapCasesDraftRows', () => {
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
