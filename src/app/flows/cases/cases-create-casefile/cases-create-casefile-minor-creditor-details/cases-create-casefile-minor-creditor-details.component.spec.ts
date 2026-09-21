import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { patchState, WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileMinorCreditorDetailsComponent } from './cases-create-casefile-minor-creditor-details.component';
import { CasesCreateCasefileMinorCreditorDetailsFormComponent } from './cases-create-casefile-minor-creditor-details-form/cases-create-casefile-minor-creditor-details-form.component';
import { MINOR_CREDITOR_DETAILS_MOCK } from './mocks/cases-create-casefile-minor-creditor.mock';
import { toMinorCreditorFormData } from './utils/cases-create-casefile-minor-creditor-mapper';
import { CASES_CREATE_CASEFILE_MINOR_CREDITOR_FIELD_NAMES as F } from './constants/cases-create-casefile-minor-creditor-field-names.constant';

const term = { termId: 1, resultId: 'MAT', parameters: {}, creditor: null };
const saved = { sequenceNumber: 4, displayName: 'Example creditor', details: MINOR_CREDITOR_DETAILS_MOCK };
const submission = () => ({
  formData: toMinorCreditorFormData(MINOR_CREDITOR_DETAILS_MOCK),
  nestedFlow: false as const,
});
const summaryPath = '/cases/create-casefile/order-terms/creditor/minor-creditor-summary';
const patch = (store: InstanceType<typeof CasesCreateCasefileStore>, state: Partial<ICasesCreateCasefileState>) =>
  patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, state);

async function setup(state: Partial<ICasesCreateCasefileState> = {}) {
  const countries = {
    count: 3,
    refData: [
      { country_id: 840, country_name: 'United States' },
      { country_id: 250, country_name: 'France' },
      { country_id: 826, country_name: 'United Kingdom' },
    ],
  };
  await TestBed.configureTestingModule({
    imports: [CasesCreateCasefileMinorCreditorDetailsComponent],
    providers: [
      CasesCreateCasefileStore,
      provideHttpClient(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { data: { countries } } } },
    ],
  }).compileComponents();
  const store = TestBed.inject(CasesCreateCasefileStore);
  patch(store, {
    orderTerms: [term],
    currentOrderTermId: 1,
    creditorDraft: { termId: 1, branch: 'add-new' },
    ...state,
  });
  const fixture = TestBed.createComponent(CasesCreateCasefileMinorCreditorDetailsComponent);
  return { fixture, component: fixture.componentInstance, store, router: TestBed.inject(Router), countries };
}

describe('CasesCreateCasefileMinorCreditorDetailsComponent', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('sorts resolved Countries without mutating reference data and renders the empty form', async () => {
    const { fixture, component, countries } = await setup();
    fixture.detectChanges();
    expect(component.countryAutocompleteItems.map((item) => item.name)).toEqual([
      'United Kingdom',
      'France',
      'United States',
    ]);
    expect(component.countrySelectOptions[0]).toEqual({ name: 'Select', value: '' });
    expect(countries.refData[0].country_name).toBe('United States');
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Minor creditor details');
    expect(component.initialFormData[F.creditorType]).toBeNull();
  });

  it('saves and assigns once, clears dirty flags and requests Summary', async () => {
    const { fixture, component, store, router } = await setup();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture.detectChanges();
    component.handleUnsavedChanges(true);
    component.handleFormSubmit(submission());
    await fixture.whenStable();
    expect(store.minorCreditors()[0].details).toEqual(MINOR_CREDITOR_DETAILS_MOCK);
    expect(store.orderTerms()[0].creditor).toEqual({ type: 'minor', sequenceNumber: 1 });
    expect(store.nextMinorCreditorSequence()).toBe(2);
    expect(store.creditorDraft()).toBeNull();
    expect(store.unsavedChanges()).toBe(false);
    expect(component.stateUnsavedChanges).toBe(false);
    expect(navigate).toHaveBeenCalledExactlyOnceWith(summaryPath);
  });

  it.each([false, new Error('Synthetic navigation error')])(
    'retains saved data and retries without allocating after %s',
    async (result) => {
      const { fixture, component, store, router } = await setup();
      const navigate = vi.spyOn(router, 'navigateByUrl');
      if (result instanceof Error) navigate.mockRejectedValueOnce(result);
      else navigate.mockResolvedValueOnce(result);
      navigate.mockResolvedValueOnce(true);
      fixture.detectChanges();
      component.handleFormSubmit(submission());
      await fixture.whenStable();
      expect(component.navigationFailed()).toBe(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('You can try again.');
      const update = vi.spyOn(store, 'updateAssignedMinorCreditor');
      component.handleFormSubmit(submission());
      await fixture.whenStable();
      expect(store.minorCreditors()).toHaveLength(1);
      expect(store.nextMinorCreditorSequence()).toBe(2);
      expect(update).not.toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledTimes(2);
      expect(component.navigationFailed()).toBe(false);
    },
  );

  it('rebases the child after failed navigation and saves later edits on the same sequence', async () => {
    const { fixture, component, store, router } = await setup();
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(false);
    fixture.detectChanges();
    component.handleFormSubmit(submission());
    await fixture.whenStable();
    const child = fixture.debugElement.query(By.directive(CasesCreateCasefileMinorCreditorDetailsFormComponent))
      .componentInstance as CasesCreateCasefileMinorCreditorDetailsFormComponent;
    child.form.controls[F.organisationName].setValue('Changed creditor');
    expect(store.unsavedChanges()).toBe(true);
    child.handleFormSubmit(new SubmitEvent('submit'));
    await fixture.whenStable();
    expect(store.minorCreditors()[0].details.identity).toEqual({
      type: 'organisation',
      organisationName: 'Changed creditor',
    });
    expect(store.nextMinorCreditorSequence()).toBe(2);
    expect(store.unsavedChanges()).toBe(false);
  });

  it('restores only the assigned saved creditor', async () => {
    const { fixture, component, store, router } = await setup({
      creditorDraft: null,
      minorCreditors: [saved],
      nextMinorCreditorSequence: 5,
      orderTerms: [{ ...term, creditor: { type: 'minor', sequenceNumber: 4 } }],
    });
    fixture.detectChanges();
    expect(component.initialFormData).toEqual(toMinorCreditorFormData(saved.details));
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const form = submission();
    form.formData[F.organisationName] = 'Updated creditor';
    component.handleFormSubmit(form);
    expect(store.minorCreditors()[0].displayName).toBe('Updated creditor');
    expect(store.nextMinorCreditorSequence()).toBe(5);
  });

  it('starts empty when adding another creditor despite an existing assignment', async () => {
    const { component } = await setup({
      minorCreditors: [saved],
      orderTerms: [{ ...term, creditor: { type: 'minor', sequenceNumber: 4 } }],
    });
    expect(component.initialFormData).toEqual(toMinorCreditorFormData(null));
  });

  it.each([
    { currentOrderTermId: 2 },
    { currentOrderTermId: null },
    { creditorDraft: null },
    { creditorDraft: { termId: 2, branch: 'add-new' as const } },
  ])('rejects a stale new-save context %j', async (state) => {
    const { component, store, router } = await setup();
    patch(store, state);
    const navigate = vi.spyOn(router, 'navigateByUrl');
    component.handleUnsavedChanges(true);
    component.handleFormSubmit(submission());
    expect(store.minorCreditors()).toEqual([]);
    expect(store.unsavedChanges()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('rejects retries when another pending draft replaces the saved context', async () => {
    const { fixture, component, store, router } = await setup();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(false);
    fixture.detectChanges();
    component.handleFormSubmit(submission());
    await fixture.whenStable();
    patch(store, { creditorDraft: { termId: 1, branch: 'add-new' } });
    component.handleFormSubmit(submission());
    expect(navigate).toHaveBeenCalledOnce();
    expect(store.minorCreditors()).toHaveLength(1);
  });

  it('ignores repeated Save and Cancel while navigation is pending', async () => {
    const { fixture, component, store, router } = await setup();
    let finish!: (value: boolean) => void;
    const navigate = vi.spyOn(router, 'navigateByUrl').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    fixture.detectChanges();
    component.handleFormSubmit(submission());
    component.handleFormSubmit(submission());
    void component.handleCancel();
    expect(navigate).toHaveBeenCalledOnce();
    expect(store.minorCreditors()).toHaveLength(1);
    finish(false);
    await fixture.whenStable();
  });

  it.each([false, new Error('Synthetic cancellation error')])(
    'preserves pending and saved data after declined/failed Cancel %s',
    async (result) => {
      const { component, store, router } = await setup({ minorCreditors: [saved] });
      const navigate = vi.spyOn(router, 'navigateByUrl');
      if (result instanceof Error) navigate.mockRejectedValue(result);
      else navigate.mockResolvedValue(result);
      component.handleUnsavedChanges(true);
      await component.handleCancel();
      expect(store.creditorDraft()).toEqual({ termId: 1, branch: 'add-new' });
      expect(store.minorCreditors()).toEqual([saved]);
      expect(store.unsavedChanges()).toBe(true);
      expect(component.navigationFailed()).toBe(result instanceof Error);
    },
  );

  it('clears matching pending data only after successful Cancel and preserves creditors', async () => {
    const { component, store, router } = await setup({ minorCreditors: [saved] });
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.handleUnsavedChanges(true);
    await component.handleCancel();
    expect(store.creditorDraft()).toBeNull();
    expect(store.minorCreditors()).toEqual([saved]);
    expect(store.unsavedChanges()).toBe(false);
  });

  it('does not clear a newer term draft from late Cancel completion', async () => {
    const { component, store, router } = await setup();
    let finish!: (value: boolean) => void;
    vi.spyOn(router, 'navigateByUrl').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const cancellation = component.handleCancel();
    patch(store, { currentOrderTermId: 2, creditorDraft: { termId: 2, branch: 'add-new' } });
    finish(true);
    await cancellation;
    expect(store.creditorDraft()).toEqual({ termId: 2, branch: 'add-new' });
  });

  it.each([
    { orderTerms: [term] },
    { orderTerms: [{ ...term, creditor: { type: 'minor' as const, sequenceNumber: 99 } }] },
  ])('enters without restoring unrelated creditors when no saved details match %j', async (state) => {
    const { component } = await setup({ creditorDraft: null, minorCreditors: [saved], ...state });
    expect(component.initialFormData).toEqual(toMinorCreditorFormData(null));
  });

  it.each([
    { orderTerms: [] },
    { orderTerms: [{ ...term, creditor: { type: 'minor' as const, sequenceNumber: 99 } }] },
    { minorCreditors: [] },
  ])('does not navigate or overwrite after the assigned saved context disappears %j', async (state) => {
    const { fixture, component, store, router } = await setup({
      creditorDraft: null,
      minorCreditors: [saved],
      orderTerms: [{ ...term, creditor: { type: 'minor', sequenceNumber: 4 } }],
    });
    fixture.detectChanges();
    patch(store, state);
    component.handleUnsavedChanges(true);
    const navigate = vi.spyOn(router, 'navigateByUrl');
    component.handleFormSubmit(submission());
    expect(navigate).not.toHaveBeenCalled();
    expect(store.unsavedChanges()).toBe(true);
  });

  it('preserves dirty edits if the bounded store update refuses them', async () => {
    const { fixture, component, store, router } = await setup({
      creditorDraft: null,
      minorCreditors: [saved],
      orderTerms: [{ ...term, creditor: { type: 'minor', sequenceNumber: 4 } }],
    });
    fixture.detectChanges();
    const navigate = vi.spyOn(router, 'navigateByUrl');
    vi.spyOn(store, 'updateAssignedMinorCreditor').mockReturnValue(false);
    component.handleUnsavedChanges(true);
    const form = submission();
    form.formData[F.organisationName] = 'Unaccepted edit';
    component.handleFormSubmit(form);
    expect(store.minorCreditors()).toEqual([saved]);
    expect(navigate).not.toHaveBeenCalled();
    expect(store.unsavedChanges()).toBe(true);
  });

  it('clears the page dirty state on destruction', async () => {
    const { fixture, component, store } = await setup();
    component.handleUnsavedChanges(true);
    fixture.destroy();
    expect(store.unsavedChanges()).toBe(false);
  });
});
