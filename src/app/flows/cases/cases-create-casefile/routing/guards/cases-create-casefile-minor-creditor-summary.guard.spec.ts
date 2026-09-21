import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { patchState, WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it } from 'vitest';
import { MINOR_CREDITOR_DETAILS_MOCK } from '../../cases-create-casefile-minor-creditor-details/mocks/cases-create-casefile-minor-creditor.mock';
import type { ICasesCreateCasefileState } from '../../interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../constants/cases-create-casefile-routing-paths.constant';
import { casesCreateCasefileMinorCreditorSummaryGuard } from './cases-create-casefile-minor-creditor-summary.guard';

describe('casesCreateCasefileMinorCreditorSummaryGuard', () => {
  const route = new ActivatedRouteSnapshot();
  const state = {} as RouterStateSnapshot;
  const acceptedTerm = {
    termId: 1,
    resultId: 'MAT',
    parameters: { amount: '12.30' },
    creditor: null,
    presentation: {
      title: 'Maintenance',
      fields: [{ name: 'amount', label: 'Amount', kind: 'money' as const, options: [] }],
    },
  };

  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([]), CasesCreateCasefileStore] }));

  const runGuard = () =>
    TestBed.runInInjectionContext(() => casesCreateCasefileMinorCreditorSummaryGuard(route, state));

  const seed = (currentOrderTermId: number | null, creditorDraft: ICasesCreateCasefileState['creditorDraft']): void => {
    patchState(TestBed.inject(CasesCreateCasefileStore) as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [acceptedTerm],
      currentOrderTermId,
      creditorDraft,
    });
  };

  it('allows a populated pending creditor matching the current term', () => {
    seed(1, {
      termId: 1,
      branch: 'add-new',
      details: MINOR_CREDITOR_DETAILS_MOCK,
      countryName: 'United Kingdom',
    });

    expect(runGuard()).toBe(true);
  });

  it.each<{
    currentOrderTermId: number | null;
    creditorDraft: ICasesCreateCasefileState['creditorDraft'];
    target: 'orderTermsSelect' | 'orderTermCreditor';
  }>([
    { currentOrderTermId: null, creditorDraft: null, target: 'orderTermsSelect' },
    { currentOrderTermId: 99, creditorDraft: null, target: 'orderTermsSelect' },
    { currentOrderTermId: 1, creditorDraft: null, target: 'orderTermCreditor' },
    {
      currentOrderTermId: 1,
      creditorDraft: { termId: 1, branch: 'add-new' as const },
      target: 'orderTermCreditor',
    },
    {
      currentOrderTermId: 1,
      creditorDraft: {
        termId: 2,
        branch: 'add-new' as const,
        details: MINOR_CREDITOR_DETAILS_MOCK,
        countryName: 'United Kingdom',
      },
      target: 'orderTermCreditor',
    },
    {
      currentOrderTermId: 1,
      creditorDraft: {
        termId: 1,
        branch: 'add-new' as const,
        details: MINOR_CREDITOR_DETAILS_MOCK,
      },
      target: 'orderTermCreditor',
    },
  ])(
    'redirects current term $currentOrderTermId with the supplied draft to $target',
    ({ currentOrderTermId, creditorDraft, target }) => {
      seed(currentOrderTermId, creditorDraft);

      const result = runGuard();
      const paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;

      expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
        '/' + paths.root + '/' + paths.children[target],
      );
    },
  );
});
