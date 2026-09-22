import { describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_STATE } from '../constants/cases-create-casefile-state.constant';
import { createCasesCreateCasefileReviewState } from '../mocks/cases-create-casefile-review-state.mock';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS } from '../cases-create-casefile-applicant-organisation/mocks/cases-create-casefile-applicant-organisation.mock';
import { MINOR_CREDITOR_DETAILS_MOCK } from '../cases-create-casefile-minor-creditor-details/mocks/cases-create-casefile-minor-creditor.mock';
import { reviewEligibility } from './cases-create-casefile-review-eligibility';

describe('reviewEligibility', () => {
  it('accepts completed individual state including accepted current term and state changes', () => {
    expect(reviewEligibility(createCasesCreateCasefileReviewState(), true)).toEqual([]);
  });
  it('accepts an organisation only for its applicable branch', () => {
    const state = createCasesCreateCasefileReviewState();
    state.caseTypeSelection = { caseType: 'REMO In', applicantType: 'Organisation' };
    state.applicantDetails = structuredClone(CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedUk);
    expect(reviewEligibility(state, true)).toEqual([]);
    state.caseTypeSelection = { caseType: 'REMO Out' };
    expect(reviewEligibility(state, true)).toContain('applicant');
  });
  it('does not trust provided statuses without required accepted values', () => {
    const state = structuredClone(CASES_CREATE_CASEFILE_STATE);
    state.taskStatuses = createCasesCreateCasefileReviewState().taskStatuses;
    expect(reviewEligibility(state, false)).toEqual([
      'caseType',
      'authority',
      'respondent',
      'applicant',
      'orderDetails',
      'orderTerms',
      'interestAndIndexation',
      'managingPayments',
    ]);
  });
  it.each([
    'respondent',
    'applicant',
    'orderDetails',
    'orderTerms',
    'interestAndIndexation',
    'managingPayments',
  ] as const)('requires provided %s status', (task) => {
    const state = createCasesCreateCasefileReviewState();
    state.taskStatuses[task] = 'Required';
    expect(reviewEligibility(state, true)).toContain(task);
  });
  it.each([
    'respondentDetails',
    'applicantDetails',
    'orderDetails',
    'interestAndIndexation',
    'paymentArrangement',
  ] as const)('rejects absent %s', (field) => {
    const state = createCasesCreateCasefileReviewState();
    state[field] = null;
    expect(reviewEligibility(state, true).length).toBeGreaterThan(0);
  });
  it('requires names and an accepted address, application and real arrears date', () => {
    const state = createCasesCreateCasefileReviewState();
    state.respondentDetails!.firstNames = ' ';
    state.applicantDetails!.contactDetails.address.countryId = 0;
    state.orderDetails!.dateArrearsLastUpdated = '2026-02-31';
    expect(reviewEligibility(state, true)).toEqual(['respondent', 'applicant', 'orderDetails', 'orderTerms']);
  });
  it('rejects missing and invalid creditor assignments and duplicate term identities', () => {
    const state = createCasesCreateCasefileReviewState();
    state.orderTerms[0].creditor = null;
    expect(reviewEligibility(state, true)).toContain('orderTerms');
    state.orderTerms[0].creditor = { type: 'major', majorCreditorId: 0, displayName: 'Test' };
    expect(reviewEligibility(state, true)).toContain('orderTerms');
    state.orderTerms[0].creditor = { type: 'major', majorCreditorId: 1, displayName: 'Test' };
    expect(reviewEligibility(state, true)).toEqual([]);
    state.orderTerms.push(structuredClone(state.orderTerms[0]));
    expect(reviewEligibility(state, true)).toContain('orderTerms');
  });
  it('requires unique known minor creditors and complete identities', () => {
    const state = createCasesCreateCasefileReviewState();
    state.orderTerms[0].creditor = { type: 'minor', sequenceNumber: 1 };
    expect(reviewEligibility(state, true)).toContain('orderTerms');
    state.minorCreditors = [
      { sequenceNumber: 1, displayName: 'Example creditor', details: structuredClone(MINOR_CREDITOR_DETAILS_MOCK) },
    ];
    expect(reviewEligibility(state, true)).toEqual([]);
    state.minorCreditors.push(structuredClone(state.minorCreditors[0]));
    expect(reviewEligibility(state, true)).toContain('orderTerms');
  });
  it('rejects a removed applicant still assigned as creditor', () => {
    const state = createCasesCreateCasefileReviewState();
    state.applicantDetails = null;
    expect(reviewEligibility(state, true)).toEqual(['applicant', 'orderTerms']);
  });
  it.each([
    'unsavedChanges',
    'orderTermDraft',
    'creditorDraft',
    'orderTermAmendment',
    'orderTermRemoval',
    'minorCreditorRemoval',
    'pendingOrderTermResultId',
  ] as const)('blocks the active %s context', (field) => {
    const state = createCasesCreateCasefileReviewState();
    Object.assign(state, { [field]: field === 'unsavedChanges' ? true : {} });
    expect(reviewEligibility(state, true)).toContain('editing');
  });
  it('is deterministic and does not mutate accepted state', () => {
    const state = createCasesCreateCasefileReviewState();
    const before = structuredClone(state);
    expect(reviewEligibility(state, false)).toEqual(['authority']);
    expect(reviewEligibility(state, false)).toEqual(['authority']);
    expect(state).toEqual(before);
  });
  it('does not require optional notes or central authority, or block completed removal feedback', () => {
    const state = createCasesCreateCasefileReviewState();
    state.orderTermRemovalOutcome = 'removed';
    state.orderTermRemovalReturnFocusId = 1;
    expect(state.commentsAndNotes).toBeNull();
    expect(state.centralAuthorityDetails).toBeNull();
    expect(reviewEligibility(state, true)).toEqual([]);
  });
  it('accepts both REMO Out individual branches', () => {
    const state = createCasesCreateCasefileReviewState();
    state.caseTypeSelection = { caseType: 'REMO Out' };
    expect(reviewEligibility(state, true)).toEqual([]);
    state.caseTypeSelection = { caseType: 'REMO Out (CMS)' };
    expect(reviewEligibility(state, true)).toEqual([]);
  });
  it('accepts six-digit UK accounts and an explicit no-bank applicant', () => {
    const state = createCasesCreateCasefileReviewState();
    state.applicantDetails!.bankDetails = {
      type: 'uk',
      nameOnAccount: 'Test',
      sortCode: '123456',
      accountNumber: '123456',
      paymentReference: 'TEST',
    };
    expect(reviewEligibility(state, true)).toEqual([]);
    state.applicantDetails!.bankDetails = { type: 'none' };
    expect(reviewEligibility(state, true)).toEqual([]);
  });
  it('accepts the non-UK minor-creditor fallback bank branch', () => {
    const state = createCasesCreateCasefileReviewState();
    state.orderTerms[0].creditor = { type: 'minor', sequenceNumber: 1 };
    const details = structuredClone(MINOR_CREDITOR_DETAILS_MOCK);
    details.bank = {
      type: 'non-uk',
      nameOnAccount: 'Test',
      paymentReference: 'TEST',
      bicSwiftCode: null,
      iban: null,
      bankName: 'Synthetic bank',
      branchSortCode: '123',
      accountNumber: '123456',
    };
    state.minorCreditors = [{ sequenceNumber: 1, displayName: 'Example creditor', details }];
    expect(reviewEligibility(state, true)).toEqual([]);
    details.bank.paymentReference = '';
    expect(reviewEligibility(state, true)).toContain('orderTerms');
  });
  it.each([
    ['money', 'not-a-number'],
    ['money', '1e5'],
    ['money', '1.234'],
    ['date', '2026-02-31'],
    ['integer', 1.5],
    ['checkbox', 'true'],
  ] as const)('rejects malformed accepted %s values', (kind, value) => {
    const state = createCasesCreateCasefileReviewState();
    state.orderTerms[0].presentation.fields[0].kind = kind;
    state.orderTerms[0].parameters['amount'] = value;
    expect(reviewEligibility(state, true)).toContain('orderTerms');
  });
});
