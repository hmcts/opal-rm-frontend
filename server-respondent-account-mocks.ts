import type { Express, Response } from 'express';
import {
  RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK,
  RESPONDENT_ACCOUNT_ETAG,
  RESPONDENT_ACCOUNT_HEADER_MOCK,
} from './src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-respondent-account.mock';

const loopbackAddresses = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const loopbackHost = /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;
const accountReadPath = /^\/opal-maintenance-service\/respondent-accounts\/[^/]+\/(header-summary|at-a-glance)$/;
const accountUrl = `/opal-maintenance-service/respondent-accounts/${RESPONDENT_ACCOUNT_HEADER_MOCK.respondentAccountId}`;
const responses = new Map<string, typeof RESPONDENT_ACCOUNT_HEADER_MOCK | typeof RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK>([
  [`${accountUrl}/header-summary`, RESPONDENT_ACCOUNT_HEADER_MOCK],
  [`${accountUrl}/at-a-glance`, RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK],
]);

function sendTerminalProblem(response: Response, status: 404 | 503): void {
  const title = status === 404 ? 'Account not found' : 'Account details unavailable';
  response
    .status(status)
    .type('application/problem+json')
    .set({ 'Cache-Control': 'no-store' })
    .end(JSON.stringify({ status, title, retriable: false }));
}

export function configureRespondentAccountDevelopmentMocks(
  app: Express,
  environment: Readonly<Record<string, string | undefined>>,
): void {
  const mocksEnabled =
    environment['NODE_ENV'] === 'development' && environment['OPAL_RM_RESPONDENT_ACCOUNT_MOCKS'] === 'true';

  app.use((request, response, next) => {
    if (request.method !== 'GET' || !accountReadPath.test(request.path)) {
      next();
      return;
    }
    // The Angular SSR watcher can rewrite Host and forward the original client address.
    const forwardedFor = request.get('x-forwarded-for');
    const localRequest =
      loopbackAddresses.has(request.socket.remoteAddress ?? '') &&
      loopbackHost.test(request.get('host') ?? '') &&
      (forwardedFor === undefined || forwardedFor.split(',').every((hop) => loopbackAddresses.has(hop.trim())));
    if (!mocksEnabled || !localRequest) {
      sendTerminalProblem(response, 503);
      return;
    }
    const body = responses.get(request.path);
    if (!body) {
      sendTerminalProblem(response, 404);
      return;
    }
    response
      .status(200)
      .type('application/json')
      .set({
        ETag: RESPONDENT_ACCOUNT_ETAG,
        'Cache-Control': 'no-store',
      })
      .end(JSON.stringify(body));
  });
}
