import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { CasesCreateCasefileSubmissionService } from '../../services/cases-create-casefile-submission.service';

/** Unlike the unsaved-change guard, pending submission cannot be overridden by a discard prompt. */
export const casesCreateCasefileSubmissionPendingGuard: CanDeactivateFn<unknown> = () =>
  !inject(CasesCreateCasefileSubmissionService).pending();
