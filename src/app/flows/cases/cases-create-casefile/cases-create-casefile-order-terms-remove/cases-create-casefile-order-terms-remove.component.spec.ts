import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { patchState, type WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
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

  const renderRemoval = () => {
    store.beginOrderTermRemoval(7);
    const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermsRemoveComponent);
    fixture.detectChanges();
    return fixture;
  };

  it.each(['handleConfirm', 'handleCancel'] as const)(
    'returns safely through %s when the selection is absent before component creation',
    async (action) => {
      const terms = structuredClone(store.orderTerms());
      const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermsRemoveComponent);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.govuk-summary-card')).toBeNull();
      await fixture.componentInstance[action]();

      expect(router.navigateByUrl).toHaveBeenCalledOnce();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/create-casefile/order-terms/summary');
      expect(store.orderTerms()).toEqual(terms);
      expect(store.orderTermRemovalOutcome()).toBeNull();
      fixture.destroy();
      expect(store.orderTermRemoval()).toBeNull();
    },
  );

  it('does not start another return when the draft resets during pending cancellation', async () => {
    let finish!: (value: boolean) => void;
    router.navigateByUrl.mockReturnValueOnce(new Promise<boolean>((resolve) => (finish = resolve)));
    const fixture = renderRemoval();
    const cancellation = fixture.componentInstance.handleCancel();

    store.resetStore();
    fixture.detectChanges();

    expect(router.navigateByUrl).toHaveBeenCalledOnce();
    expect(store.orderTerms()).toEqual([]);
    finish(false);
    await cancellation;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
    expect(store.orderTermRemoval()).toBeNull();
    expect(store.orderTermRemovalOutcome()).toBeNull();
  });

  it('renders the captured order term with confirmation actions', () => {
    const fixture = renderRemoval();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.govuk-grid-column-two-thirds')).not.toBeNull();
    expect(element.querySelector('.govuk-caption-l')?.textContent).toBe('Order terms');
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Are you sure you want to remove these order terms?');
    expect(element.querySelector('#create_casefile_order_terms_remove_confirm')?.textContent?.trim()).toBe(
      'Yes - remove order terms',
    );
    expect(element.querySelector('#create_casefile_order_terms_remove_cancel')?.textContent?.trim()).toBe(
      'No - cancel',
    );
    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Maintenance');
    expect(element.querySelector('#order-term-7-change')).toBeNull();
    expect(element.querySelector('#order-term-7-remove')).toBeNull();
  });

  it('confirms once and leaves a success outcome for summary when return navigation fails', async () => {
    router.navigateByUrl.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const fixture = renderRemoval();
    const removal = vi.spyOn(store, 'confirmOrderTermRemoval');

    await fixture.componentInstance.handleConfirm();
    fixture.detectChanges();
    expect(store.orderTerms()).toHaveLength(0);
    expect(store.orderTermRemovalOutcome()).toBe('removed');
    expect(fixture.nativeElement.querySelector('#create_casefile_order_terms_remove_confirm')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('h1')?.textContent.trim()).toBe(
      'Are you sure you want to remove these order terms?',
    );

    await fixture.componentInstance.handleConfirm();
    expect(removal).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
    expect(store.orderTermRemovalOutcome()).toBe('removed');
  });

  it('retains success and does not remove again when summary navigation rejects', async () => {
    router.navigateByUrl.mockRejectedValueOnce(new Error('Synthetic navigation failure'));
    const fixture = renderRemoval();
    const removal = vi.spyOn(store, 'confirmOrderTermRemoval');

    await fixture.componentInstance.handleConfirm();
    fixture.detectChanges();
    await fixture.componentInstance.handleCancel();

    expect(store.orderTermRemovalOutcome()).toBe('removed');
    expect(store.orderTerms()).toHaveLength(0);
    expect(removal).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
  });

  it('confirms and navigates once when Confirm is pressed again before return completes', async () => {
    let resolveNavigation!: (value: boolean) => void;
    router.navigateByUrl.mockReturnValueOnce(new Promise<boolean>((resolve) => (resolveNavigation = resolve)));
    const fixture = renderRemoval();
    const removal = vi.spyOn(store, 'confirmOrderTermRemoval');

    const first = fixture.componentInstance.handleConfirm();
    await fixture.componentInstance.handleConfirm();

    expect(removal).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
    expect(store.orderTerms()).toHaveLength(0);
    resolveNavigation(true);
    await first;
    expect(store.orderTermRemovalOutcome()).toBe('removed');
  });

  it.each(['false', 'rejection'])(
    'keeps a selected term available when cancellation navigation returns %s',
    async (failure) => {
      if (failure === 'false') router.navigateByUrl.mockResolvedValueOnce(false);
      else router.navigateByUrl.mockRejectedValueOnce(new Error('Synthetic navigation failure'));
      const fixture = renderRemoval();
      const selection = store.orderTermRemoval();

      await fixture.componentInstance.handleCancel();
      fixture.detectChanges();

      expect(store.orderTermRemoval()).toBe(selection);
      expect(store.orderTermRemovalReturnFocusId()).toBeNull();
      expect(store.orderTermRemovalOutcome()).toBeNull();
      expect(store.orderTerms()).toHaveLength(1);
      expect(fixture.nativeElement.querySelector('#create_casefile_order_terms_remove_confirm')).not.toBeNull();
    },
  );

  it('cancels without mutation and sets a focus target before navigation', async () => {
    let resolveNavigation!: (value: boolean) => void;
    router.navigateByUrl.mockReturnValueOnce(new Promise<boolean>((resolve) => (resolveNavigation = resolve)));
    const fixture = renderRemoval();
    const selection = store.orderTermRemoval();

    const cancellation = fixture.componentInstance.handleCancel();
    expect(store.orderTermRemovalReturnFocusId()).toBe(7);
    resolveNavigation(true);
    await cancellation;

    expect(store.orderTermRemoval()).toBeNull();
    expect(selection).not.toBeNull();
    expect(store.orderTermRemovalOutcome()).toBeNull();
    expect(store.orderTerms()).toHaveLength(1);
  });

  it('keeps the captured card and confirmation controls while redirecting a stale selection', async () => {
    const fixture = renderRemoval();
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [{ ...store.orderTerms()[0], presentation: { title: 'Changed Maintenance', fields: [] } }],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#create_casefile_order_terms_remove_confirm')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('h1')?.textContent.trim()).toBe(
      'Are you sure you want to remove these order terms?',
    );
    expect(fixture.nativeElement.querySelector('h2')?.textContent.trim()).toBe('Maintenance');
    expect(fixture.nativeElement.textContent).not.toContain('Changed Maintenance');
    expect(store.orderTermRemovalOutcome()).toBe('unavailable');
    expect(store.orderTerms()[0].presentation.title).toBe('Changed Maintenance');
  });

  it('rejects a stale confirmation click before the render effect runs', async () => {
    const fixture = renderRemoval();
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [{ ...store.orderTerms()[0], parameters: { amount: '99.00' } }],
    });

    await fixture.componentInstance.handleConfirm();

    expect(store.orderTermRemovalOutcome()).toBe('unavailable');
    expect(store.orderTerms()).toHaveLength(1);
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
  });

  it('rejects a stale cancellation click before the render effect runs', async () => {
    const fixture = renderRemoval();
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [{ ...store.orderTerms()[0], parameters: { amount: '99.00' } }],
    });

    await fixture.componentInstance.handleCancel();

    expect(store.orderTermRemovalOutcome()).toBe('unavailable');
    expect(store.orderTermRemovalReturnFocusId()).toBeNull();
    expect(store.orderTerms()).toHaveLength(1);
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
  });

  it('does not start a second cancellation navigation while the first is pending', async () => {
    let resolveNavigation!: (value: boolean) => void;
    router.navigateByUrl.mockReturnValueOnce(new Promise<boolean>((resolve) => (resolveNavigation = resolve)));
    const fixture = renderRemoval();
    const first = fixture.componentInstance.handleCancel();

    await fixture.componentInstance.handleCancel();

    expect(router.navigateByUrl).toHaveBeenCalledOnce();
    resolveNavigation(true);
    await first;
  });

  it('does not return over a newer removal selection', async () => {
    const fixture = renderRemoval();
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [store.orderTerms()[0], { ...store.orderTerms()[0], termId: 12 }],
    });
    const newer = store.beginOrderTermRemoval(12);

    await fixture.componentInstance.handleConfirm();

    expect(store.orderTermRemoval()).toBe(newer);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it.each(['false', 'rejection'])(
    'tries return once after reset, then lets Yes retry when navigation returns %s',
    async (failure) => {
      const fixture = renderRemoval();
      if (failure === 'false') router.navigateByUrl.mockResolvedValueOnce(false);
      else router.navigateByUrl.mockRejectedValueOnce(new Error('Synthetic navigation failure'));
      store.resetStore();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(router.navigateByUrl).toHaveBeenCalledOnce();
      expect(fixture.nativeElement.querySelector('#create_casefile_order_terms_remove_confirm')).not.toBeNull();
      await fixture.componentInstance.handleConfirm();

      expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
      expect(store.orderTerms()).toHaveLength(0);
      expect(store.orderTermRemoval()).toBeNull();
      expect(store.orderTermRemovalOutcome()).toBeNull();
    },
  );

  it('preserves a newer selection after an old cancellation navigation fails late', async () => {
    let resolveNavigation!: (value: boolean) => void;
    router.navigateByUrl.mockReturnValueOnce(new Promise<boolean>((resolve) => (resolveNavigation = resolve)));
    const fixture = renderRemoval();
    const cancellation = fixture.componentInstance.handleCancel();
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [store.orderTerms()[0], { ...store.orderTerms()[0], termId: 12 }],
    });
    const newer = store.beginOrderTermRemoval(12);

    resolveNavigation(false);
    await cancellation;

    expect(store.orderTermRemoval()).toBe(newer);
    expect(store.orderTermRemovalReturnFocusId()).toBeNull();
    expect(store.orderTermRemovalOutcome()).toBeNull();
  });

  it('does not retarget or invalidate a newer selection after its captured token is superseded', async () => {
    const fixture = renderRemoval();
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [...store.orderTerms(), { ...store.orderTerms()[0], termId: 12, parameters: { amount: '20.00' } }],
    });
    const newer = store.beginOrderTermRemoval(12);
    fixture.detectChanges();
    await fixture.componentInstance.handleConfirm();
    await fixture.componentInstance.handleCancel();
    fixture.destroy();

    expect(store.orderTermRemoval()).toBe(newer);
    expect(store.orderTermRemovalOutcome()).toBeNull();
    expect(store.orderTerms().map((term) => term.termId)).toEqual([7, 12]);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('removes the captured ID when an earlier term shifts its array index after display', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [{ ...store.orderTerms()[0], termId: 3 }, ...store.orderTerms()],
    });
    store.beginOrderTermRemoval(7);
    const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermsRemoveComponent);
    fixture.detectChanges();
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [store.orderTerms()[1]],
    });

    await fixture.componentInstance.handleConfirm();

    expect(store.orderTerms()).toHaveLength(0);
    expect(store.orderTermRemovalOutcome()).toBe('removed');
  });
});
