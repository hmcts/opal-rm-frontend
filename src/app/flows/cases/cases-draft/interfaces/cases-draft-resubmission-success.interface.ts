import type { ICasesDraftIdentity } from './cases-draft-identity.interface';
export interface ICasesDraftResubmissionSuccess {
  origin: 'dashboard' | 'all-rejected';
  identity: ICasesDraftIdentity;
  draftCasefileId: number;
  respondentForename: string;
  respondentSurname: string;
}
