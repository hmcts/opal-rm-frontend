import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, EMPTY, of, throwError } from 'rxjs';
import { CasesDraftDashboardService } from '../../services/cases-draft-dashboard.service';
import { parseCasesDraftNavigation } from '../../utils/cases-draft-navigation';

export const casesDraftCountResolver: ResolveFn<number | null> = (route) => {
  const data = inject(CasesDraftDashboardService);
  const identity = data.getIdentity();
  if (!identity) return EMPTY;
  // The selected Rejected list already provides the exact count on this arrival.
  if (parseCasesDraftNavigation(route.fragment, route.queryParamMap).tab === 'rejected') return of(null);
  return data.getRejectedCount(identity).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && [401, 403].includes(error.status)) return throwError(() => error);
      return of(null);
    }),
  );
};
