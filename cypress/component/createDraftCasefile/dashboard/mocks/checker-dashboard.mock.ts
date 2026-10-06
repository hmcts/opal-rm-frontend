import { HttpErrorResponse } from '@angular/common/http';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { createCasesDraftSummary } from 'src/app/flows/cases/cases-draft/mocks/cases-draft-summary.mock';
const row = (id: number) =>
  createCasesDraftSummary({
    draft_casefile_id: id,
    submitted_by: 'BUU-OTHER',
    submitted_by_name: 'Synthetic submitter',
    created_date: '2026-09-' + String((id % 26) + 1).padStart(2, '0') + 'T10:00:00Z',
    casefile_snapshot: {
      respondent_account: { respondent_name: 'Synthetic respondent ' + String(id).padStart(3, '0') },
      applicant_account: { applicant_name: 'Synthetic applicant' },
      minor_creditor_accounts: [],
    },
  });
const review26 = Array.from({ length: 26 }, (_, i) => ({
  ...row(i + 1),
  created_date: '2026-09-' + String(i + 1).padStart(2, '0') + 'T10:00:00Z',
}));
export const checkerFixtures = {
  review26,
  empty: [],
  mixedScope: [
    row(101),
    { ...row(102), submitted_by: 'BUU-CHECKER' },
    { ...row(103), business_unit_id: 45 },
    { ...row(104), casefile_status: 'PUBLISHING_PENDING' as const },
  ],
  missingName: [{ ...row(101), submitted_by_name: null }],
  oldest: [row(103), { ...row(101), created_date: '2026-08-01T10:00:00Z' }, row(102)],
  queues: {
    'to-review': review26,
    rejected: review26.map((r) => ({ ...r, casefile_status: 'REJECTED' as const })),
    deleted: review26.map((r) => ({ ...r, casefile_status: 'DELETED' as const })),
    failed: review26.map((r) => ({ ...r, casefile_status: 'PUBLISHING_FAILED' as const })),
  },
};
export function checkerUser(role: 'checker' | 'dual') {
  const user = structuredClone(OPAL_USER_STATE_MOCK);
  user.user_id = 100;
  user.status = 'active';
  const permissions = [{ permission_id: 22, permission_name: 'Check and Validate Draft Casefiles' }];
  if (role === 'dual') permissions.push({ permission_id: 21, permission_name: 'Create and Manage Draft Casefiles' });
  user.business_unit_users = [{ business_unit_id: 44, business_unit_user_id: 'BUU-CHECKER', permissions }];
  return user;
}

export const checkerListFailure = new HttpErrorResponse({
  status: 500,
  error: { operation_id: 'SYNTHETIC-REF-123', detail: 'Synthetic private detail', title: 'Synthetic backend title' },
});
export const checkerEmptyMessages = {
  'to-review': 'There are no cases to review.',
  rejected: 'There are no rejected cases.',
  deleted: 'No cases have been deleted in the past 7 days.',
  failed: 'There are no failed cases.',
};
