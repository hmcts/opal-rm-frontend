import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from '../constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import { CasesCreateCasefileStore } from './cases-create-casefile.store';

describe('CasesCreateCasefileStore', () => {
  let store: InstanceType<typeof CasesCreateCasefileStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(CasesCreateCasefileStore);
    store.resetStore();
  });

  it('starts without default business values', () => {
    expect(store.caseTypeSelection()).toBeNull();
    expect(store.caseTypeComplete()).toBe(false);
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(false);
  });

  it('saves a valid REMO In selection and clears unsaved state', () => {
    store.setUnsavedChanges(true);
    store.setCaseTypeSelection({
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
    });

    expect(store.caseTypeSelection()).toEqual({
      caseType: 'REMO In',
      applicantType: 'Individual',
    });
    expect(store.caseTypeComplete()).toBe(true);
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(true);
  });

  it('saves an outbound selection without an applicant type', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS });

    expect(store.caseTypeSelection()).toEqual({ caseType: 'REMO Out (CMS)' });
    expect(store.caseTypeSelection()).not.toHaveProperty('applicantType');
  });

  it('resets the complete journey state', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setUnsavedChanges(true);

    store.resetStore();

    expect(store.caseTypeSelection()).toBeNull();
    expect(store.caseTypeComplete()).toBe(false);
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(false);
  });
});
