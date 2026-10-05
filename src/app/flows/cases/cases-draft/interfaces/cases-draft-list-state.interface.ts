import type { ICasesDraftRow } from './cases-draft-row.interface';

export interface ICasesDraftListState {
  status: 'idle' | 'loading' | 'ready' | 'empty' | 'error' | 'denied';
  rows: readonly ICasesDraftRow[];
  count: number | null;
  correlationReference: string | null;
}
