import { createPersistedCasefileDetail } from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';

export function rejectedAmendmentDraft(submitter: 'me' | 'another' = 'me') {
  const draft = createPersistedCasefileDetail();
  draft.casefile_status = 'REJECTED';
  draft.casefile_status_name = 'Rejected';
  draft.submitted_by = submitter === 'me' ? 'BUU-CHECKER' : 'BUU-OTHER';
  draft.timeline_data.push({
    username: 'Synthetic Checker',
    status: 'Rejected',
    status_date: '2026-09-16T09:00:00Z',
    reason_text: 'Correct the respondent',
  });
  return draft;
}
