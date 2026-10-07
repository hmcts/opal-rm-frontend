import { createPersistedCasefileResolved } from '../cases-draft/mocks/cases-draft-casefile-resolved.mock';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { CasesDraftCasefileStore } from '../cases-draft/stores/cases-draft-casefile.store';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { patchState, WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from './constants/cases-create-casefile-case-types.constant';
import type { ICasesCreateCasefileState } from './interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileStore } from './stores/cases-create-casefile.store';
import { CasesCreateCasefileComponent } from './cases-create-casefile.component';
import { CasesCreateCasefileReviewNavigationService } from './services/cases-create-casefile-review-navigation.service';

describe('CasesCreateCasefileComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileComponent>;
  let component: CasesCreateCasefileComponent;
  let store: InstanceType<typeof CasesCreateCasefileStore>;

  const userState = signal({
    ...structuredClone(OPAL_USER_STATE_MOCK),
    user_id: 10606,
    status: 'active' as const,
    business_unit_users: [
      {
        business_unit_id: 44,
        business_unit_user_id: 'BUU-CHECKER',
        permissions: [
          { permission_id: 21, permission_name: 'Create' },
          { permission_id: 22, permission_name: 'Review' },
        ],
      },
    ],
  });
  const authenticated = signal(true);
  const featureFlags = signal<Record<string, boolean>>({ 'release-1c-rm-create-case-files': true });
  const resolved = createPersistedCasefileResolved;
  beforeEach(async () => {
    authenticated.set(true);
    featureFlags.set({ 'release-1c-rm-create-case-files': true });
    userState.set({
      ...structuredClone(OPAL_USER_STATE_MOCK),
      user_id: 10606,
      status: 'active',
      business_unit_users: [
        {
          business_unit_id: 44,
          business_unit_user_id: 'BUU-CHECKER',
          permissions: [
            { permission_id: 21, permission_name: 'Create' },
            { permission_id: 22, permission_name: 'Review' },
          ],
        },
      ],
    });
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileComponent],
      providers: [provideRouter([]), { provide: GlobalStore, useValue: { userState, authenticated, featureFlags } }],
    }).compileComponents();

    fixture = TestBed.createComponent(CasesCreateCasefileComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(CasesCreateCasefileStore);
    store.resetStore();
  });

  it('clears both hydrated stores and review context when the persisted shell exits', () => {
    const persisted = fixture.debugElement.injector.get(CasesDraftCasefileStore);
    const result = resolved();
    store.hydratePersistedCasefile(result.state);
    persisted.loadResolved(result);
    TestBed.inject(CasesCreateCasefileReviewNavigationService).setContext({ origin: 'review', section: 'respondent' });
    fixture.destroy();
    expect(persisted.draft()).toBeNull();
    expect(persisted.etag()).toBeNull();
    expect(persisted.identity()).toBeNull();
    expect(store.caseTypeSelection()).toBeNull();
    expect(TestBed.inject(CasesCreateCasefileReviewNavigationService).context()).toBeNull();
  });
  it.each(['authentication', 'release', 'user', 'BU user', 'permission'])(
    'clears persisted data and uses Permission Denied on %s loss',
    (condition) => {
      const persisted = fixture.debugElement.injector.get(CasesDraftCasefileStore);
      const result = resolved();
      store.hydratePersistedCasefile(result.state);
      persisted.loadResolved(result);
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      fixture.detectChanges();
      if (condition === 'authentication') authenticated.set(false);
      if (condition === 'release') featureFlags.set({});
      if (condition === 'user') userState.set({ ...userState(), user_id: 88 });
      if (condition === 'BU user')
        userState.set({
          ...userState(),
          business_unit_users: [{ ...userState().business_unit_users[0], business_unit_user_id: 'NEW' }],
        });
      if (condition === 'permission') userState.set({ ...userState(), business_unit_users: [] });
      fixture.detectChanges();
      expect(persisted.draft()).toBeNull();
      expect(store.caseTypeSelection()).toBeNull();
      expect(navigate).toHaveBeenCalledWith('/error/permission-denied');
    },
  );
  it('keeps the saved envelope when only review permission is lost', () => {
    const persisted = fixture.debugElement.injector.get(CasesDraftCasefileStore);
    persisted.loadResolved(resolved());
    fixture.detectChanges();
    userState.set({
      ...userState(),
      business_unit_users: [
        { ...userState().business_unit_users[0], permissions: [{ permission_id: 21, permission_name: 'Create' }] },
      ],
    });
    fixture.detectChanges();
    expect(persisted.draft()).not.toBeNull();
  });
  it('allows unload when there are no changes', () => {
    expect(component.handleBeforeUnload()).toBe(true);
    expect(component.canDeactivate()).toBe(true);
  });

  it('blocks unload for unsaved form edits', () => {
    store.setUnsavedChanges(true);
    expect(component.handleBeforeUnload()).toBe(false);
    expect(component.canDeactivate()).toBe(false);
  });

  it('prevents the browser beforeunload event when changes exist', () => {
    store.setUnsavedChanges(true);
    const event = new Event('beforeunload', { cancelable: true });

    fixture.detectChanges();
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('blocks external departure after valid journey state is saved', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    expect(component.handleBeforeUnload()).toBe(false);
    expect(component.canDeactivate()).toBe(false);
  });

  it('blocks departure and unload for a populated creditor draft until it is cleared', () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      stateChanges: false,
      unsavedChanges: false,
      creditorDraft: {
        termId: 1,
        branch: 'add-new',
        details: {
          identity: { type: 'organisation', organisationName: 'Example creditor' },
          address: {
            addressLine1: '1 Test Street',
            addressLine2: null,
            addressLine3: null,
            addressLine4: null,
            addressLine5: null,
            postalOrZipCode: null,
            countryId: 826,
          },
          bank: { type: 'none' },
        },
        countryName: 'United Kingdom',
      },
    });

    expect(component.handleBeforeUnload()).toBe(false);
    expect(component.canDeactivate()).toBe(false);

    store.clearCreditorDraft();
    expect(component.handleBeforeUnload()).toBe(true);
    expect(component.canDeactivate()).toBe(true);
  });

  it('blocks departure and unload while an order term amendment is pending', () => {
    const term = {
      termId: 1,
      resultId: 'MAT',
      parameters: { amount: '12.30' },
      creditor: { type: 'applicant' as const },
      presentation: { title: 'Maintenance', fields: [] },
    };
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      stateChanges: false,
      unsavedChanges: false,
      orderTerms: [term],
      currentOrderTermId: 1,
      orderTermAmendment: { termId: 1, term, inputComplete: true, ready: false },
    });

    expect(component.handleBeforeUnload()).toBe(false);
    expect(component.canDeactivate()).toBe(false);

    store.cancelOrderTermAmendment(1);
    expect(component.handleBeforeUnload()).toBe(true);
    expect(component.canDeactivate()).toBe(true);
  });

  it('clears a populated creditor draft when the shell is destroyed', () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      creditorDraft: { termId: 1, branch: 'add-new', countryName: 'United Kingdom' },
    });

    component.ngOnDestroy();

    expect(store.creditorDraft()).toBeNull();
  });

  it('resets journey state on shell destruction', () => {
    store.setSubmissionSucceeded(true);
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    component.ngOnDestroy();
    expect(store.caseTypeSelection()).toBeNull();
    expect(store.stateChanges()).toBe(false);
    expect(store.submissionSucceeded()).toBe(false);
  });

  it('clears draft and review context on shell destruction', () => {
    const reviewNavigation = TestBed.inject(CasesCreateCasefileReviewNavigationService);
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    reviewNavigation.setContext({ origin: 'review', section: 'respondent' });

    component.ngOnDestroy();

    expect(store.caseTypeSelection()).toBeNull();
    expect(store.stateChanges()).toBe(false);
    expect(store.submissionSucceeded()).toBe(false);
    expect(reviewNavigation.context()).toBeNull();
  });
});
