import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { defer, finalize, Subscription, take, throwIfEmpty } from 'rxjs';
import type { OpalMaintenanceService } from '../../../services/opal-maintenance-service/opal-maintenance.service';
import type { ICasesCreateCasefileOrderTermsLoadState } from '../interfaces/cases-create-casefile-order-terms-load-state.interface';

/** One activation's resource owner; resolver creates it and routed component disposes it. */
export class CasesCreateCasefileOrderTermsLoadService {
  private readonly current = signal<ICasesCreateCasefileOrderTermsLoadState>({
    status: 'loading',
    records: [],
    correlationReference: null,
  });
  private readonly subscriptions = new Subscription();
  private pending = false;
  private disposed = false;
  public readonly state = this.current.asReadonly();

  public constructor(private readonly service: Pick<OpalMaintenanceService, 'getResults'>) {}

  public load(): void {
    if (this.pending || this.disposed) return;
    this.pending = true;
    this.current.update((state) => ({ ...state, status: 'loading', correlationReference: null }));
    this.subscriptions.add(
      defer(() => this.service.getResults({ order_term: true, active: true }))
        .pipe(
          take(1),
          throwIfEmpty(),
          finalize(() => {
            this.pending = false;
          }),
        )
        .subscribe({
          next: ({ refData }) =>
            this.current.set({
              status: refData.length ? 'ready' : 'empty',
              records: refData.map((record) => ({ ...record })),
              correlationReference: null,
            }),
          error: (error: unknown) => {
            const body: unknown = error instanceof HttpErrorResponse ? error.error : null;
            const problem = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
            const operationId = problem['operation_id'];
            this.current.update((state) => ({
              ...state,
              status: 'error',
              correlationReference: typeof operationId === 'string' && operationId.trim() ? operationId : null,
            }));
          },
        }),
    );
  }

  public dispose(): void {
    this.disposed = true;
    this.subscriptions.unsubscribe();
  }
}
