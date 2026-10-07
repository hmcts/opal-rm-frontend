import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { cancelOrderTermAmendmentAfterNavigation } from './cases-create-casefile-order-term-amendment-navigation';

describe('cancelOrderTermAmendmentAfterNavigation', () => {
  it('reports a retained amendment when navigation succeeds but cancellation is refused', async () => {
    TestBed.configureTestingModule({ providers: [CasesCreateCasefileStore] });
    const store = TestBed.inject(CasesCreateCasefileStore);
    store.setPendingOrderTermResultId('MAT');
    store.prepareOrderTermDraft({ resultId: 'MAT', title: 'Maintenance', fields: [] });
    expect(store.acceptOrderTerm({ resultId: 'MAT', parameters: {} })).toBe(true);
    expect(store.beginOrderTermAmendment(store.currentOrderTermId()!)).toBe(true);
    const amendment = store.orderTermAmendment()!;
    const router = { navigateByUrl: vi.fn().mockResolvedValue(true) };
    const cancel = vi.spyOn(store, 'cancelOrderTermAmendment').mockReturnValue(false);

    expect(await cancelOrderTermAmendmentAfterNavigation(router, store, '/summary', amendment)).toBe('retained');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/summary');
    expect(cancel).toHaveBeenCalledWith(amendment.termId);
    expect(store.orderTermAmendment()).toBe(amendment);
    expect(store.orderTerms()).toHaveLength(1);
  });
});
