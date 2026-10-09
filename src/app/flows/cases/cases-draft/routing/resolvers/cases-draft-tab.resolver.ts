import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { EMPTY, map } from 'rxjs';
import { CasesDraftDashboardService } from '../../services/cases-draft-dashboard.service';
import type { ICasesDraftResolvedList } from '../../interfaces/cases-draft-resolved-list.interface';
import { parseCasesDraftNavigation } from '../../utils/cases-draft-navigation';

export const casesDraftTabResolver: ResolveFn<ICasesDraftResolvedList> = (route) => {
  const data = inject(CasesDraftDashboardService);
  const identity = data.getIdentity();
  if (!identity) return EMPTY;
  const { tab } = parseCasesDraftNavigation(route.fragment);
  return data.getList(identity, tab).pipe(map((response) => ({ identity, tab, response })));
};
