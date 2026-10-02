import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { patchState, type WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ICasesCreateCasefileState } from '../../interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { casesCreateCasefileOrderTermsSelectGuard } from './cases-create-casefile-order-terms-select.guard';

const acceptedTerm = {
  termId: 1,
  resultId: 'MAT/ORDER',
  parameters: {},
  creditor: null,
  presentation: { title: 'Maintenance', fields: [] },
};

describe('Order terms selection entry guard', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([]), CasesCreateCasefileStore] }));

  it('allows selection when no amendment is pending', () => {
    const result = TestBed.runInInjectionContext(() =>
      casesCreateCasefileOrderTermsSelectGuard({} as never, {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('redirects a pending amendment to its encoded input route without changing journey state', () => {
    const store = TestBed.inject(CasesCreateCasefileStore);
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [acceptedTerm],
      pendingOrderTermResultId: acceptedTerm.resultId,
    });
    expect(store.beginOrderTermAmendment(acceptedTerm.termId)).toBe(true);
    const acceptedTerms = store.orderTerms();
    const amendment = store.orderTermAmendment();

    const result = TestBed.runInInjectionContext(() =>
      casesCreateCasefileOrderTermsSelectGuard({} as never, {} as RouterStateSnapshot),
    );

    expect(result).toEqual(TestBed.inject(Router).parseUrl('/cases/create-casefile/order-terms/add/MAT%2FORDER'));
    expect(store.orderTerms()).toBe(acceptedTerms);
    expect(store.orderTermAmendment()).toBe(amendment);
    expect(store.currentOrderTermId()).toBe(acceptedTerm.termId);
  });
});
