import type {
  RespondentAccountAtAGlance,
  RespondentAccountHeaderSummary,
} from '../interfaces/opal-maintenance-respondent-account.interface';

export const RESPONDENT_ACCOUNT_ETAG = '"respondent-11748-v1"';

export const RESPONDENT_ACCOUNT_HEADER_MOCK: RespondentAccountHeaderSummary = {
  respondentAccountId: 11748,
  respondentAccountPartyId: 21748,
  partyId: 31748,
  businessUnitId: 44,
  accountNumber: 'RM0011748',
  accountType: 'Respondent',
  name: { title: 'Ms', forenames: 'Alex', surname: 'Test' },
  caseType: 'REMO In',
  arrears: 125.5,
  balance: 30.25,
  arrearsUpdatedDate: '2026-10-12',
  accountStatus: { code: 'L', display: 'Live' },
  version: 'respondent-11748-v1',
  enforcementStatus: null,
  hasOutstandingCaseHearing: false,
};

export const RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK: RespondentAccountAtAGlance = {
  respondentAccountId: RESPONDENT_ACCOUNT_HEADER_MOCK.respondentAccountId,
  respondent: {
    name: RESPONDENT_ACCOUNT_HEADER_MOCK.name,
    dateOfBirth: '1990-02-28',
    age: 36,
    address: { lines: ['1 Example Road', 'Example Town'], postcode: 'AB1 2CD', country: 'United Kingdom' },
    mainEmail: 'respondent@example.test',
    restricted: true,
  },
  applicant: {
    accountId: 41748,
    accountNumber: 'RA0011748',
    kind: 'individual',
    name: { title: 'Mr', forenames: 'Sam', surname: 'Example' },
    restricted: true,
  },
  comment: 'Synthetic account comment.',
  authorityReference: 'SYNTHETIC-AUTHORITY',
  version: RESPONDENT_ACCOUNT_HEADER_MOCK.version,
  enforcementStatus: null,
};
