import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { httpErrorInterceptor } from '@hmcts/opal-frontend-common/interceptors/http-error';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { AppInsightsService } from '@hmcts/opal-frontend-common/services/app-insights-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import { CASES_DRAFT_CHECKER_HTTP_ERROR } from '../flows/cases/cases-draft/constants/cases-draft-checker-http-error.token';
import { safeCasesDraftCorrelation } from '../flows/cases/cases-draft/utils/cases-draft-safe-correlation';

/** Preserve common handling unless the caller explicitly owns checker recovery and access denial. */
export const applicationHttpErrorInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.context.get(CASES_DRAFT_CHECKER_HTTP_ERROR)) return httpErrorInterceptor(request, next);
  const store = inject(GlobalStore);
  const insights = inject(AppInsightsService);
  return next(request).pipe(
    tap(() => store.resetBannerError()),
    catchError((error: unknown) => {
      const operationId = safeCasesDraftCorrelation(error);
      store.setBannerError({
        ...GLOBAL_ERROR_STATE,
        error: true,
        title: GENERIC_HTTP_ERROR_TITLE,
        message: GENERIC_HTTP_ERROR_MESSAGE,
        operationId,
      });
      // Provider copy and URLs can contain personal data. Retain only status and bounded correlation in monitoring.
      insights.logException(
        new HttpErrorResponse({
          status: error instanceof HttpErrorResponse ? error.status : 0,
          error: { title: GENERIC_HTTP_ERROR_TITLE, operation_id: operationId },
        }),
      );
      return throwError(() => error);
    }),
  );
};
