import { createCasesDraftSummary } from 'src/app/flows/cases/cases-draft/mocks/cases-draft-summary.mock';

/** Independent, deliberately reversed synthetic other-inputter wire collection. */
export function allRejectedRows(count = 26) {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    return createCasesDraftSummary({
      draft_casefile_id: id,
      casefile_status: 'REJECTED',
      submitted_by: 'BUU-OTHER',
      submitted_by_name: 'Synthetic submitter ' + String(id).padStart(2, '0'),
      created_date: '2026-08-01T10:00:00Z',
      casefile_status_date: new Date(Date.UTC(2026, 8, 1) + id * 86400000).toISOString(),
      casefile_snapshot: {
        respondent_account: { respondent_name: 'Synthetic respondent ' + id },
        applicant_account: { applicant_name: 'Synthetic applicant ' + id },
        minor_creditor_accounts: [],
      },
    });
  }).reverse();
}
