import { describe, expect, it } from 'vitest';
import { createCasesCreateCasefileReviewState } from '../mocks/cases-create-casefile-review-state.mock';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS } from '../cases-create-casefile-applicant-organisation/mocks/cases-create-casefile-applicant-organisation.mock';
import { acceptedOrderTermsComplete } from './cases-create-casefile-order-terms-complete';

describe('acceptedOrderTermsComplete', () => {
  it.each(['Organisation', 'Individual'] as const)(
    'requires organisation applicant creditors to match the active %s selection',
    (applicantType) => {
      const state = createCasesCreateCasefileReviewState();
      state.applicantDetails = CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedNone;
      state.caseTypeSelection = { caseType: 'REMO In', applicantType };
      expect(acceptedOrderTermsComplete(state)).toBe(applicantType === 'Organisation');
    },
  );
});
