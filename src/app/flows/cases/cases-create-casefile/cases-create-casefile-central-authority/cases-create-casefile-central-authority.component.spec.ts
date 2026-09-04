import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IOpalMaintenanceMajorCreditorReferenceDataItem } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-item.interface';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CASES_CREATE_CASEFILE_CENTRAL_AUTHORITY_FIELD_NAMES as FIELD_NAMES } from './constants/cases-create-casefile-central-authority-field-names.constant';
import { CasesCreateCasefileCentralAuthorityFormComponent } from './cases-create-casefile-central-authority-form/cases-create-casefile-central-authority-form.component';
import { CasesCreateCasefileCentralAuthorityComponent } from './cases-create-casefile-central-authority.component';

describe('CasesCreateCasefileCentralAuthorityComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileCentralAuthorityComponent>;
  let component: CasesCreateCasefileCentralAuthorityComponent;
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  const route = { snapshot: { data: {} as Record<string, unknown> } };
  const router = { navigate: vi.fn() };
  const first: IOpalMaintenanceMajorCreditorReferenceDataItem = {
    major_creditor_id: 101,
    business_unit_id: 1,
    major_creditor_code: '0123',
    name: 'Central Authority One',
    address_line_1: 'First address',
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
    central_authority: true,
  };
  const second: IOpalMaintenanceMajorCreditorReferenceDataItem = {
    ...first,
    major_creditor_id: 202,
    major_creditor_code: '0456',
    name: 'Central Authority Two',
  };
  const missing: IOpalMaintenanceMajorCreditorReferenceDataItem = {
    ...first,
    major_creditor_id: 303,
    major_creditor_code: '0789',
    name: 'Missing Central Authority',
  };
  const centralAuthorities: IOpalMaintenanceMajorCreditorReferenceDataResponse = {
    count: 2,
    refData: [first, second],
  };

  const createComponent = (): void => {
    fixture = TestBed.createComponent(CasesCreateCasefileCentralAuthorityComponent);
    component = fixture.componentInstance;
  };

  const renderForm = (): CasesCreateCasefileCentralAuthorityFormComponent => {
    fixture.detectChanges();
    return fixture.debugElement.query(By.directive(CasesCreateCasefileCentralAuthorityFormComponent)).componentInstance;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileCentralAuthorityComponent],
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        CasesCreateCasefileStore,
      ],
    }).compileComponents();

    store = TestBed.inject(CasesCreateCasefileStore);
    store.resetStore();
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setTaskStatus('respondent', CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    route.snapshot.data = { centralAuthorities };
    router.navigate.mockClear();
  });

  it('maps resolved records in response order and renders the child in the two-thirds column', () => {
    createComponent();
    const child = renderForm();

    expect(component.centralAuthorityAutocompleteItems).toEqual([
      { value: first.major_creditor_id, name: '0123 - Central Authority One' },
      { value: second.major_creditor_id, name: '0456 - Central Authority Two' },
    ]);
    expect(child.initialFormData).toEqual({
      [FIELD_NAMES.remoReference]: null,
      [FIELD_NAMES.centralAuthorityReference]: null,
      [FIELD_NAMES.majorCreditorId]: null,
    });
    expect(fixture.nativeElement.querySelector('.govuk-grid-column-two-thirds')).not.toBeNull();
    expect(fixture.debugElement.queryAll(By.directive(CasesCreateCasefileCentralAuthorityFormComponent))).toHaveLength(
      1,
    );
  });

  it('refreshes a saved selection from resolved data without making the form dirty', () => {
    store.setCentralAuthorityDetails({
      remoReference: 'REMO-1',
      centralAuthorityReference: 'CA-1',
      majorCreditor: { ...first, name: 'Stale name' },
    });

    createComponent();

    expect(store.centralAuthorityDetails()?.majorCreditor).toBe(first);
    expect(component.initialFormData[FIELD_NAMES.majorCreditorId]).toBe(first.major_creditor_id);
    expect(store.unsavedChanges()).toBe(false);
    expect(component.stateUnsavedChanges).toBeFalsy();
  });

  it('clears an inactive saved selection from form and store while retaining references', () => {
    store.setCentralAuthorityDetails({
      remoReference: 'REMO-1',
      centralAuthorityReference: 'CA-1',
      majorCreditor: missing,
    });

    createComponent();

    expect(component.initialFormData).toEqual({
      [FIELD_NAMES.remoReference]: 'REMO-1',
      [FIELD_NAMES.centralAuthorityReference]: 'CA-1',
      [FIELD_NAMES.majorCreditorId]: null,
    });
    expect(store.centralAuthorityDetails()).toEqual({
      remoReference: 'REMO-1',
      centralAuthorityReference: 'CA-1',
      majorCreditor: null,
    });
    expect(store.unsavedChanges()).toBe(false);
  });

  it('recomputes the task as Optional when a missing saved authority was the only value', () => {
    store.setCentralAuthorityDetails({ remoReference: null, centralAuthorityReference: null, majorCreditor: missing });

    createComponent();

    expect(store.centralAuthorityDetails()).toEqual({
      remoReference: null,
      centralAuthorityReference: null,
      majorCreditor: null,
    });
    expect(store.taskStatuses().centralAuthority).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL);
    expect(store.unsavedChanges()).toBe(false);
  });

  it('saves valid form data atomically, clears dirty state and returns to Case details', () => {
    createComponent();
    component.handleUnsavedChanges(true);

    component.handleFormSubmit({
      formData: {
        [FIELD_NAMES.remoReference]: 'REMO-1',
        [FIELD_NAMES.centralAuthorityReference]: 'CA-1',
        [FIELD_NAMES.majorCreditorId]: second.major_creditor_id,
      },
      nestedFlow: false,
    });

    expect(store.centralAuthorityDetails()).toEqual({
      remoReference: 'REMO-1',
      centralAuthorityReference: 'CA-1',
      majorCreditor: second,
    });
    expect(store.taskStatuses().centralAuthority).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(component.stateUnsavedChanges).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it.each(['handleBack', 'handleCancel'] as const)(
    '%s requests guarded Case details navigation without saving edits',
    (method) => {
      store.setCentralAuthorityDetails({
        remoReference: 'SAVED',
        centralAuthorityReference: null,
        majorCreditor: first,
      });
      createComponent();
      component.handleUnsavedChanges(true);

      component[method]();

      expect(store.centralAuthorityDetails()?.remoReference).toBe('SAVED');
      expect(store.unsavedChanges()).toBe(true);
      expect(component['canDeactivate']()).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
    },
  );

  it('mirrors form dirty state into the store and base guard state', () => {
    createComponent();

    component.handleUnsavedChanges(true);

    expect(store.unsavedChanges()).toBe(true);
    expect(component.stateUnsavedChanges).toBe(true);
    expect(component['canDeactivate']()).toBe(false);
  });

  it('clears only transient dirty state when destroyed', () => {
    store.setCentralAuthorityDetails({ remoReference: 'SAVED', centralAuthorityReference: null, majorCreditor: first });
    createComponent();
    component.handleUnsavedChanges(true);

    component.ngOnDestroy();

    expect(store.centralAuthorityDetails()?.remoReference).toBe('SAVED');
    expect(store.unsavedChanges()).toBe(false);
  });
});
