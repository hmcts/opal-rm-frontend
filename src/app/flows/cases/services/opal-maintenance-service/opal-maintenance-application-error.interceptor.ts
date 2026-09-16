import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const opalMaintenanceApplicationErrorInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.method !== 'GET' || request.url !== '/opal-maintenance-service/maintenance-applications') {
    return next(request);
  }

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) return throwError(() => error);

      const body: unknown = error.error;
      const problem = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
      const operationId = typeof problem['operation_id'] === 'string' ? problem['operation_id'] : null;

      return throwError(
        () =>
          new HttpErrorResponse({
            status: error.status,
            statusText: error.statusText,
            headers: error.headers,
            url: error.url ?? undefined,
            error: {
              operation_id: operationId,
              retriable: typeof problem['retriable'] === 'boolean' ? problem['retriable'] : undefined,
            },
          }),
      );
    }),
  );
};
