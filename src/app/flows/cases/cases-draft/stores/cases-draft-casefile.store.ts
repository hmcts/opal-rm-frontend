import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import type { ICasesDraftCasefileResolved } from '../interfaces/cases-draft-casefile-resolved.interface';
import { CASES_DRAFT_CASEFILE_STATE } from '../constants/cases-draft-casefile-state.constant';

/** Retains the saved envelope and submission lock; editable presentation belongs to the creation store. */
export const CasesDraftCasefileStore = signalStore(
  withState(CASES_DRAFT_CASEFILE_STATE),
  withMethods((store) => ({
    /** Starts a fresh resolved entry; editor returns retain the working context. */
    loadResolved: (result: ICasesDraftCasefileResolved): void => {
      patchState(store, {
        draft: structuredClone(result.draft),
        etag: result.etag,
        identity: structuredClone(result.identity),
        references: structuredClone(result.references),
        requiresReload: false,
      });
    },
    setRequiresReload: (requiresReload: boolean): void => {
      patchState(store, { requiresReload });
    },
    resetStore: (): void => patchState(store, CASES_DRAFT_CASEFILE_STATE),
  })),
);
