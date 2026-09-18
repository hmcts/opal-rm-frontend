import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../constants/cases-create-casefile-routing-paths.constant';

export const casesCreateCasefileOrderTermCreditorGuard: CanActivateFn = () => {
  const store = inject(CasesCreateCasefileStore);
  const paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
  return store.orderTerms().length > 0
    ? true
    : inject(Router).parseUrl('/' + paths.root + '/' + paths.children.orderTermsSelect);
};
