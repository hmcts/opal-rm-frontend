import type { ICasesDraftCasefileResolved } from '../interfaces/cases-draft-casefile-resolved.interface';
import {
  createPersistedCasefileDetail,
  PERSISTED_CASEFILE_REFERENCES,
  PERSISTED_CASEFILE_RESULT_PAGE,
} from '../../services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import { mapPersistedCasefile } from '../../cases-create-casefile/services/cases-create-casefile-payload/utils/map-casefile/cases-create-casefile-payload-map-state';

export function createPersistedCasefileResolved(
  overrides: Partial<ICasesDraftCasefileResolved> = {},
): ICasesDraftCasefileResolved {
  const draft = overrides.draft ?? createPersistedCasefileDetail();
  const references =
    overrides.references ??
    structuredClone({ ...PERSISTED_CASEFILE_REFERENCES, resultPages: { TEST01: PERSISTED_CASEFILE_RESULT_PAGE } });
  return {
    draft,
    etag: '"0"',
    references,
    state: mapPersistedCasefile(draft, references),
    identity: { userId: 10606, businessUnitId: 44, submittedBy: 'BUU-CHECKER' },
    intent: 'checker-review',
    mode: 'review',
    context: 'checker',
    dashboardMode: 'checker',
    ...overrides,
  };
}
