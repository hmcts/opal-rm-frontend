import { describe, expect, it } from 'vitest';
import { createCasesCreateCasefileReviewState } from '../mocks/cases-create-casefile-review-state.mock';
import { reviewCaseSections } from './cases-create-casefile-case-review';

describe('reviewCaseSections', () => {
  it('renders accepted case fields with resolved application and date-only formatting', () => {
    const snapshot = createCasesCreateCasefileReviewState();
    const sections = reviewCaseSections(
      snapshot,
      [],
      [
        {
          application_id: 901,
          application_code: 'TEST',
          application_title: 'Test application',
          application_group: 'Test',
          active: true,
        },
      ],
    );
    expect(sections.map((section) => section.id)).toEqual([
      'caseType',
      'orderDetails',
      'interestAndIndexation',
      'managingPayments',
    ]);
    expect(sections[1].rows).toEqual(
      expect.arrayContaining([
        { id: 'application', label: 'Application code', values: ['TEST Test application'] },
        { id: 'court', label: 'Court that made the order', values: ['Not provided'] },
        { id: 'dateArrearsLastUpdated', label: 'Date arrears last updated', values: ['15 September 2026'] },
      ]),
    );
  });
  it('does not fabricate missing application labels', () => {
    const rows = reviewCaseSections(createCasesCreateCasefileReviewState(), [], [])[1].rows;
    expect(rows.find((row) => row.id === 'application')?.values).toEqual(['']);
  });
  it('includes applicable central authority, notes and direct payments', () => {
    const snapshot = createCasesCreateCasefileReviewState();
    snapshot.caseTypeSelection = { caseType: 'REMO Out' };
    snapshot.centralAuthorityDetails = { remoReference: 'TEST', centralAuthorityReference: null, majorCreditor: null };
    snapshot.commentsAndNotes = { comment: null, note: '<img src=x>' };
    snapshot.paymentArrangement = 'direct';
    snapshot.interestAndIndexation = { interestApplies: true, indexationType: 'CPI' };
    const before = structuredClone(snapshot);
    const sections = reviewCaseSections(snapshot, [], []);
    expect(sections.find((section) => section.id === 'centralAuthority')?.rows[0].values).toEqual(['TEST']);
    expect(sections.find((section) => section.id === 'commentsAndNotes')?.rows[1].values).toEqual(['<img src=x>']);
    expect(sections.find((section) => section.id === 'managingPayments')?.rows[0].values).toEqual([
      'Direct payments to creditors',
    ]);
    expect(sections.find((section) => section.id === 'interestAndIndexation')?.rows.map((row) => row.values)).toEqual([
      ['Yes'],
      ['Consumer Price Index (CPI)'],
    ]);
    expect(sections[0].rows.some((row) => row.id === 'applicantType')).toBe(false);
    expect(snapshot).toEqual(before);
  });
  it('omits absent optional sections', () => {
    const snapshot = createCasesCreateCasefileReviewState();
    snapshot.centralAuthorityDetails = null;
    snapshot.orderDetails = null;
    snapshot.interestAndIndexation = null;
    snapshot.paymentArrangement = null;
    expect(reviewCaseSections(snapshot, [], []).map((section) => section.id)).toEqual(['caseType']);
  });
  it.each([
    ['RPI', 'Retail Price Index (RPI)'],
    ['OTHER', 'Other indexation'],
    ['NONE', 'No indexation'],
  ] as const)('presents %s indexation and a leap-day order date', (indexationType, label) => {
    const snapshot = createCasesCreateCasefileReviewState();
    snapshot.interestAndIndexation = { interestApplies: false, indexationType };
    snapshot.orderDetails!.dateOrderMade = '2024-02-29';
    const sections = reviewCaseSections(snapshot, [], []);
    expect(sections.find((section) => section.id === 'interestAndIndexation')?.rows.map((row) => row.values)).toEqual([
      ['No'],
      [label],
    ]);
    expect(
      sections.find((section) => section.id === 'orderDetails')?.rows.find((row) => row.id === 'dateOrderMade')?.values,
    ).toEqual(['29 February 2024']);
  });
  it('omits the case header when there is no accepted selection', () => {
    const snapshot = createCasesCreateCasefileReviewState();
    snapshot.caseTypeSelection = null;
    expect(reviewCaseSections(snapshot, [], []).some((section) => section.id === 'caseType')).toBe(false);
  });
});
