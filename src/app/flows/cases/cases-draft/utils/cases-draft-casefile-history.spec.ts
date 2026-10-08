import type { IOpalMaintenanceDraftCasefileDetail } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-detail.interface';
import { casefileStatusLabel, chronologicalCasefileTimeline } from './cases-draft-casefile-history';

const labels: [IOpalMaintenanceDraftCasefileDetail['casefile_status'], string, string][] = [
  ['SUBMITTED', 'In review', 'To review'],
  ['RESUBMITTED', 'In review', 'To review'],
  ['PUBLISHING_PENDING', 'Approved', 'Approved'],
  ['PUBLISHED', 'Approved', 'Approved'],
  ['REJECTED', 'Rejected', 'Rejected'],
  ['DELETED', 'Deleted', 'Deleted'],
  ['PUBLISHING_FAILED', 'Failed', 'Failed'],
];

describe('casefileStatusLabel', () => {
  it.each(labels)('labels %s for both trusted audiences', (status, inputter, checker) => {
    expect(casefileStatusLabel(status, 'inputter')).toBe(inputter);
    expect(casefileStatusLabel(status, 'checker')).toBe(checker);
  });
});

describe('chronologicalCasefileTimeline', () => {
  it('orders reversed events by their UTC instant while preserving equal-time occurrence order', () => {
    const entries: IOpalMaintenanceDraftCasefileDetail['timeline_data'] = [
      { username: 'Synthetic Deleter', status: 'Deleted', status_date: '2026-09-15T14:00:00Z' },
      { username: 'Synthetic Approver', status: 'Approved', status_date: '2026-09-15T13:00:00+01:00' },
      { username: 'Synthetic Resubmitter', status: 'Resubmitted', status_date: '2026-09-15T12:00:00Z' },
      {
        username: 'Synthetic Rejecter',
        status: 'Rejected',
        status_date: '2026-09-15T10:00:00Z',
        reason_text: 'Test reason',
      },
      { username: 'Synthetic Submitter', status: 'Submitted', status_date: '2026-09-15T10:30:00+01:00' },
    ];
    const original = structuredClone(entries);
    const result = chronologicalCasefileTimeline(entries);
    expect(result.map(({ status }) => status)).toEqual(['Submitted', 'Rejected', 'Approved', 'Resubmitted', 'Deleted']);
    expect(result.map(({ key }) => key)).toEqual([4, 3, 1, 2, 0]);
    expect(result[2].utc).toBe(result[3].utc);
    expect(result[1].reason_text).toBe('Test reason');
    expect(result[0].reason_text).toBeUndefined();
    expect(entries).toEqual(original);
    result[0].username = 'Changed copy';
    expect(entries).toEqual(original);
  });

  it('returns a separate empty collection', () => {
    const entries: IOpalMaintenanceDraftCasefileDetail['timeline_data'] = [];
    const result = chronologicalCasefileTimeline(entries);
    expect(result).toEqual([]);
    expect(result).not.toBe(entries);
  });
});
