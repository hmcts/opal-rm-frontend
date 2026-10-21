import type { HttpResponse } from '@angular/common/http';
import type { ICasesDraftCasefileResolved } from '../interfaces/cases-draft-casefile-resolved.interface';
import type { ICasesDraftDecisionNotice } from '../interfaces/cases-draft-decision-notice.interface';
import type { CasesDraftCasefileDecision } from '../types/cases-draft-casefile-decision.type';
import { decodeDraftCasefileDetail } from '../../services/opal-maintenance-service/utils/opal-maintenance-draft-casefile-detail';

/** Accepts only a matching, versioned checker completion; errors contain no casefile data. */
export function readCasesDraftDecisionReceipt(
  response: HttpResponse<unknown>,
  expected: Pick<ICasesDraftCasefileResolved, 'draft' | 'etag' | 'identity'>,
  decision: CasesDraftCasefileDecision,
): ICasesDraftDecisionNotice {
  if (response.status !== 200) throw new Error('Invalid checker decision receipt');
  const { draft, etag } = decodeDraftCasefileDetail(
    response.body,
    response.headers.get('ETag'),
    expected.draft.draft_casefile_id,
  );
  const respondentName = draft.casefile_snapshot.respondent_account.respondent_name;
  if (
    draft.business_unit_id !== expected.draft.business_unit_id ||
    draft.casefile_status !== decision.targetStatus ||
    !etag.trim() ||
    etag === expected.etag ||
    !respondentName.trim()
  )
    throw new Error('Invalid checker decision receipt');
  return {
    identity: { ...expected.identity },
    draftCasefileId: draft.draft_casefile_id,
    respondentName,
    outcome: decision.decision === 'approve' ? 'approved' : 'rejected',
  };
}
