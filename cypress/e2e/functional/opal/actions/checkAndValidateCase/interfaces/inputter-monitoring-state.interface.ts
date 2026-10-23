import type { IOwnedDraftCasefile } from './draft-casefile-owned.interface';

/** Created per scenario; semantic journey roles and persisted IDs reference the same owned receipts. */
export interface IInputterMonitoringState {
  ownedByKey: Map<string, IOwnedDraftCasefile>;
  ownedById: Map<number, IOwnedDraftCasefile>;
}
