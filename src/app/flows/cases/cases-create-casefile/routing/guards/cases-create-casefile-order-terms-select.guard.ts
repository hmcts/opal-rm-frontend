import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../constants/cases-create-casefile-routing-paths.constant';

export const casesCreateCasefileOrderTermsSelectGuard: CanActivateFn = () => {
  const amendment = inject(CasesCreateCasefileStore).orderTermAmendment();
  if (!amendment) return true;

  const paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
  return inject(Router).parseUrl(
    '/' + paths.root + '/' + paths.children.orderTermsInput + '/' + encodeURIComponent(amendment.term.resultId),
  );
};
