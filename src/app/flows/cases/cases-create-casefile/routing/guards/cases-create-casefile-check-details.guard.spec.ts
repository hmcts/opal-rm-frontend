import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';
import { patchState, type WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it } from 'vitest';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { createCasesCreateCasefileReviewState } from '../../mocks/cases-create-casefile-review-state.mock';
import type { ICasesCreateCasefileState } from '../../interfaces/cases-create-casefile-state.interface';
import { casesCreateCasefileCheckDetailsGuard } from './cases-create-casefile-check-details.guard';

describe('Check details and confirmation state guard', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));
  const runGuard = () =>
    TestBed.runInInjectionContext(() =>
      casesCreateCasefileCheckDetailsGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  it('allows complete casefile data', () => {
    patchState(
      TestBed.inject(CasesCreateCasefileStore) as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    expect(runGuard()).toBe(true);
  });

  it.each([
    'caseTypeSelection',
    'respondentDetails',
    'applicantDetails',
    'orderDetails',
    'interestAndIndexation',
    'paymentArrangement',
  ] as const)('redirects missing %s even when task statuses are Provided', (field) => {
    const state = createCasesCreateCasefileReviewState();
    state[field] = null;
    patchState(
      TestBed.inject(CasesCreateCasefileStore) as unknown as WritableStateSource<ICasesCreateCasefileState>,
      state,
    );
    expect(runGuard()).toEqual(TestBed.inject(Router).parseUrl('/cases/create-casefile/task-list'));
  });

  it('redirects missing accepted terms despite Provided statuses', () => {
    const state = createCasesCreateCasefileReviewState();
    state.orderTerms = [];
    patchState(
      TestBed.inject(CasesCreateCasefileStore) as unknown as WritableStateSource<ICasesCreateCasefileState>,
      state,
    );
    expect(runGuard()).toEqual(TestBed.inject(Router).parseUrl('/cases/create-casefile/task-list'));
  });

  it('redirects an incomplete required task', () => {
    const state = createCasesCreateCasefileReviewState();
    state.taskStatuses.respondent = 'Required';
    patchState(
      TestBed.inject(CasesCreateCasefileStore) as unknown as WritableStateSource<ICasesCreateCasefileState>,
      state,
    );
    expect(runGuard()).toEqual(TestBed.inject(Router).parseUrl('/cases/create-casefile/task-list'));
  });
});
