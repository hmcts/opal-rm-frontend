import { DateTime } from 'luxon';
import type { IOpalMaintenanceDraftCasefileDetail } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-detail.interface';
import type { CasesDraftDashboardMode } from '../types/cases-draft-dashboard-mode.type';

const inputterLabels: Record<IOpalMaintenanceDraftCasefileDetail['casefile_status'], string> = {
  SUBMITTED: 'In review',
  RESUBMITTED: 'In review',
  PUBLISHING_PENDING: 'Approved',
  PUBLISHED: 'Approved',
  REJECTED: 'Rejected',
  DELETED: 'Deleted',
  PUBLISHING_FAILED: 'Failed',
};
const checkerLabels = { ...inputterLabels, SUBMITTED: 'To review', RESUBMITTED: 'To review' };

export function casefileStatusLabel(
  status: IOpalMaintenanceDraftCasefileDetail['casefile_status'],
  context: CasesDraftDashboardMode,
): string {
  const labels = context === 'checker' ? checkerLabels : inputterLabels;
  return labels[status];
}

/** Dates are validated at the detail decoder boundary; equal instants retain server occurrence order. */
export function chronologicalCasefileTimeline(entries: IOpalMaintenanceDraftCasefileDetail['timeline_data']) {
  return entries
    .map((entry, key) => ({
      ...entry,
      key,
      utc: DateTime.fromISO(entry.status_date, { zone: 'utc' }).toMillis(),
    }))
    .sort((left, right) => left.utc - right.utc || left.key - right.key);
}
