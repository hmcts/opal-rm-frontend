import type { ICasesDraftIdentity } from './cases-draft-identity.interface';

export interface ICasesDraftDeletionNotice {
  identity: ICasesDraftIdentity;
  draftCasefileId: number;
  respondentName: string;
  outcome: 'confirmed' | 'observed';
}
