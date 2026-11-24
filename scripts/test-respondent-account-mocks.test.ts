import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Express, Request, RequestHandler, Response } from 'express';
import { configureRespondentAccountDevelopmentMocks } from '../server-respondent-account-mocks';
import {
  RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK,
  RESPONDENT_ACCOUNT_ETAG,
  RESPONDENT_ACCOUNT_HEADER_MOCK,
} from '../src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-respondent-account.mock';

const url = '/opal-maintenance-service/respondent-accounts/11748';
const enabled = { NODE_ENV: 'development', OPAL_RM_RESPONDENT_ACCOUNT_MOCKS: 'true' };

function register(environment: Readonly<Record<string, string | undefined>>): RequestHandler[] {
  const handlers: RequestHandler[] = [];
  const app = {
    use: (handler: RequestHandler) => handlers.push(handler),
  } as unknown as Express;
  configureRespondentAccountDevelopmentMocks(app, environment);
  return handlers;
}

interface RequestOptions {
  method?: string;
  host?: string;
  remoteAddress?: string;
  forwardedFor?: string;
}

function callHandler(
  handler: RequestHandler,
  path: string,
  { method = 'GET', host = 'localhost:5200', remoteAddress = '127.0.0.1', forwardedFor }: RequestOptions = {},
) {
  const requestHeaders: Record<string, string | undefined> = {
    host,
    'x-forwarded-for': forwardedFor,
    'x-forwarded-host': 'localhost',
    'if-none-match': RESPONDENT_ACCOUNT_ETAG,
  };
  const request = {
    method,
    path,
    socket: { remoteAddress },
    get: (header: string) => requestHeaders[header.toLowerCase()],
  } as unknown as Request;
  const response = {
    statusCode: 0,
    contentType: '',
    headers: {} as Record<string, string>,
    body: '',
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    type(contentType: string) {
      this.contentType = contentType;
      return this;
    },
    set(headers: Record<string, string>) {
      Object.assign(this.headers, headers);
      return this;
    },
    end(body: string) {
      this.body = body;
    },
  };
  let continued = false;
  handler(request, response as unknown as Response, () => {
    continued = true;
  });
  return { response, continued };
}

test('serves the two synthetic GETs with matching quoted ETags and no-store', () => {
  const handlers = register(enabled);
  assert.equal(handlers.length, 1);
  const [{ response: header, continued: continuedHeader }, { response: glance, continued: continuedGlance }] = [
    callHandler(handlers[0], `${url}/header-summary`),
    callHandler(handlers[0], `${url}/at-a-glance`, {
      host: '[::1]:5200',
      remoteAddress: '::1',
      forwardedFor: '127.0.0.1, ::1',
    }),
  ];
  assert.equal(continuedHeader, false);
  assert.equal(continuedGlance, false);
  assert.deepEqual(JSON.parse(header.body), RESPONDENT_ACCOUNT_HEADER_MOCK);
  assert.deepEqual(JSON.parse(glance.body), RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK);
  for (const response of [header, glance]) {
    assert.equal(response.statusCode, 200);
    assert.equal(response.contentType, 'application/json');
    assert.equal(response.headers['ETag'], RESPONDENT_ACCOUNT_ETAG);
    assert.equal(response.headers['Cache-Control'], 'no-store');
  }
});

function assertTerminalProblem(result: ReturnType<typeof callHandler>, status: 404 | 503): void {
  assert.equal(result.continued, false);
  assert.equal(result.response.statusCode, status);
  assert.equal(result.response.contentType, 'application/problem+json');
  assert.equal(result.response.headers['Cache-Control'], 'no-store');
  assert.equal(result.response.headers['ETag'], undefined);
  assert.deepEqual(JSON.parse(result.response.body), {
    status,
    title: status === 404 ? 'Account not found' : 'Account details unavailable',
    retriable: false,
  });
}

test('continues the normal proxy path for unrelated paths and methods', () => {
  for (const environment of [enabled, {}]) {
    const [handler] = register(environment);
    const candidates = [
      callHandler(handler, `${url}/header-summary`, { method: 'HEAD' }),
      callHandler(handler, `${url}/header-summary`, { method: 'POST' }),
      callHandler(handler, `${url}/notes`),
      callHandler(handler, '/opal-maintenance-service/draft-casefiles/11748'),
    ];
    for (const { response, continued } of candidates) {
      assert.equal(continued, true);
      assert.equal(response.body, '');
    }
  }
});

test('returns terminal 404 for both reserved reads of an unknown local fixture ID', () => {
  const [handler] = register(enabled);
  for (const resource of ['header-summary', 'at-a-glance']) {
    const path = `/opal-maintenance-service/respondent-accounts/11749/${resource}`;
    assertTerminalProblem(callHandler(handler, path), 404);
  }
});

test('returns terminal 503 for reserved reads when local mock setup is unavailable', () => {
  for (const environment of [
    {},
    { NODE_ENV: 'development' },
    { NODE_ENV: 'development', OPAL_RM_RESPONDENT_ACCOUNT_MOCKS: 'false' },
    { OPAL_RM_RESPONDENT_ACCOUNT_MOCKS: 'true' },
    { NODE_ENV: 'production', OPAL_RM_RESPONDENT_ACCOUNT_MOCKS: 'true' },
  ]) {
    const [handler] = register(environment);
    assertTerminalProblem(callHandler(handler, `${url}/at-a-glance`), 503);
    assertTerminalProblem(callHandler(handler, `${url}/header-summary`), 503);
  }
  const [handler] = register(enabled);
  assertTerminalProblem(callHandler(handler, `${url}/header-summary`, { host: 'other.example.test' }), 503);
  assertTerminalProblem(callHandler(handler, `${url}/at-a-glance`, { remoteAddress: '192.0.2.3' }), 503);
});

test('rejects a non-loopback client when the local SSR watcher rewrites Host', () => {
  const [handler] = register(enabled);
  assertTerminalProblem(callHandler(handler, `${url}/header-summary`, { forwardedFor: '127.0.0.1, 192.0.2.3' }), 503);
});
