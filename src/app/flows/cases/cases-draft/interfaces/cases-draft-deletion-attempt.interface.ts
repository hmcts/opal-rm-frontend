import type { ICasesDraftIdentity } from './cases-draft-identity.interface';
export interface ICasesDraftDeletionAttempt {
  entry: number;
  id: number;
  businessUnitId: number;
  etag: string;
  reason: string;
  identity: ICasesDraftIdentity;
}
