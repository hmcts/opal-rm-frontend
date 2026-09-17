import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { casesCreateCasefileOrderTermCreditorGuard } from './cases-create-casefile-order-term-creditor.guard';

describe('casesCreateCasefileOrderTermCreditorGuard', () => {
  it('redirects when no order term has been accepted', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), CasesCreateCasefileStore] });
    const result = TestBed.runInInjectionContext(() =>
      casesCreateCasefileOrderTermCreditorGuard({} as never, {} as never),
    );

    expect((result as UrlTree).toString()).toBe('/cases/create-casefile/order-terms/select');
  });

  it('allows entry after an order term has been accepted', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), CasesCreateCasefileStore] });
    const store = TestBed.inject(CasesCreateCasefileStore);
    store.setPendingOrderTermResultId('MAT');
    store.prepareOrderTermDraft({ resultId: 'MAT', title: 'Maintenance', fields: [] });
    store.acceptOrderTerm({ resultId: 'MAT', parameters: {} });

    expect(
      TestBed.runInInjectionContext(() => casesCreateCasefileOrderTermCreditorGuard({} as never, {} as never)),
    ).toBe(true);
    expect(TestBed.inject(Router).url).toBe('/');
  });
});
