import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { createCasesDraftSummary } from 'src/app/flows/cases/cases-draft/mocks/cases-draft-summary.mock';

export const allRejectedFixtures = {
  identity: { userId: 100, businessUnitId: 44 as const, submittedBy: 'BUU-SYNTHETIC' },
  user: {
    ...structuredClone(OPAL_USER_STATE_MOCK),
    user_id: 100,
    status: 'active' as const,
    business_unit_users: [
      {
        business_unit_id: 44,
        business_unit_user_id: 'BUU-SYNTHETIC',
        permissions: [{ permission_id: 21, permission_name: 'Create and Manage Draft Casefiles' }],
      },
    ],
  },
  success: {
    origin: 'all-rejected' as const,
    identity: { userId: 100, businessUnitId: 44 as const, submittedBy: 'BUU-SYNTHETIC' },
    draftCasefileId: 26,
    respondentForename: 'Synthetic',
    respondentSurname: 'Respondent',
  },
  rows: (count = 26) =>
    Array.from({ length: count }, (_, index) => {
      const id = index + 1;
      const interval = count > 26 ? 60_000 : 86_400_000;
      let caseType: 'REMO In' | 'REMO Out' | 'REMO Out (CMS)' = 'REMO In';
      if (id > 18) caseType = 'REMO Out (CMS)';
      else if (id > 9) caseType = 'REMO Out';
      return createCasesDraftSummary({
        draft_casefile_id: id,
        casefile_status: 'REJECTED',
        casefile_type: caseType,
        submitted_by: 'BUU-OTHER',
        submitted_by_name: 'Synthetic submitter ' + id,
        created_date: new Date(Date.UTC(2026, 7, 1) + id * interval).toISOString(),
        casefile_status_date: new Date(Date.UTC(2026, 8, 1) + (count - id) * interval).toISOString(),
        casefile_snapshot: {
          respondent_account: { respondent_name: 'Synthetic respondent ' + id },
          applicant_account: { applicant_name: 'Synthetic applicant ' + (count - id + 1) },
          minor_creditor_accounts: [],
        },
      });
    }).reverse(),
};

// Expected IDs are independently enumerated; no production sorter is used.
export const allRejectedExpected = {
  forwards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
  backwards: [26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  caseDescending: [19, 20, 21, 22, 23, 24, 25, 26, 10, 11, 12, 13, 14, 15, 16, 17, 18, 1, 2, 3, 4, 5, 6, 7, 8, 9],
};
export const allRejectedTies = () =>
  allRejectedFixtures.rows(3).map((row) => ({
    ...row,
    submitted_by_name: row.draft_casefile_id === 3 ? null : 'Synthetic branch',
    created_date: '2026-09-01T10:00:00Z',
    casefile_status_date: '2026-10-01T10:00:00Z',
  }));
export const allRejectedEscapedSuccess = {
  ...allRejectedFixtures.success,
  respondentForename: '<img src=x>',
  respondentSurname: '<script>Synthetic</script>',
};
