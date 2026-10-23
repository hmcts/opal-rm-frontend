import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { CasesCreateCasefileStore } from '../../stores/cases-create-casefile.store';
import { CasesDraftCasefileStore } from '../../../cases-draft/stores/cases-draft-casefile.store';
import { createPersistedCasefileResolved } from '../../../cases-draft/mocks/cases-draft-casefile-resolved.mock';
import { casesCreateCasefileCaseTypeGuard } from './cases-create-casefile-case-type.guard';

describe('fixed amendment case type', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [CasesDraftCasefileStore, provideRouter([])] });
    const store = TestBed.inject(CasesCreateCasefileStore);
    const persisted = TestBed.inject(CasesDraftCasefileStore);
    const guard = () =>
      TestBed.runInInjectionContext(() =>
        casesCreateCasefileCaseTypeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );
    return { store, persisted, guard };
  }
  it('allows creation', () => expect(setup().guard()).toBe(true));
  it('clears a previous saved envelope and references before creation starts', () => {
    const { persisted, guard } = setup();
    persisted.loadResolved(createPersistedCasefileResolved({ intent: 'inputter-amend', mode: 'amend' }));
    persisted.setRequiresReload(true);

    expect(guard()).toBe(true);

    expect(persisted.draft()).toBeNull();
    expect(persisted.references()).toBeNull();
    expect(persisted.identity()).toBeNull();
    expect(persisted.etag()).toBeNull();
    expect(persisted.requiresReload()).toBe(false);
  });
  it('redirects amendment to its tasks without resetting corrections', () => {
    const { store, persisted, guard } = setup();
    const resolved = createPersistedCasefileResolved();
    store.hydratePersistedCasefile({ ...resolved.state, submissionIntent: 'amendment' });
    persisted.loadResolved(resolved);
    const result = guard() as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/cases/create-casefile/task-list');
    expect(store.respondentDetails()).toEqual(resolved.state.respondentDetails);
    expect(persisted.etag()).toBe(resolved.etag);
  });
});
