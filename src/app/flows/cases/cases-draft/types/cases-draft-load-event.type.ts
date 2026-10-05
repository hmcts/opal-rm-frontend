import type { ICasesDraftRow } from '../interfaces/cases-draft-row.interface';
import type { CasesDraftTab } from './cases-draft-tab.type';

export type CasesDraftLoadEvent =
  | { kind: 'denied' }
  | { kind: 'list-loading'; tab: CasesDraftTab }
  | { kind: 'list-ready'; tab: CasesDraftTab; rows: readonly ICasesDraftRow[]; count: number }
  | { kind: 'list-error'; tab: CasesDraftTab; reference: string | null }
  | { kind: 'badge-loading' }
  | { kind: 'badge-ready'; count: number }
  | { kind: 'badge-error'; reference: string | null };
