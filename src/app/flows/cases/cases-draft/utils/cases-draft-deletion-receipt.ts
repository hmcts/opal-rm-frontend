import type { HttpResponse } from '@angular/common/http';
import type { ICasesDraftCasefileResolved } from '../interfaces/cases-draft-casefile-resolved.interface';
import type { IOpalMaintenanceDraftCasefileDetail } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-detail.interface';
import { decodeDraftCasefileDetail } from '../../services/opal-maintenance-service/utils/opal-maintenance-draft-casefile-detail';

/** Confirms a same-case deletion with a changed version before announcing success. */
export function readCasesDraftDeletionReceipt(
  response: HttpResponse<unknown> | null,
  expected: Pick<ICasesDraftCasefileResolved, 'draft' | 'etag'>,
): IOpalMaintenanceDraftCasefileDetail {
  if (response?.status !== 200) throw new Error('Invalid deletion receipt');
  const { draft, etag } = decodeDraftCasefileDetail(
    response.body,
    response.headers.get('ETag'),
    expected.draft.draft_casefile_id,
  );
  if (
    draft.business_unit_id !== expected.draft.business_unit_id ||
    draft.casefile_status !== 'DELETED' ||
    etag === expected.etag
  ) {
    throw new Error('Invalid deletion receipt');
  }
  return draft;
}
