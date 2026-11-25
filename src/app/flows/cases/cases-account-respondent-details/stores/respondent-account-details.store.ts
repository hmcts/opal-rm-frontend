import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, inject } from '@angular/core';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import {
  catchError,
  defaultIfEmpty,
  defer,
  EMPTY,
  forkJoin,
  map,
  type Observable,
  of,
  Subject,
  takeUntil,
  tap,
} from 'rxjs';
import type {
  RespondentAccountAtAGlance,
  RespondentAccountHeaderSummary,
  RespondentAccountRead,
} from '../../services/opal-maintenance-service/interfaces/opal-maintenance-respondent-account.interface';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';

export type RespondentAccountReadKind = 'header' | 'summary';

interface ReadError {
  title: string;
  message: string;
}

type Result<T> = { ok: true; value: RespondentAccountRead<T> } | { ok: false; error: ReadError };

interface ReadSlot<T> {
  phase: 'loading' | 'ready' | 'error';
  data: RespondentAccountRead<T> | null;
  error: ReadError | null;
}

interface Freshness {
  baseline: string | null;
  warning: boolean;
  confirmed: boolean;
}

interface AccountDetailsState {
  _scope: { accountId: number; selectedApplicantAccountId: number | null } | null;
  header: ReadSlot<RespondentAccountHeaderSummary>;
  summary: ReadSlot<RespondentAccountAtAGlance>;
  freshness: Freshness;
}

const genericReadError: ReadError = { title: GENERIC_HTTP_ERROR_TITLE, message: GENERIC_HTTP_ERROR_MESSAGE };
const initialState: AccountDetailsState = {
  _scope: null,
  header: { phase: 'loading', data: null, error: null },
  summary: { phase: 'loading', data: null, error: null },
  freshness: { baseline: null, warning: false, confirmed: false },
};

function comparableTag(tag: string | null): string | null {
  return tag !== null && /^"[\x21\x23-\x7e\x80-\xff]*"$/.test(tag) ? tag : null;
}

export function observeTag(current: Freshness, candidate: string | null): Freshness {
  const tag = comparableTag(candidate);
  return current.baseline !== null && tag !== null && current.baseline !== tag
    ? { ...current, warning: true, confirmed: false }
    : current;
}

export const RespondentAccountDetailsStore = signalStore(
  withState(initialState),
  withMethods((store, maintenance = inject(OpalMaintenanceService), globalStore = inject(GlobalStore)) => {
    const cancelRequests = new Subject<void>();
    let leaving = false;

    inject(DestroyRef).onDestroy(() => {
      cancelRequests.next();
      cancelRequests.complete();
    });

    function takeSharedError(): ReadError {
      const banner = globalStore.bannerError();
      if (!banner.error) return genericReadError;

      // A successful sibling read clears the shared banner. Keep the copy with the read it belongs to.
      globalStore.resetBannerError();
      return {
        title: banner.title || GENERIC_HTTP_ERROR_TITLE,
        message: banner.message || GENERIC_HTTP_ERROR_MESSAGE,
      };
    }

    function load<T>(
      request: () => Observable<RespondentAccountRead<T>>,
      updateSlot: (changes: Partial<ReadSlot<T>>) => void,
    ): Observable<Result<T>> {
      return defer(() => {
        if (leaving) return EMPTY;
        updateSlot({ phase: 'loading', error: null });

        return defer(request).pipe(
          // The shared interceptor can record an error and complete without a response.
          defaultIfEmpty(null),
          map((value): Result<T> => (value ? { ok: true, value } : { ok: false, error: takeSharedError() })),
          catchError((error: unknown) => {
            if (error instanceof HttpErrorResponse) {
              const problem = error.error as { retriable?: unknown } | null;
              if (problem?.retriable === false) {
                // The shared interceptor has started navigation. Cancel the pending account reads.
                leaving = true;
                cancelRequests.next();
                return EMPTY;
              }
              return of<Result<T>>({ ok: false, error: takeSharedError() });
            }

            return of<Result<T>>({ ok: false, error: genericReadError });
          }),
          tap((result) => {
            if (result.ok) {
              updateSlot({ phase: 'ready', data: result.value, error: null });
            } else {
              updateSlot({ phase: 'error', error: result.error });
            }
          }),
        );
      }).pipe(takeUntil(cancelRequests));
    }

    function observeHeader(headerTag: string | null): void {
      patchState(store, ({ freshness, summary }) => {
        if (freshness.baseline !== null) return { freshness: observeTag(freshness, headerTag) };
        const summaryTag = summary.phase === 'ready' ? (summary.data?.etag ?? null) : null;
        return { freshness: observeTag({ ...freshness, baseline: comparableTag(headerTag) }, summaryTag) };
      });
    }

    function readHeader(id: number, observeFreshness: boolean): Observable<Result<RespondentAccountHeaderSummary>> {
      return load(
        () => maintenance.getRespondentAccountHeaderSummary(id),
        (changes) => patchState(store, ({ header }) => ({ header: { ...header, ...changes } })),
      ).pipe(
        tap((result) => {
          if (observeFreshness && result.ok) observeHeader(result.value.etag);
        }),
      );
    }

    function readSummary(id: number, observeFreshness: boolean): Observable<Result<RespondentAccountAtAGlance>> {
      return load(
        () => maintenance.getRespondentAccountAtAGlance(id),
        (changes) => patchState(store, ({ summary }) => ({ summary: { ...summary, ...changes } })),
      ).pipe(
        tap((result) => {
          if (observeFreshness && result.ok) {
            patchState(store, ({ freshness }) => ({ freshness: observeTag(freshness, result.value.etag) }));
          }
        }),
      );
    }

    function loadPair(id: number, refresh: boolean): void {
      forkJoin({
        header: readHeader(id, !refresh),
        summary: readSummary(id, !refresh),
      }).subscribe(({ header, summary }) => {
        if (!refresh || leaving || !header.ok || !summary.ok) return;

        const tag = comparableTag(header.value.etag);
        if (tag !== null && tag === comparableTag(summary.value.etag)) {
          patchState(store, { freshness: { baseline: tag, warning: false, confirmed: true } });
        }
      });
    }

    return {
      open(accountId: number, selectedApplicantAccountId: number | null): void {
        const scope = store._scope();
        if (scope?.accountId === accountId && scope.selectedApplicantAccountId === selectedApplicantAccountId) return;

        cancelRequests.next();
        leaving = false;
        patchState(store, { ...initialState, _scope: { accountId, selectedApplicantAccountId } });
        loadPair(accountId, false);
      },

      refresh(): void {
        const scope = store._scope();
        if (
          !scope ||
          leaving ||
          !store.freshness().warning ||
          store.header().phase === 'loading' ||
          store.summary().phase === 'loading'
        ) {
          return;
        }
        loadPair(scope.accountId, true);
      },

      retry(read: RespondentAccountReadKind): void {
        const scope = store._scope();
        if (!scope || leaving || store[read]().phase !== 'error') return;

        if (read === 'header') {
          readHeader(scope.accountId, true).subscribe();
        } else {
          readSummary(scope.accountId, true).subscribe();
        }
      },

      dismissConfirmation(): void {
        patchState(store, ({ freshness }) => ({ freshness: { ...freshness, confirmed: false } }));
      },
    };
  }),
);
