import { createPersistedCasefileResolved } from 'src/app/flows/cases/cases-draft/mocks/cases-draft-casefile-resolved.mock';

export function createDeletionScenario() {
  const resolved = createPersistedCasefileResolved({ intent: 'checker-delete' });
  const deleted = structuredClone(resolved.draft);
  deleted.casefile_status = 'DELETED';
  deleted.casefile_status_name = 'Deleted';
  return {
    resolved,
    deleted,
    reason: 'Synthetic deletion reason',
    url: '/opal-maintenance-service/draft-casefiles/' + resolved.draft.draft_casefile_id,
  };
}
export const DELETE_CASEFILE_SEEDS = {
  empty: '',
  whitespace: '   ',
  'defensive limit': 'R'.repeat(251),
} as const;
