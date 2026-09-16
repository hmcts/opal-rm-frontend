import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IOpalMaintenanceApplicationReferenceDataItem } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-application-reference-data-item.interface';
import type { IOpalMaintenanceApplicationReferenceDataResponse } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-application-reference-data-response.interface';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileOrderDetailsFormComponent } from './cases-create-casefile-order-details-form/cases-create-casefile-order-details-form.component';
import { CasesCreateCasefileOrderDetailsComponent } from './cases-create-casefile-order-details.component';
import { CASES_CREATE_CASEFILE_ORDER_DETAILS_FIELD_NAMES as FIELD_NAMES } from './constants/cases-create-casefile-order-details-field-names.constant';

describe('CasesCreateCasefileOrderDetailsComponent', () => {
  const first: IOpalMaintenanceApplicationReferenceDataItem = {
    application_id: 901,
    application_code: 'TEST01',
    application_title: 'Synthetic application',
    application_group: 'Synthetic group',
    active: true,
  };
  const second: IOpalMaintenanceApplicationReferenceDataItem = {
    ...first,
    application_id: 902,
    application_code: 'TEST02',
    application_title: 'Second application',
  };
  const applications: IOpalMaintenanceApplicationReferenceDataResponse = { count: 2, refData: [first, second] };
  const route = { snapshot: { data: { applications } } };
  const router = { navigate: vi.fn() };
  let fixture: ComponentFixture<CasesCreateCasefileOrderDetailsComponent>;
  let component: CasesCreateCasefileOrderDetailsComponent;
  let store: InstanceType<typeof CasesCreateCasefileStore>;

  const createComponent = (): void => {
    fixture = TestBed.createComponent(CasesCreateCasefileOrderDetailsComponent);
    component = fixture.componentInstance;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileOrderDetailsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        CasesCreateCasefileStore,
      ],
    }).compileComponents();
    store = TestBed.inject(CasesCreateCasefileStore);
    store.resetStore();
    router.navigate.mockClear();
  });

  it('maps resolved applications in response order and renders the restored form in the two-thirds column', () => {
    store.setOrderDetails({
      applicationId: first.application_id,
      court: 'Test Court',
      dateOrderMade: null,
      paymentFrequency: 'Monthly',
      dateArrearsLastUpdated: '2026-09-15',
    });
    createComponent();
    fixture.detectChanges();
    const child = fixture.debugElement.query(By.directive(CasesCreateCasefileOrderDetailsFormComponent))
      .componentInstance as CasesCreateCasefileOrderDetailsFormComponent;

    expect(component.applicationAutocompleteItems).toEqual([
      { name: 'TEST01 - Synthetic application', value: 901 },
      { name: 'TEST02 - Second application', value: 902 },
    ]);
    expect(child.initialFormData).toEqual({
      [FIELD_NAMES.applicationId]: 901,
      [FIELD_NAMES.court]: 'Test Court',
      [FIELD_NAMES.dateOrderMade]: null,
      [FIELD_NAMES.paymentFrequency]: 'Monthly',
      [FIELD_NAMES.dateArrearsLastUpdated]: '15/09/2026',
    });
    expect(fixture.nativeElement.querySelector('.govuk-grid-column-two-thirds')).not.toBeNull();
    expect(fixture.debugElement.queryAll(By.directive(CasesCreateCasefileOrderDetailsFormComponent))).toHaveLength(1);
    expect(store.orderDetails()?.applicationId).toBe(901);
    expect(store.unsavedChanges()).toBe(false);
  });

  it('restores a stale saved application ID without mutating the saved section', () => {
    store.setOrderDetails({
      applicationId: 999,
      court: 'Saved Court',
      dateOrderMade: null,
      paymentFrequency: 'Monthly',
      dateArrearsLastUpdated: '2026-09-15',
    });
    createComponent();

    expect(component.initialFormData[FIELD_NAMES.applicationId]).toBe(999);
    expect(store.orderDetails()?.applicationId).toBe(999);
    expect(store.taskStatuses().orderDetails).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.unsavedChanges()).toBe(false);
  });

  it('saves valid form data once, clears dirty state and returns to Case details without a prompt', () => {
    createComponent();
    const setOrderDetails = vi.spyOn(store, 'setOrderDetails');
    component.handleUnsavedChanges(true);

    component.handleFormSubmit({
      formData: {
        [FIELD_NAMES.applicationId]: String(second.application_id),
        [FIELD_NAMES.court]: '  Test Court  ',
        [FIELD_NAMES.dateOrderMade]: null,
        [FIELD_NAMES.paymentFrequency]: 'Monthly',
        [FIELD_NAMES.dateArrearsLastUpdated]: '15/09/2026',
      },
      nestedFlow: false,
    });

    expect(setOrderDetails).toHaveBeenCalledOnce();
    expect(store.orderDetails()).toEqual({
      applicationId: second.application_id,
      court: 'Test Court',
      dateOrderMade: null,
      paymentFrequency: 'Monthly',
      dateArrearsLastUpdated: '2026-09-15',
    });
    expect(component.stateUnsavedChanges).toBe(false);
    expect(component['canDeactivate']()).toBe(true);
    expect(router.navigate).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('does not save stale application IDs', () => {
    createComponent();
    const setOrderDetails = vi.spyOn(store, 'setOrderDetails');

    expect(() =>
      component.handleFormSubmit({
        formData: {
          [FIELD_NAMES.applicationId]: 999,
          [FIELD_NAMES.court]: null,
          [FIELD_NAMES.dateOrderMade]: null,
          [FIELD_NAMES.paymentFrequency]: 'Monthly',
          [FIELD_NAMES.dateArrearsLastUpdated]: '15/09/2026',
        },
        nestedFlow: false,
      }),
    ).toThrow('Invalid Order Details selection');
    expect(setOrderDetails).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('requests guarded Cancel navigation without saving edits', () => {
    store.setOrderDetails({
      applicationId: first.application_id,
      court: 'Saved Court',
      dateOrderMade: null,
      paymentFrequency: 'Monthly',
      dateArrearsLastUpdated: '2026-09-15',
    });
    createComponent();
    const setOrderDetails = vi.spyOn(store, 'setOrderDetails');
    component.handleUnsavedChanges(true);

    component.handleCancel();

    expect(setOrderDetails).not.toHaveBeenCalled();
    expect(store.orderDetails()?.court).toBe('Saved Court');
    expect(store.unsavedChanges()).toBe(true);
    expect(component['canDeactivate']()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('mirrors dirty state into the store and clears only transient state on destruction', () => {
    createComponent();
    component.handleUnsavedChanges(true);

    expect(store.unsavedChanges()).toBe(true);
    expect(component.stateUnsavedChanges).toBe(true);
    component.ngOnDestroy();
    expect(store.unsavedChanges()).toBe(false);
  });
});
