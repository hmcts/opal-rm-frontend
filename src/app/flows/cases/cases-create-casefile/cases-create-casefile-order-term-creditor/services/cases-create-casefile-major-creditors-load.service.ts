import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { defer, finalize, Subscription, take, throwIfEmpty } from 'rxjs';
import type { OpalMaintenanceService } from '../../../services/opal-maintenance-service/opal-maintenance.service';
import type { ICasesCreateCasefileMajorCreditorsLoadState } from '../interfaces/cases-create-casefile-major-creditors-load-state.interface';

/** Owns the Major Creditor request for one creditor-page activation. */
export class CasesCreateCasefileMajorCreditorsLoadService {
  private readonly current = signal<ICasesCreateCasefileMajorCreditorsLoadState>({
    status: 'loading',
    records: [],
    correlationReference: null,
  });
  private readonly subscriptions = new Subscription();
  private pending = false;
  private disposed = false;
  public readonly state = this.current.asReadonly();

  public constructor(
    private readonly service: Pick<OpalMaintenanceService, 'getMajorCreditors'>,
    private readonly businessUnitId: number,
  ) {}

  public load(): void {
    if (this.pending || this.disposed) return;
    this.pending = true;
    this.current.set({ status: 'loading', records: [], correlationReference: null });
    this.subscriptions.add(
      defer(() =>
        this.service.getMajorCreditors({
          business_unit_id: this.businessUnitId,
          active: true,
          central_authority: false,
        }),
      )
        .pipe(
          take(1),
          throwIfEmpty(),
          finalize(() => {
            this.pending = false;
          }),
        )
        .subscribe({
          next: ({ refData }) => {
            const records = refData.filter(
              (record) =>
                record.business_unit_id === this.businessUnitId &&
                record.active &&
                !record.central_authority &&
                Number.isInteger(record.major_creditor_id) &&
                record.major_creditor_id > 0,
            );
            this.current.set({
              status: records.length ? 'ready' : 'empty',
              records: records.map((record) => ({ ...record })),
              correlationReference: null,
            });
          },
          error: (error: unknown) => {
            const body: unknown = error instanceof HttpErrorResponse ? error.error : null;
            const problem = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
            const operationId = problem['operation_id'];
            this.current.set({
              status: 'error',
              records: [],
              correlationReference: typeof operationId === 'string' && operationId.trim() ? operationId : null,
            });
          },
        }),
    );
  }

  public dispose(): void {
    this.disposed = true;
    this.subscriptions.unsubscribe();
  }
}
