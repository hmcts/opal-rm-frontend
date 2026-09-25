import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../constants/cases-create-casefile-routing-paths.constant';

export const casesCreateCasefileOrderTermsRemoveGuard: CanActivateFn = (route) => {
  const store = inject(CasesCreateCasefileStore);
  const router = inject(Router);
  const raw = route.paramMap.get('orderTermIndex') ?? '';
  const index = Number(raw);
  const paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
  return /^(0|[1-9]\d*)$/.test(raw) && Number.isSafeInteger(index) && index < store.orderTerms().length
    ? true
    : router.parseUrl('/' + paths.root + '/' + paths.children.orderTermsSummary);
};
