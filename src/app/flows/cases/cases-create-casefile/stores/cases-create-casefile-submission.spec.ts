import { CASES_CREATE_CASEFILE_STATE } from '../constants/cases-create-casefile-state.constant';
import { TestBed } from '@angular/core/testing';
import { getState, patchState, WritableStateSource } from '@ngrx/signals';
import { describe, expect, it } from 'vitest';
import { createCasesCreateCasefileReviewState } from '../mocks/cases-create-casefile-review-state.mock';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileStore } from './cases-create-casefile.store';

describe('Casefile submission handoff', () => {
  it('clears the accepted draft and retains only the submission marker', () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    store.completeSubmission();
    expect(getState(store)).toEqual({ ...CASES_CREATE_CASEFILE_STATE, submissionSucceeded: true });
    expect(store.checkCaseAvailable()).toBe(false);
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
