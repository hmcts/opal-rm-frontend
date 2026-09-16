import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../constants/cases-create-casefile-routing-paths.constant';

export const casesCreateCasefileOrderTermSelectionGuard: CanActivateFn = (route) => {
  const selected = inject(CasesCreateCasefileStore).pendingOrderTermResultId();
  const paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
  return selected !== null && selected === route.paramMap.get('resultId')
    ? true
    : inject(Router).parseUrl('/' + paths.root + '/' + paths.children.orderTermsSelect);
};
