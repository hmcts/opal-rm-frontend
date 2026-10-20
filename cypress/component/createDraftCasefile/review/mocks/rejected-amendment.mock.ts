import { createPersistedCasefileResolved } from 'src/app/flows/cases/cases-draft/mocks/cases-draft-casefile-resolved.mock';
import { createPersistedCasefileDetail } from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';

export function createRejectedAmendment() {
  const draft = createPersistedCasefileDetail();
  draft.casefile_status = 'REJECTED';
  draft.casefile_status_name = 'Rejected';
  draft.timeline_data.push({
    username: 'Synthetic Checker',
    status: 'Rejected',
    status_date: '2026-09-16T09:00:00Z',
    reason_text: 'Correct the respondent',
  });
  return createPersistedCasefileResolved({
    draft,
    etag: '\"4\"',
    intent: 'inputter-amend',
    mode: 'amend',
    context: 'inputter',
    dashboardMode: 'inputter',
    identity: { userId: 10606, businessUnitId: 44, submittedBy: 'BUU-CHECKER' },
  });
}

export function createResubmittedAmendment() {
  const amendment = createRejectedAmendment();
  const draft = structuredClone(amendment.draft);
  draft.casefile_status = 'RESUBMITTED';
  draft.submitted_by = amendment.identity.submittedBy;
  return draft;
}
