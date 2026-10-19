import { CASES_CREATE_CASEFILE_STATE } from '../constants/cases-create-casefile-state.constant';
import { TestBed } from '@angular/core/testing';
import { getState, patchState, WritableStateSource } from '@ngrx/signals';
import { describe, expect, it } from 'vitest';
import { createCasesCreateCasefileReviewState } from '../mocks/cases-create-casefile-review-state.mock';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileStore } from './cases-create-casefile.store';

describe('Casefile submission handoff', () => {
  const receipt = { draft_casefile_id: 123, casefile_status: 'SUBMITTED' as const };

  it('clears the accepted draft and retains the real backend receipt', () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    patchState(
      store as unknown as WritableStateSource<ICasesCreateCasefileState>,
      createCasesCreateCasefileReviewState(),
    );
    store.completeSubmission(receipt);
    expect(getState(store)).toEqual({
      ...CASES_CREATE_CASEFILE_STATE,
      submissionSucceeded: true,
      submissionReceipt: receipt,
    });
    expect(store.checkCaseAvailable()).toBe(false);
  });

  it.each(['resetStore', 'resetForCaseTypeEdit'] as const)('clears the receipt on %s', (reset) => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    store.completeSubmission(receipt);
    store[reset]();
    expect(store.submissionSucceeded()).toBe(false);
    expect(store.submissionReceipt()).toBeNull();
  });

  it('clears the previous receipt when starting another case', () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    store.completeSubmission(receipt);
    store.setCaseTypeSelection({ caseType: 'REMO In', applicantType: 'Individual' });
    expect(store.submissionSucceeded()).toBe(false);
    expect(store.submissionReceipt()).toBeNull();
  });
});
