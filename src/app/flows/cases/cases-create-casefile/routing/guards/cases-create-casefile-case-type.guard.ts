import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { CasesDraftCasefileStore } from '../../../cases-draft/stores/cases-draft-casefile.store';

export const casesCreateCasefileCaseTypeGuard: CanActivateFn = () => {
  const store = inject(CasesCreateCasefileStore);
  if (store.submissionIntent() === 'amendment') {
    return inject(Router).parseUrl('/cases/create-casefile/task-list');
  }
  inject(CasesDraftCasefileStore).resetStore();
  return true;
};
