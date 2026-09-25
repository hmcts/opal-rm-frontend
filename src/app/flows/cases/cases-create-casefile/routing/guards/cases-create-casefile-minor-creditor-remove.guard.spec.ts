import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { patchState, type WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it } from 'vitest';
import { MINOR_CREDITOR_DETAILS_MOCK } from '../../cases-create-casefile-minor-creditor-details/mocks/cases-create-casefile-minor-creditor.mock';
import type { ICasesCreateCasefileState } from '../../interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { casesCreateCasefileMinorCreditorRemoveGuard } from './cases-create-casefile-minor-creditor-remove.guard';

describe('casesCreateCasefileMinorCreditorRemoveGuard', () => {
  const route = new ActivatedRouteSnapshot();
  const state = {} as RouterStateSnapshot;
  const term = {
    termId: 1,
    resultId: 'MAT',
    parameters: {},
    creditor: null,
    presentation: { title: 'Maintenance', fields: [] },
  };
  const draft = {
    termId: 1,
    branch: 'add-new' as const,
    details: MINOR_CREDITOR_DETAILS_MOCK,
    countryName: 'United Kingdom',
  };
  const patch = (statePatch: Partial<ICasesCreateCasefileState>) =>
    patchState(
      TestBed.inject(CasesCreateCasefileStore) as unknown as WritableStateSource<ICasesCreateCasefileState>,
      statePatch,
    );
  const run = () => TestBed.runInInjectionContext(() => casesCreateCasefileMinorCreditorRemoveGuard(route, state));
  const url = (result: ReturnType<typeof run>) => TestBed.inject(Router).serializeUrl(result as UrlTree);

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), CasesCreateCasefileStore] });
    patch({ orderTerms: [term], currentOrderTermId: 1, creditorDraft: draft });
  });

  it('captures a valid direct-entry selection', () => {
    expect(run()).toBe(true);
    expect(TestBed.inject(CasesCreateCasefileStore).minorCreditorRemoval()?.expectedDraft).toBe(draft);
  });

  it.each<{ change: Partial<ICasesCreateCasefileState>; target: string }>([
    { change: { currentOrderTermId: null }, target: '/cases/create-casefile/order-terms/select' },
    { change: { orderTerms: [] }, target: '/cases/create-casefile/order-terms/select' },
    {
      change: { creditorDraft: { termId: 1, branch: 'add-new' } },
      target: '/cases/create-casefile/order-terms/creditor',
    },
  ])('redirects invalid state $change', ({ change, target }) => {
    patch(change);
    expect(url(run())).toBe(target);
  });

  it('clears a stale captured selection and redirects without selecting replacement data', () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    const old = store.beginMinorCreditorRemoval();
    const replacement = { ...draft };
    patch({ creditorDraft: replacement });
    expect(url(run())).toBe('/cases/create-casefile/order-terms/creditor');
    expect(store.minorCreditorRemoval()).toBeNull();
    expect(old?.expectedDraft).not.toBe(replacement);
  });

  it('permits a staged add-new amendment', () => {
    patch({ orderTermAmendment: { termId: 1, term, inputComplete: true, ready: false } });
    expect(run()).toBe(true);
  });

  it('rejects an assigned amendment and a mismatched assigned sequence', () => {
    patch({
      orderTerms: [{ ...term, creditor: { type: 'minor', sequenceNumber: 4 } }],
      creditorDraft: { ...draft, existingSequenceNumber: 3 },
      orderTermAmendment: { termId: 1, term, inputComplete: true, ready: false },
    });
    expect(url(run())).toBe('/cases/create-casefile/order-terms/creditor');
  });
});
