import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSpyObj } from '@app/testing/create-spy-obj.helper';
import { CASES_CREATE_CASEFILE_INDEXATION_TYPES } from '../constants/cases-create-casefile-indexation-types.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileInterestIndexationFormComponent } from './cases-create-casefile-interest-indexation-form/cases-create-casefile-interest-indexation-form.component';
import { CasesCreateCasefileInterestIndexationComponent } from './cases-create-casefile-interest-indexation.component';
import { CASES_CREATE_CASEFILE_INTEREST_INDEXATION_FIELD_NAMES as FIELD_NAMES } from './constants/cases-create-casefile-interest-indexation-field-names.constant';

describe('CasesCreateCasefileInterestIndexationComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileInterestIndexationComponent>;
  let component: CasesCreateCasefileInterestIndexationComponent;
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  const router = createSpyObj(Router, ['navigate']);
  const saved = {
    interestApplies: true,
    indexationType: CASES_CREATE_CASEFILE_INDEXATION_TYPES.RPI,
  } as const;

  const createComponent = (): void => {
    fixture = TestBed.createComponent(CasesCreateCasefileInterestIndexationComponent);
    component = fixture.componentInstance;
  };

  const renderForm = (): CasesCreateCasefileInterestIndexationFormComponent => {
    fixture.detectChanges();

    return fixture.debugElement.query(
      (debugElement) => debugElement.componentInstance instanceof CasesCreateCasefileInterestIndexationFormComponent,
    ).componentInstance as CasesCreateCasefileInterestIndexationFormComponent;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileInterestIndexationComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { parent: null } },
      ],
    }).compileComponents();

    router['navigate'].mockReset();
    store = TestBed.inject(CasesCreateCasefileStore);
    store.resetStore();
  });

  it('supplies empty initial values when nothing has been saved', () => {
    createComponent();

    expect(component.initialFormData).toEqual({
      [FIELD_NAMES.interestApplies]: null,
      [FIELD_NAMES.indexationType]: null,
    });
  });

  it('supplies the last saved state for rehydration', () => {
    store.setInterestAndIndexation(saved);

    createComponent();

    expect(component.initialFormData).toEqual({
      [FIELD_NAMES.interestApplies]: saved.interestApplies,
      [FIELD_NAMES.indexationType]: saved.indexationType,
    });
  });

  it('renders and wires the typed form inside the two-thirds container', () => {
    store.setInterestAndIndexation(saved);
    createComponent();

    const child = renderForm();
    expect(fixture.nativeElement.querySelector('.govuk-grid-column-two-thirds')).not.toBeNull();
    expect(child.initialFormData).toEqual({
      [FIELD_NAMES.interestApplies]: saved.interestApplies,
      [FIELD_NAMES.indexationType]: saved.indexationType,
    });
  });

  it('saves data when the rendered form emits formSubmit', () => {
    createComponent();

    renderForm()['formSubmit'].emit({
      formData: {
        [FIELD_NAMES.interestApplies]: false,
        [FIELD_NAMES.indexationType]: CASES_CREATE_CASEFILE_INDEXATION_TYPES.CPI,
      },
      nestedFlow: false,
    });

    expect(store.interestAndIndexation()).toEqual({ interestApplies: false, indexationType: 'CPI' });
    expect(store.taskStatuses().interestAndIndexation).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.unsavedChanges()).toBe(false);
    expect(component.stateUnsavedChanges).toBe(false);
    expect(router['navigate']).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('tracks dirty state when the rendered form emits unsavedChanges', () => {
    createComponent();

    renderForm()['unsavedChanges'].emit(true);

    expect(store.unsavedChanges()).toBe(true);
    expect(component.stateUnsavedChanges).toBe(true);
    expect(component['canDeactivate']()).toBe(false);
  });

  it('returns to Case details when the rendered form emits cancel', () => {
    store.setInterestAndIndexation(saved);
    createComponent();

    renderForm().cancel.emit();

    expect(store.interestAndIndexation()).toEqual(saved);
    expect(store.unsavedChanges()).toBe(false);
    expect(router['navigate']).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('saves valid data, completes the task, clears dirty state and returns to Case details', () => {
    createComponent();
    component.handleUnsavedChanges(true);

    component.handleFormSubmit({
      formData: {
        [FIELD_NAMES.interestApplies]: false,
        [FIELD_NAMES.indexationType]: CASES_CREATE_CASEFILE_INDEXATION_TYPES.CPI,
      },
      nestedFlow: false,
    });

    expect(store.interestAndIndexation()).toEqual({ interestApplies: false, indexationType: 'CPI' });
    expect(store.taskStatuses().interestAndIndexation).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(true);
    expect(component.stateUnsavedChanges).toBe(false);
    expect(component['canDeactivate']()).toBe(true);
    expect(router['navigate']).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('mirrors form dirty state into the store and parent base class', () => {
    createComponent();

    component.handleUnsavedChanges(true);

    expect(store.unsavedChanges()).toBe(true);
    expect(component.stateUnsavedChanges).toBe(true);
    expect(component['canDeactivate']()).toBe(false);
  });

  it('routes Cancel through protected navigation without replacing the last saved state', () => {
    store.setInterestAndIndexation(saved);
    createComponent();
    component.handleUnsavedChanges(true);

    component.handleCancel();

    expect(store.interestAndIndexation()).toEqual(saved);
    expect(store.unsavedChanges()).toBe(true);
    expect(component['canDeactivate']()).toBe(false);
    expect(router['navigate']).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('clears only transient dirty state during destruction', () => {
    store.setInterestAndIndexation(saved);
    createComponent();
    component.handleUnsavedChanges(true);

    component.ngOnDestroy();

    expect(store.interestAndIndexation()).toEqual(saved);
    expect(store.taskStatuses().interestAndIndexation).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.stateChanges()).toBe(true);
    expect(store.unsavedChanges()).toBe(false);
  });
});
