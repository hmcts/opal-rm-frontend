import type { ICasesDraftIdentity } from './cases-draft-identity.interface';
import type { ICasesDraftRow } from './cases-draft-row.interface';

/** Successful identity-scoped collection supplied before route activation. */
export interface ICasesDraftAllRejectedResolvedCasefiles {
  identity: ICasesDraftIdentity;
  rows: readonly ICasesDraftRow[];
}
