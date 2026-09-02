import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from '../constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES } from '../constants/cases-create-casefile-state.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import type { CasesCreateCasefileCaseTypeSelection } from '../types/cases-create-casefile-case-type-selection.type';
import type { CasesCreateCasefileTask } from '../types/cases-create-casefile-task.type';
import { CasesCreateCasefileStore } from './cases-create-casefile.store';

describe('CasesCreateCasefileStore', () => {
  let store: InstanceType<typeof CasesCreateCasefileStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(CasesCreateCasefileStore);
    store.resetStore();
  });

  const provide = (...tasks: CasesCreateCasefileTask[]): void => {
    tasks.forEach((task) => store.setTaskStatus(task, CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED));
  };

  it('starts without default business values', () => {
    expect(store.caseTypeSelection()).toBeNull();
    expect(store.caseTypeComplete()).toBe(false);
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(false);
  });

  it('starts mandatory tasks as Required and optional tasks as Optional', () => {
    expect(store.taskStatuses()).toEqual({
      respondent: 'Required',
      applicant: 'Required',
      centralAuthority: 'Optional',
      orderDetails: 'Required',
      orderTerms: 'Required',
      interestAndIndexation: 'Required',
      managingPayments: 'Required',
      commentsAndNotes: 'Optional',
    });
    expect(store.partyDetailsComplete()).toBe(false);
    expect(store.orderDetailsAvailable()).toBe(false);
    expect(store.remainingOrderTasksAvailable()).toBe(false);
    expect(store.checkCaseAvailable()).toBe(false);
  });

  it('unlocks Order details only after Respondent and Applicant are Provided', () => {
    provide('respondent');
    expect(store.orderDetailsAvailable()).toBe(false);

    provide('applicant');
    expect(store.partyDetailsComplete()).toBe(true);
    expect(store.orderDetailsAvailable()).toBe(true);
    expect(store.remainingOrderTasksAvailable()).toBe(false);
  });

  it('unlocks the remaining Order tasks after Order details is Provided', () => {
    provide('respondent', 'applicant', 'orderDetails');

    expect(store.remainingOrderTasksAvailable()).toBe(true);
  });

  it('makes Check case available after all mandatory tasks are Provided', () => {
    provide('respondent', 'applicant', 'orderDetails', 'orderTerms', 'interestAndIndexation', 'managingPayments');

    expect(store.checkCaseAvailable()).toBe(true);
    expect(store.taskStatuses().centralAuthority).toBe('Optional');
    expect(store.taskStatuses().commentsAndNotes).toBe('Optional');
  });

  it('updates task statuses immutably', () => {
    const initialTaskStatuses = store.taskStatuses();

    store.setTaskStatus('respondent', CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);

    expect(store.taskStatuses()).not.toBe(initialTaskStatuses);
    expect(initialTaskStatuses.respondent).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED);
    expect(store.taskStatuses().respondent).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
  });

  it('allows optional tasks to become Provided without gating Check case', () => {
    provide(
      'respondent',
      'applicant',
      'orderDetails',
      'orderTerms',
      'interestAndIndexation',
      'managingPayments',
      'centralAuthority',
      'commentsAndNotes',
    );

    expect(store.taskStatuses().centralAuthority).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.taskStatuses().commentsAndNotes).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.checkCaseAvailable()).toBe(true);
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

  it('resets task progress when the submitted Case Type changes', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    provide('respondent', 'applicant', 'orderDetails');

    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS });

    expect(store.taskStatuses()).toEqual(CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES);
  });

  it('resets task progress when the submitted REMO In Applicant Type changes', () => {
    store.setCaseTypeSelection({
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
    });
    provide('respondent', 'applicant', 'orderDetails');

    store.setCaseTypeSelection({
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
    });

    expect(store.taskStatuses()).toEqual(CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES);
  });

  it('preserves task progress when the submitted Case Type selection is unchanged', () => {
    const selection = {
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
    } as const;
    store.setCaseTypeSelection(selection);
    provide('respondent', 'applicant', 'orderDetails');

    store.setCaseTypeSelection(selection);

    expect(store.taskStatuses().respondent).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.taskStatuses().applicant).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.taskStatuses().orderDetails).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
  });

  it('preserves task progress when the submitted outbound Case Type is unchanged', () => {
    const selection = { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT } as const;
    store.setCaseTypeSelection(selection);
    provide('respondent', 'applicant', 'orderDetails');

    store.setCaseTypeSelection(selection);

    expect(store.taskStatuses().respondent).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.taskStatuses().applicant).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    expect(store.taskStatuses().orderDetails).toBe(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
  });

  it.each([
    [
      'REMO In with Individual',
      {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
      },
      true,
    ],
    [
      'REMO In with Organisation',
      {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
      },
      true,
    ],
    ['REMO Out without Applicant Type', { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT }, true],
    ['REMO Out (CMS) without Applicant Type', { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS }, true],
    ['null', null as unknown as CasesCreateCasefileCaseTypeSelection, false],
    [
      'REMO In without Applicant Type',
      { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN } as unknown as CasesCreateCasefileCaseTypeSelection,
      false,
    ],
    [
      'REMO In with an unsupported Applicant Type',
      {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
        applicantType: 'Unsupported',
      } as unknown as CasesCreateCasefileCaseTypeSelection,
      false,
    ],
    [
      'REMO Out carrying Applicant Type',
      {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
      } as unknown as CasesCreateCasefileCaseTypeSelection,
      false,
    ],
    [
      'REMO Out (CMS) carrying Applicant Type',
      {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
      } as unknown as CasesCreateCasefileCaseTypeSelection,
      false,
    ],
    ['an unsupported Case Type', { caseType: 'Unsupported' } as unknown as CasesCreateCasefileCaseTypeSelection, false],
  ])('marks %s selection complete: %s', (_description, selection, expectedComplete) => {
    store.setCaseTypeSelection(selection);

    expect(store.caseTypeComplete()).toBe(expectedComplete);
  });

  it('preserves only Case Type as unsaved screen data when returning to Case Type', () => {
    const selection = {
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
    } as const;
    store.setCaseTypeSelection(selection);
    provide('respondent', 'applicant', 'centralAuthority', 'orderDetails');

    store.resetForCaseTypeEdit();

    expect(store.caseTypeSelection()).toEqual(selection);
    expect(store.taskStatuses()).toEqual(CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES);
    expect(store.stateChanges()).toBe(false);
    expect(store.unsavedChanges()).toBe(true);
  });

  it('resets the complete journey state', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    provide('respondent', 'centralAuthority');
    store.setUnsavedChanges(true);

    store.resetStore();

    expect(store.caseTypeSelection()).toBeNull();
    expect(store.caseTypeComplete()).toBe(false);
    expect(store.unsavedChanges()).toBe(false);
    expect(store.stateChanges()).toBe(false);
    expect(store.taskStatuses()).toEqual(CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES);
  });
});
