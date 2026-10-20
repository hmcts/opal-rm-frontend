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
  });
  it('replaces successive envelopes and completely resets', () => {
    store.loadResolved(createPersistedCasefileResolved());
    const result = createPersistedCasefileResolved({ etag: '"1"' });
    result.draft.draft_casefile_id = 18;
    store.loadResolved(result);
    expect(store.draft()?.draft_casefile_id).toBe(18);
    expect(store.etag()).toBe('"1"');
    store.resetStore();
    expect(getState(store)).toEqual({
      draft: null,
      etag: null,
      identity: null,
      references: null,
      requiresReload: false,
    });
  });
  it.each([false, true])('retains working context when requiresReload is %s', (requiresReload) => {
    const result = createPersistedCasefileResolved({ intent: 'inputter-amend', mode: 'amend' });
    store.loadResolved(result);
    store.setRequiresReload(requiresReload);
    expect(store.requiresReload()).toBe(requiresReload);
    expect(store.etag()).toBe(result.etag);
  });
  it('isolates references and clears the reload requirement on a fresh load', () => {
    const result = createPersistedCasefileResolved();
    store.loadResolved(result);
    const references = structuredClone(result.references);
    result.references.countries[0].country_name = 'Changed reference';
    expect(store.references()).toEqual(references);
    store.setRequiresReload(true);
    store.loadResolved(result);
    expect(store.requiresReload()).toBe(false);
    expect(store.draft()).toEqual(result.draft);
  });
  it('clears abandoned amendment context and its submission lock', () => {
    store.loadResolved(createPersistedCasefileResolved());
    store.setRequiresReload(true);
    store.resetStore();
    expect(store.draft()).toBeNull();
    expect(store.references()).toBeNull();
    expect(store.identity()).toBeNull();
    expect(store.etag()).toBeNull();
    expect(store.requiresReload()).toBe(false);
  });
});
