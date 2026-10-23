import type { ICasesDraftIdentity } from './cases-draft-identity.interface';
import type { CasesDraftDecisionOutcome } from '../types/cases-draft-decision-outcome.type';

export interface ICasesDraftDecisionNotice {
  identity: ICasesDraftIdentity;
  draftCasefileId: number;
  respondentName: string;
  outcome: CasesDraftDecisionOutcome;
}
