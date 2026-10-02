import { TestBed } from '@angular/core/testing';
import { getState, patchState, WritableStateSource } from '@ngrx/signals';
import { describe, expect, it } from 'vitest';
import { createCasesCreateCasefileReviewState } from '../mocks/cases-create-casefile-review-state.mock';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileStore } from './cases-create-casefile.store';

describe('Casefile submission handoff', () => {
  it('marks submission successful without taking over confirmation state handling', () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    store.setSubmissionSucceeded(true);
    expect(getState(store)).toEqual({ ...createCasesCreateCasefileReviewState(), submissionSucceeded: true });
    expect(store.checkCaseAvailable()).toBe(true);
  });

  it.each(['resetStore', 'resetForCaseTypeEdit'] as const)('clears the receipt on %s', (reset) => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    store.setSubmissionSucceeded(true);
    store[reset]();
    expect(store.submissionSucceeded()).toBe(false);
  });

  it('clears the previous receipt when starting another case', () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    store.setSubmissionSucceeded(true);
    store.setCaseTypeSelection({ caseType: 'REMO In', applicantType: 'Individual' });
    expect(store.submissionSucceeded()).toBe(false);
  });
});
