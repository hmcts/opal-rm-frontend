import type { CasesDraftSortColumn } from '../types/cases-draft-sort-column.type';
import type { CasesDraftTab } from '../types/cases-draft-tab.type';

type CasesDraftTabMetadata = {
  label: string;
  statuses: string;
  defaultSort: CasesDraftSortColumn;
  columns: readonly CasesDraftSortColumn[];
  empty: string;
};

export const CASES_DRAFT_TABS: Record<CasesDraftTab, CasesDraftTabMetadata> = {
  'in-review': {
    label: 'In review',
    statuses: 'SUBMITTED,RESUBMITTED',
    defaultSort: 'created',
    columns: ['respondent', 'applicant', 'caseType', 'created'],
    empty: 'You have no cases in review.',
  },
  rejected: {
    label: 'Rejected',
    statuses: 'REJECTED',
    defaultSort: 'statusDate',
    columns: ['respondent', 'applicant', 'caseType', 'created', 'statusDate'],
    empty: 'You have no rejected cases.',
  },
  approved: {
    label: 'Approved',
    statuses: 'PUBLISHED',
    defaultSort: 'approved',
    columns: ['respondentAccount', 'applicantAccount', 'minorCreditorAccounts', 'caseType', 'approved'],
    empty: 'No cases have been approved in the past 7 days.',
  },
  deleted: {
    label: 'Deleted',
    statuses: 'DELETED',
    defaultSort: 'statusDate',
    columns: ['respondent', 'applicant', 'caseType', 'created', 'statusDate'],
    empty: 'No cases have been deleted in the past 7 days.',
  },
};
