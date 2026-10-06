import type { ICasesDraftIdentity } from '../interfaces/cases-draft-identity.interface';
import type { ICasesDraftRow } from '../interfaces/cases-draft-row.interface';
import type { CasesDraftCheckerTab } from './cases-draft-tab.type';
export type CasesDraftCheckerListState = { identity: ICasesDraftIdentity; tab: CasesDraftCheckerTab } & (
  | { status: 'loading'; rows: null; count: null }
  | { status: 'success'; rows: ICasesDraftRow[]; count: number }
  | { status: 'failure'; rows: null; count: null; correlationReference: string | null }
);
export type CasesDraftCheckerCountState =
  | { status: 'idle' | 'loading'; count: null }
  | { status: 'success'; count: number }
  | { status: 'failure'; count: null; correlationReference: string | null };
