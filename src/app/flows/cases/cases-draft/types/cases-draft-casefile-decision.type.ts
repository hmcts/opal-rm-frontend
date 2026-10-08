export type CasesDraftCasefileDecision =
  | { decision: 'approve'; targetStatus: 'PUBLISHING_PENDING' }
  | { decision: 'reject'; targetStatus: 'REJECTED'; reason: string };
