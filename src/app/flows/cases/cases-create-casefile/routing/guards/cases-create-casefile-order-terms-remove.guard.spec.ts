import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { getState, patchState, type WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ICasesCreateCasefileState } from '../../interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { casesCreateCasefileOrderTermsRemoveGuard } from './cases-create-casefile-order-terms-remove.guard';

describe('Order terms removal guard', () => {
  let store: InstanceType<typeof CasesCreateCasefileStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), CasesCreateCasefileStore] });
    store = TestBed.inject(CasesCreateCasefileStore);
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [
        {
          termId: 7,
          resultId: 'MAT',
          parameters: { amount: '10.00' },
          creditor: null,
          presentation: { title: 'Maintenance', fields: [] },
        },
        {
          termId: 12,
          resultId: 'MAT',
          parameters: { amount: '20.00' },
          creditor: null,
          presentation: { title: 'Maintenance', fields: [] },
        },
      ],
    });
  });

  const runGuard = (orderTermIndex: string) => {
    const route = new ActivatedRouteSnapshot();
    Object.defineProperty(route, 'paramMap', { value: convertToParamMap({ orderTermIndex }) });
    return TestBed.runInInjectionContext(() =>
      casesCreateCasefileOrderTermsRemoveGuard(route, {} as RouterStateSnapshot),
    );
  };

  it('allows only the captured index and live selection', () => {
    store.beginOrderTermRemoval(7);
    const before = structuredClone(getState(store));
    expect(runGuard('0')).toBe(true);
    expect(getState(store)).toEqual(before);
  });

  it('redirects a bare valid URL and marks the term unavailable', () => {
    expect(runGuard('0')).toEqual(TestBed.inject(Router).parseUrl('/cases/create-casefile/order-terms/summary'));
    expect(store.orderTermRemovalOutcome()).toBe('unavailable');
  });

  it('redirects a route with no index parameter', () => {
    const route = new ActivatedRouteSnapshot();
    Object.defineProperty(route, 'paramMap', { value: convertToParamMap({}) });

    const result = TestBed.runInInjectionContext(() =>
      casesCreateCasefileOrderTermsRemoveGuard(route, {} as RouterStateSnapshot),
    );

    expect(result).toEqual(TestBed.inject(Router).parseUrl('/cases/create-casefile/order-terms/summary'));
    expect(store.orderTermRemovalOutcome()).toBe('unavailable');
  });

  it('redirects an index that no longer identifies the captured term', () => {
    store.beginOrderTermRemoval(7);
    expect(runGuard('1')).toEqual(TestBed.inject(Router).parseUrl('/cases/create-casefile/order-terms/summary'));
    expect(store.orderTermRemovalOutcome()).toBe('unavailable');
  });

  it('does not replay a prior success when browser history revisits the removal URL', () => {
    const selection = store.beginOrderTermRemoval(7)!;
    expect(store.confirmOrderTermRemoval(selection)).toBe(true);
    expect(store.orderTermRemovalOutcome()).toBe('removed');

    expect(runGuard('0')).toEqual(TestBed.inject(Router).parseUrl('/cases/create-casefile/order-terms/summary'));
    expect(store.orderTermRemovalOutcome()).toBe('unavailable');
    expect(store.orderTerms().map((term) => term.termId)).toEqual([12]);
  });

  it.each(['01', '1.0', '1e0', ' 1', 'NaN', '9007199254740992'])(
    'rejects noncanonical index %s even with a selected term',
    (index) => {
      store.beginOrderTermRemoval(12);
      expect(runGuard(index)).toEqual(TestBed.inject(Router).parseUrl('/cases/create-casefile/order-terms/summary'));
      expect(store.orderTermRemovalOutcome()).toBe('unavailable');
    },
  );

  it.each(['-1', '1.5', 'x', '', '99'])('redirects invalid order term array index %j to Summary', (index) => {
    expect(runGuard(index)).toEqual(TestBed.inject(Router).parseUrl('/cases/create-casefile/order-terms/summary'));
  });
});
