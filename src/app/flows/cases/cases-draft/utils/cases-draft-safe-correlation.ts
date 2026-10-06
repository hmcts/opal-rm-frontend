import { HttpErrorResponse } from '@angular/common/http';

/** Accept only a bounded identifier, never backend error copy or personal data. */
export function safeCasesDraftCorrelation(error: unknown): string | null {
  if (!(error instanceof HttpErrorResponse)) return null;
  const body: unknown = error.error;
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const reference: unknown = (body as Record<string, unknown>)['operation_id'];
  return typeof reference === 'string' && /^[\w-]{1,100}$/.test(reference) ? reference : null;
}
