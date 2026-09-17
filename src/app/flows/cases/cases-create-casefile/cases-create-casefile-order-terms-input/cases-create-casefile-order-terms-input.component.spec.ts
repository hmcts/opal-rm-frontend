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

@Component({ template: '<h1>Destination</h1>' })
class TestDestinationComponent {}

const amountId = 'create_casefile_order_terms_input_amount';
const creditorId = 'create_casefile_order_terms_input_creditor';
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
  ],
};

const inputPath = 'cases/create-casefile/order-terms/add/:resultId';
const selectionPath = 'cases/create-casefile/order-terms/select';
const creditorPath = 'cases/create-casefile/order-terms/creditor';
const taskListPath = 'cases/create-casefile/task-list';

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
    { path: taskListPath, component: TestDestinationComponent },
  ];
}

describe('Order term input routed parent', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders resolved data, restored draft confirmation and the latest frequency', async () => {
    const store = await configure();
    store.prepareOrderTermDraft(page);
    store.updateOrderTermDraft({ amount: '12.30', creditor: 'C1' }, true, { creditor: true });
    const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermsInputComponent);
    fixture.detectChanges();
    const child = fixture.debugElement.query(
      (element) => element.componentInstance instanceof CasesCreateCasefileOrderTermsInputFormComponent,
    ).componentInstance as CasesCreateCasefileOrderTermsInputFormComponent;

    expect(child.initialValues).toEqual({ amount: '12.30', creditor: 'C1' });
    expect(child.initialConfirmedAutocomplete).toEqual({ creditor: true });
    expect(child.initialDirty).toBe(true);
    expect(child.frequency).toBe('Monthly');
    expect(TestBed.inject(Title).getTitle()).toBe('OPAL - Maintenance');

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
    expect(store.orderTerms()).toEqual([{ resultId: 'MAT', parameters: { amount: '1.00' } }]);

    confirm.mockReturnValue(true);
    await component.handleCancel();
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/order-terms/select');
    expect(store.orderTermDraft()).toBeNull();
    expect(store.orderTerms()).toEqual([{ resultId: 'MAT', parameters: { amount: '1.00' } }]);
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

    expect(store.orderTerms()).toEqual([{ resultId: 'MAT', parameters: { amount: '12.30' } }]);
    expect(store.orderTermDraft()).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/order-terms/creditor');
  });

  it('rejects invalid payloads and unconfirmed autocomplete text without navigation', async () => {
    const store = await configure();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    const fixture = TestBed.createComponent(CasesCreateCasefileOrderTermsInputComponent);
    const component = fixture.componentInstance;
    component.handleDraftChange({ values: { amount: 'bad', creditor: '' }, dirty: true });

    component.handleFormSubmit({ formData: { [amountId]: 'bad', [creditorId]: '' }, nestedFlow: false });
    component.handleDraftChange({ values: { amount: '12.3', creditor: 'C1' }, dirty: true, confirmedAutocomplete: {} });
    component.handleFormSubmit({ formData: { [amountId]: '12.3', [creditorId]: 'C1' }, nestedFlow: false });

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
    expect(store.orderTerms()).toEqual([{ resultId: 'MAT', parameters: { amount: '12.30' } }]);

    component.handleDraftChange({ values: { amount: 'bad', creditor: '' }, dirty: true });
    component.handleFormSubmit({ formData: { [amountId]: 'bad', [creditorId]: '' }, nestedFlow: false });
    component.handleDraftChange({
      values: { amount: '20', creditor: 'C1' },
      dirty: true,
      confirmedAutocomplete: {},
    });
    component.handleFormSubmit({ formData: { [amountId]: '20', [creditorId]: 'C1' }, nestedFlow: false });
    expect(store.orderTerms()).toEqual([{ resultId: 'MAT', parameters: { amount: '12.30' } }]);

    component.handleDraftChange({ values: { amount: '20' }, dirty: true });
    allowCreditor = true;
    component.handleFormSubmit({ formData: { [amountId]: '20' }, nestedFlow: false });
    await harness.fixture.whenStable();

    expect(store.orderTerms()).toEqual([{ resultId: 'MAT', parameters: { amount: '20.00' } }]);
    expect(router.url).toBe('/cases/create-casefile/order-terms/creditor');
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
});
