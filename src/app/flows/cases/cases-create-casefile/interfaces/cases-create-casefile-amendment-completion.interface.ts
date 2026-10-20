import type { ICasesDraftResubmissionSuccess } from '../../cases-draft/interfaces/cases-draft-resubmission-success.interface';

export interface ICasesCreateCasefileAmendmentCompletion {
  target: string;
  notice: ICasesDraftResubmissionSuccess;
}
