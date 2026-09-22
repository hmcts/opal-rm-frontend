import { CasesCreateCasefileReviewNavigationService } from '../../services/cases-create-casefile-review-navigation.service';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getState } from '@ngrx/signals';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { CasesCreateCasefileAuthorityService } from '../../services/cases-create-casefile-authority.service';
import { CasesCreateCasefileSubmissionService } from '../../services/cases-create-casefile-submission.service';
import { reviewEligibility } from '../../utils/cases-create-casefile-review-eligibility';

export const casesCreateCasefileCheckDetailsGuard: CanActivateFn = () => {
  const router = inject(Router);
  const submission = inject(CasesCreateCasefileSubmissionService);
  if (submission.receipt()) return router.parseUrl('/cases/create-casefile/submission-confirmation');
  const accepted = getState(inject(CasesCreateCasefileStore));
  // canDeactivate has already confirmed discarding the current editor. Its destroy
  // hook clears this flag after activation; only accepted values are reviewed here.
  const returning =
    inject(CasesCreateCasefileReviewNavigationService).context() &&
    router.url.startsWith('/cases/create-casefile/') &&
    !router.url.includes('/check-case-details');
  const state = returning ? { ...accepted, unsavedChanges: false } : accepted;
  const issues = reviewEligibility(state, inject(CasesCreateCasefileAuthorityService).authorised());
  if (!issues.length) return true;
  inject(GlobalStore).setBannerError({
    error: true,
    title: 'Check your case details',
    message: issues.includes('authority')
      ? 'Review and submission are available only in the local mock configuration while RM permissions are being confirmed.'
      : 'Complete the required case details before checking the case.',
    operationId: null,
  });
  return router.parseUrl('/cases/create-casefile/task-list');
};
