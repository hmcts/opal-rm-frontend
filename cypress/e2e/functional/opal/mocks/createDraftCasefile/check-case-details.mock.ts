export const CHECK_CASE_DETAILS_SUBMISSION = {
  receipt: {
    draft_casefile_id: 123,
    business_unit_id: 44,
    created_date: '2026-10-02T12:00:00Z',
    submitted_by: 'synthetic-user',
    submitted_by_name: 'Synthetic User',
    casefile_type: 'REMO In',
    casefile_status: 'SUBMITTED',
    casefile_status_date: '2026-10-02T12:00:00Z',
    casefile_snapshot: {
      respondent_account: { account_id: null, account_number: null, respondent_name: 'Respondent, Synthetic' },
      applicant_account: { account_id: null, account_number: null, applicant_name: 'Applicant, Synthetic' },
      minor_creditor_accounts: [],
    },
    timeline_data: [{ username: 'Synthetic User', status: 'Submitted', status_date: '2026-10-02T12:00:00Z' }],
  },
  expectedOrderTerms: ['10.00', '20.00'].map((amount) => ({
    result_id: 'MAT',
    creditor_type: 'Applicant',
    result_responses: [
      { parameter_name: 'amount', response: amount },
      { parameter_name: 'frequency', response: 'Monthly' },
    ],
  })),
};
