import { MINOR_CREDITOR_DETAILS_MOCK } from '../cases-create-casefile-minor-creditor-details/mocks/cases-create-casefile-minor-creditor.mock';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { createCasesCreateCasefileReviewState } from './cases-create-casefile-review-state.mock';

export function createCasesCreateCasefileCancellationState(): ICasesCreateCasefileState {
  const state = createCasesCreateCasefileReviewState();
  const term = state.orderTerms[0];
  const creditor = {
    sequenceNumber: 7,
    displayName: 'Synthetic creditor',
    details: structuredClone(MINOR_CREDITOR_DETAILS_MOCK),
  };
  const draft = { termId: term.termId, branch: 'add-new' as const, details: creditor.details };
  const amendment = { termId: term.termId, term, inputComplete: true, ready: true };

  return structuredClone({
    ...state,
    centralAuthorityDetails: {
      remoReference: 'SYNTHETIC-REMO',
      centralAuthorityReference: 'SYNTHETIC-CA',
      majorCreditor: null,
    },
    commentsAndNotes: { comment: 'Synthetic comment', note: 'Synthetic note' },
    minorCreditors: [creditor],
    nextMinorCreditorSequence: 8,
    creditorDraft: draft,
    minorCreditorRemoval: {
      termId: term.termId,
      expectedTerm: term,
      expectedDraft: draft,
      expectedAmendment: amendment,
      expectedCreditor: creditor,
    },
    minorCreditorRemovalOutcome: {
      termId: term.termId,
      expectedTerm: term,
      expectedAmendment: amendment,
    },
    orderTermDraft: {
      resultId: term.resultId,
      fieldTypes: { amount: 'money' as const },
      values: { amount: '125.00' },
      dirty: true,
      presentation: term.presentation,
    },
    orderTermAmendment: amendment,
    orderTermRemoval: {
      index: 0,
      termId: term.termId,
      expectedTerm: term,
      presentationSignature: 'synthetic-signature',
    },
    orderTermRemovalOutcome: 'removed' as const,
    orderTermRemovalReturnFocusId: term.termId,
    pendingOrderTermResultId: term.resultId,
    nextOrderTermId: 12,
    unsavedChanges: true,
    stateChanges: true,
    taskStatuses: {
      ...state.taskStatuses,
      centralAuthority: 'Provided' as const,
      commentsAndNotes: 'Provided' as const,
    },
  });
}
