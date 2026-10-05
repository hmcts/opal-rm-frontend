import { HttpErrorResponse } from '@angular/common/http';

/** Displays only the existing operation reference convention, never backend error details. */
export function casesDraftErrorReference(error: unknown): string | null {
  if (!(error instanceof HttpErrorResponse)) return null;
  const body: unknown = error.error;
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const reference = (body as Record<string, unknown>)['operation_id'];
  return typeof reference === 'string' && reference.trim() ? reference : null;
}

export function formatCasesDraftRejectedCount(count: number): string | null {
  if (count === 0) return null;
  return count > 99 ? '99+' : String(count);
}
