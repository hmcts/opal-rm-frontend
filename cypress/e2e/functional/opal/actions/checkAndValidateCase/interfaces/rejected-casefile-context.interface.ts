import type { IOwnedDraftCasefile } from './draft-casefile-owned.interface';
import type { IDraftCasefileSnapshot } from './draft-casefile-snapshot.interface';

export type RejectedAmendmentKind = 'same-user' | 'cross-user' | 'retry' | 'stale' | 'denied' | 'non-rejected';
export interface IRejectedCasefileActor {
  email: string;
  id: string;
  name: string;
}
export interface IRejectedCasefileContext {
  owned: IOwnedDraftCasefile;
  before: IDraftCasefileSnapshot;
  amender: IRejectedCasefileActor;
}
