import type { ICasesDraftIdentity } from './cases-draft-identity.interface';
export interface ICasesDraftResubmissionSuccess {
  origin: 'all-rejected';
  identity: ICasesDraftIdentity;
  draftCasefileId: number;
  respondentForename: string;
  respondentSurname: string;
}
