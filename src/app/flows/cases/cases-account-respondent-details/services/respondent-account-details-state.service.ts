import { DestroyRef, Injectable, inject, signal, type WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, defer, EMPTY, forkJoin, map, type Observable, of, Subject, takeUntil, tap } from 'rxjs';
import type {
  RespondentAccountAtAGlance,
  RespondentAccountHeaderSummary,
  RespondentAccountRead,
} from '../../services/opal-maintenance-service/interfaces/opal-maintenance-respondent-account.interface';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
import {
  type RespondentAccountReadFailure,
  toRespondentAccountReadError,
} from '../../services/opal-maintenance-service/utils/opal-maintenance-respondent-account-read-error';

export type RespondentAccountReadKind = 'header' | 'summary';
type RetryableFailure = Extract<RespondentAccountReadFailure, { kind: 'retryable' }>;
type Result<T> = { ok: true; value: RespondentAccountRead<T> } | { ok: false; failure: RespondentAccountReadFailure };

interface ReadSlot<T> {
  phase: 'loading' | 'ready' | 'error';
  data: RespondentAccountRead<T> | null;
  error: RetryableFailure | null;
}

interface Freshness {
  baseline: string | null;
  warning: boolean;
  confirmed: boolean;
}

const emptySlot = <T>(): ReadSlot<T> => ({ phase: 'loading', data: null, error: null });
const initialFreshness: Freshness = { baseline: null, warning: false, confirmed: false };

function comparableTag(tag: string | null): string | null {
  return tag !== null && /^"[\x21\x23-\x7e\x80-\xff]*"$/.test(tag) ? tag : null;
}

export function observeTag(current: Freshness, candidate: string | null): Freshness {
  const tag = comparableTag(candidate);
  return current.baseline !== null && tag !== null && current.baseline !== tag
    ? { ...current, warning: true, confirmed: false }
    : current;
}

@Injectable()
export class RespondentAccountDetailsState {
  private readonly maintenance = inject(OpalMaintenanceService);
  private readonly router = inject(Router);
  private readonly headerSlot = signal(emptySlot<RespondentAccountHeaderSummary>());
  private readonly summarySlot = signal(emptySlot<RespondentAccountAtAGlance>());
  private readonly tags = signal(initialFreshness);
  private readonly cancelRequests = new Subject<void>();
  private scope: { accountId: number; selectedApplicantAccountId: number | null } | null = null;
  private leaving = false;

  public readonly header = this.headerSlot.asReadonly();
  public readonly summary = this.summarySlot.asReadonly();
  public readonly freshness = this.tags.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.cancelRequests.next();
      this.cancelRequests.complete();
    });
  }

  private loadPair(id: number, refresh: boolean): void {
    forkJoin({
      header: this.readHeader(id, !refresh),
      summary: this.readSummary(id, !refresh),
    }).subscribe(({ header, summary }) => {
      if (!refresh || this.leaving || !header.ok || !summary.ok) return;
      const tag = comparableTag(header.value.etag);
      if (tag !== null && tag === comparableTag(summary.value.etag)) {
        this.tags.set({ baseline: tag, warning: false, confirmed: true });
      }
    });
  }

  private readHeader(id: number, observeFreshness: boolean): Observable<Result<RespondentAccountHeaderSummary>> {
    return this.load(this.headerSlot, () => this.maintenance.getRespondentAccountHeaderSummary(id)).pipe(
      tap((result) => {
        if (observeFreshness && result.ok) this.observeHeader(result.value.etag);
      }),
    );
  }

  private readSummary(id: number, observeFreshness: boolean): Observable<Result<RespondentAccountAtAGlance>> {
    return this.load(this.summarySlot, () => this.maintenance.getRespondentAccountAtAGlance(id)).pipe(
      tap((result) => {
        if (observeFreshness && result.ok) this.tags.update((current) => observeTag(current, result.value.etag));
      }),
    );
  }

  private observeHeader(headerTag: string | null): void {
    this.tags.update((current) => {
      if (current.baseline !== null) return observeTag(current, headerTag);
      const summary = this.summary();
      const summaryTag = summary.phase === 'ready' ? (summary.data?.etag ?? null) : null;
      return observeTag({ ...current, baseline: comparableTag(headerTag) }, summaryTag);
    });
  }

  private load<T>(
    slot: WritableSignal<ReadSlot<T>>,
    request: () => Observable<RespondentAccountRead<T>>,
  ): Observable<Result<T>> {
    return defer(() => {
      if (this.leaving) return EMPTY;
      slot.update((current) => ({ ...current, phase: 'loading', error: null }));
      return request();
    }).pipe(
      map((value): Result<T> => ({ ok: true, value })),
      catchError((error: unknown) =>
        of<Result<T>>({ ok: false, failure: toRespondentAccountReadError(error).failure }),
      ),
      tap((result) => this.accept(slot, result)),
      takeUntil(this.cancelRequests),
    );
  }

  private accept<T>(slot: WritableSignal<ReadSlot<T>>, result: Result<T>): void {
    if (result.ok) {
      slot.set({ phase: 'ready', data: result.value, error: null });
      return;
    }
    if (result.failure.kind === 'retryable') {
      const error = result.failure;
      slot.update((current) => ({ ...current, phase: 'error', error }));
      return;
    }
    this.leaving = true;
    this.cancelRequests.next();
    void this.router.navigateByUrl(result.failure.path, { state: { operationId: result.failure.operationId } });
  }

  public open(accountId: number, selectedApplicantAccountId: number | null): void {
    if (this.scope?.accountId === accountId && this.scope.selectedApplicantAccountId === selectedApplicantAccountId) {
      return;
    }
    this.cancelRequests.next();
    this.scope = { accountId, selectedApplicantAccountId };
    this.leaving = false;
    this.headerSlot.set(emptySlot());
    this.summarySlot.set(emptySlot());
    this.tags.set(initialFreshness);
    this.loadPair(accountId, false);
  }

  public refresh(): void {
    if (
      !this.scope ||
      this.leaving ||
      !this.tags().warning ||
      this.header().phase === 'loading' ||
      this.summary().phase === 'loading'
    ) {
      return;
    }
    this.loadPair(this.scope.accountId, true);
  }

  public retry(read: RespondentAccountReadKind): void {
    if (!this.scope || this.leaving || this[read]().phase !== 'error') return;
    const id = this.scope.accountId;
    if (read === 'header') {
      this.readHeader(id, true).subscribe();
    } else {
      this.readSummary(id, true).subscribe();
    }
  }

  public dismissConfirmation(): void {
    this.tags.update((current) => ({ ...current, confirmed: false }));
  }
}
