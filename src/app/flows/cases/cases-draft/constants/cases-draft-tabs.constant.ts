import type { CasesDraftInputterTab } from '../types/cases-draft-tab.type';
import type { CasesDraftTabMetadata } from '../interfaces/cases-draft-tab-metadata.interface';

export const CASES_DRAFT_TABS: Record<CasesDraftInputterTab, CasesDraftTabMetadata> = {
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
