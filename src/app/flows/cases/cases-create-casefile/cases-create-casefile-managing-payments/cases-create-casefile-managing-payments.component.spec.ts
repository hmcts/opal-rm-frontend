import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSpyObj } from '@app/testing/create-spy-obj.helper';
import { CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS } from '../constants/cases-create-casefile-payment-arrangements.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileManagingPaymentsFormComponent } from './cases-create-casefile-managing-payments-form/cases-create-casefile-managing-payments-form.component';
import { CasesCreateCasefileManagingPaymentsComponent } from './cases-create-casefile-managing-payments.component';
import { CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES as FIELD_NAMES } from './constants/cases-create-casefile-managing-payments-field-names.constant';

describe('CasesCreateCasefileManagingPaymentsComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileManagingPaymentsComponent>;
  let component: CasesCreateCasefileManagingPaymentsComponent;
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  const router = createSpyObj(Router, ['navigate']);

  const createComponent = (): void => {
    fixture = TestBed.createComponent(CasesCreateCasefileManagingPaymentsComponent);
    component = fixture.componentInstance;
  };

  const renderForm = (): CasesCreateCasefileManagingPaymentsFormComponent => {
    fixture.detectChanges();

    return fixture.debugElement.query(
      (debugElement) => debugElement.componentInstance instanceof CasesCreateCasefileManagingPaymentsFormComponent,
    ).componentInstance as CasesCreateCasefileManagingPaymentsFormComponent;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileManagingPaymentsComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { parent: null } },
      ],
    }).compileComponents();

    router['navigate'].mockReset();
    store = TestBed.inject(CasesCreateCasefileStore);
    store.resetStore();
  });

  it('supplies an empty initial value when nothing has been saved', () => {
    createComponent();

    expect(component.initialFormData).toEqual({ [FIELD_NAMES.paymentArrangement]: null });
  });

  it.each([
    CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT,
    CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.DIRECT,
  ] as const)('supplies saved value %s for rehydration', (paymentArrangement) => {
    store.setPaymentArrangement(paymentArrangement);

    createComponent();

    expect(component.initialFormData).toEqual({ [FIELD_NAMES.paymentArrangement]: paymentArrangement });
  });

  it('renders and wires the typed form inside the two-thirds container', () => {
    store.setPaymentArrangement(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.DIRECT);
    createComponent();

    const child = renderForm();

    expect(fixture.nativeElement.querySelector('.govuk-grid-column-two-thirds')).not.toBeNull();
    expect(child.initialFormData).toEqual({
      [FIELD_NAMES.paymentArrangement]: CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.DIRECT,
    });
  });

  it('saves rendered form data, completes the task and returns to Case details', () => {
    createComponent();

    renderForm()['formSubmit'].emit({
      formData: {
        [FIELD_NAMES.paymentArrangement]: CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT,
      },
      nestedFlow: false,
    });

    expect(store.paymentArrangement()).toBe(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT);
    expect(store.taskStatuses().managingPayments).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(true);
    expect(component.stateUnsavedChanges).toBe(false);
    expect(router['navigate']).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('mirrors rendered form dirty state into the store and parent base class', () => {
    createComponent();

    renderForm()['unsavedChanges'].emit(true);

    expect(store.unsavedChanges()).toBe(true);
    expect(component.stateUnsavedChanges).toBe(true);
    expect(component['canDeactivate']()).toBe(false);
  });

  it('routes rendered Cancel through protected navigation without replacing saved state', () => {
    store.setPaymentArrangement(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.DIRECT);
    createComponent();
    component.handleUnsavedChanges(true);

    renderForm().cancel.emit();

    expect(store.paymentArrangement()).toBe(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.DIRECT);
    expect(store.unsavedChanges()).toBe(true);
    expect(component['canDeactivate']()).toBe(false);
    expect(router['navigate']).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('saves valid data, clears parent dirty state and permits deactivation', () => {
    createComponent();
    component.handleUnsavedChanges(true);

    component.handleFormSubmit({
      formData: {
        [FIELD_NAMES.paymentArrangement]: CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.DIRECT,
      },
      nestedFlow: false,
    });

    expect(store.paymentArrangement()).toBe(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.DIRECT);
    expect(store.unsavedChanges()).toBe(false);
    expect(component.stateUnsavedChanges).toBe(false);
    expect(component['canDeactivate']()).toBe(true);
    expect(router['navigate']).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('routes clean Cancel directly to Case details', () => {
    createComponent();

    component.handleCancel();

    expect(store.paymentArrangement()).toBeNull();
    expect(store.unsavedChanges()).toBe(false);
    expect(router['navigate']).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('clears only transient dirty state during destruction', () => {
    store.setPaymentArrangement(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT);
    createComponent();
    component.handleUnsavedChanges(true);

    component.ngOnDestroy();

    expect(store.paymentArrangement()).toBe(CASES_CREATE_CASEFILE_PAYMENT_ARRANGEMENTS.COURT);
    expect(store.taskStatuses().managingPayments).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.stateChanges()).toBe(true);
    expect(store.unsavedChanges()).toBe(false);
  });
});
