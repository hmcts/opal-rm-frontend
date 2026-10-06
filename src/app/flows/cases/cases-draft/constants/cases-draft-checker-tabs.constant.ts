import type { CasesDraftCheckerTab } from '../types/cases-draft-tab.type';
import type { CasesDraftTabMetadata } from '../interfaces/cases-draft-tab-metadata.interface';

const base = ['respondent', 'applicant', 'caseType', 'submittedByName', 'created'] as const;

export const CASES_DRAFT_CHECKER_TABS: Record<CasesDraftCheckerTab, CasesDraftTabMetadata> = {
  'to-review': {
    label: 'To review',
    statuses: 'SUBMITTED,RESUBMITTED',
    defaultSort: 'created',
    columns: base,
    empty: 'There are no cases to review.',
  },
  rejected: {
    label: 'Rejected',
    statuses: 'REJECTED',
    defaultSort: 'statusDate',
    columns: [...base, 'statusDate'],
    statusDateLabel: 'Rejected',
    empty: 'There are no rejected cases.',
  },
  deleted: {
    label: 'Deleted',
    statuses: 'DELETED',
    defaultSort: 'statusDate',
    columns: [...base, 'statusDate'],
    statusDateLabel: 'Deleted',
    empty: 'No cases have been deleted in the past 7 days.',
  },
  failed: {
    label: 'Failed',
    statuses: 'PUBLISHING_FAILED',
    defaultSort: 'statusDate',
    columns: [...base, 'statusDate'],
    statusDateLabel: 'Failed',
    empty: 'There are no failed cases.',
  },
};
