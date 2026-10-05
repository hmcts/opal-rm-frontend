export interface ICasesDraftBadgeState {
  status: 'idle' | 'loading' | 'ready' | 'error' | 'denied';
  count: number | null;
  label: string | null;
  correlationReference: string | null;
}
