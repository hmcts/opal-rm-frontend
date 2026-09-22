import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CasesCreateCasefileSubmissionService } from '../../services/cases-create-casefile-submission.service';

export const casesCreateCasefileReceiptGuard: CanActivateFn = () =>
  inject(CasesCreateCasefileSubmissionService).receipt()
    ? true
    : inject(Router).parseUrl('/cases/create-casefile/case-type');
