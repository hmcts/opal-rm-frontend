import { createPersistedCasefileResolved } from 'src/app/flows/cases/cases-draft/mocks/cases-draft-casefile-resolved.mock';
import type { CasesDraftCasefileDecision } from 'src/app/flows/cases/cases-draft/types/cases-draft-casefile-decision.type';

export function createDecisionScenario(decision: CasesDraftCasefileDecision['decision'] = 'approve') {
  const resolved = createPersistedCasefileResolved();
  const accepted = structuredClone(resolved.draft);
  accepted.casefile_status = decision === 'approve' ? 'PUBLISHING_PENDING' : 'REJECTED';
  accepted.casefile_status_name = decision === 'approve' ? 'Publishing pending' : 'Rejected';
  return { resolved, accepted, reason: 'Synthetic rejection reason' };
}
