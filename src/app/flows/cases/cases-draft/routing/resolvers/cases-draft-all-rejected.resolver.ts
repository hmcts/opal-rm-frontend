import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ResolveFn } from '@angular/router';
import { catchError, EMPTY, map, of, throwError } from 'rxjs';
import { CasesDraftDashboardService } from '../../services/cases-draft-dashboard.service';
import type { CasesDraftAllRejectedResolvedState } from '../../types/cases-draft-all-rejected-resolved-state.type';
import { mapCasesDraftRows } from '../../utils/cases-draft-summary';

export const casesDraftAllRejectedResolver: ResolveFn<CasesDraftAllRejectedResolvedState> = () => {
  const data = inject(CasesDraftDashboardService);
  const identity = data.getIdentity();
  if (!identity) return EMPTY;
  return data.getAllRejectedList(identity).pipe(
    map((response): CasesDraftAllRejectedResolvedState => ({
      status: 'success',
      identity,
      rows: mapCasesDraftRows(
        response.summaries.filter(
          (summary) =>
            summary.business_unit_id === identity.businessUnitId &&
            summary.casefile_status === 'REJECTED' &&
            summary.submitted_by !== identity.submittedBy,
        ),
        'rejected',
      ),
    })),
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        ([401, 403].includes(error.status) || error.error?.retriable === false)
      ) {
        return throwError(() => error);
      }
      return of<CasesDraftAllRejectedResolvedState>({
        status: 'failure',
        identity,
      });
    }),
    takeUntilDestroyed(),
  );
};
