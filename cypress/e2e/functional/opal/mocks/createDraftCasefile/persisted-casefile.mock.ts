import type { IOpalMaintenanceDraftCasefileDetail } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-detail.interface';
import { createPersistedCasefileDetail } from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';

/** Adapts independently authored wire data to the selected dashboard ID and lifecycle.
 * @param id Selected draft identifier.
 * @param status Saved lifecycle status.
 * @param submitter Saved BU-user identity.
 * @returns Complete independent selected HTTP fixture. */
export function selectedPersistedCasefile(
  id: number,
  status = 'SUBMITTED',
  submitter = 'BUU-OTHER',
): IOpalMaintenanceDraftCasefileDetail {
  const draft = createPersistedCasefileDetail();
  draft.draft_casefile_id = id;
  const statuses = [
    'SUBMITTED',
    'RESUBMITTED',
    'REJECTED',
    'DELETED',
    'PUBLISHED',
    'PUBLISHING_PENDING',
    'PUBLISHING_FAILED',
  ] as const;
  const selectedStatus = statuses.find((value) => value === status);
  if (!selectedStatus) throw new Error('Unsupported persisted fixture lifecycle: ' + status);
  draft.casefile_status = selectedStatus;
  draft.casefile_status_name = status.charAt(0) + status.slice(1).toLowerCase();
  draft.submitted_by = submitter;
  return draft;
}
