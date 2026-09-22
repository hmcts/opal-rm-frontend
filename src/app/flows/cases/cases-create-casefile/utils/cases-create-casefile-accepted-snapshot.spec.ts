import { describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_STATE } from '../constants/cases-create-casefile-state.constant';
import { CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS } from '../cases-create-casefile-respondent-details/mocks/cases-create-casefile-respondent-details.mock';
import { createCasesCreateCasefileReviewState } from '../mocks/cases-create-casefile-review-state.mock';
import { acceptedCasefileSnapshot } from './cases-create-casefile-accepted-snapshot';

describe('acceptedCasefileSnapshot', () => {
  it('copies accepted data without outer draft bookkeeping', () => {
    const state = structuredClone(CASES_CREATE_CASEFILE_STATE);
    state.respondentDetails = structuredClone(CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.saved);
    const snapshot = acceptedCasefileSnapshot(state);
    expect(Object.keys(snapshot).sort()).toEqual(
      [
        'applicantDetails',
        'caseTypeSelection',
        'centralAuthorityDetails',
        'commentsAndNotes',
        'interestAndIndexation',
        'minorCreditors',
        'orderDetails',
        'orderTerms',
        'paymentArrangement',
        'respondentDetails',
      ].sort(),
    );
    state.respondentDetails.firstNames = 'Changed';
    expect(snapshot.respondentDetails?.firstNames).toBe('Test');
  });
  it('retains term identity and presentation in a detached nested snapshot', () => {
    const state = createCasesCreateCasefileReviewState();
    const snapshot = acceptedCasefileSnapshot(state);
    state.orderTerms[0].presentation.fields[0].label = 'Changed';
    state.orderTerms[0].parameters['amount'] = '200.00';
    expect(snapshot.orderTerms[0].termId).toBe(1);
    expect(snapshot.orderTerms[0].presentation.fields[0].label).toBe('Amount');
    expect(snapshot.orderTerms[0].parameters['amount']).toBe('100.00');
  });
});
