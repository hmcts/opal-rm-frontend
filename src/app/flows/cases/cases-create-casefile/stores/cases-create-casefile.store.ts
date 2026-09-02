import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { CASES_CREATE_CASEFILE_STATE } from '../constants/cases-create-casefile-state.constant';
import { CasesCreateCasefileCaseTypeSelection } from '../types/cases-create-casefile-case-type-selection.type';

export const CasesCreateCasefileStore = signalStore(
  { providedIn: 'root' },
  withState(CASES_CREATE_CASEFILE_STATE),
  withComputed((store) => ({
    caseTypeComplete: computed(() => store.caseTypeSelection() !== null),
  })),
  withMethods((store) => ({
    setCaseTypeSelection: (caseTypeSelection: CasesCreateCasefileCaseTypeSelection): void => {
      patchState(store, { caseTypeSelection, stateChanges: true, unsavedChanges: false });
    },
    setUnsavedChanges: (unsavedChanges: boolean): void => {
      patchState(store, { unsavedChanges });
    },
    resetStore: (): void => {
      patchState(store, CASES_CREATE_CASEFILE_STATE);
    },
  })),
);
