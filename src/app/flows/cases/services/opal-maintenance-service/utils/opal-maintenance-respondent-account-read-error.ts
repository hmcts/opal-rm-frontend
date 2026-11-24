import { HttpErrorResponse } from '@angular/common/http';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { HTTP_RETRYABLE_STATUS_CODES } from '@hmcts/opal-frontend-common/interceptors/http-retry/constants';

export type RespondentAccountReadFailure =
  | { kind: 'retryable'; title: string; message: string }
  | {
      kind: 'route';
      path: '/error/permission-denied' | '/error/concurrency-failure' | '/error/internal-server';
      operationId: string | null;
    };

export class RespondentAccountReadError extends Error {
  public constructor(public readonly failure: RespondentAccountReadFailure) {
    super('Respondent account read failed');
    this.name = 'RespondentAccountReadError';
  }
}

function readText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function routeForStatus(status: number): Extract<RespondentAccountReadFailure, { kind: 'route' }>['path'] {
  if (status === 403) return '/error/permission-denied';
  if (status === 409) return '/error/concurrency-failure';
  return '/error/internal-server';
}

export function invalidRespondentAccountResponse(): RespondentAccountReadError {
  return new RespondentAccountReadError({
    kind: 'retryable',
    title: GENERIC_HTTP_ERROR_TITLE,
    message: GENERIC_HTTP_ERROR_MESSAGE,
  });
}

export function toRespondentAccountReadError(error: unknown): RespondentAccountReadError {
  if (error instanceof RespondentAccountReadError) return error;
  if (!(error instanceof HttpErrorResponse) || (error.status >= 200 && error.status < 300)) {
    return invalidRespondentAccountResponse();
  }
  const body: unknown = error.error;
  const problem =
    typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  if (HTTP_RETRYABLE_STATUS_CODES.includes(error.status) && problem['retriable'] !== false) {
    const title = problem['status'] === error.status ? readText(problem['title']) : undefined;
    const detail = problem['status'] === error.status ? readText(problem['detail']) : undefined;
    return new RespondentAccountReadError({
      kind: 'retryable',
      title: title ?? GENERIC_HTTP_ERROR_TITLE,
      message: detail ?? GENERIC_HTTP_ERROR_MESSAGE,
    });
  }
  const reference = readText(problem['operation_id']);
  return new RespondentAccountReadError({
    kind: 'route',
    path: routeForStatus(error.status),
    operationId: reference && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(reference) ? reference : null,
  });
}
