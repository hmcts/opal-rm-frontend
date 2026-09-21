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

  it.each(['0', '1'])('allows accepted order term array index %s without changing journey state', (index) => {
    const before = structuredClone(getState(store));

    expect(runGuard(index)).toBe(true);
    expect(getState(store)).toEqual(before);
  });

  it.each(['-1', '1.5', 'x', '', '99'])('redirects invalid order term array index %j to Summary', (index) => {
    expect(runGuard(index)).toEqual(TestBed.inject(Router).parseUrl('/cases/create-casefile/order-terms/summary'));
  });
});
