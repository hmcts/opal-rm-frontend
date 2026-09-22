import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { getState, patchState, type WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MINOR_CREDITOR_DETAILS_MOCK } from '../cases-create-casefile-minor-creditor-details/mocks/cases-create-casefile-minor-creditor.mock';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileMinorCreditorRemoveComponent } from './cases-create-casefile-minor-creditor-remove.component';

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
const patch = (store: InstanceType<typeof CasesCreateCasefileStore>, state: Partial<ICasesCreateCasefileState>) =>
  patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, state);

async function setupRemoval(state: Partial<ICasesCreateCasefileState> = {}) {
  await TestBed.configureTestingModule({
    imports: [CasesCreateCasefileMinorCreditorRemoveComponent],
    providers: [CasesCreateCasefileStore, provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  }).compileComponents();
  const store = TestBed.inject(CasesCreateCasefileStore);
  patch(store, { orderTerms: [term], currentOrderTermId: 1, creditorDraft: draft, ...state });
  store.beginMinorCreditorRemoval();
  const fixture = TestBed.createComponent(CasesCreateCasefileMinorCreditorRemoveComponent);
  return { fixture, component: fixture.componentInstance, store, router: TestBed.inject(Router) };
}

describe('CasesCreateCasefileMinorCreditorRemoveComponent', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders exact read-only details and native confirmation actions', async () => {
    const { fixture } = await setupRemoval();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent?.trim()).toBe(
      'Are you sure you want to remove this minor creditor?',
    );
    expect(element.querySelector('h1')?.getAttribute('tabindex')).toBe('-1');
    expect(element.querySelector('.govuk-caption-l')).toBeNull();
    expect(element.querySelector('.govuk-summary-card__title')?.textContent).toBe('Minor creditor details');
    expect(element.querySelector('#create_casefile_minor_creditor_remove_confirm')?.textContent?.trim()).toBe(
      'Yes - remove minor creditor',
    );
    expect(element.querySelector('#create_casefile_minor_creditor_remove_cancel')?.textContent?.trim()).toBe(
      'No - cancel',
    );
    expect(element.querySelector('#minorCreditorRemovalDetailsAddressValue')?.textContent).toContain('United Kingdom');
  });

  it('renders stored identity text without injecting markup', async () => {
    const details = structuredClone(MINOR_CREDITOR_DETAILS_MOCK);
    details.identity = { type: 'organisation', organisationName: '<img src=x onerror=alert(1)>Example' };
    const { fixture } = await setupRemoval({ creditorDraft: { ...draft, details } });

    fixture.detectChanges();

    const value = fixture.nativeElement.querySelector('#minorCreditorRemovalDetailsNameValue') as HTMLElement;
    expect(value.textContent?.trim()).toBe('<img src=x onerror=alert(1)>Example');
    expect(value.querySelector('img')).toBeNull();
  });

  it('confirms the local removal without issuing an HTTP request', async () => {
    const { component, router } = await setupRemoval();
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    await component.handleConfirm();

    TestBed.inject(HttpTestingController).expectNone(() => true);
    TestBed.inject(HttpTestingController).verify();
  });

  it.each([false, new Error('Synthetic navigation failure')])(
    'commits once and retries navigation after %s',
    async (result) => {
      const { component, store, router } = await setupRemoval();
      const confirm = vi.spyOn(store, 'confirmMinorCreditorRemoval');
      const navigate = vi.spyOn(router, 'navigateByUrl');
      if (result instanceof Error) navigate.mockRejectedValueOnce(result);
      else navigate.mockResolvedValueOnce(result);
      navigate.mockResolvedValueOnce(true);
      await component.handleConfirm();
      expect(store.creditorDraft()).toBeNull();
      expect(component.navigationFailed()).toBe(true);
      await component.retryNavigation();
      expect(confirm).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledTimes(2);
    },
  );

  it('cancels without changing business state', async () => {
    const { component, store, router } = await setupRemoval();
    const before = getState(store);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await component.handleCancel(new Event('click', { cancelable: true }));
    expect(getState(store)).toEqual({ ...before, minorCreditorRemoval: null });
    expect(router.navigateByUrl).toHaveBeenCalledWith(
      '/cases/create-casefile/order-terms/creditor/minor-creditor-summary',
      { state: { minorCreditorRemovalReturnFocus: true } },
    );
  });

  it.each([false, new Error('Synthetic cancellation failure')])(
    'retains the captured selection after failed cancellation: %s',
    async (result) => {
      const { component, store, router } = await setupRemoval();
      const selection = store.minorCreditorRemoval();
      const navigate = vi.spyOn(router, 'navigateByUrl');
      if (result instanceof Error) navigate.mockRejectedValue(result);
      else navigate.mockResolvedValue(result);

      await component.handleCancel(new Event('click', { cancelable: true }));

      expect(store.minorCreditorRemoval()).toBe(selection);
      expect(component.navigationFailed()).toBe(true);
      expect(component.retryAvailable()).toBe(true);
    },
  );

  it('does not clear a newer selection when earlier cancellation completes', async () => {
    const { component, store, router } = await setupRemoval();
    let finish!: (result: boolean) => void;
    vi.spyOn(router, 'navigateByUrl').mockImplementation(() => new Promise<boolean>((resolve) => (finish = resolve)));
    const cancellation = component.handleCancel(new Event('click', { cancelable: true }));
    const old = store.minorCreditorRemoval();
    const newer = store.beginMinorCreditorRemoval();

    finish(true);
    await cancellation;

    expect(newer).not.toBe(old);
    expect(store.minorCreditorRemoval()).toBe(newer);
  });

  it('guards all actions while confirmation navigation is pending', async () => {
    const { component, store, router } = await setupRemoval();
    let finish!: (result: boolean) => void;
    const navigate = vi
      .spyOn(router, 'navigateByUrl')
      .mockImplementation(() => new Promise<boolean>((resolve) => (finish = resolve)));
    const confirm = vi.spyOn(store, 'confirmMinorCreditorRemoval');
    const first = component.handleConfirm();
    await component.handleConfirm();
    await component.handleCancel(new Event('click', { cancelable: true }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledOnce();
    finish(false);
    await first;
    expect(component.committed()).toBe(true);
    expect(component.retryAvailable()).toBe(true);
  });

  it('hides stale details and destructive controls', async () => {
    const { fixture, store } = await setupRemoval();
    patch(store, { creditorDraft: { ...draft } });
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.govuk-summary-card')).toBeNull();
    expect(element.querySelector('#create_casefile_minor_creditor_remove_confirm')).toBeNull();
    expect(element.textContent).toContain('This minor creditor is no longer available to remove.');
    expect(element.querySelector('#create_casefile_minor_creditor_remove_recover')).not.toBeNull();
  });

  it.each([
    ['present term', false, false, '/cases/create-casefile/order-terms/creditor'],
    ['present term', false, new Error('Synthetic recovery failure'), '/cases/create-casefile/order-terms/creditor'],
    ['missing term', true, false, '/cases/create-casefile/order-terms/select'],
    ['missing term', true, new Error('Synthetic recovery failure'), '/cases/create-casefile/order-terms/select'],
  ] as const)('retries %s recovery after %s', async (_description, termMissing, result, target) => {
    const { component, store, router } = await setupRemoval();
    patch(store, termMissing ? { orderTerms: [] } : { creditorDraft: { ...draft } });
    const navigate = vi.spyOn(router, 'navigateByUrl');
    if (result instanceof Error) navigate.mockRejectedValueOnce(result);
    else navigate.mockResolvedValueOnce(result);
    navigate.mockResolvedValueOnce(true);

    await component.recover();
    expect(component.navigationFailed()).toBe(true);
    expect(component.retryAvailable()).toBe(true);
    await component.retryNavigation();

    expect(navigate).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenNthCalledWith(1, target);
    expect(navigate).toHaveBeenNthCalledWith(2, target);
  });

  it('does not retry a committed navigation after its outcome is replaced', async () => {
    const { component, store, router } = await setupRemoval();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(false);
    await component.handleConfirm();
    patch(store, { minorCreditorRemovalOutcome: null });
    await component.retryNavigation();
    expect(navigate).toHaveBeenCalledOnce();
    expect(component.retryAvailable()).toBe(false);
  });

  it('focuses the error heading after Confirm is removed by a failed navigation', async () => {
    const { component, fixture, router } = await setupRemoval();
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(false);
    fixture.detectChanges();

    await component.handleConfirm();
    fixture.detectChanges();
    await fixture.whenStable();

    const errorHeading = fixture.nativeElement.querySelector('#create_casefile_minor_creditor_remove_error_title');
    expect(fixture.nativeElement.querySelector('#create_casefile_minor_creditor_remove_confirm')).toBeNull();
    expect(document.activeElement).toBe(errorHeading);
  });
});
