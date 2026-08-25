import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import {
  CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES,
  CASES_CREATE_CASEFILE_STATE,
} from '../constants/cases-create-casefile-state.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import type { CasesCreateCasefileCaseTypeSelection } from '../types/cases-create-casefile-case-type-selection.type';
import type { CasesCreateCasefileTaskStatus } from '../types/cases-create-casefile-task-status.type';
import type { CasesCreateCasefileTask } from '../types/cases-create-casefile-task.type';
import { isCasesCreateCasefileCaseTypeSelectionValid } from '../utils/cases-create-casefile-case-type-selection';

export const CasesCreateCasefileStore = signalStore(
  { providedIn: 'root' },
  withState({ ...CASES_CREATE_CASEFILE_STATE, taskStatuses: { ...CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES } }),
  withComputed((store) => {
    const partyDetailsComplete = computed(
      () =>
        store.taskStatuses().respondent === CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED &&
        store.taskStatuses().applicant === CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED,
    );
    const orderDetailsAvailable = computed(() => partyDetailsComplete());
    const remainingOrderTasksAvailable = computed(
      () =>
        partyDetailsComplete() && store.taskStatuses().orderDetails === CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED,
    );
    const checkCaseAvailable = computed(() =>
      [
        store.taskStatuses().respondent,
        store.taskStatuses().applicant,
        store.taskStatuses().orderDetails,
        store.taskStatuses().orderTerms,
        store.taskStatuses().interestAndIndexation,
        store.taskStatuses().managingPayments,
      ].every((status) => status === CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED),
    );

    return {
      caseTypeComplete: computed(() => isCasesCreateCasefileCaseTypeSelectionValid(store.caseTypeSelection())),
      partyDetailsComplete,
      orderDetailsAvailable,
      remainingOrderTasksAvailable,
      checkCaseAvailable,
    };
  }),
  withMethods((store) => ({
    setCaseTypeSelection: (caseTypeSelection: CasesCreateCasefileCaseTypeSelection): void => {
      patchState(store, { caseTypeSelection, stateChanges: true, unsavedChanges: false });
    },
    setTaskStatus: (task: CasesCreateCasefileTask, status: CasesCreateCasefileTaskStatus): void => {
      patchState(store, {
        taskStatuses: { ...store.taskStatuses(), [task]: status },
        stateChanges: true,
        unsavedChanges: false,
      });
    },
    setUnsavedChanges: (unsavedChanges: boolean): void => {
      patchState(store, { unsavedChanges });
    },
    resetForCaseTypeEdit: (): void => {
      const caseTypeSelection = store.caseTypeSelection();
      const validSelection = isCasesCreateCasefileCaseTypeSelectionValid(caseTypeSelection) ? caseTypeSelection : null;

      patchState(store, {
        ...CASES_CREATE_CASEFILE_STATE,
        taskStatuses: { ...CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES },
        caseTypeSelection: validSelection,
        unsavedChanges: validSelection !== null,
        stateChanges: false,
      });
    },
    resetStore: (): void => {
      patchState(store, {
        ...CASES_CREATE_CASEFILE_STATE,
        taskStatuses: { ...CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES },
      });
    },
  })),
);
