import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { catchError, defaultIfEmpty, defer, map, type Observable, of } from 'rxjs';
import type { RespondentAccountRead } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-respondent-account.interface';

export interface RespondentAccountReadError {
  title: string;
  message: string;
  operationId: string | null;
}

export type RespondentAccountReadResult<T> =
  | { status: 'success'; value: RespondentAccountRead<T> }
  | { status: 'failed'; error: RespondentAccountReadError }
  | { status: 'unavailable' };

const genericReadError: RespondentAccountReadError = {
  title: GENERIC_HTTP_ERROR_TITLE,
  message: GENERIC_HTTP_ERROR_MESSAGE,
  operationId: null,
};

@Injectable()
export class RespondentAccountReadService {
  private readonly globalStore = inject(GlobalStore);

  private takeSharedError(): RespondentAccountReadError {
    const banner = this.globalStore.bannerError();
    if (!banner.error) return genericReadError;

    // Move the banner to the failed read so sibling success cannot erase it and the shell does not duplicate it.
    this.globalStore.resetBannerError();
    return {
      title: banner.title || GENERIC_HTTP_ERROR_TITLE,
      message: banner.message || GENERIC_HTTP_ERROR_MESSAGE,
      operationId: banner.operationId ?? null,
    };
  }

  public read<T>(request: () => Observable<RespondentAccountRead<T>>): Observable<RespondentAccountReadResult<T>> {
    return defer(request).pipe(
      // A retryable 409 sets the shared banner and completes without a response.
      defaultIfEmpty(null),
      map((value): RespondentAccountReadResult<T> =>
        value ? { status: 'success', value } : { status: 'failed', error: this.takeSharedError() },
      ),
      catchError((error: unknown) => {
        if (!(error instanceof HttpErrorResponse)) {
          return of<RespondentAccountReadResult<T>>({ status: 'failed', error: genericReadError });
        }

        const problem = error.error as { retriable?: unknown } | null;
        return of<RespondentAccountReadResult<T>>(
          problem?.retriable === false
            ? { status: 'unavailable' }
            : { status: 'failed', error: this.takeSharedError() },
        );
      }),
    );
  }
}
