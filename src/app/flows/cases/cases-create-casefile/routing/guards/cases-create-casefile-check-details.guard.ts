import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getState } from '@ngrx/signals';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { acceptedOrderTermsComplete } from '../../utils/cases-create-casefile-order-terms-complete';

/** Requires populated, completed required sections before review or confirmation. */
export const casesCreateCasefileCheckDetailsGuard: CanActivateFn = () => {
  const store = inject(CasesCreateCasefileStore);
  const complete =
    store.caseTypeComplete() &&
    store.checkCaseAvailable() &&
    store.respondentDetails() !== null &&
    store.applicantDetails() !== null &&
    store.orderDetails() !== null &&
    store.interestAndIndexation() !== null &&
    store.paymentArrangement() !== null &&
    acceptedOrderTermsComplete(getState(store));
  return complete || inject(Router).parseUrl('/cases/create-casefile/task-list');
};
