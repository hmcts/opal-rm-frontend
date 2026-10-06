import { TestBed } from '@angular/core/testing';
import { CASES_DRAFT_DASHBOARD_MODE } from '../constants/cases-draft-dashboard-mode.token';
import { CASES_DRAFT_TABS } from '../constants/cases-draft-tabs.constant';
import { getCasesDraftTabs, getCasesDraftTabMetadata } from './cases-draft-tab-metadata';

describe('cases draft tab metadata', () => {
  it('defaults the injected dashboard mode to inputter', () => {
    expect(TestBed.inject(CASES_DRAFT_DASHBOARD_MODE)).toBe('inputter');
  });
  it('preserves the inputter queues and metadata', () => {
    expect(getCasesDraftTabs('inputter')).toEqual(['in-review', 'rejected', 'approved', 'deleted']);
    for (const tab of getCasesDraftTabs('inputter')) {
      expect(getCasesDraftTabMetadata(tab, 'inputter')).toEqual(CASES_DRAFT_TABS[tab as keyof typeof CASES_DRAFT_TABS]);
    }
  });
  it('defines permanent checker queues', () => {
    expect(getCasesDraftTabs('checker')).toEqual(['to-review', 'rejected', 'deleted', 'failed']);
  });
  it('defines the oldest-created review queue', () => {
    expect(getCasesDraftTabMetadata('to-review', 'checker')).toEqual({
      label: 'To review',
      statuses: 'SUBMITTED,RESUBMITTED',
      defaultSort: 'created',
      columns: ['respondent', 'applicant', 'caseType', 'submittedByName', 'created'],
      empty: 'There are no cases to review.',
    });
  });
  it.each([
    { tab: 'rejected', label: 'Rejected', statuses: 'REJECTED', empty: 'There are no rejected cases.' },
    { tab: 'deleted', label: 'Deleted', statuses: 'DELETED', empty: 'No cases have been deleted in the past 7 days.' },
    { tab: 'failed', label: 'Failed', statuses: 'PUBLISHING_FAILED', empty: 'There are no failed cases.' },
  ] as const)('defines the $tab outcome queue', ({ tab, label, statuses, empty }) => {
    expect(getCasesDraftTabMetadata(tab, 'checker')).toEqual({
      label,
      statuses,
      empty,
      defaultSort: 'statusDate',
      statusDateLabel: label,
      columns: ['respondent', 'applicant', 'caseType', 'submittedByName', 'created', 'statusDate'],
    });
  });
  it.each([
    { tab: 'to-review', mode: 'inputter' },
    { tab: 'failed', mode: 'inputter' },
    { tab: 'in-review', mode: 'checker' },
    { tab: 'approved', mode: 'checker' },
  ] as const)('rejects cross-mode queue $tab in $mode', ({ tab, mode }) => {
    expect(() => getCasesDraftTabMetadata(tab, mode)).toThrow('Invalid cases draft tab');
  });
});
