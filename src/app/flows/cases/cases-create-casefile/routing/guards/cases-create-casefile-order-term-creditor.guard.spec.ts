import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { patchState, WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ICasesCreateCasefileState } from '../../interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { casesCreateCasefileOrderTermCreditorGuard } from './cases-create-casefile-order-term-creditor.guard';

describe('casesCreateCasefileOrderTermCreditorGuard', () => {
  const route = new ActivatedRouteSnapshot();
  const state = {} as RouterStateSnapshot;
  const accepted = {
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

  it.each([null, 999])('redirects when current order term ID is %s', (currentOrderTermId) => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [accepted],
      currentOrderTermId,
    });

    const result = TestBed.runInInjectionContext(() => casesCreateCasefileOrderTermCreditorGuard(route, state));

    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/cases/create-casefile/order-terms/select');
  });

  it('allows entry when the current order term exists', () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [accepted],
      currentOrderTermId: 1,
    });

    expect(TestBed.runInInjectionContext(() => casesCreateCasefileOrderTermCreditorGuard(route, state))).toBe(true);
  });

  it('matches the current term by term ID when results are identical', () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [accepted, { ...accepted, termId: 2 }],
      currentOrderTermId: 2,
    });

    expect(TestBed.runInInjectionContext(() => casesCreateCasefileOrderTermCreditorGuard(route, state))).toBe(true);
  });

  it('requires completed amendment input before creditor selection', () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [accepted],
      currentOrderTermId: 1,
      orderTermAmendment: { termId: 1, term: accepted, inputComplete: false, ready: false },
    });

    const result = TestBed.runInInjectionContext(() => casesCreateCasefileOrderTermCreditorGuard(route, state));
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/cases/create-casefile/order-terms/add/MAT');

    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTermAmendment: { termId: 1, term: accepted, inputComplete: true, ready: false },
    });
    expect(TestBed.runInInjectionContext(() => casesCreateCasefileOrderTermCreditorGuard(route, state))).toBe(true);
  });

  it('allows amendment details only for a matching add-new draft', () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    const detailsRoute = new ActivatedRouteSnapshot();
    Object.defineProperty(detailsRoute, 'routeConfig', {
      value: { path: 'order-terms/creditor/minor-creditor-details' },
    });
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [accepted],
      currentOrderTermId: 1,
      orderTermAmendment: { termId: 1, term: accepted, inputComplete: true, ready: false },
      creditorDraft: null,
    });

    const result = TestBed.runInInjectionContext(() => casesCreateCasefileOrderTermCreditorGuard(detailsRoute, state));
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/cases/create-casefile/order-terms/creditor');

    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      creditorDraft: { termId: 1, branch: 'add-new' },
    });
    expect(TestBed.runInInjectionContext(() => casesCreateCasefileOrderTermCreditorGuard(detailsRoute, state))).toBe(
      true,
    );
  });
});
