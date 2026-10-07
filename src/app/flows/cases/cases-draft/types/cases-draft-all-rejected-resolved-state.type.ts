import type { ICasesDraftIdentity } from '../interfaces/cases-draft-identity.interface';
import type { ICasesDraftRow } from '../interfaces/cases-draft-row.interface';
export type CasesDraftAllRejectedResolvedState =
  | { status: 'success'; identity: ICasesDraftIdentity; rows: readonly ICasesDraftRow[] }
  | { status: 'failure'; identity: ICasesDraftIdentity };
