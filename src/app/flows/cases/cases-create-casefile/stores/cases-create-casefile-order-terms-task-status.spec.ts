import { TestBed } from '@angular/core/testing';
import { patchState, type WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import type { ICasesCreateCasefileOrderTermPage } from '../cases-create-casefile-order-terms-input/interfaces/cases-create-casefile-order-term-page.interface';
import { createCasesCreateCasefileReviewState } from '../mocks/cases-create-casefile-review-state.mock';
import { MINOR_CREDITOR_DETAILS_MOCK } from '../cases-create-casefile-minor-creditor-details/mocks/cases-create-casefile-minor-creditor.mock';
import { CasesCreateCasefileStore } from './cases-create-casefile.store';

describe('accepted order-term task status', () => {
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  let source: WritableStateSource<ICasesCreateCasefileState>;
  const page: ICasesCreateCasefileOrderTermPage = {
    resultId: 'TEST01',
    title: 'Synthetic maintenance',
    fields: [
      {
        name: 'amount',
        id: 'amount',
        label: 'Amount',
        kind: 'money',
        required: true,
        hint: '',
        min: null,
        max: null,
        past: false,
        options: [],
        lookup: null,
      },
    ],
  };
  const acceptTerm = (): number => {
    store.setPendingOrderTermResultId(page.resultId);
    store.prepareOrderTermDraft(page);
    expect(store.acceptOrderTerm({ resultId: page.resultId, parameters: { amount: '100.00' } })).toBe(true);
    return store.currentOrderTermId()!;
  };
  beforeEach(() => {
    store = TestBed.inject(CasesCreateCasefileStore);
    source = store as unknown as WritableStateSource<ICasesCreateCasefileState>;
    const state = createCasesCreateCasefileReviewState();
    state.orderTerms = [];
    state.taskStatuses.orderTerms = 'Required';
    state.currentOrderTermId = null;
    patchState(source, state);
  });

  it('unlocks review only after every accepted term has a valid creditor', () => {
    const first = acceptTerm();
    expect(store.taskStatuses().orderTerms).toBe('Required');
    expect(store.assignCurrentOrderTermCreditor(first, { type: 'applicant' })).toBe(true);
    expect(store.taskStatuses().orderTerms).toBe('Provided');
    expect(store.checkCaseAvailable()).toBe(true);
    expect(store.checkCaseAvailable()).toBe(true);
    const second = acceptTerm();
    expect(store.taskStatuses().orderTerms).toBe('Required');
    expect(store.checkCaseAvailable()).toBe(false);
    expect(
      store.assignCurrentOrderTermCreditor(second, {
        type: 'major',
        majorCreditorId: 901,
        displayName: 'Synthetic authority',
      }),
    ).toBe(true);
    expect(store.taskStatuses().orderTerms).toBe('Provided');
    expect(store.checkCaseAvailable()).toBe(true);
  });

  it('requires a valid accepted applicant when used as creditor and updates on applicant correction', () => {
    const applicant = store.applicantDetails()!;
    patchState(source, { applicantDetails: null });
    const termId = acceptTerm();
    store.assignCurrentOrderTermCreditor(termId, { type: 'applicant' });
    expect(store.taskStatuses().orderTerms).toBe('Required');
    store.setApplicantDetails(applicant);
    expect(store.taskStatuses().orderTerms).toBe('Provided');
  });

  it('updates immediately after accepting a new minor creditor and after detaching it', () => {
    const termId = acceptTerm();
    store.setPendingNewMinorCreditor(termId);
    store.savePendingMinorCreditorDetails(termId, MINOR_CREDITOR_DETAILS_MOCK, 'United Kingdom');
    expect(store.acceptPendingMinorCreditor(termId)).not.toBeNull();
    expect(store.taskStatuses().orderTerms).toBe('Provided');
    store.savePendingMinorCreditorDetails(termId, MINOR_CREDITOR_DETAILS_MOCK, 'United Kingdom');
    const removal = store.beginMinorCreditorRemoval();
    expect(removal).not.toBeNull();
    expect(store.confirmMinorCreditorRemoval(removal!)).toBe(true);
    expect(store.taskStatuses().orderTerms).toBe('Required');
    expect(store.orderTerms()[0].creditor).toBeNull();
  });

  it('updates only accepted amendment completion, retaining completion during a cancelled draft', () => {
    const termId = acceptTerm();
    store.assignCurrentOrderTermCreditor(termId, { type: 'applicant' });
    store.beginOrderTermAmendment(termId);
    expect(store.taskStatuses().orderTerms).toBe('Provided');
    store.cancelOrderTermAmendment(termId);
    expect(store.taskStatuses().orderTerms).toBe('Provided');
    store.beginOrderTermAmendment(termId);
    store.stageOrderTermAmendment({ resultId: page.resultId, parameters: { amount: '200.00' } }, page);
    store.stageAmendmentCreditor({ type: 'major', majorCreditorId: 901, displayName: 'Synthetic authority' });
    expect(store.completeOrderTermAmendment(store.orderTermAmendment()!, null)).toBe(true);
    expect(store.taskStatuses().orderTerms).toBe('Provided');
    expect(store.checkCaseAvailable()).toBe(true);
  });

  it('retains Provided after deleting one complete term and requires a replacement after deleting the last', () => {
    const first = acceptTerm();
    store.assignCurrentOrderTermCreditor(first, { type: 'applicant' });
    const second = acceptTerm();
    store.assignCurrentOrderTermCreditor(second, { type: 'applicant' });
    expect(store.confirmOrderTermRemoval(store.beginOrderTermRemoval(first)!)).toBe(true);
    expect(store.taskStatuses().orderTerms).toBe('Provided');
    expect(store.confirmOrderTermRemoval(store.beginOrderTermRemoval(second)!)).toBe(true);
    expect(store.taskStatuses().orderTerms).toBe('Required');
    expect(store.checkCaseAvailable()).toBe(false);
  });
  it('marks an accepted amendment complete when it supplies the missing creditor', () => {
    const termId = acceptTerm();
    store.beginOrderTermAmendment(termId);
    store.stageOrderTermAmendment({ resultId: page.resultId, parameters: { amount: '200.00' } }, page);
    store.stageAmendmentCreditor({ type: 'major', majorCreditorId: 901, displayName: 'Synthetic authority' });
    expect(store.taskStatuses().orderTerms).toBe('Required');
    expect(store.completeOrderTermAmendment(store.orderTermAmendment()!, null)).toBe(true);
    expect(store.taskStatuses().orderTerms).toBe('Provided');
  });
});
