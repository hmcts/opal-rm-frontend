import { buildCasesDraftListParams } from './cases-draft-list-params';
import { CASES_DRAFT_TABS } from '../constants/cases-draft-tabs.constant';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { Settings } from 'luxon';
import { vi } from 'vitest';

describe('buildCasesDraftListParams', () => {
  afterEach(() => {
    vi.useRealTimers();
    Settings.defaultZone = 'system';
  });

  it.each([
    ['in-review', 'SUBMITTED,RESUBMITTED', false],
    ['rejected', 'REJECTED', false],
    ['approved', 'PUBLISHED', true],
    ['deleted', 'DELETED', true],
  ] as const)('builds the %s request', (tab, status, bounded) => {
    const params = buildCasesDraftListParams({ userId: 7, businessUnitId: 44, submittedBy: 'BUU-SYNTHETIC' }, tab, {
      from: '2026-09-28',
      to: '2026-10-05',
    });
    expect(params).toEqual({
      business_unit_id: 44,
      submitted_by: 'BUU-SYNTHETIC',
      casefile_status: status,
      ...(bounded ? { casefile_status_from_date: '2026-09-28', casefile_status_to_date: '2026-10-05' } : {}),
    });
    expect(Object.keys(params)).not.toContain('created_date');
  });

  it('defines the approved tab as published cases only', () => {
    expect(CASES_DRAFT_TABS.approved.statuses).toBe('PUBLISHED');
  });

  it.each([
    ['2024-03-01T12:00:00Z', '2024-02-23', '2024-03-01'],
    ['2024-12-31T12:00:00Z', '2024-12-24', '2024-12-31'],
    ['2025-01-03T12:00:00Z', '2024-12-27', '2025-01-03'],
    ['2026-03-29T12:00:00Z', '2026-03-22', '2026-03-29'],
  ])('uses DateService range across calendar boundaries at %s', (now, from, to) => {
    Settings.defaultZone = 'Europe/London';
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
    const range = new DateService().getDateRange(7, 0);
    expect(range).toEqual({ from, to });
    expect(
      buildCasesDraftListParams({ userId: 7, businessUnitId: 44, submittedBy: 'BUU-SYNTHETIC' }, 'approved', range),
    ).toMatchObject({ casefile_status_from_date: from, casefile_status_to_date: to });
  });
});
