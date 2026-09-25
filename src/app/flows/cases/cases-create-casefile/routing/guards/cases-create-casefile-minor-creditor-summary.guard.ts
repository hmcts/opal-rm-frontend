import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../constants/cases-create-casefile-routing-paths.constant';

export const casesCreateCasefileMinorCreditorSummaryGuard: CanActivateFn = () => {
  const store = inject(CasesCreateCasefileStore);
  const router = inject(Router);
  const paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
  const termId = store.currentOrderTermId();
  const path = (child: string) => router.parseUrl('/' + paths.root + '/' + child);

  if (termId === null || !store.orderTerms().some((term) => term.termId === termId)) {
    return path(paths.children.orderTermsSelect);
  }

  const draft = store.creditorDraft();
  return draft?.termId === termId && !!draft.details && !!draft.countryName
    ? true
    : path(paths.children.orderTermCreditor);
};
