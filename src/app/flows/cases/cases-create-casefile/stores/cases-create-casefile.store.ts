import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import {
  CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES,
  CASES_CREATE_CASEFILE_STATE,
} from '../constants/cases-create-casefile-state.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import type { ICasesCreateCasefileInterestIndexation } from '../interfaces/cases-create-casefile-interest-indexation.interface';
import type { ICasesCreateCasefileRespondentDetails } from '../interfaces/cases-create-casefile-respondent-details.interface';
import type { CasesCreateCasefileApplicantDetails } from '../types/cases-create-casefile-applicant-details.type';
import type { CasesCreateCasefileCaseTypeSelection } from '../types/cases-create-casefile-case-type-selection.type';
import type { CasesCreateCasefilePaymentArrangement } from '../types/cases-create-casefile-payment-arrangement.type';
import type { CasesCreateCasefileTaskStatus } from '../types/cases-create-casefile-task-status.type';
import type { CasesCreateCasefileTask } from '../types/cases-create-casefile-task.type';
import { isCasesCreateCasefileCaseTypeSelectionValid } from '../utils/cases-create-casefile-case-type-selection';

const areCaseTypeSelectionsEqual = (
  currentSelection: CasesCreateCasefileCaseTypeSelection | null,
  nextSelection: CasesCreateCasefileCaseTypeSelection,
): boolean => {
  if (currentSelection?.caseType !== nextSelection.caseType) {
    return false;
  }

  if (
    currentSelection.caseType === CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN &&
    nextSelection.caseType === CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN
  ) {
    return currentSelection.applicantType === nextSelection.applicantType;
  }

  return true;
};

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
      const selectionUnchanged = areCaseTypeSelectionsEqual(store.caseTypeSelection(), caseTypeSelection);
      const taskStatuses = selectionUnchanged
        ? store.taskStatuses()
        : { ...CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES };

      patchState(store, {
        caseTypeSelection,
        applicantDetails: selectionUnchanged ? store.applicantDetails() : null,
        respondentDetails: selectionUnchanged ? store.respondentDetails() : null,
        interestAndIndexation: selectionUnchanged ? store.interestAndIndexation() : null,
        paymentArrangement: selectionUnchanged ? store.paymentArrangement() : null,
        taskStatuses,
        stateChanges: true,
        unsavedChanges: false,
      });
    },
    setRespondentDetails: (respondentDetails: ICasesCreateCasefileRespondentDetails): void => {
      patchState(store, {
        respondentDetails,
        taskStatuses: {
          ...store.taskStatuses(),
          respondent: CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED,
        },
        stateChanges: true,
        unsavedChanges: false,
      });
    },
    setApplicantDetails: (applicantDetails: CasesCreateCasefileApplicantDetails): void => {
      patchState(store, {
        applicantDetails,
        taskStatuses: {
          ...store.taskStatuses(),
          applicant: CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED,
        },
        stateChanges: true,
        unsavedChanges: false,
      });
    },
    setInterestAndIndexation: (interestAndIndexation: ICasesCreateCasefileInterestIndexation): void => {
      patchState(store, {
        interestAndIndexation,
        taskStatuses: {
          ...store.taskStatuses(),
          interestAndIndexation: CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED,
        },
        stateChanges: true,
        unsavedChanges: false,
      });
    },
    setPaymentArrangement: (paymentArrangement: CasesCreateCasefilePaymentArrangement): void => {
      patchState(store, {
        paymentArrangement,
        taskStatuses: {
          ...store.taskStatuses(),
          managingPayments: CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED,
        },
        stateChanges: true,
        unsavedChanges: false,
      });
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
