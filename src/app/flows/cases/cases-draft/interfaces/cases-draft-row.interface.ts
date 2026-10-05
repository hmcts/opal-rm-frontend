import type { CasesCreateCasefileCaseType } from '../../cases-create-casefile/types/cases-create-casefile-case-type.type';

export interface ICasesDraftRow {
  id: number;
  respondent: string | null;
  applicant: string | null;
  caseType: CasesCreateCasefileCaseType;
  created: string;
  statusDate: string;
  approved: string | null;
  respondentAccount: string | null;
  applicantAccount: string | null;
  minorCreditorAccounts: readonly string[];
}
