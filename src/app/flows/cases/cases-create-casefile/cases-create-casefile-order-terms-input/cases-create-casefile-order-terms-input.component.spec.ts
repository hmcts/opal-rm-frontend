import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ActivatedRouteSnapshot, CanActivateFn, provideRouter, Router, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { canDeactivateGuard } from '@hmcts/opal-frontend-common/guards/can-deactivate';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { casesCreateCasefileChildCanDeactivateGuard } from '../routing/guards/cases-create-casefile-child-can-deactivate.guard';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileComponent } from '../cases-create-casefile.component';
import { CasesCreateCasefileOrderTermsInputFormComponent } from './cases-create-casefile-order-terms-input-form/cases-create-casefile-order-terms-input-form.component';
import { CasesCreateCasefileOrderTermsInputComponent } from './cases-create-casefile-order-terms-input.component';
import type { ICasesCreateCasefileOrderTermPage } from './interfaces/cases-create-casefile-order-term-page.interface';
import { orderTermPresentation } from './utils/cases-create-casefile-order-term-presentation';

@Component({ template: '<h1>Destination</h1>' })
class TestDestinationComponent {}

const amountId = 'create_casefile_order_terms_input_amount';
const creditorId = 'create_casefile_order_terms_input_creditor';
const expiryDateId = 'create_casefile_order_terms_input_expiry_date';
const page: ICasesCreateCasefileOrderTermPage = {
  resultId: 'MAT',
  title: 'Maintenance',
  fields: [
    {
      name: 'amount',
      id: amountId,
      label: 'Amount',
      kind: 'money',
      required: true,
      hint: '',
      min: 0,
      max: null,
      past: false,
      options: [],
      lookup: null,
    },
    {
      name: 'creditor',
      id: creditorId,
      label: 'Creditor',
      kind: 'autocomplete',
      required: false,
      hint: '',
      min: null,
      max: null,
      past: false,
      options: [{ value: 'C1', label: 'Creditor one' }],
      lookup: null,
    },
    {
      name: 'frequency',
      id: 'create_casefile_order_terms_input_frequency',
      label: 'Payment frequency',
      kind: 'readonly',
      required: true,
      hint: '',
      min: null,
      max: null,
      past: false,
      options: [],
      lookup: null,
    },
    {
      name: 'expiry_date',
      id: expiryDateId,
      label: 'Expiry date',
      kind: 'date',
      required: false,
      hint: '',
      min: null,
      max: null,
      past: false,
      options: [],
      lookup: null,
    },
  ],
};

const inputPath = 'cases/create-casefile/order-terms/add/:resultId';
const selectionPath = 'cases/create-casefile/order-terms/select';
const creditorPath = 'cases/create-casefile/order-terms/creditor';
const summaryPath = 'cases/create-casefile/order-terms/summary';
const taskListPath = 'cases/create-casefile/task-list';
const acceptedTerm = (
  parameters: Record<string, string | number | boolean>,
  termId = 1,
  creditor: { type: 'applicant' } | null = null,
) => ({ termId, resultId: 'MAT', parameters, creditor, presentation: orderTermPresentation(page) });

function seed(store: InstanceType<typeof CasesCreateCasefileStore>): void {
  store.setOrderDetails({
    applicationId: 1,
    court: null,
    dateOrderMade: null,
    paymentFrequency: 'Monthly',
    dateArrearsLastUpdated: '2026-09-17',
  });
  store.setPendingOrderTermResultId('MAT');
}

function seedAmendment(store: InstanceType<typeof CasesCreateCasefileStore>): number {
  store.prepareOrderTermDraft(page);
  expect(store.acceptOrderTerm({ resultId: 'MAT', parameters: { amount: '10.00', expiry_date: '2026-10-01' } })).toBe(
    true,
  );
  store.setPendingOrderTermResultId('MAT');
  store.prepareOrderTermDraft(page);
  expect(store.acceptOrderTerm({ resultId: 'MAT', parameters: { amount: '20.00', expiry_date: '2026-11-02' } })).toBe(
    true,
  );
  const termId = store.currentOrderTermId()!;
  expect(store.assignCurrentOrderTermCreditor(termId, { type: 'applicant' })).toBe(true);
  expect(store.beginOrderTermAmendment(termId)).toBe(true);
  return termId;
}

async function configure(routes: Routes = []): Promise<InstanceType<typeof CasesCreateCasefileStore>> {
  await TestBed.configureTestingModule({
    imports: [CasesCreateCasefileOrderTermsInputComponent],
    providers: [
      CasesCreateCasefileStore,
      provideRouter(routes),
      ...(routes.length ? [] : [{ provide: ActivatedRoute, useValue: { data: of({ orderTerm: page }) } }]),
    ],
  }).compileComponents();
  const store = TestBed.inject(CasesCreateCasefileStore);
  seed(store);
  return store;
}

function routedInput(creditorGuard: CanActivateFn = () => true): Routes {
  return [
    {
      path: inputPath,
      component: CasesCreateCasefileOrderTermsInputComponent,
      canDeactivate: [casesCreateCasefileChildCanDeactivateGuard],
      data: { orderTerm: page },
    },
    { path: selectionPath, component: TestDestinationComponent },
    { path: creditorPath, component: TestDestinationComponent, canActivate: [creditorGuard] },
    { path: summaryPath, component: TestDestinationComponent },
    { path: taskListPath, component: TestDestinationComponent },
  ];
}

describe('Order term input routed parent', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders resolved data, restored draft values and the latest frequency', async () => {
    const store = await configure();
    store.prepareOrderTermDraft(page);
    store.updateOrderTermDraft({ amount: '12.30', creditor: 'C1' }, true);
    const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermsInputComponent);
    fixture.detectChanges();
    const child = fixture.debugElement.query(
      (element) => element.componentInstance instanceof CasesCreateCasefileOrderTermsInputFormComponent,
    ).componentInstance as CasesCreateCasefileOrderTermsInputFormComponent;

    expect(child.initialValues).toEqual({ amount: '12.30', creditor: 'C1' });
    expect(child.initialDirty).toBe(true);
    expect(child.frequency).toBe('Monthly');
    expect(TestBed.inject(Title).getTitle()).toBe('OPAL - Maintenance');
    expect(fixture.nativeElement.querySelector('.govuk-back-link')?.textContent.trim()).toBe('Back');
    expect(fixture.nativeElement.querySelector('#order-term-amendment-cancel')).toBeNull();

    store.setOrderDetails({ ...store.orderDetails()!, paymentFrequency: 'Weekly' });
    fixture.detectChanges();
    expect(child.frequency).toBe('Weekly');
  });

  it('retains a dirty draft when a guarded departure is cancelled and discards it after confirmation', async () => {
    const store = await configure(routedInput());
    store.prepareOrderTermDraft(page);
    store.acceptOrderTerm({ resultId: 'MAT', parameters: { amount: '1.00' } });
    store.setPendingOrderTermResultId('MAT');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const harness = await RouterTestingHarness.create('/cases/create-casefile/order-terms/add/MAT');
    const component = harness.routeDebugElement!.componentInstance as CasesCreateCasefileOrderTermsInputComponent;
    component.handleDraftChange({ values: { amount: '12.3' }, dirty: true });

    await component.handleCancel();
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/order-terms/add/MAT');
    expect(store.orderTermDraft()?.values).toEqual({ amount: '12.3' });
    expect(store.orderTermDraft()?.dirty).toBe(true);
    expect(store.orderTerms()).toEqual([acceptedTerm({ amount: '1.00' })]);

    confirm.mockReturnValue(true);
    await component.handleCancel();
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/order-terms/select');
    expect(store.orderTermDraft()).toBeNull();
    expect(store.orderTerms()).toEqual([acceptedTerm({ amount: '1.00' })]);
  });

  it('allows clean Cancel without a warning', async () => {
    const store = await configure(routedInput());
    const confirm = vi.spyOn(window, 'confirm');
    const harness = await RouterTestingHarness.create('/cases/create-casefile/order-terms/add/MAT');
    const component = harness.routeDebugElement!.componentInstance as CasesCreateCasefileOrderTermsInputComponent;

    await component.handleCancel();

    expect(confirm).not.toHaveBeenCalled();
    expect(store.orderTermDraft()).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/order-terms/select');
  });

  it('retains a compatible draft after a confirmed ordinary internal departure', async () => {
    const store = await configure(routedInput());
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const harness = await RouterTestingHarness.create('/cases/create-casefile/order-terms/add/MAT');
    const component = harness.routeDebugElement!.componentInstance as CasesCreateCasefileOrderTermsInputComponent;
    component.handleDraftChange({ values: { amount: '12.3' }, dirty: true });

    await TestBed.inject(Router).navigateByUrl('/cases/create-casefile/task-list');

    expect(store.orderTermDraft()?.values).toEqual({ amount: '12.3' });
    expect(store.orderTermDraft()?.dirty).toBe(true);
    expect(store.unsavedChanges()).toBe(false);
  });

  it('retains all state when external departure is cancelled and resets it after confirmed shell teardown', async () => {
    const routes: Routes = [
      {
        path: 'cases/create-casefile',
        component: CasesCreateCasefileComponent,
        canDeactivate: [canDeactivateGuard],
        children: [
          {
            path: 'order-terms/add/:resultId',
            component: CasesCreateCasefileOrderTermsInputComponent,
            canDeactivate: [casesCreateCasefileChildCanDeactivateGuard],
            data: { orderTerm: page },
          },
        ],
      },
      { path: 'dashboard', component: TestDestinationComponent },
    ];
    const store = await configure(routes);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await RouterTestingHarness.create('/cases/create-casefile/order-terms/add/MAT');
    store.prepareOrderTermDraft(page);
    store.updateOrderTermDraft({ amount: '12.3' }, true);

    await TestBed.inject(Router).navigateByUrl('/dashboard');
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/order-terms/add/MAT');
    expect(store.pendingOrderTermResultId()).toBe('MAT');
    expect(store.orderTermDraft()?.values).toEqual({ amount: '12.3' });

    confirm.mockReturnValue(true);
    await TestBed.inject(Router).navigateByUrl('/dashboard');
    expect(TestBed.inject(Router).url).toBe('/dashboard');
    expect(store.pendingOrderTermResultId()).toBeNull();
    expect(store.orderTermDraft()).toBeNull();
  });

  it('accepts exactly once and navigates to the creditor destination', async () => {
    const store = await configure(routedInput());
    const harness = await RouterTestingHarness.create('/cases/create-casefile/order-terms/add/MAT');
    const component = harness.routeDebugElement!.componentInstance as CasesCreateCasefileOrderTermsInputComponent;
    component.handleDraftChange({ values: { amount: '12.3' }, dirty: true });

    component.handleFormSubmit({ formData: { [amountId]: '12.3' }, nestedFlow: false });
    component.handleFormSubmit({ formData: { [amountId]: '12.3' }, nestedFlow: false });
    await harness.fixture.whenStable();

    expect(store.orderTerms()).toEqual([acceptedTerm({ amount: '12.30' })]);
    expect(store.orderTermDraft()).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/order-terms/creditor');
  });

  it('accepts an autocomplete option ID through normal form submission', async () => {
    const store = await configure();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermsInputComponent);
    fixture.componentInstance.handleFormSubmit({
      formData: { [amountId]: '12.3', [creditorId]: 'C1' },
      nestedFlow: false,
    });
    expect(store.orderTerms()).toEqual([acceptedTerm({ amount: '12.30', creditor: 'C1' })]);
    expect(navigate).toHaveBeenCalledWith('/cases/create-casefile/order-terms/creditor');
  });

  it('rejects invalid payloads and unknown autocomplete values without navigation', async () => {
    const store = await configure();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermsInputComponent);
    const component = fixture.componentInstance;
    component.handleDraftChange({ values: { amount: 'bad', creditor: '' }, dirty: true });

    component.handleFormSubmit({ formData: { [amountId]: 'bad', [creditorId]: '' }, nestedFlow: false });
    component.handleDraftChange({ values: { amount: '12.3', creditor: 'UNKNOWN' }, dirty: true });
    component.handleFormSubmit({ formData: { [amountId]: '12.3', [creditorId]: 'UNKNOWN' }, nestedFlow: false });

    expect(store.orderTerms()).toEqual([]);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('retries a real rejected navigation and applies later edits without appending twice', async () => {
    let allowCreditor = false;
    const store = await configure(routedInput(() => allowCreditor));
    const harness = await RouterTestingHarness.create('/cases/create-casefile/order-terms/add/MAT');
    const component = harness.routeDebugElement!.componentInstance as CasesCreateCasefileOrderTermsInputComponent;
    const router = TestBed.inject(Router);
    component.handleDraftChange({ values: { amount: '12.3' }, dirty: true });

    component.handleFormSubmit({ formData: { [amountId]: '12.3' }, nestedFlow: false });
    await harness.fixture.whenStable();
    expect(router.url).toBe('/cases/create-casefile/order-terms/add/MAT');
    expect(store.orderTerms()).toEqual([acceptedTerm({ amount: '12.30' })]);

    component.handleDraftChange({ values: { amount: 'bad', creditor: '' }, dirty: true });
    component.handleFormSubmit({ formData: { [amountId]: 'bad', [creditorId]: '' }, nestedFlow: false });
    component.handleDraftChange({
      values: { amount: '20', creditor: 'UNKNOWN' },
      dirty: true,
    });
    component.handleFormSubmit({ formData: { [amountId]: '20', [creditorId]: 'UNKNOWN' }, nestedFlow: false });
    expect(store.orderTerms()).toEqual([acceptedTerm({ amount: '12.30' })]);

    component.handleDraftChange({ values: { amount: '20' }, dirty: true });
    allowCreditor = true;
    component.handleFormSubmit({ formData: { [amountId]: '20' }, nestedFlow: false });
    await harness.fixture.whenStable();

    expect(store.orderTerms()).toEqual([acceptedTerm({ amount: '20.00' })]);
    expect(router.url).toBe('/cases/create-casefile/order-terms/creditor');
  });

  it('keeps stable identity through false, rejected and successful navigation attempts', async () => {
    const store = await configure();
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(new Error('Synthetic navigation failure'))
      .mockResolvedValueOnce(true);
    const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermsInputComponent);
    const component = fixture.componentInstance;

    component.handleFormSubmit({ formData: { [amountId]: '12.3' }, nestedFlow: false });
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    const originalId = store.currentOrderTermId()!;
    expect(store.assignCurrentOrderTermCreditor(originalId, { type: 'applicant' })).toBe(true);

    component.handleDraftChange({ values: { amount: '20' }, dirty: true });
    component.handleFormSubmit({ formData: { [amountId]: '20' }, nestedFlow: false });
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(2));

    component.handleDraftChange({ values: { amount: '25.1' }, dirty: true });
    component.handleFormSubmit({ formData: { [amountId]: '25.1' }, nestedFlow: false });
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(3));

    expect(store.orderTerms()).toHaveLength(1);
    expect(store.orderTerms()[0]).toEqual(acceptedTerm({ amount: '25.10' }, originalId, { type: 'applicant' }));
  });

  it('keeps the first accepted term intact when retry context becomes stale', async () => {
    const store = await configure();
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(false);
    const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermsInputComponent);
    const component = fixture.componentInstance;

    component.handleFormSubmit({ formData: { [amountId]: '12.3' }, nestedFlow: false });
    const originalId = store.currentOrderTermId()!;
    store.setPendingOrderTermResultId('MCHILD');
    component.handleDraftChange({ values: { amount: '25.1' }, dirty: true });
    component.handleFormSubmit({ formData: { [amountId]: '25.1' }, nestedFlow: false });

    expect(store.orderTerms()).toEqual([acceptedTerm({ amount: '12.30' }, originalId)]);
  });

  it('replaces an accepted optional value after a rejected navigation when the real form reverts to pristine', async () => {
    const checkboxId = 'create_casefile_order_terms_input_apply_indexation';
    const optionalPage: ICasesCreateCasefileOrderTermPage = {
      resultId: 'OPTIONAL',
      title: 'Optional term',
      fields: [
        {
          name: 'apply_indexation',
          id: checkboxId,
          label: 'Apply indexation',
          kind: 'checkbox',
          required: false,
          hint: '',
          min: null,
          max: null,
          past: false,
          options: [],
          lookup: null,
        },
        { ...page.fields[2], id: 'create_casefile_order_terms_input_frequency' },
      ],
    };
    let allowCreditor = false;
    const store = await configure([
      {
        path: inputPath,
        component: CasesCreateCasefileOrderTermsInputComponent,
        canDeactivate: [casesCreateCasefileChildCanDeactivateGuard],
        data: { orderTerm: optionalPage },
      },
      { path: creditorPath, component: TestDestinationComponent, canActivate: [() => allowCreditor] },
    ]);
    store.setPendingOrderTermResultId('OPTIONAL');
    const harness = await RouterTestingHarness.create('/cases/create-casefile/order-terms/add/OPTIONAL');
    const child = harness.routeDebugElement!.query(
      (element) => element.componentInstance instanceof CasesCreateCasefileOrderTermsInputFormComponent,
    ).componentInstance as CasesCreateCasefileOrderTermsInputFormComponent;

    child.form.controls[checkboxId].setValue(true);
    child.handleFormSubmit(new SubmitEvent('submit'));
    await harness.fixture.whenStable();
    expect(store.orderTerms()).toEqual([
      {
        termId: 1,
        resultId: 'OPTIONAL',
        parameters: { apply_indexation: true },
        creditor: null,
        presentation: orderTermPresentation(optionalPage),
      },
    ]);
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/order-terms/add/OPTIONAL');

    child.form.controls[checkboxId].setValue(false);
    expect(store.unsavedChanges()).toBe(false);
    allowCreditor = true;
    child.handleFormSubmit(new SubmitEvent('submit'));
    await harness.fixture.whenStable();

    expect(store.orderTerms()).toEqual([
      {
        termId: 1,
        resultId: 'OPTIONAL',
        parameters: { apply_indexation: false },
        creditor: null,
        presentation: orderTermPresentation(optionalPage),
      },
    ]);
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/order-terms/creditor');
  });

  it('remounts the form when route data changes for another Result', async () => {
    const childPage = { ...page, resultId: 'MCHILD', title: 'Child maintenance' };
    await configure([
      {
        path: inputPath,
        component: CasesCreateCasefileOrderTermsInputComponent,
        resolve: {
          orderTerm: (route: ActivatedRouteSnapshot) => (route.paramMap.get('resultId') === 'MAT' ? page : childPage),
        },
      },
    ]);
    const store = TestBed.inject(CasesCreateCasefileStore);
    const harness = await RouterTestingHarness.create('/cases/create-casefile/order-terms/add/MAT');
    const first = harness.routeDebugElement!.query(
      (element) => element.componentInstance instanceof CasesCreateCasefileOrderTermsInputFormComponent,
    ).componentInstance;

    store.setPendingOrderTermResultId('MCHILD');
    await TestBed.inject(Router).navigateByUrl('/cases/create-casefile/order-terms/add/MCHILD');
    harness.fixture.detectChanges();
    const second = harness.routeDebugElement!.query(
      (element) => element.componentInstance instanceof CasesCreateCasefileOrderTermsInputFormComponent,
    ).componentInstance as CasesCreateCasefileOrderTermsInputFormComponent;

    expect(second).not.toBe(first);
    expect(second.page.resultId).toBe('MCHILD');
    expect(TestBed.inject(Title).getTitle()).toBe('OPAL - Child maintenance');
  });

  it('hydrates the selected amendment once, including dates, and preserves edits on revisit', async () => {
    const store = await configure();
    seedAmendment(store);
    const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermsInputComponent);
    fixture.detectChanges();
    let child = fixture.debugElement.query(
      (element) => element.componentInstance instanceof CasesCreateCasefileOrderTermsInputFormComponent,
    ).componentInstance as CasesCreateCasefileOrderTermsInputFormComponent;

    expect(child.initialValues).toEqual({ amount: '20.00', expiry_date: '02/11/2026' });
    fixture.componentInstance.handleDraftChange({ values: { amount: '25', expiry_date: '03/11/2026' }, dirty: true });
    fixture.destroy();

    const revisited = TestBed.createComponent(CasesCreateCasefileOrderTermsInputComponent);
    revisited.detectChanges();
    child = revisited.debugElement.query(
      (element) => element.componentInstance instanceof CasesCreateCasefileOrderTermsInputFormComponent,
    ).componentInstance as CasesCreateCasefileOrderTermsInputFormComponent;
    expect(child.initialValues).toEqual({ amount: '25', expiry_date: '03/11/2026' });
    expect(store.orderTerms()[1].parameters).toEqual({ amount: '20.00', expiry_date: '2026-11-02' });
  });

  it('stages an amendment without changing accepted terms through declined navigation and retry', async () => {
    const store = await configure();
    const termId = seedAmendment(store);
    const acceptedBefore = structuredClone(store.orderTerms());
    let finish!: (value: boolean) => void;
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockImplementation(() => new Promise<boolean>((resolve) => (finish = resolve)));
    const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermsInputComponent);
    const component = fixture.componentInstance;
    const submission = {
      formData: { [amountId]: '30', [expiryDateId]: '04/11/2026' },
      nestedFlow: false,
    };

    component.handleFormSubmit(submission);
    component.handleFormSubmit(submission);
    expect(navigate).toHaveBeenCalledOnce();
    expect(store.orderTerms()).toEqual(acceptedBefore);
    expect(store.orderTermAmendment()).toMatchObject({
      termId,
      inputComplete: true,
      term: { parameters: { amount: '30.00', expiry_date: '2026-11-04' } },
    });

    finish(false);
    await fixture.whenStable();
    expect(store.orderTerms()).toEqual(acceptedBefore);
    expect(store.orderTermAmendment()).not.toBeNull();

    navigate.mockRejectedValueOnce(new Error('Synthetic navigation failure')).mockResolvedValueOnce(true);
    component.handleFormSubmit(submission);
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(2));
    expect(store.orderTerms()).toEqual(acceptedBefore);
    component.handleFormSubmit(submission);
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(3));
    expect(store.orderTerms()).toEqual(acceptedBefore);
    expect(store.orderTermAmendment()?.termId).toBe(termId);
  });

  it('cancels the whole amendment only after successful summary navigation', async () => {
    const store = await configure();
    const termId = seedAmendment(store);
    const acceptedBefore = structuredClone(store.orderTerms());
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(new Error('Synthetic cancellation failure'))
      .mockResolvedValueOnce(true);
    const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermsInputComponent);
    const component = fixture.componentInstance;
    component.handleDraftChange({ values: { amount: '31' }, dirty: true });

    await component.handleCancel();
    expect(store.orderTermAmendment()?.termId).toBe(termId);
    await component.handleCancel();
    expect(store.orderTermAmendment()?.termId).toBe(termId);
    await component.handleCancel();

    expect(navigate).toHaveBeenLastCalledWith('/cases/create-casefile/order-terms/summary');
    expect(store.orderTermAmendment()).toBeNull();
    expect(store.orderTerms()).toEqual(acceptedBefore);
  });

  it('retains a dirty amendment when routed Cancel is declined and discards it after confirmation', async () => {
    const store = await configure(routedInput());
    seedAmendment(store);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const harness = await RouterTestingHarness.create('/cases/create-casefile/order-terms/add/MAT');
    const component = harness.routeDebugElement!.componentInstance as CasesCreateCasefileOrderTermsInputComponent;
    harness.fixture.detectChanges();
    expect(harness.fixture.nativeElement.querySelector('.govuk-back-link')).toBeNull();
    expect(
      harness.fixture.nativeElement.querySelector('#order-term-amendment-cancel .button-link')?.textContent.trim(),
    ).toBe('Cancel amendment');
    component.handleDraftChange({ values: { amount: '31' }, dirty: true });

    await component.handleCancel();
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/order-terms/add/MAT');
    expect(store.orderTermAmendment()).not.toBeNull();
    expect(store.orderTermDraft()?.values).toEqual({ amount: '31' });

    confirm.mockReturnValue(true);
    await component.handleCancel();
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/order-terms/summary');
    expect(store.orderTermAmendment()).toBeNull();
  });

  it('does not cancel a replacement amendment after late navigation completes', async () => {
    const store = await configure();
    seedAmendment(store);
    const original = store.orderTermAmendment();
    let finish!: (value: boolean) => void;
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockImplementation(
      () => new Promise<boolean>((resolve) => (finish = resolve)),
    );
    const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermsInputComponent);
    const cancellation = fixture.componentInstance.handleCancel();

    store.resetStore();
    seed(store);
    seedAmendment(store);
    const replacement = store.orderTermAmendment();
    expect(replacement).not.toBe(original);
    finish(true);
    await cancellation;

    expect(store.orderTermAmendment()).toBe(replacement);
    expect(store.orderTerms()).toHaveLength(2);
  });
});
