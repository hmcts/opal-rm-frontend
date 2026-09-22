import { getState, patchState, type WritableStateSource } from '@ngrx/signals';
import { CasesCreateCasefileStore } from './cases-create-casefile.store';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import type { ICasesCreateCasefileAcceptedOrderTerm } from '../interfaces/cases-create-casefile-accepted-order-term.interface';
import { MINOR_CREDITOR_DETAILS_MOCK } from '../cases-create-casefile-minor-creditor-details/mocks/cases-create-casefile-minor-creditor.mock';
const seed = (overrides: Partial<ICasesCreateCasefileState> = {}) => {
  const store = new CasesCreateCasefileStore();
  const term: ICasesCreateCasefileAcceptedOrderTerm = {
    termId: 1,
    resultId: 'MAT',
    parameters: { amount: '12.30' },
    creditor: null,
    presentation: { title: 'Maintenance', fields: [] },
  };
  patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
    orderTerms: [term],
    currentOrderTermId: 1,
    nextOrderTermId: 2,
    nextMinorCreditorSequence: 4,
    creditorDraft: {
      termId: 1,
      branch: 'add-new',
      details: structuredClone(MINOR_CREDITOR_DETAILS_MOCK),
      countryName: 'United Kingdom',
    },
    ...overrides,
  });
  return store;
};

it('removes a pending creditor without allocating an ID or changing its term', () => {
  const store = seed();
  const terms = store.orderTerms();
  const selection = store.beginMinorCreditorRemoval()!;
  expect(store.confirmMinorCreditorRemoval(selection)).toBe(true);
  expect(store.creditorDraft()).toBeNull();
  expect(store.orderTerms()).toBe(terms);
  expect(store.minorCreditors()).toEqual([]);
  expect(store.nextMinorCreditorSequence()).toBe(4);
  expect(store.minorCreditorRemovalOutcome()?.termId).toBe(1);
  expect(store.confirmMinorCreditorRemoval(selection)).toBe(false);
});

it('cannot clear or confirm a newer removal selection', () => {
  const store = seed();
  const oldSelection = store.beginMinorCreditorRemoval()!;
  store.savePendingMinorCreditorDetails(1, MINOR_CREDITOR_DETAILS_MOCK, 'United Kingdom');
  const newSelection = store.beginMinorCreditorRemoval()!;
  const before = getState(store);
  store.clearMinorCreditorRemoval(oldSelection);
  expect(store.confirmMinorCreditorRemoval(oldSelection)).toBe(false);
  expect(store.minorCreditorRemoval()).toBe(newSelection);
  expect(getState(store)).toEqual(before);
});

it('preserves a different accepted choice when removing a new replacement', () => {
  const store = seed();
  const term = { ...store.orderTerms()[0], creditor: { type: 'applicant' as const } };
  patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, { orderTerms: [term] });
  expect(store.confirmMinorCreditorRemoval(store.beginMinorCreditorRemoval()!)).toBe(true);
  expect(store.orderTerms()[0]).toBe(term);
  expect(store.orderTerms()[0].creditor).toEqual({ type: 'applicant' });
});

it.each([false, true])('detaches only the selected association; shared=%s', (shared) => {
  const store = seed();
  const details = structuredClone(MINOR_CREDITOR_DETAILS_MOCK);
  const selected = { ...store.orderTerms()[0], creditor: { type: 'minor' as const, sequenceNumber: 3 } };
  const other = { ...selected, termId: 2, creditor: shared ? selected.creditor : { type: 'applicant' as const } };
  patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
    orderTerms: [selected, other],
    minorCreditors: [{ sequenceNumber: 3, displayName: 'Example creditor', details }],
    creditorDraft: { ...store.creditorDraft()!, existingSequenceNumber: 3 },
  });
  expect(store.confirmMinorCreditorRemoval(store.beginMinorCreditorRemoval()!)).toBe(true);
  expect(store.orderTerms()[0]).toEqual({ ...selected, creditor: null });
  expect(store.orderTerms()[1]).toBe(other);
  expect(store.minorCreditors()).toHaveLength(shared ? 1 : 0);
  expect(store.nextMinorCreditorSequence()).toBe(4);
});

it('removes only staged creditor data, and wider cancellation preserves the accepted term', () => {
  const store = seed();
  const accepted = { ...store.orderTerms()[0], creditor: { type: 'applicant' as const } };
  const staged = { ...accepted, parameters: { amount: '45.00' } };
  patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
    orderTerms: [accepted],
    orderTermAmendment: { termId: 1, term: staged, inputComplete: true, ready: true },
  });
  expect(store.confirmMinorCreditorRemoval(store.beginMinorCreditorRemoval()!)).toBe(true);
  expect(store.orderTerms()[0]).toBe(accepted);
  expect(store.orderTermAmendment()).toEqual({
    termId: 1,
    term: { ...staged, creditor: null },
    inputComplete: true,
    ready: false,
  });
  expect(store.cancelOrderTermAmendment(1)).toBe(true);
  expect(store.orderTerms()[0]).toBe(accepted);
});

it.each([
  { creditorDraft: null },
  { orderTerms: [] },
  { currentOrderTermId: 2 },
  { creditorDraft: { termId: 1, branch: 'add-new' as const } },
])('rejects a stale screen without business or outcome mutation: %j', (change) => {
  const store = seed();
  const selection = store.beginMinorCreditorRemoval()!;
  patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, change);
  const before = getState(store);
  expect(store.confirmMinorCreditorRemoval(selection)).toBe(false);
  expect(getState(store)).toEqual(before);
});

it('consumes success exactly once and clears all transients on reset', () => {
  const store = seed();
  store.confirmMinorCreditorRemoval(store.beginMinorCreditorRemoval()!);
  expect(store.consumeMinorCreditorRemovalOutcome(2)).toBeNull();
  expect(store.consumeMinorCreditorRemovalOutcome(1)?.termId).toBe(1);
  expect(store.consumeMinorCreditorRemovalOutcome(1)).toBeNull();
  store.resetStore();
  expect(store.minorCreditorRemoval()).toBeNull();
  expect(store.minorCreditorRemovalOutcome()).toBeNull();
});

it('rejects replaced same-ID objects without mutating state', () => {
  const store = seed();
  const selection = store.beginMinorCreditorRemoval()!;
  patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
    orderTerms: [{ ...store.orderTerms()[0] }],
    creditorDraft: { ...store.creditorDraft()! },
  });
  const before = getState(store);
  expect(store.confirmMinorCreditorRemoval(selection)).toBe(false);
  expect(getState(store)).toEqual(before);
});

it('rejects a changed creditor record and assignment sequence without mutating state', () => {
  const store = seed();
  const selected = { ...store.orderTerms()[0], creditor: { type: 'minor' as const, sequenceNumber: 3 } };
  const creditor = {
    sequenceNumber: 3,
    displayName: 'Example creditor',
    details: structuredClone(MINOR_CREDITOR_DETAILS_MOCK),
  };
  patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
    orderTerms: [selected],
    minorCreditors: [creditor],
    creditorDraft: { ...store.creditorDraft()!, existingSequenceNumber: 3 },
  });
  const selection = store.beginMinorCreditorRemoval()!;
  patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
    minorCreditors: [{ ...creditor }],
    orderTerms: [{ ...selected, creditor: { type: 'minor', sequenceNumber: 4 } }],
  });
  const before = getState(store);
  expect(store.confirmMinorCreditorRemoval(selection)).toBe(false);
  expect(getState(store)).toEqual(before);
});

it('invalidates removal transients only after a successful context change', () => {
  const store = seed();
  const selection = store.beginMinorCreditorRemoval()!;
  const before = getState(store);

  expect(store.savePendingMinorCreditorDetails(2, MINOR_CREDITOR_DETAILS_MOCK, 'United Kingdom')).toBe(false);
  expect(getState(store)).toEqual(before);

  expect(store.savePendingMinorCreditorDetails(1, MINOR_CREDITOR_DETAILS_MOCK, 'United Kingdom')).toBe(true);
  expect(store.minorCreditorRemoval()).toBeNull();
  expect(store.minorCreditorRemovalOutcome()).toBeNull();
  expect(store.confirmMinorCreditorRemoval(selection)).toBe(false);
});

it('preserves another term removal transient and clears the matching one', () => {
  const store = seed();
  const selection = store.beginMinorCreditorRemoval()!;
  const other = { ...store.orderTerms()[0], termId: 2 };
  patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
    orderTerms: [...store.orderTerms(), other],
  });

  expect(store.removeAcceptedOrderTerm(2)).toBe(true);
  expect(store.minorCreditorRemoval()).toBe(selection);
  expect(store.removeAcceptedOrderTerm(1)).toBe(true);
  expect(store.minorCreditorRemoval()).toBeNull();
});
