import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../constants/cases-create-casefile-routing-paths.constant';

export const casesCreateCasefileMinorCreditorRemoveGuard: CanActivateFn = () => {
  const store = inject(CasesCreateCasefileStore);
  const router = inject(Router);
  const paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
  const redirect = (child: string) => router.parseUrl('/' + paths.root + '/' + child);
  const termId = store.currentOrderTermId();

  if (termId === null || !store.orderTerms().some((term) => term.termId === termId)) {
    return redirect(paths.children.orderTermsSelect);
  }
  const selected = store.minorCreditorRemoval();
  if (selected) {
    if (store.isMinorCreditorRemovalCurrent(selected)) return true;
    store.clearMinorCreditorRemoval(selected);
    return redirect(paths.children.orderTermCreditor);
  }
  return store.beginMinorCreditorRemoval() ? true : redirect(paths.children.orderTermCreditor);
};
