import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';

/** A complete draft alone is not evidence that submission succeeded. */
export const casesCreateCasefileSubmissionGuard: CanActivateFn = () => {
  const store = inject(CasesCreateCasefileStore);
  return (
    (store.submissionSucceeded() && store.submissionReceipt() !== null) ||
    inject(Router).parseUrl('/cases/create-casefile/check-case-details')
  );
};
