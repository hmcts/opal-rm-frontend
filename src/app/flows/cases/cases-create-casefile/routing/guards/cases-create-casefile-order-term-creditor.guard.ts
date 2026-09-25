import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../constants/cases-create-casefile-routing-paths.constant';

export const casesCreateCasefileOrderTermCreditorGuard: CanActivateFn = (route) => {
  const store = inject(CasesCreateCasefileStore);
  const router = inject(Router);
  const paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
  const currentId = store.currentOrderTermId();
  const hasCurrentTerm = currentId !== null && store.orderTerms().some((term) => term.termId === currentId);
  if (!hasCurrentTerm) return router.parseUrl('/' + paths.root + '/' + paths.children.orderTermsSelect);

  const amendment = store.orderTermAmendment();
  if (!amendment) return true;
  if (amendment.termId !== currentId || !amendment.inputComplete) {
    return router.parseUrl(
      '/' + paths.root + '/' + paths.children.orderTermsInput + '/' + encodeURIComponent(amendment.term.resultId),
    );
  }
  if (route.routeConfig?.path === paths.children.minorCreditorDetails) {
    const draft = store.creditorDraft();
    if (draft?.termId !== currentId || draft.branch !== 'add-new' || draft.existingSequenceNumber !== undefined) {
      return router.parseUrl('/' + paths.root + '/' + paths.children.orderTermCreditor);
    }
  }
  return true;
};
