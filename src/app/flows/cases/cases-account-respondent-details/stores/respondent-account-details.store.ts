import { computed, DestroyRef, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { defer, forkJoin, type Observable, Subject, takeUntil, tap } from 'rxjs';
import type {
  RespondentAccountAtAGlance,
  RespondentAccountHeaderSummary,
  RespondentAccountRead,
} from '../../services/opal-maintenance-service/interfaces/opal-maintenance-respondent-account.interface';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
import {
  type RespondentAccountReadError,
  type RespondentAccountReadResult,
  RespondentAccountReadService,
} from '../services/respondent-account-read.service';

export type RespondentAccountReadKind = 'header' | 'summary';

interface ReadSlot<T> {
  phase: 'loading' | 'ready' | 'error' | 'unavailable';
  data: RespondentAccountRead<T> | null;
  error: RespondentAccountReadError | null;
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

const unavailableRead = { phase: 'unavailable', data: null, error: null } as const;
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
  withComputed(({ header }) => ({ unavailable: computed(() => header().phase === 'unavailable') })),
  withMethods((store, accountReads = inject(RespondentAccountReadService)) => {
    const maintenance = inject(OpalMaintenanceService);
    const cancelRequests = new Subject<void>();

    inject(DestroyRef).onDestroy(() => {
      cancelRequests.next();
      cancelRequests.complete();
    });

    function markUnavailable(): void {
      patchState(store, { header: unavailableRead, summary: unavailableRead, freshness: initialState.freshness });
      cancelRequests.next();
    }

    function load<T>(
      request: () => Observable<RespondentAccountRead<T>>,
      updateSlot: (changes: Partial<ReadSlot<T>>) => void,
    ): Observable<RespondentAccountReadResult<T>> {
      return defer(() => {
        updateSlot({ phase: 'loading', error: null });

        return accountReads.read(request).pipe(
          tap((result) => {
            if (result.status === 'unavailable') {
              markUnavailable();
            } else if (result.status === 'success') {
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

    function readHeader(
      id: number,
      observeFreshness: boolean,
    ): Observable<RespondentAccountReadResult<RespondentAccountHeaderSummary>> {
      return load(
        () => maintenance.getRespondentAccountHeaderSummary(id),
        (changes) => patchState(store, ({ header }) => ({ header: { ...header, ...changes } })),
      ).pipe(
        tap((result) => {
          if (observeFreshness && result.status === 'success') observeHeader(result.value.etag);
        }),
      );
    }

    function readSummary(
      id: number,
      observeFreshness: boolean,
    ): Observable<RespondentAccountReadResult<RespondentAccountAtAGlance>> {
      return load(
        () => maintenance.getRespondentAccountAtAGlance(id),
        (changes) => patchState(store, ({ summary }) => ({ summary: { ...summary, ...changes } })),
      ).pipe(
        tap((result) => {
          if (observeFreshness && result.status === 'success') {
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
        if (!refresh || header.status !== 'success' || summary.status !== 'success') return;

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
        patchState(store, { ...initialState, _scope: { accountId, selectedApplicantAccountId } });
        loadPair(accountId, false);
      },

      refresh(): void {
        const scope = store._scope();
        if (
          !scope ||
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
        if (!scope || store[read]().phase !== 'error') return;

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
