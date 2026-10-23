import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getState } from '@ngrx/signals';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { isCasesCreateCasefileSubmissionEligible } from '../../utils/cases-create-casefile-submission-eligible';

/** Requires populated, completed required sections before review or confirmation. */
export const casesCreateCasefileCheckDetailsGuard: CanActivateFn = () => {
  const store = inject(CasesCreateCasefileStore);
  const complete = isCasesCreateCasefileSubmissionEligible(getState(store));
  return complete || inject(Router).parseUrl('/cases/create-casefile/task-list');
};
