export interface RespondentAccountName {
  title?: string | null;
  forenames?: string | null;
  surname: string;
}

interface RespondentAccountAddress {
  lines: string[];
  postcode?: string | null;
  country?: string | null;
}

interface RespondentAccountIdentity {
  respondentAccountId: number;
  version: string;
  enforcementStatus: null;
}

export interface RespondentAccountHeaderSummary extends RespondentAccountIdentity {
  respondentAccountPartyId: number;
  partyId: number;
  businessUnitId: number;
  accountNumber: string;
  accountType: 'Respondent';
  name: RespondentAccountName;
  caseType: 'REMO In' | 'REMO Out' | 'REMO Out (CMS)' | null;
  arrears: number;
  balance: number;
  arrearsUpdatedDate?: string | null;
  accountStatus: { code: 'L'; display: 'Live' } | { code: 'C'; display: 'Completed' };
  hasOutstandingCaseHearing: false;
}

type RespondentAccountApplicant = {
  accountId: number;
  accountNumber?: string | null;
} & (
  | { kind: 'individual'; name: RespondentAccountName; restricted?: boolean | null }
  | { kind: 'organisation'; organisationName: string }
);

export interface RespondentAccountAtAGlance extends RespondentAccountIdentity {
  respondent: {
    name: RespondentAccountName;
    dateOfBirth?: string | null;
    age?: number;
    address?: RespondentAccountAddress | null;
    mainEmail?: string | null;
    restricted?: boolean | null;
  };
  applicant?: RespondentAccountApplicant | null;
  comment?: string | null;
  authorityReference?: string | null;
}

export interface RespondentAccountRead<T> {
  body: T;
  etag: string | null;
}
