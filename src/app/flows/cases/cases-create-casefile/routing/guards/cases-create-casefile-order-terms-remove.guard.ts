import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../constants/cases-create-casefile-routing-paths.constant';

export const casesCreateCasefileOrderTermsRemoveGuard: CanActivateFn = (route) => {
  const store = inject(CasesCreateCasefileStore);
  const router = inject(Router);
  const raw = route.paramMap.get('orderTermIndex') ?? '';
  const index = Number(raw);
  const selection = store.orderTermRemoval();
  const paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
  if (
    /^(0|[1-9]\d*)$/.test(raw) &&
    Number.isSafeInteger(index) &&
    selection?.index === index &&
    store.orderTerms()[index]?.termId === selection.termId &&
    store.isOrderTermRemovalCurrent(selection)
  ) {
    return true;
  }
  // A fresh invalid entry must not replay a success notice left by a completed removal.
  store.clearOrderTermRemovalOutcome();
  store.markOrderTermRemovalUnavailable();
  return router.parseUrl('/' + paths.root + '/' + paths.children.orderTermsSummary);
};
