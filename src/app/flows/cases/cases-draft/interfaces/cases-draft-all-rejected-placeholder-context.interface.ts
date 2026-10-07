import type { CasesDraftAllRejectedPlaceholderKind } from '../types/cases-draft-all-rejected-placeholder-kind.type';
import type { ICasesDraftIdentity } from './cases-draft-identity.interface';
export interface ICasesDraftAllRejectedPlaceholderContext {
  identity: ICasesDraftIdentity;
  kind: CasesDraftAllRejectedPlaceholderKind;
  id: number;
}
