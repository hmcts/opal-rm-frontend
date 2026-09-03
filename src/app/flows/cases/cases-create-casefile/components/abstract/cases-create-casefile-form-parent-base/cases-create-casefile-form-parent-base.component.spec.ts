import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSpyObj } from '@app/testing/create-spy-obj.helper';
import type { ICasesCreateCasefileCountryReferenceDataResponse } from '../../../services/interfaces/cases-create-casefile-country-reference-data-response.interface';
import { CasesCreateCasefileStore } from '../../../stores/cases-create-casefile.store';
import { CasesCreateCasefileFormParentBaseComponent } from './cases-create-casefile-form-parent-base.component';

@Component({ template: '' })
class TestCasesCreateCasefileFormParentComponent extends CasesCreateCasefileFormParentBaseComponent {
  public submit(save: () => void): void {
    this.completeFormSubmission(save);
  }
}

describe('CasesCreateCasefileFormParentBaseComponent', () => {
  let fixture: ComponentFixture<TestCasesCreateCasefileFormParentComponent>;
  let component: TestCasesCreateCasefileFormParentComponent;
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  const router = createSpyObj(Router, ['navigate']);
  const countriesResponse: ICasesCreateCasefileCountryReferenceDataResponse = {
    count: 2,
    refData: [
      {
        country_id: 826,
        cjs_code: 1,
        country_name: 'United Kingdom',
        date_used_from: '2020-01-01',
        active: true,
      },
      {
        country_id: 250,
        cjs_code: 2,
        country_name: 'France',
        date_used_from: '2020-01-01',
        active: true,
      },
    ],
  };

  const createComponent = (): void => {
    fixture = TestBed.createComponent(TestCasesCreateCasefileFormParentComponent);
    component = fixture.componentInstance;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestCasesCreateCasefileFormParentComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { countries: countriesResponse } }, parent: null } },
      ],
    });

    router['navigate'].mockReset();
    store = TestBed.inject(CasesCreateCasefileStore);
    store.resetStore();
  });

  it('maps resolved Countries for autocomplete and select controls', () => {
    createComponent();

    expect(component.countryAutocompleteItems).toEqual([
      { name: 'United Kingdom', value: 826 },
      { name: 'France', value: 250 },
    ]);
    expect(component.countrySelectOptions).toEqual([
      { name: 'Select', value: '' },
      { name: 'United Kingdom', value: 826 },
      { name: 'France', value: 250 },
    ]);
  });

  it('retains the Select option when the Countries response has no entries', () => {
    const refData = countriesResponse.refData;
    countriesResponse.refData = [];

    try {
      createComponent();

      expect(component.countryAutocompleteItems).toEqual([]);
      expect(component.countrySelectOptions).toEqual([{ name: 'Select', value: '' }]);
    } finally {
      countriesResponse.refData = refData;
    }
  });

  it('tracks dirty state in both the store and the route guard state', () => {
    createComponent();

    component.handleUnsavedChanges(true);

    expect(store.unsavedChanges()).toBe(true);
    expect(component['canDeactivate']()).toBe(false);

    component.handleUnsavedChanges(false);

    expect(store.unsavedChanges()).toBe(false);
    expect(component['canDeactivate']()).toBe(true);
  });

  it('cancels to the task list without clearing dirty state', () => {
    createComponent();
    component.handleUnsavedChanges(true);

    component.handleCancel();

    expect(store.unsavedChanges()).toBe(true);
    expect(component['canDeactivate']()).toBe(false);
    expect(router['navigate']).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('completes a submission by saving, clearing guard state and returning to the task list', () => {
    createComponent();
    component.handleUnsavedChanges(true);
    const save = vi.fn(() => store.setUnsavedChanges(false));

    component.submit(save);

    expect(save).toHaveBeenCalledOnce();
    expect(store.unsavedChanges()).toBe(false);
    expect(component['canDeactivate']()).toBe(true);
    expect(router['navigate']).toHaveBeenCalledWith(['/cases/create-casefile/task-list'], {});
  });

  it('clears only the transient dirty marker when destroyed', () => {
    createComponent();
    component.handleUnsavedChanges(true);

    component.ngOnDestroy();

    expect(store.unsavedChanges()).toBe(false);
  });
});
