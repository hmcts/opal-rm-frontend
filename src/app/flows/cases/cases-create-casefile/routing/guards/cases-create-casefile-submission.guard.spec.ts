import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { patchState, WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ICasesCreateCasefileState } from '../../interfaces/cases-create-casefile-state.interface';
import { createCasesCreateCasefileReviewState } from '../../mocks/cases-create-casefile-review-state.mock';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { casesCreateCasefileSubmissionGuard } from './cases-create-casefile-submission.guard';
import { casesCreateCasefileCheckDetailsGuard } from './cases-create-casefile-check-details.guard';

describe('Casefile submission route guards', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('denies confirmation without a receipt, including a completed but unsubmitted draft', () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    const taskList = TestBed.inject(Router).parseUrl('/cases/create-casefile/check-case-details');
    expect(TestBed.runInInjectionContext(() => casesCreateCasefileSubmissionGuard(route, state))).toEqual(taskList);
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    expect(store.checkCaseAvailable()).toBe(true);
    expect(TestBed.runInInjectionContext(() => casesCreateCasefileSubmissionGuard(route, state))).toEqual(taskList);
  });

  it('allows confirmation only after a successful submission', () => {
    TestBed.inject(CasesCreateCasefileStore).setSubmissionSucceeded(true);
    expect(TestBed.runInInjectionContext(() => casesCreateCasefileSubmissionGuard(route, state))).toBe(true);
  });

  it('retains draft completion requirements for review before submission', () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    expect(TestBed.runInInjectionContext(() => casesCreateCasefileCheckDetailsGuard(route, state))).toEqual(
      TestBed.inject(Router).parseUrl('/cases/create-casefile/task-list'),
    );
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    expect(TestBed.runInInjectionContext(() => casesCreateCasefileCheckDetailsGuard(route, state))).toBe(true);
  });
});
