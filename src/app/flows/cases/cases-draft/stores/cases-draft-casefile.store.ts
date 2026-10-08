import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import type { IOpalMaintenanceDraftCasefileDetail } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-detail.interface';
import type { ICasesDraftIdentity } from '../interfaces/cases-draft-identity.interface';
import type { ICasesDraftCasefileResolved } from '../interfaces/cases-draft-casefile-resolved.interface';

/** Retains the saved lifecycle envelope; editable presentation state belongs to the creation store. */
export const CasesDraftCasefileStore = signalStore(
  withState({
    draft: null as IOpalMaintenanceDraftCasefileDetail | null,
    etag: null as string | null,
    identity: null as ICasesDraftIdentity | null,
  }),
  withMethods((store) => ({
    loadResolved: (result: ICasesDraftCasefileResolved): void => {
      patchState(store, { draft: structuredClone(result.draft), etag: result.etag, identity: { ...result.identity } });
    },
    resetStore: (): void => patchState(store, { draft: null, etag: null, identity: null }),
  })),
);
