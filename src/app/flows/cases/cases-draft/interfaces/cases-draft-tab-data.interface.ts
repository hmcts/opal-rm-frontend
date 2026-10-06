import type { ICasesDraftIdentity } from './cases-draft-identity.interface';
import type { ICasesDraftRow } from './cases-draft-row.interface';
import type { CasesDraftTab } from '../types/cases-draft-tab.type';

export interface ICasesDraftTabData {
  identity: ICasesDraftIdentity;
  tab: CasesDraftTab;
  rows: ICasesDraftRow[] | null;
  count: number | null;
  failure?: { correlationReference: string | null };
}
