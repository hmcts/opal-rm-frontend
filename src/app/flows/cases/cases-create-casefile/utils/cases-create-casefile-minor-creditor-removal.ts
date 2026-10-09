import type { ICasesCreateCasefileMinorCreditorRemoval } from '../interfaces/cases-create-casefile-minor-creditor-removal.interface';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { associatedMinorCreditors } from './cases-create-casefile-associated-minor-creditors';

/** Captures the exact state objects that a removal screen is allowed to mutate. */
export function captureMinorCreditorRemoval(
  state: ICasesCreateCasefileState,
): ICasesCreateCasefileMinorCreditorRemoval | null {
  const term = state.orderTerms.find((item) => item.termId === state.currentOrderTermId);
  const draft = state.creditorDraft;
  const amendment = state.orderTermAmendment;
  if (
    !term ||
    draft?.termId !== term.termId ||
    draft.branch !== 'add-new' ||
    !draft.details ||
    !draft.countryName?.trim()
  )
    return null;
  if (
    amendment &&
    (amendment.termId !== term.termId || !amendment.inputComplete || draft.existingSequenceNumber !== undefined)
  )
    return null;

  const sequence = draft.existingSequenceNumber;
  const creditor =
    sequence === undefined ? null : (state.minorCreditors.find((item) => item.sequenceNumber === sequence) ?? null);
  if (
    sequence !== undefined &&
    (!creditor || term.creditor?.type !== 'minor' || term.creditor.sequenceNumber !== sequence)
  )
    return null;

  return {
    termId: term.termId,
    expectedTerm: term,
    expectedDraft: draft,
    expectedAmendment: amendment,
    expectedCreditor: creditor,
  };
}

/** Checks that no term, draft, amendment, or creditor object has changed since capture. */
export function isMinorCreditorRemovalCurrent(
  state: ICasesCreateCasefileState,
  expected: ICasesCreateCasefileMinorCreditorRemoval,
): boolean {
  const current = captureMinorCreditorRemoval(state);
  return (
    state.minorCreditorRemoval === expected &&
    current !== null &&
    current.termId === expected.termId &&
    current.expectedTerm === expected.expectedTerm &&
    current.expectedDraft === expected.expectedDraft &&
    current.expectedAmendment === expected.expectedAmendment &&
    current.expectedCreditor === expected.expectedCreditor
  );
}

/** Calculates the complete atomic removal update, or rejects a stale selection without an update. */
export function minorCreditorRemovalPatch(
  state: ICasesCreateCasefileState,
  expected: ICasesCreateCasefileMinorCreditorRemoval,
): Partial<ICasesCreateCasefileState> | null {
  if (!isMinorCreditorRemovalCurrent(state, expected)) return null;

  const amendment = expected.expectedAmendment;
  const detach = !amendment && expected.expectedDraft.existingSequenceNumber !== undefined;
  const orderTerms = detach
    ? state.orderTerms.map((term) => (term === expected.expectedTerm ? { ...term, creditor: null } : term))
    : state.orderTerms;
  const orderTermAmendment = amendment
    ? { ...amendment, term: { ...amendment.term, creditor: null }, ready: false }
    : null;

  return {
    orderTerms,
    minorCreditors: detach ? associatedMinorCreditors(orderTerms, state.minorCreditors) : state.minorCreditors,
    orderTermAmendment,
    creditorDraft: null,
    minorCreditorRemoval: null,
    minorCreditorRemovalOutcome: {
      termId: expected.termId,
      expectedTerm: orderTerms.find((term) => term.termId === expected.termId)!,
      expectedAmendment: orderTermAmendment,
    },
    stateChanges: true,
  };
}
