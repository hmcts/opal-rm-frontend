import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { IOpalMaintenanceResultReferenceDataResponse } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-result-reference-data-response.interface';
import { OPAL_MAINTENANCE_RESULTS_MOCK } from '../../services/opal-maintenance-service/mocks/opal-maintenance-results.mock';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileOrderTermsLoadService } from './services/cases-create-casefile-order-terms-load.service';
import { CasesCreateCasefileOrderTermsSelectComponent } from './cases-create-casefile-order-terms-select.component';

async function setup(pending = false, savedId: string | null = null) {
  const response = new Subject<IOpalMaintenanceResultReferenceDataResponse>();
  const owner = new CasesCreateCasefileOrderTermsLoadService({
    getResults: () => (pending ? response : of(structuredClone(OPAL_MAINTENANCE_RESULTS_MOCK))),
  });
  owner.load();
  await TestBed.configureTestingModule({
    imports: [CasesCreateCasefileOrderTermsSelectComponent],
    providers: [
      provideRouter([]),
      CasesCreateCasefileStore,
      { provide: ActivatedRoute, useValue: { snapshot: { data: { orderTerms: owner } } } },
    ],
  }).compileComponents();
  const store = TestBed.inject(CasesCreateCasefileStore);
  store.setPendingOrderTermResultId(savedId);
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermsSelectComponent);
  return { fixture, component: fixture.componentInstance, owner, store, navigate, response };
}

describe('Order term selection parent boundary', () => {
  it('saves an ID without changing completion and requests the actual input URL', async () => {
    const { component, store, navigate } = await setup();
    const statuses = { ...store.taskStatuses() };
    component.handleUnsavedChanges(true);
    component.handleFormSubmit({
      formData: { create_casefile_order_terms_select_result_id: 'MOCK01' },
      nestedFlow: false,
    });
    expect(store.pendingOrderTermResultId()).toBe('MOCK01');
    expect(store.taskStatuses()).toEqual(statuses);
    expect(store.unsavedChanges()).toBe(false);
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/cases/create-casefile/order-terms/add/MOCK01'], {});
  });

  it.each([null, 'OTHER'])('rejects forged or missing ID %s at the parent boundary', async (id) => {
    const { component, store, navigate } = await setup();
    component.handleFormSubmit({ formData: { create_casefile_order_terms_select_result_id: id }, nestedFlow: false });
    expect(store.pendingOrderTermResultId()).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not submit while loading even if the submitted ID looks valid', async () => {
    const { component, store, navigate } = await setup(true);
    component.handleFormSubmit({
      formData: { create_casefile_order_terms_select_result_id: 'MOCK01' },
      nestedFlow: false,
    });
    expect(store.pendingOrderTermResultId()).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('retains the saved ID on failure', async () => {
    const { fixture, owner, store, response } = await setup(true, 'MOCK01');
    fixture.detectChanges();
    response.error(new Error('Synthetic failure'));
    await fixture.whenStable();
    expect(store.pendingOrderTermResultId()).toBe('MOCK01');
    owner.dispose();
  });

  it('clears a saved ID removed by a successful response', async () => {
    const { fixture, store } = await setup(false, 'OTHER');
    fixture.detectChanges();
    expect(store.pendingOrderTermResultId()).toBeNull();
  });

  it('retains a saved ID that remains in a successful response', async () => {
    const { fixture, store } = await setup(false, 'MOCK01');
    fixture.detectChanges();
    expect(store.pendingOrderTermResultId()).toBe('MOCK01');
  });

  it('leaves a changed choice intact until the navigation guard decides', async () => {
    const { component, owner, navigate, store } = await setup(false, 'MOCK01');
    const dispose = vi.spyOn(owner, 'dispose');
    component.handleUnsavedChanges(true);
    component.handleCancel();
    expect(navigate).toHaveBeenCalledWith(['/cases/create-casefile/order-terms/summary'], {});
    expect(store.pendingOrderTermResultId()).toBe('MOCK01');
    expect(store.unsavedChanges()).toBe(true);
    expect(dispose).not.toHaveBeenCalled();
  });

  it('disposes its load when the routed component is destroyed', async () => {
    const { fixture, owner, store } = await setup(true);
    const dispose = vi.spyOn(owner, 'dispose');
    fixture.destroy();
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(store.unsavedChanges()).toBe(false);
  });
});
