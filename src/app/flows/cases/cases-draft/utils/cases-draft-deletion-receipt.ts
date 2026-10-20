import { decodeDraftCasefileDetail } from '../../services/opal-maintenance-service/utils/opal-maintenance-draft-casefile-detail';
import { isUsableDraftCasefileEtag } from '../../services/opal-maintenance-service/utils/opal-maintenance-draft-casefile-etag';
import type { HttpResponse } from '@angular/common/http';

export function readCasesDraftDeletionReceipt(
  response: HttpResponse<unknown>,
  expected: { id: number; businessUnitId: number; etag: string },
): ReturnType<typeof decodeDraftCasefileDetail> {
  const version = response.headers.get('ETag');
  if (response.status !== 200 || !isUsableDraftCasefileEtag(version)) throw new Error('Invalid deletion receipt');
  const receipt = decodeDraftCasefileDetail(response.body, version, expected.id);
  if (
    receipt.draft.business_unit_id !== expected.businessUnitId ||
    receipt.draft.casefile_status !== 'DELETED' ||
    !receipt.draft.casefile_snapshot.respondent_account.respondent_name.trim() ||
    receipt.etag === expected.etag
  )
    throw new Error('Invalid deletion receipt');
  return receipt;
}
