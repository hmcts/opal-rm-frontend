import { describe, expect, it } from 'vitest';
import { createCasesCreateCasefileReviewState } from '../mocks/cases-create-casefile-review-state.mock';
import { isCasesCreateCasefileSubmissionEligible } from './cases-create-casefile-submission-eligible';

describe('isCasesCreateCasefileSubmissionEligible', () => {
  it('accepts completed state with accepted changes', () => {
    const state = createCasesCreateCasefileReviewState();
    expect(state.stateChanges).toBe(true);
    expect(isCasesCreateCasefileSubmissionEligible(state)).toBe(true);
  });
  it.each([
    'respondent',
    'applicant',
    'orderDetails',
    'orderTerms',
    'interestAndIndexation',
    'managingPayments',
  ] as const)('rejects required %s', (task) => {
    const state = createCasesCreateCasefileReviewState();
    state.taskStatuses[task] = 'Required';
    expect(isCasesCreateCasefileSubmissionEligible(state)).toBe(false);
  });
  it.each([
    'caseTypeSelection',
    'respondentDetails',
    'applicantDetails',
    'orderDetails',
    'interestAndIndexation',
    'paymentArrangement',
  ] as const)('rejects absent %s', (field) => {
    const state = createCasesCreateCasefileReviewState();
    state[field] = null;
    expect(isCasesCreateCasefileSubmissionEligible(state)).toBe(false);
  });
  it('rejects missing terms, unresolved minor creditors and mismatched applicant selection', () => {
    const state = createCasesCreateCasefileReviewState();
    state.orderTerms = [];
    expect(isCasesCreateCasefileSubmissionEligible(state)).toBe(false);
    state.orderTerms = createCasesCreateCasefileReviewState().orderTerms;
    state.orderTerms[0].creditor = { type: 'minor', sequenceNumber: 99 };
    expect(isCasesCreateCasefileSubmissionEligible(state)).toBe(false);
    state.orderTerms[0].creditor = { type: 'applicant' };
    state.caseTypeSelection = { caseType: 'REMO In', applicantType: 'Organisation' };
    expect(isCasesCreateCasefileSubmissionEligible(state)).toBe(false);
  });
  it.each([
    'unsavedChanges',
    'pendingOrderTermResultId',
    'orderTermDraft',
    'orderTermAmendment',
    'orderTermRemoval',
    'creditorDraft',
    'minorCreditorRemoval',
  ] as const)('rejects unfinished %s', (field) => {
    const state = createCasesCreateCasefileReviewState();
    const term = state.orderTerms[0];
    const creditorDraft = { termId: 1, branch: 'add-new' as const };
    const contexts = {
      unsavedChanges: true,
      pendingOrderTermResultId: 'TEST01',
      orderTermDraft: {
        resultId: 'TEST01',
        fieldTypes: { amount: 'money' as const },
        values: { amount: '100' },
        dirty: true,
        presentation: term.presentation,
      },
      orderTermAmendment: { termId: 1, term, inputComplete: true, ready: true },
      orderTermRemoval: { index: 0, termId: 1, expectedTerm: term, presentationSignature: 'TEST01' },
      creditorDraft,
      minorCreditorRemoval: {
        termId: 1,
        expectedTerm: term,
        expectedDraft: creditorDraft,
        expectedAmendment: null,
        expectedCreditor: null,
      },
    };
    Object.assign(state, { [field]: contexts[field] });
    expect(isCasesCreateCasefileSubmissionEligible(state)).toBe(false);
  });
});
