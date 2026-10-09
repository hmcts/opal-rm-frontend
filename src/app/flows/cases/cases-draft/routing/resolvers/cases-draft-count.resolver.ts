import { CASES_DRAFT_DASHBOARD_MODE } from '../../constants/cases-draft-dashboard-mode.token';
import type { CasesDraftOutcomeTab } from '../../types/cases-draft-tab.type';
import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, EMPTY, of, throwError } from 'rxjs';
import { CasesDraftDashboardService } from '../../services/cases-draft-dashboard.service';
import { parseCasesDraftNavigation } from '../../utils/cases-draft-navigation';

export const casesDraftCountResolver =
  (outcome: CasesDraftOutcomeTab = 'rejected'): ResolveFn<number | null> =>
  (route) => {
    const mode = inject(CASES_DRAFT_DASHBOARD_MODE);
    const data = inject(CasesDraftDashboardService);
    const identity = data.getIdentity();
    if (!identity) return EMPTY;
    // The selected outcome list already supplies the exact count on this arrival.
    if (parseCasesDraftNavigation(route.fragment, mode).tab === outcome) return of(null);
    return (mode === 'checker' ? data.getOutcomeCount(identity, outcome) : data.getRejectedCount(identity)).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && [401, 403].includes(error.status)) return throwError(() => error);
        return of(null);
      }),
    );
  };
