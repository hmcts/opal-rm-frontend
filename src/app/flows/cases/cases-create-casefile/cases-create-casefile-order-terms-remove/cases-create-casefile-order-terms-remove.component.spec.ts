import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { getState, patchState, type WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileOrderTermsRemoveComponent } from './cases-create-casefile-order-terms-remove.component';

describe('CasesCreateCasefileOrderTermsRemoveComponent', () => {
  const router = { navigateByUrl: vi.fn().mockResolvedValue(true) };
  let store: InstanceType<typeof CasesCreateCasefileStore>;

  beforeEach(() => {
    router.navigateByUrl.mockClear();
    TestBed.configureTestingModule({
      imports: [CasesCreateCasefileOrderTermsRemoveComponent],
      providers: [{ provide: Router, useValue: router }, CasesCreateCasefileStore],
    });
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
      ],
    });
  });

  it('renders the removal placeholder and returns to Summary without changing journey state', () => {
    const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermsRemoveComponent);
    const before = structuredClone(getState(store));
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.govuk-grid-column-two-thirds')).not.toBeNull();
    expect(element.querySelector('.govuk-caption-l')?.textContent).toBe('Order terms');
    expect(element.querySelector('h1')?.textContent).toBe('Remove order term');

    element.querySelector<HTMLButtonElement>('#create_casefile_order_terms_remove_return')?.click();

    const paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
    expect(router.navigateByUrl).toHaveBeenCalledWith('/' + paths.root + '/' + paths.children.orderTermsSummary);
    expect(getState(store)).toEqual(before);
  });
});
