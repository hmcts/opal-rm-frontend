import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { CasesCreateCasefileSubmissionService } from '../../services/cases-create-casefile-submission.service';

/** A complete draft alone is not evidence that submission succeeded. */
export const casesCreateCasefileSubmissionGuard: CanActivateFn = () =>
  (inject(CasesCreateCasefileStore).submissionSucceeded() &&
    inject(CasesCreateCasefileSubmissionService).receipt() !== null) ||
  inject(Router).parseUrl('/cases/create-casefile/check-case-details');
