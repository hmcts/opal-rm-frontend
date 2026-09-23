import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CasesCreateCasefileCompletionService } from '../../services/cases-create-casefile-completion.service';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../constants/cases-create-casefile-routing-paths.constant';

export const casesCreateCasefileSubmissionConfirmationGuard: CanActivateFn = () => {
  const result = inject(CasesCreateCasefileCompletionService).result();
  const router = inject(Router);
  return (
    result !== null ||
    router.createUrlTree([
      '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.caseType,
    ])
  );
};
