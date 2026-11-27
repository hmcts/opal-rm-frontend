import type { StaticResponse } from 'cypress/types/net-stubbing';
import { createCasesDraftSummary } from 'src/app/flows/cases/cases-draft/mocks/cases-draft-summary.mock';
import type { RespondentAccountAtAGlance } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-respondent-account.interface';
import {
  RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK,
  RESPONDENT_ACCOUNT_HEADER_MOCK,
} from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-respondent-account.mock';

export const retryableProblemResponse = {
  statusCode: 503,
  body: { status: 503, retriable: true, title: 'Summary unavailable', detail: 'Try the account summary again.' },
} satisfies StaticResponse;

export const deniedProblemResponse = {
  statusCode: 403,
  body: { status: 403, retriable: false, title: 'Permission denied' },
} satisfies StaticResponse;

export const serviceProblemResponse = {
  statusCode: 500,
  body: { status: 500, retriable: false, title: 'Read failed', operation_id: 'synthetic-11748-reference' },
} satisfies StaticResponse;

export const publishedRespondent = createCasesDraftSummary({
  draft_casefile_id: 123,
  casefile_status: 'PUBLISHED',
  validated_date: '2026-10-12T12:00:00Z',
  casefile_snapshot: {
    respondent_account: {
      account_id: RESPONDENT_ACCOUNT_HEADER_MOCK.respondentAccountId,
      account_number: RESPONDENT_ACCOUNT_HEADER_MOCK.accountNumber,
    },
  },
});

export const sparseSummary: RespondentAccountAtAGlance = {
  ...RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK,
  respondent: {
    name: RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK.respondent.name,
    dateOfBirth: null,
    address: null,
    mainEmail: null,
    restricted: false,
  },
  applicant: null,
  comment: null,
};
