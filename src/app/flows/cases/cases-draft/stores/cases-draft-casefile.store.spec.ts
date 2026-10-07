import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { getState } from '@ngrx/signals';
import { CasesDraftCasefileStore } from './cases-draft-casefile.store';
import { createPersistedCasefileResolved } from '../mocks/cases-draft-casefile-resolved.mock';
describe('CasesDraftCasefileStore', () => {
  let store: InstanceType<typeof CasesDraftCasefileStore>;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CasesDraftCasefileStore] });
    store = TestBed.inject(CasesDraftCasefileStore);
  });
  it('retains the exact ETag and isolates the loaded envelope and identity', () => {
    const result = createPersistedCasefileResolved();
    store.loadResolved(result);
    expect(store.etag()).toBe('"0"');
    expect(store.draft()).toEqual(result.draft);
    expect(store.identity()).toEqual({ userId: 10606, businessUnitId: 44, submittedBy: 'BUU-CHECKER' });
    result.draft.casefile_status = 'DELETED';
    result.identity.submittedBy = 'CHANGED';
    expect(store.draft()?.casefile_status).toBe('SUBMITTED');
    expect(store.identity()?.submittedBy).toBe('BUU-CHECKER');
    expect(Object.keys(getState(store)).sort()).toEqual(['draft', 'etag', 'identity']);
  });
  it('replaces successive envelopes and completely resets', () => {
    store.loadResolved(createPersistedCasefileResolved());
    const result = createPersistedCasefileResolved({ etag: '"1"' });
    result.draft.draft_casefile_id = 18;
    store.loadResolved(result);
    expect(store.draft()?.draft_casefile_id).toBe(18);
    expect(store.etag()).toBe('"1"');
    store.resetStore();
    expect(getState(store)).toEqual({ draft: null, etag: null, identity: null });
  });
});
