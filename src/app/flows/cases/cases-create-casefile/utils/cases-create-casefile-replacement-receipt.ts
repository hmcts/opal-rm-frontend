import type { HttpResponse } from '@angular/common/http';
import type { ICasesDraftCasefileResolved } from '../../cases-draft/interfaces/cases-draft-casefile-resolved.interface';
import { decodeDraftCasefileDetail } from '../../services/opal-maintenance-service/utils/opal-maintenance-draft-casefile-detail';

export function readCasesCreateCasefileReplacementReceipt(
  response: HttpResponse<unknown>,
  expected: Pick<ICasesDraftCasefileResolved, 'draft' | 'etag' | 'identity'>,
): void {
  if (response.status !== 200) throw new Error('Invalid replacement receipt');
  const { draft, etag } = decodeDraftCasefileDetail(
    response.body,
    response.headers.get('ETag'),
    expected.draft.draft_casefile_id,
  );
  if (
    draft.business_unit_id !== expected.draft.business_unit_id ||
    draft.casefile_status !== 'RESUBMITTED' ||
    draft.submitted_by !== expected.identity.submittedBy ||
    etag === expected.etag
  ) {
    throw new Error('Invalid replacement receipt');
  }
}
