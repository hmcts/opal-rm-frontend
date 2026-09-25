import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';

/** Reuses the task-list completion check for direct review navigation. */
export const casesCreateCasefileCheckDetailsGuard: CanActivateFn = () =>
  inject(CasesCreateCasefileStore).checkCaseAvailable() || inject(Router).parseUrl('/cases/create-casefile/task-list');
