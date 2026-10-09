import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ResolveFn } from '@angular/router';
import { EMPTY, map } from 'rxjs';
import { CasesDraftDashboardService } from '../../services/cases-draft-dashboard.service';
import type { ICasesDraftAllRejectedResolvedCasefiles } from '../../interfaces/cases-draft-all-rejected-resolved-casefiles.interface';
import { mapCasesDraftRows } from '../../utils/cases-draft-summary';

export const casesDraftAllRejectedResolver: ResolveFn<ICasesDraftAllRejectedResolvedCasefiles> = () => {
  const data = inject(CasesDraftDashboardService);
  const identity = data.getIdentity();
  if (!identity) return EMPTY;
  return data.getAllRejectedList(identity).pipe(
    map((response): ICasesDraftAllRejectedResolvedCasefiles => ({
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
    takeUntilDestroyed(),
  );
};
