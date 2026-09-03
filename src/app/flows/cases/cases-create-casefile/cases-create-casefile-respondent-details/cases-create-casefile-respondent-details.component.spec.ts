import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSpyObj } from '@app/testing/create-spy-obj.helper';
import { CasesCreateCasefileFormParentBaseComponent } from '../components/abstract/cases-create-casefile-form-parent-base/cases-create-casefile-form-parent-base.component';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import type { IOpalMaintenanceCountryReferenceDataResponse } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-country-reference-data-response.interface';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS } from './mocks/cases-create-casefile-respondent-details.mock';
import { CasesCreateCasefileRespondentDetailsComponent } from './cases-create-casefile-respondent-details.component';

describe('CasesCreateCasefileRespondentDetailsComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileRespondentDetailsComponent>;
  let component: CasesCreateCasefileRespondentDetailsComponent;
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  const router = createSpyObj(Router, ['navigate']);
  const countriesResponse: IOpalMaintenanceCountryReferenceDataResponse = {
    count: 2,
    refData: [
      {
        country_id: 1,
        cjs_code: 1,
        country_name: 'United Kingdom',
        date_used_from: '2020-01-01',
        active: true,
      },
      {
        country_id: 2,
        cjs_code: 2,
        country_name: 'France',
        date_used_from: '2020-01-01',
        active: true,
      },
    ],
  };

  const createComponent = (): CasesCreateCasefileRespondentDetailsComponent => {
    fixture = TestBed.createComponent(CasesCreateCasefileRespondentDetailsComponent);
    return fixture.componentInstance;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileRespondentDetailsComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { countries: countriesResponse } }, parent: null } },
      ],
    }).compileComponents();

    router['navigate'].mockReset();
    store = TestBed.inject(CasesCreateCasefileStore);
    store.resetStore();
  });

  it('maps resolved Countries for autocomplete and select controls', () => {
    component = createComponent();

    expect(component).toBeInstanceOf(CasesCreateCasefileFormParentBaseComponent);
    expect(component.countryAutocompleteItems).toEqual([
      { name: 'United Kingdom', value: 1 },
      { name: 'France', value: 2 },
    ]);
    expect(component.countrySelectOptions).toEqual([
      { name: 'Select', value: '' },
      { name: 'United Kingdom', value: 1 },
      { name: 'France', value: 2 },
    ]);
  });

  it('retains the Select option when the Countries response has no entries', () => {
    const refData = countriesResponse.refData;
    countriesResponse.refData = [];

    try {
      component = createComponent();

      expect(component.countryAutocompleteItems).toEqual([]);
      expect(component.countrySelectOptions).toEqual([{ name: 'Select', value: '' }]);
    } finally {
      countriesResponse.refData = refData;
    }
  });

  it('rehydrates the last saved respondent through the mapper', () => {
    store.setRespondentDetails(CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.saved);
    component = createComponent();

    expect(component.initialFormData).toEqual(CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData);
  });

  it('saves a valid respondent and returns to the task list', () => {
    component = createComponent();
    component.handleUnsavedChanges(true);

    component.handleFormSubmit({
      formData: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.validFormData,
      nestedFlow: false,
    });

    expect(store.respondentDetails()).toEqual(CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.saved);
    expect(store.taskStatuses().respondent).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.unsavedChanges()).toBe(false);
    expect(component['canDeactivate']()).toBe(true);
    expect(router['navigate']).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('tracks dirty state and cancels without replacing saved respondent data', () => {
    store.setRespondentDetails(CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.saved);
    component = createComponent();

    component.handleUnsavedChanges(true);
    component.handleCancel();

    expect(store.respondentDetails()).toEqual(CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.saved);
    expect(store.unsavedChanges()).toBe(true);
    expect(component['canDeactivate']()).toBe(false);
    expect(router['navigate']).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('clears only the transient dirty marker after a confirmed route departure', () => {
    store.setRespondentDetails(CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.saved);
    component = createComponent();

    component.handleUnsavedChanges(true);
    component.ngOnDestroy();

    expect(store.respondentDetails()).toEqual(CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.saved);
    expect(store.unsavedChanges()).toBe(false);
  });
});
