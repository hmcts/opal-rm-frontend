import { createCasesCreateCasefileReviewState } from '../../mocks/cases-create-casefile-review-state.mock';
import { TestBed } from '@angular/core/testing';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { casesCreateCasefileAmendmentEntryCanDeactivateGuard } from './cases-create-casefile-amendment-entry-can-deactivate.guard';

describe('amendment replacement entry departure', () => {
  afterEach(() => vi.restoreAllMocks());
  const current = {} as ActivatedRouteSnapshot;
  const state = { url: '/cases/create-casefile/task-list' } as RouterStateSnapshot;
  it.each([false, true])('uses established confirmation before replacing corrections: %s', (decision) => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(decision);
    TestBed.inject(CasesCreateCasefileStore).setUnsavedChanges(true);
    const result = TestBed.runInInjectionContext(() =>
      casesCreateCasefileAmendmentEntryCanDeactivateGuard({ canDeactivate: () => false }, current, state, {
        url: '/cases/create-casefile/task-list/17?source=history#rejected',
      } as RouterStateSnapshot),
    );
    expect(result).toBe(decision);
    expect(confirm).toHaveBeenCalledOnce();
  });
  it.each([
    '/cases/create-casefile/task-list/18;source=history',
    '/cases/create-casefile/task-list/%31%38',
    '/cases/create-casefile/task-list/18/',
  ])('protects an equivalent Angular entry URL %s', (url) => {
    TestBed.inject(CasesCreateCasefileStore).setUnsavedChanges(true);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const result = TestBed.runInInjectionContext(() =>
      casesCreateCasefileAmendmentEntryCanDeactivateGuard({}, current, state, { url } as RouterStateSnapshot),
    );
    expect(result).toBe(false);
  });
  it('allows fresh entry without prompting when the current journey is clean', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const result = TestBed.runInInjectionContext(() =>
      casesCreateCasefileAmendmentEntryCanDeactivateGuard({}, current, state, {
        url: '/cases/create-casefile/task-list/18',
      } as RouterStateSnapshot),
    );
    expect(result).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });
  it.each([
    'creditorDraft',
    'orderTermDraft',
    'orderTermAmendment',
    'orderTermRemoval',
    'minorCreditorRemoval',
  ] as const)('requires departure confirmation for unfinished %s even without accepted corrections', (field) => {
    const editable = createCasesCreateCasefileReviewState();
    editable.stateChanges = false;
    const term = editable.orderTerms[0];
    const creditorDraft = { termId: term.termId, branch: 'add-new' as const };
    const contexts = {
      creditorDraft,
      orderTermDraft: {
        resultId: term.resultId,
        fieldTypes: { amount: 'money' as const },
        values: { amount: '100' },
        dirty: true,
        presentation: term.presentation,
      },
      orderTermAmendment: { termId: term.termId, term, inputComplete: true, ready: false },
      orderTermRemoval: { index: 0, termId: term.termId, expectedTerm: term, presentationSignature: term.resultId },
      minorCreditorRemoval: {
        termId: term.termId,
        expectedTerm: term,
        expectedDraft: creditorDraft,
        expectedAmendment: null,
        expectedCreditor: null,
      },
    };
    Object.assign(editable, { [field]: contexts[field] });
    TestBed.inject(CasesCreateCasefileStore).hydratePersistedCasefile(editable);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const result = TestBed.runInInjectionContext(() =>
      casesCreateCasefileAmendmentEntryCanDeactivateGuard({}, current, state, {
        url: '/cases/create-casefile/task-list/18',
      } as RouterStateSnapshot),
    );
    expect(result).toBe(false);
    expect(confirm).toHaveBeenCalledOnce();
  });
  it.each(['/', '/cases/create-casefile/task-list', '/cases/create-casefile/check-case-details', '/outside'])(
    'permits normal navigation to %s',
    (url) => {
      const canDeactivate = vi.fn().mockReturnValue(false);
      expect(
        casesCreateCasefileAmendmentEntryCanDeactivateGuard({ canDeactivate }, current, state, {
          url,
        } as RouterStateSnapshot),
      ).toBe(true);
      expect(canDeactivate).not.toHaveBeenCalled();
    },
  );
});
