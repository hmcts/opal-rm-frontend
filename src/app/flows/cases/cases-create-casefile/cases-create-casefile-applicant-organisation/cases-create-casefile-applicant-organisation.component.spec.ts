import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSpyObj } from '@app/testing/create-spy-obj.helper';
import { CasesCreateCasefileFormParentBaseComponent } from '../components/abstract/cases-create-casefile-form-parent-base/cases-create-casefile-form-parent-base.component';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS } from '../cases-create-casefile-applicant-individual/mocks/cases-create-casefile-applicant-individual.mock';
import type { ICasesCreateCasefileCountryReferenceDataResponse } from '../services/interfaces/cases-create-casefile-country-reference-data-response.interface';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileApplicantOrganisationFormComponent } from './cases-create-casefile-applicant-organisation-form/cases-create-casefile-applicant-organisation-form.component';
import { CasesCreateCasefileApplicantOrganisationComponent } from './cases-create-casefile-applicant-organisation.component';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS } from './mocks/cases-create-casefile-applicant-organisation.mock';

describe('CasesCreateCasefileApplicantOrganisationComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileApplicantOrganisationComponent>;
  let component: CasesCreateCasefileApplicantOrganisationComponent;
  let httpTestingController: HttpTestingController;
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  const router = createSpyObj(Router, ['navigate']);
  const countriesResponse: ICasesCreateCasefileCountryReferenceDataResponse = {
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

  const createComponent = (): CasesCreateCasefileApplicantOrganisationComponent => {
    fixture = TestBed.createComponent(CasesCreateCasefileApplicantOrganisationComponent);
    return fixture.componentInstance;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileApplicantOrganisationComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { countries: countriesResponse } }, parent: null } },
      ],
    }).compileComponents();

    router['navigate'].mockReset();
    httpTestingController = TestBed.inject(HttpTestingController);
    store = TestBed.inject(CasesCreateCasefileStore);
    store.resetStore();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('maps resolved Countries into accessible-autocomplete items', () => {
    component = createComponent();

    expect(component).toBeInstanceOf(CasesCreateCasefileFormParentBaseComponent);
    expect(component.countryAutocompleteItems).toEqual([
      { name: 'United Kingdom', value: 1 },
      { name: 'France', value: 2 },
    ]);
  });

  it('uses empty form data when the store contains an Individual applicant', () => {
    store.setApplicantDetails(CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.saved);
    component = createComponent();

    expect(component.initialFormData).toEqual(CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.emptyFormData);
  });

  it('rehydrates the last saved Organisation applicant through the mapper', () => {
    store.setApplicantDetails(CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedUk);
    component = createComponent();

    expect(component.initialFormData).toEqual(CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validUkFormData);
  });

  it('renders the form inside the two-thirds container and wires both inputs', () => {
    component = createComponent();

    fixture.detectChanges();

    const child = fixture.debugElement.query(
      (debugElement) => debugElement.componentInstance instanceof CasesCreateCasefileApplicantOrganisationFormComponent,
    ).componentInstance as CasesCreateCasefileApplicantOrganisationFormComponent;
    expect(fixture.nativeElement.querySelector('.govuk-grid-column-two-thirds')).not.toBeNull();
    expect(child.initialFormData).toEqual(component.initialFormData);
    expect(child.countryAutocompleteItems).toEqual(component.countryAutocompleteItems);
  });

  it('saves valid Organisation data, marks Applicant Provided and returns without HTTP', () => {
    component = createComponent();
    component.handleUnsavedChanges(true);

    component.handleFormSubmit({
      formData: CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.validUkFormData,
      nestedFlow: false,
    });

    expect(store.applicantDetails()).toEqual(CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedUk);
    expect(store.taskStatuses().applicant).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.unsavedChanges()).toBe(false);
    expect(component['canDeactivate']()).toBe(true);
    expect(router['navigate']).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
    expect(httpTestingController.match(() => true)).toEqual([]);
  });

  it('tracks dirty state and Cancel preserves the last saved applicant', () => {
    store.setApplicantDetails(CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedUk);
    component = createComponent();

    component.handleUnsavedChanges(true);
    component.handleCancel();

    expect(store.applicantDetails()).toEqual(CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedUk);
    expect(store.unsavedChanges()).toBe(true);
    expect(component['canDeactivate']()).toBe(false);
    expect(router['navigate']).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('clears only transient dirty state during destruction', () => {
    store.setApplicantDetails(CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedUk);
    component = createComponent();

    component.handleUnsavedChanges(true);
    component.ngOnDestroy();

    expect(store.applicantDetails()).toEqual(CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedUk);
    expect(store.taskStatuses().applicant).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.unsavedChanges()).toBe(false);
  });
});
