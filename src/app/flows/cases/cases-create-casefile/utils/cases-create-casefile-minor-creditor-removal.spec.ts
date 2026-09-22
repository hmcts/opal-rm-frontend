import type { ICasesCreateCasefileAcceptedOrderTerm } from '../interfaces/cases-create-casefile-accepted-order-term.interface';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { CASES_CREATE_CASEFILE_STATE } from '../constants/cases-create-casefile-state.constant';
import { MINOR_CREDITOR_DETAILS_MOCK } from '../cases-create-casefile-minor-creditor-details/mocks/cases-create-casefile-minor-creditor.mock';
import {
  captureMinorCreditorRemoval,
  isMinorCreditorRemovalCurrent,
  minorCreditorRemovalPatch,
} from './cases-create-casefile-minor-creditor-removal';

const term = (
  creditor: ICasesCreateCasefileAcceptedOrderTerm['creditor'] = null,
): ICasesCreateCasefileAcceptedOrderTerm => ({
  termId: 1,
  resultId: 'MAT',
  parameters: { amount: '12.30' },
  creditor,
  presentation: { title: 'Maintenance', fields: [] },
});

const state = (overrides: Partial<ICasesCreateCasefileState> = {}): ICasesCreateCasefileState => ({
  ...CASES_CREATE_CASEFILE_STATE,
  taskStatuses: { ...CASES_CREATE_CASEFILE_STATE.taskStatuses },
  orderTerms: [term()],
  currentOrderTermId: 1,
  creditorDraft: {
    termId: 1,
    branch: 'add-new',
    details: structuredClone(MINOR_CREDITOR_DETAILS_MOCK),
    countryName: 'United Kingdom',
  },
  ...overrides,
});

describe('captureMinorCreditorRemoval', () => {
  it.each([
    ['missing term', { orderTerms: [] }],
    ['mismatched draft term', { creditorDraft: { termId: 2, branch: 'add-new' as const } }],
    ['missing details', { creditorDraft: { termId: 1, branch: 'add-new' as const, countryName: 'UK' } }],
    [
      'blank country',
      {
        creditorDraft: {
          termId: 1,
          branch: 'add-new' as const,
          details: MINOR_CREDITOR_DETAILS_MOCK,
          countryName: '  ',
        },
      },
    ],
  ])('rejects %s', (_label, override) => {
    expect(captureMinorCreditorRemoval(state(override))).toBeNull();
  });

  it('rejects an incomplete amendment', () => {
    const current = state();
    expect(
      captureMinorCreditorRemoval(
        state({
          orderTermAmendment: { termId: 1, term: current.orderTerms[0], inputComplete: false, ready: false },
        }),
      ),
    ).toBeNull();
  });

  it('rejects editing an assigned creditor within an amendment', () => {
    const current = state();
    expect(
      captureMinorCreditorRemoval(
        state({
          creditorDraft: { ...current.creditorDraft!, existingSequenceNumber: 3 },
          orderTermAmendment: { termId: 1, term: current.orderTerms[0], inputComplete: true, ready: false },
        }),
      ),
    ).toBeNull();
  });

  it('rejects a missing referenced creditor and a mismatched assignment', () => {
    const current = state();
    const draft = { ...current.creditorDraft!, existingSequenceNumber: 3 };
    expect(captureMinorCreditorRemoval(state({ creditorDraft: draft }))).toBeNull();
    expect(
      captureMinorCreditorRemoval(
        state({
          orderTerms: [term({ type: 'minor', sequenceNumber: 4 })],
          creditorDraft: draft,
          minorCreditors: [{ sequenceNumber: 3, displayName: 'Example', details: MINOR_CREDITOR_DETAILS_MOCK }],
        }),
      ),
    ).toBeNull();
  });
});

describe('minorCreditorRemovalPatch', () => {
  it('preserves the existing dirty warning while creating a post-removal outcome', () => {
    const current = state({ unsavedChanges: true });
    const selection = captureMinorCreditorRemoval(current)!;
    current.minorCreditorRemoval = selection;

    const update = minorCreditorRemovalPatch(current, selection)!;

    expect(update.unsavedChanges).toBeUndefined();
    expect(update.stateChanges).toBe(true);
    expect(update.minorCreditorRemovalOutcome).toEqual({
      termId: 1,
      expectedTerm: current.orderTerms[0],
      expectedAmendment: null,
    });
  });

  it('rejects a replaced term, draft, creditor record, or amendment reference', () => {
    const selectedTerm = term({ type: 'minor', sequenceNumber: 3 });
    const creditor = { sequenceNumber: 3, displayName: 'Example', details: MINOR_CREDITOR_DETAILS_MOCK };
    const base = state({
      orderTerms: [selectedTerm],
      minorCreditors: [creditor],
      creditorDraft: { ...state().creditorDraft!, existingSequenceNumber: 3 },
    });
    const selection = captureMinorCreditorRemoval(base)!;
    base.minorCreditorRemoval = selection;

    expect(isMinorCreditorRemovalCurrent({ ...base, orderTerms: [{ ...selectedTerm }] }, selection)).toBe(false);
    expect(isMinorCreditorRemovalCurrent({ ...base, creditorDraft: { ...base.creditorDraft! } }, selection)).toBe(
      false,
    );
    expect(isMinorCreditorRemovalCurrent({ ...base, minorCreditors: [{ ...creditor }] }, selection)).toBe(false);

    const amendment = { termId: 1, term: selectedTerm, inputComplete: true, ready: false };
    const amended = state({ orderTerms: [selectedTerm], orderTermAmendment: amendment });
    const amendedSelection = captureMinorCreditorRemoval(amended)!;
    amended.minorCreditorRemoval = amendedSelection;
    expect(isMinorCreditorRemovalCurrent({ ...amended, orderTermAmendment: { ...amendment } }, amendedSelection)).toBe(
      false,
    );
  });
});
