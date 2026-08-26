import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { patchState, WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSpyObj } from '@app/testing/create-spy-obj.helper';
import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from '../constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES } from '../constants/cases-create-casefile-state.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileCaseTypeComponent } from './cases-create-casefile-case-type.component';

describe('CasesCreateCasefileCaseTypeComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileCaseTypeComponent>;
  let component: CasesCreateCasefileCaseTypeComponent;
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  const router = createSpyObj(Router, ['navigate']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileCaseTypeComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { parent: null } },
      ],
    }).compileComponents();

    router['navigate'].mockReset();
    fixture = TestBed.createComponent(CasesCreateCasefileCaseTypeComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(CasesCreateCasefileStore);
    store.resetStore();
    fixture.detectChanges();
  });

  it('exposes null initial form data', () => {
    expect(component.initialFormData).toEqual({ caseType: null, applicantType: null });
  });

  it('rehydrates a valid saved REMO In selection', () => {
    store.setCaseTypeSelection({
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
    });

    expect(component.initialFormData).toEqual({ caseType: 'REMO In', applicantType: 'Individual' });
  });

  it('rehydrates valid saved outbound selections without Applicant Type', () => {
    for (const caseType of [CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT, CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS]) {
      store.setCaseTypeSelection({ caseType });

      expect(component.initialFormData).toEqual({ caseType, applicantType: null });
    }
  });

  it('does not rehydrate stale runtime selections', () => {
    const staleStore = store as unknown as WritableStateSource<ICasesCreateCasefileState>;

    patchState(staleStore, {
      caseTypeSelection: { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN } as unknown as ReturnType<
        typeof store.caseTypeSelection
      >,
    });

    expect(component.initialFormData).toEqual({ caseType: null, applicantType: null });

    patchState(staleStore, {
      caseTypeSelection: {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
        applicantType: 'Unknown applicant type',
      } as unknown as ReturnType<typeof store.caseTypeSelection>,
    });

    expect(component.initialFormData).toEqual({ caseType: null, applicantType: null });

    patchState(staleStore, {
      caseTypeSelection: {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
      } as unknown as ReturnType<typeof store.caseTypeSelection>,
    });

    expect(component.initialFormData).toEqual({ caseType: null, applicantType: null });

    patchState(staleStore, {
      caseTypeSelection: { caseType: 'Unknown case type' } as unknown as ReturnType<typeof store.caseTypeSelection>,
    });

    expect(component.initialFormData).toEqual({ caseType: null, applicantType: null });
  });

  it('normalizes and saves REMO In before requesting Task List navigation', () => {
    component.handleFormSubmit({
      formData: {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
      },
      nestedFlow: false,
    });

    expect(store.caseTypeSelection()).toEqual({ caseType: 'REMO In', applicantType: 'Organisation' });
    expect(router['navigate']).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('removes Applicant Type from an outbound selection', () => {
    component.handleFormSubmit({
      formData: {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
      },
      nestedFlow: false,
    });

    expect(store.caseTypeSelection()).toEqual({ caseType: 'REMO Out' });
    expect(store.caseTypeSelection()).not.toHaveProperty('applicantType');
  });

  it('clears downstream task progress when a different Case Type is submitted after returning directly', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setTaskStatus('respondent', CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    store.setTaskStatus('applicant', CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);

    component.handleFormSubmit({
      formData: {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS,
        applicantType: null,
      },
      nestedFlow: false,
    });

    expect(store.taskStatuses()).toEqual(CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES);
    expect(router['navigate']).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('does not save or navigate for invalid runtime form values', () => {
    component.handleFormSubmit({
      formData: {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
        applicantType: 'Unknown applicant type',
      },
      nestedFlow: false,
    } as unknown as Parameters<CasesCreateCasefileCaseTypeComponent['handleFormSubmit']>[0]);

    component.handleFormSubmit({
      formData: {
        caseType: 'Unknown case type',
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
      },
      nestedFlow: false,
    } as unknown as Parameters<CasesCreateCasefileCaseTypeComponent['handleFormSubmit']>[0]);

    expect(store.caseTypeSelection()).toBeNull();
    expect(router['navigate']).not.toHaveBeenCalled();
  });

  it('tracks dirty state in the page and store', () => {
    component.handleUnsavedChanges(true);

    expect(component.stateUnsavedChanges).toBe(true);
    expect(store.unsavedChanges()).toBe(true);
  });

  it('clears dirty state in the page and store after a valid submit', () => {
    component.handleUnsavedChanges(true);

    component.handleFormSubmit({
      formData: {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS,
        applicantType: null,
      },
      nestedFlow: false,
    });

    expect(component.stateUnsavedChanges).toBe(false);
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(true);
  });

  it('cancels to the Cases dashboard', () => {
    component.handleCancel();

    expect(router['navigate']).toHaveBeenCalledWith(['/dashboard/cases'], {});
  });
});
