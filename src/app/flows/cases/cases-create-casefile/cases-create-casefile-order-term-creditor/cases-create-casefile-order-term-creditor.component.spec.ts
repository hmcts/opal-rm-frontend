import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter, Router, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { patchState, WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS } from '../cases-create-casefile-applicant-individual/mocks/cases-create-casefile-applicant-individual.mock';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS } from '../cases-create-casefile-applicant-organisation/mocks/cases-create-casefile-applicant-organisation.mock';
import { MINOR_CREDITOR_DETAILS_MOCK } from '../cases-create-casefile-minor-creditor-details/mocks/cases-create-casefile-minor-creditor.mock';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { casesCreateCasefileChildCanDeactivateGuard } from '../routing/guards/cases-create-casefile-child-can-deactivate.guard';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileOrderTermCreditorFormComponent } from './cases-create-casefile-order-term-creditor-form/cases-create-casefile-order-term-creditor-form.component';
import { CasesCreateCasefileOrderTermCreditorComponent } from './cases-create-casefile-order-term-creditor.component';

@Component({ template: '<h1>Summary</h1>' })
class TestDestinationComponent {}

const acceptedTerm = {
  termId: 1,
  resultId: 'MAT',
  parameters: { amount: '12.30' },
  creditor: null,
  presentation: {
    title: 'Maintenance',
    fields: [{ name: 'amount', label: 'Amount', kind: 'money' as const, options: [] }],
  },
};
const existingMinorCreditor = {
  sequenceNumber: 4,
  displayName: 'Existing Synthetic Creditor',
  details: {
    ...MINOR_CREDITOR_DETAILS_MOCK,
    identity: { type: 'organisation' as const, organisationName: 'Existing Synthetic Creditor' },
  },
};
const majorCreditor = {
  major_creditor_id: 47,
  business_unit_id: 44,
  major_creditor_code: 'MC47',
  name: 'Synthetic Major Creditor',
  address_line_1: '1 Example Street',
  address_line_2: null,
  address_line_3: null,
  address_line_4: null,
  address_line_5: null,
  postcode: null,
  country_id: null,
  country_name: null,
  contact_name: null,
  contact_email: null,
  active: true,
  central_authority: false,
};

function seedCurrentTerm(store: InstanceType<typeof CasesCreateCasefileStore>): void {
  patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
    orderTerms: [{ ...acceptedTerm }],
    currentOrderTermId: 1,
    nextOrderTermId: 2,
  });
}

async function setup(majorCreditors = [majorCreditor]) {
  await TestBed.configureTestingModule({
    imports: [CasesCreateCasefileOrderTermCreditorComponent],
    providers: [
      CasesCreateCasefileStore,
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { data: { majorCreditors: { count: majorCreditors.length, refData: majorCreditors } } } },
      },
    ],
  }).compileComponents();
  const store = TestBed.inject(CasesCreateCasefileStore);
  seedCurrentTerm(store);
  const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermCreditorComponent);
  return { fixture, component: fixture.componentInstance, store, router: TestBed.inject(Router) };
}

function routedCreditor(): Routes {
  return [
    {
      path: 'cases/create-casefile/order-terms/creditor',
      component: CasesCreateCasefileOrderTermCreditorComponent,
      canDeactivate: [casesCreateCasefileChildCanDeactivateGuard],
      data: { majorCreditors: { count: 1, refData: [majorCreditor] } },
    },
    { path: 'cases/create-casefile/order-terms/summary', component: TestDestinationComponent },
  ];
}

describe('CasesCreateCasefileOrderTermCreditorComponent', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders the creditor form with resolved Major records and entry term data', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();
    const child = fixture.debugElement.query(By.directive(CasesCreateCasefileOrderTermCreditorFormComponent))
      .componentInstance as CasesCreateCasefileOrderTermCreditorFormComponent;
    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Creditor');
    expect(child.majorCreditors).toEqual([majorCreditor]);
    expect(child.initialFormData.create_casefile_order_term_creditor_choice).toBeNull();
  });

  it.each([
    [CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.saved, 'Mr Test Applicant (Applicant)'],
    [
      {
        ...CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.saved,
        title: ' Ms ',
        firstNames: ' Synthetic ',
        lastName: ' Person ',
      },
      'Ms Synthetic Person (Applicant)',
    ],
    [CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedUk, 'Example Organisation (Applicant)'],
  ])('derives the applicant radio label from saved party details', async (details, expected) => {
    const { fixture, store } = await setup();
    store.setApplicantDetails(details);
    fixture.detectChanges();
    const child = fixture.debugElement.query(By.directive(CasesCreateCasefileOrderTermCreditorFormComponent))
      .componentInstance as CasesCreateCasefileOrderTermCreditorFormComponent;
    expect(child.applicantLabel).toBe(expected);
  });

  it('assigns Applicant to the captured term and navigates without completing order terms', async () => {
    const { component, store, router } = await setup();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const statusBefore = store.taskStatuses().orderTerms;
    component.handleFormSubmit({
      formData: {
        create_casefile_order_term_creditor_choice: 'applicant',
        create_casefile_order_term_creditor_major_creditor_id: null,
      },
      nestedFlow: false,
    });
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledOnce());
    expect(store.orderTerms()[0].creditor).toEqual({ type: 'applicant' });
    expect(store.taskStatuses().orderTerms).toBe(statusBefore);
    expect(navigate).toHaveBeenCalledWith('/cases/create-casefile/order-terms/summary');
  });

  it('rejects submission when the current term changes after page entry', async () => {
    const { component, store, router } = await setup();
    const navigate = vi.spyOn(router, 'navigateByUrl');
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [{ ...acceptedTerm }, { ...acceptedTerm, termId: 2 }],
      currentOrderTermId: 2,
      nextOrderTermId: 3,
    });
    component.handleFormSubmit({
      formData: {
        create_casefile_order_term_creditor_choice: 'applicant',
        create_casefile_order_term_creditor_major_creditor_id: null,
      },
      nestedFlow: false,
    });
    expect(store.orderTerms().map((term) => term.creditor)).toEqual([null, null]);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('accepts only a Major ID from the resolved records', async () => {
    const { component, store, router } = await setup([{ ...majorCreditor, major_creditor_id: 99 }]);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.handleFormSubmit({
      formData: {
        create_casefile_order_term_creditor_choice: 'major',
        create_casefile_order_term_creditor_major_creditor_id: 47,
      },
      nestedFlow: false,
    });
    expect(store.orderTerms()[0].creditor).toBeNull();
    component.handleFormSubmit({
      formData: {
        create_casefile_order_term_creditor_choice: 'major',
        create_casefile_order_term_creditor_major_creditor_id: 99,
      },
      nestedFlow: false,
    });
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledOnce());
    expect(store.orderTerms()[0].creditor).toEqual({
      type: 'major',
      majorCreditorId: 99,
      displayName: 'Synthetic Major Creditor',
    });
  });

  it('keeps accepted assignments and minor allocation state when starting add-new details', async () => {
    const { component, store, router } = await setup();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [{ ...acceptedTerm, creditor: { type: 'applicant' } }],
      minorCreditors: [existingMinorCreditor],
      nextMinorCreditorSequence: 5,
    });
    component.handleFormSubmit({
      formData: {
        create_casefile_order_term_creditor_choice: 'add-new',
        create_casefile_order_term_creditor_major_creditor_id: null,
      },
      nestedFlow: false,
    });
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledOnce());
    expect(store.orderTerms()[0].creditor).toEqual({ type: 'applicant' });
    expect(store.minorCreditors()).toEqual([existingMinorCreditor]);
    expect(store.nextMinorCreditorSequence()).toBe(5);
    expect(store.creditorDraft()).toEqual({ termId: 1, branch: 'add-new' });
    expect(navigate).toHaveBeenCalledWith('/cases/create-casefile/order-terms/creditor/minor-creditor-details');
  });

  it('retains accepted state, shows a safe error and retries unchanged without duplication', async () => {
    const { fixture, component, store, router } = await setup();
    const navigate = vi
      .spyOn(router, 'navigateByUrl')
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(new Error('Synthetic navigation failure'))
      .mockResolvedValueOnce(true);
    const form = {
      formData: {
        create_casefile_order_term_creditor_choice: 'add-new',
        create_casefile_order_term_creditor_major_creditor_id: null,
      },
      nestedFlow: false,
    } as const;
    component.handleFormSubmit(form);
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('You can try again.');
    component.handleFormSubmit(form);
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(2));
    component.handleFormSubmit(form);
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(3));
    expect(store.orderTerms()).toHaveLength(1);
    expect(store.minorCreditors()).toEqual([]);
    expect(store.nextMinorCreditorSequence()).toBe(1);
    expect(store.creditorDraft()).toEqual({ termId: 1, branch: 'add-new' });
  });

  it('rebases the child snapshot before failed navigation so later edits become dirty', async () => {
    const { fixture, store, router } = await setup();
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(false);
    fixture.detectChanges();
    const child = fixture.debugElement.query(By.directive(CasesCreateCasefileOrderTermCreditorFormComponent))
      .componentInstance as CasesCreateCasefileOrderTermCreditorFormComponent;

    child.form.controls.create_casefile_order_term_creditor_choice.setValue('applicant');
    child.handleFormSubmit(new SubmitEvent('submit'));
    await vi.waitFor(() => expect(store.orderTerms()[0].creditor).toEqual({ type: 'applicant' }));

    expect(child.initialFormData.create_casefile_order_term_creditor_choice).toBe('applicant');
    child.form.controls.create_casefile_order_term_creditor_choice.setValue('add-new');
    expect(store.unsavedChanges()).toBe(true);
  });

  it('ignores a concurrent repeat submission while navigation is in flight', async () => {
    const { component, router } = await setup();
    let finish!: (value: boolean) => void;
    const navigate = vi
      .spyOn(router, 'navigateByUrl')
      .mockImplementation(() => new Promise((resolve) => (finish = resolve)));
    const form = {
      formData: {
        create_casefile_order_term_creditor_choice: 'applicant',
        create_casefile_order_term_creditor_major_creditor_id: null,
      },
      nestedFlow: false,
    } as const;
    component.handleFormSubmit(form);
    component.handleFormSubmit(form);
    expect(navigate).toHaveBeenCalledOnce();
    finish(false);
    await vi.waitFor(() => expect(component.navigationFailed()).toBe(true));
  });

  it('preserves a final Minor reference and edits when Cancel is declined or fails', async () => {
    const { component, store, router } = await setup();
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [{ ...acceptedTerm, creditor: { type: 'minor', sequenceNumber: 3 } }],
      minorCreditors: [{ ...existingMinorCreditor, sequenceNumber: 3 }],
      nextMinorCreditorSequence: 4,
      creditorDraft: { termId: 1, branch: 'add-new' },
    });
    vi.spyOn(router, 'navigateByUrl')
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(new Error('Synthetic failure'));
    component.handleUnsavedChanges(true);
    await component.handleCancel();
    await component.handleCancel();
    expect(store.orderTerms()[0].creditor).toEqual({ type: 'minor', sequenceNumber: 3 });
    expect(store.minorCreditors()).toEqual([{ ...existingMinorCreditor, sequenceNumber: 3 }]);
    expect(store.creditorDraft()).toEqual({ termId: 1, branch: 'add-new' });
    expect(store.unsavedChanges()).toBe(true);
    expect(component.navigationFailed()).toBe(true);
  });

  it('clears only the creditor draft and unsaved flags after successful Cancel', async () => {
    const { component, store, router } = await setup();
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [{ ...acceptedTerm, creditor: { type: 'applicant' } }],
      creditorDraft: { termId: 1, branch: 'add-new' },
    });
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.handleUnsavedChanges(true);
    await component.handleCancel();
    expect(store.orderTerms()[0].creditor).toEqual({ type: 'applicant' });
    expect(store.creditorDraft()).toBeNull();
    expect(store.unsavedChanges()).toBe(false);
  });

  it('retains dirty edits when routed Cancel confirmation is declined and clears draft after confirmation', async () => {
    await TestBed.configureTestingModule({
      providers: [CasesCreateCasefileStore, provideRouter(routedCreditor())],
    }).compileComponents();
    const store = TestBed.inject(CasesCreateCasefileStore);
    seedCurrentTerm(store);
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      creditorDraft: { termId: 1, branch: 'add-new' },
    });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const harness = await RouterTestingHarness.create('/cases/create-casefile/order-terms/creditor');
    const component = harness.routeDebugElement!.componentInstance as CasesCreateCasefileOrderTermCreditorComponent;
    component.handleUnsavedChanges(true);
    await component.handleCancel();
    harness.fixture.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/order-terms/creditor');
    expect(store.creditorDraft()).toEqual({ termId: 1, branch: 'add-new' });
    expect(store.unsavedChanges()).toBe(true);
    expect(harness.fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    confirm.mockReturnValue(true);
    await component.handleCancel();
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/order-terms/summary');
    expect(store.creditorDraft()).toBeNull();
    expect(store.orderTerms()).toEqual([{ ...acceptedTerm }]);
  });
});
