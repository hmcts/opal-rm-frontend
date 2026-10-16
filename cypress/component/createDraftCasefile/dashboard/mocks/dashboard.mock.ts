import { createCasesDraftSummary } from 'src/app/flows/cases/cases-draft/mocks/cases-draft-summary.mock';
export const dashboardFixtures = {
  review26: Array.from({ length: 26 }, (_, index) =>
    createCasesDraftSummary({
      draft_casefile_id: index + 1,
      casefile_status: index % 2 ? 'RESUBMITTED' : 'SUBMITTED',
      casefile_snapshot: {
        respondent_account: { respondent_name: 'Synthetic respondent ' + String(index + 1).padStart(2, '0') },
        applicant_account: { applicant_name: 'Synthetic applicant ' + index },
        minor_creditor_accounts: [],
      },
    }),
  ),
  empty: [],
  published: [
    createCasesDraftSummary({
      casefile_status: 'PUBLISHED',
      validated_date: '2026-10-05T10:00:00Z',
      casefile_snapshot: {
        respondent_account: { account_number: '000123A' },
        applicant_account: { account_number: null },
        minor_creditor_accounts: [{ account_number: 'M10' }, { account_number: 'M2' }],
      },
    }),
  ],
};

/** Synthetic narrow-screen rows preserve realistic readable column widths. */
export const populatedReflowFixtures = {
  'in-review': dashboardFixtures.review26,
  rejected: dashboardFixtures.review26.map((row) => ({ ...row, casefile_status: 'REJECTED' as const })),
  approved: dashboardFixtures.published,
  deleted: dashboardFixtures.review26.map((row) => ({ ...row, casefile_status: 'DELETED' as const })),
};
