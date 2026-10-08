import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Data, provideRouter, Router, UrlTree } from '@angular/router';
import { getState } from '@ngrx/signals';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { GLOBAL_ERROR_STATE } from '@hmcts/opal-frontend-common/stores/global/constants';
import type { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import {
  GENERIC_HTTP_ERROR_MESSAGE,
  GENERIC_HTTP_ERROR_TITLE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { UtilsService } from '@hmcts/opal-frontend-common/services/utils-service';
import { CasesCreateCasefileStore } from '../../cases-create-casefile/stores/cases-create-casefile.store';
import { CASES_DRAFT_DASHBOARD_MODE } from '../constants/cases-draft-dashboard-mode.token';
import { createPersistedCasefileResolved } from '../mocks/cases-draft-casefile-resolved.mock';
import { CasesDraftCasefileStore } from '../stores/cases-draft-casefile.store';
import { CasesDraftNavigationService } from '../services/cases-draft-navigation.service';
import { CasesDraftDeletePlaceholderComponent } from './cases-draft-delete-placeholder.component';

function checkerUser(): IOpalUserState {
  return {
    ...structuredClone(OPAL_USER_STATE_MOCK),
    user_id: 10606,
    status: 'active' as const,
    business_unit_users: [
      {
        business_unit_id: 44,
        business_unit_user_id: 'BUU-CHECKER',
        permissions: [{ permission_id: 22, permission_name: 'Review' }],
      },
    ],
  };
}

function deleteResult() {
  return createPersistedCasefileResolved({ intent: 'checker-delete' });
}

describe('CasesDraftDeletePlaceholderComponent', () => {
  let fixture: ComponentFixture<CasesDraftDeletePlaceholderComponent>;
  let routeData: BehaviorSubject<Data>;
  let store: InstanceType<typeof CasesDraftCasefileStore>;
  let globalStore: InstanceType<typeof GlobalStore>;
  let router: Router;
  const userState = signal(checkerUser());
  const authenticated = signal(true);
  const featureFlags = signal<Record<string, boolean>>({ 'release-1c-rm-create-case-files': true });
  const scrollToTop = vi.fn();

  beforeEach(async () => {
    userState.set(checkerUser());
    authenticated.set(true);
    featureFlags.set({ 'release-1c-rm-create-case-files': true });
    scrollToTop.mockReset();
    routeData = new BehaviorSubject<Data>({ casefileIntent: 'checker-delete' });
    await TestBed.configureTestingModule({
      imports: [CasesDraftDeletePlaceholderComponent],
      providers: [
        provideRouter([]),
        CasesDraftCasefileStore,
        CasesCreateCasefileStore,
        CasesDraftNavigationService,
        { provide: CASES_DRAFT_DASHBOARD_MODE, useValue: 'checker' },
        {
          provide: GlobalStore,
          useValue: Object.assign(new GlobalStore(), { userState, authenticated, featureFlags }),
        },
        { provide: UtilsService, useValue: { scrollToTop } },
        { provide: ActivatedRoute, useValue: { data: routeData, snapshot: { data: routeData.value } } },
      ],
    }).compileComponents();
    store = TestBed.inject(CasesDraftCasefileStore);
    globalStore = TestBed.inject(GlobalStore);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  function create(data: Data = { casefileIntent: 'checker-delete', draftCasefile: deleteResult() }) {
    TestBed.inject(ActivatedRoute).snapshot.data = data;
    routeData.next(data);
    fixture = TestBed.createComponent(CasesDraftDeletePlaceholderComponent);
    return fixture.componentInstance;
  }

  it('renders the authorised two-thirds Delete page with a shared native Return button', () => {
    create();
    fixture.detectChanges();
    const column: HTMLElement = fixture.nativeElement.querySelector('.govuk-grid-column-two-thirds');
    expect(column.querySelector('h1')?.textContent?.trim()).toBe('Delete casefile');
    expect(column.querySelector('h1')?.classList.contains('govuk-heading-l')).toBe(true);
    const button = column.querySelector('opal-lib-govuk-button button');
    expect(button?.id).toBe('create_casefile_delete_return');
    expect(button?.textContent?.trim()).toBe('Return to review cases');
    expect(button?.getAttribute('type')).toBe('button');
    expect(fixture.nativeElement.querySelector('.govuk-grid-row')).toBeNull();
    expect(fixture.nativeElement.querySelector('form, input, textarea, select')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('button')).toHaveLength(1);
  });

  it('retains the completed envelope and quoted ETag without mutating creation or lifecycle state', () => {
    const creation = TestBed.inject(CasesCreateCasefileStore);
    const before = structuredClone(getState(creation));
    const result = deleteResult();
    create({ draftCasefile: result, casefileIntent: 'checker-delete' });
    fixture.detectChanges();
    expect(store.draft()).toEqual(result.draft);
    expect(store.etag()).toBe(result.etag);
    expect(store.identity()).toEqual(result.identity);
    expect(getState(creation)).toEqual(before);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('consumes a completed result when the same routed component is reused', () => {
    create();
    fixture.detectChanges();
    const result = deleteResult();
    result.draft.draft_casefile_id = 987;
    result.etag = '"4"';
    routeData.next({ draftCasefile: result });
    expect(store.draft()).toEqual(result.draft);
    expect(store.etag()).toBe('"4"');
  });

  it('keeps actions hidden and blocked until completed route data exists', async () => {
    const component = create({ casefileIntent: 'checker-delete' });
    fixture.detectChanges();
    await component.handleReturn();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(store.draft()).toBeNull();
  });

  it('clears action eligibility when reused route data no longer contains a result', async () => {
    const component = create();
    fixture.detectChanges();
    routeData.next({});
    await component.handleReturn();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it.each(['checker-view', 'checker-review', 'inputter-view'] as const)(
    'does not make a %s result actionable',
    async (intent) => {
      const result = createPersistedCasefileResolved({ intent });
      const component = create({ draftCasefile: result });
      fixture.detectChanges();
      await component.handleReturn();
      expect(fixture.nativeElement.querySelector('button')).toBeNull();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    },
  );

  it.each(['SUBMITTED', 'RESUBMITTED'] as const)('allows the eligible %s walkthrough', async (status) => {
    const result = deleteResult();
    result.draft.casefile_status = status;
    const component = create({ draftCasefile: result });
    fixture.detectChanges();
    await component.handleReturn();
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
    expect(router.serializeUrl(vi.mocked(router.navigateByUrl).mock.calls[0][0] as UrlTree)).toBe(
      '/cases/draft/check-and-validate/tabs#to-review',
    );
  });

  it.each([
    'authentication',
    'release',
    'global identity',
    'BU identity',
    'inactive user',
    'checker permission',
    'own submitter',
    'other business unit',
    'published',
    'cleared envelope',
    'different envelope',
  ])('blocks Return immediately after %s changes', async (condition) => {
    const component = create();
    fixture.detectChanges();
    if (condition === 'authentication') authenticated.set(false);
    if (condition === 'release') featureFlags.set({});
    if (condition === 'global identity') userState.set({ ...userState(), user_id: 99 });
    if (condition === 'inactive user') userState.set({ ...userState(), status: null });
    if (condition === 'BU identity') {
      userState.set({
        ...userState(),
        business_unit_users: [{ ...userState().business_unit_users[0], business_unit_user_id: 'BUU-OTHER' }],
      });
    }
    if (condition === 'checker permission') {
      userState.set({
        ...userState(),
        business_unit_users: [
          { ...userState().business_unit_users[0], permissions: [{ permission_id: 21, permission_name: 'Create' }] },
        ],
      });
    }
    if (condition === 'cleared envelope') store.resetStore();
    if (['own submitter', 'other business unit', 'published', 'different envelope'].includes(condition)) {
      const changed = deleteResult();
      if (condition === 'own submitter') changed.draft.submitted_by = 'BUU-CHECKER';
      if (condition === 'other business unit') changed.draft.business_unit_id = 99;
      if (condition === 'published') changed.draft.casefile_status = 'PUBLISHED';
      if (condition === 'different envelope') changed.draft.draft_casefile_id = 999;
      store.loadResolved(changed);
    }
    await component.handleReturn();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    if (['checker permission', 'own submitter', 'published'].includes(condition))
      expect(router.navigateByUrl).toHaveBeenCalledExactlyOnceWith('/error/permission-denied');
    else expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('renders shared permission denial when checker access is revoked but owning read access remains', async () => {
    const component = create();
    fixture.detectChanges();
    userState.set({
      ...userState(),
      business_unit_users: [
        { ...userState().business_unit_users[0], permissions: [{ permission_id: 21, permission_name: 'Create' }] },
      ],
    });
    await component.handleReturn();
    fixture.detectChanges();
    expect(router.navigateByUrl).toHaveBeenCalledExactlyOnceWith('/error/permission-denied');
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Delete casefile');
    expect(fixture.nativeElement.querySelector('#create_casefile_delete_return')).toBeNull();
  });

  it.each(['false', 'reject'])(
    'keeps a meaningful heading and shared banner if permission-denial navigation %s',
    async (failure) => {
      create();
      fixture.detectChanges();
      const before = structuredClone(getState(store));
      if (failure === 'false') vi.mocked(router.navigateByUrl).mockResolvedValueOnce(false);
      else vi.mocked(router.navigateByUrl).mockRejectedValueOnce(new Error('Synthetic failure'));
      userState.set({
        ...userState(),
        business_unit_users: [
          { ...userState().business_unit_users[0], permissions: [{ permission_id: 21, permission_name: 'Create' }] },
        ],
      });
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Delete casefile');
      expect(fixture.nativeElement.querySelector('button')).toBeNull();
      expect(globalStore.bannerError().error).toBe(true);
      expect(scrollToTop).toHaveBeenCalledOnce();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(getState(store)).toEqual(before);
      expect(router.navigateByUrl).toHaveBeenCalledExactlyOnceWith('/error/permission-denied');
    },
  );

  it('returns through the checker dashboard helper when the shared Return button is clicked', async () => {
    create();
    fixture.detectChanges();
    const navigation = TestBed.inject(CasesDraftNavigationService);
    const destination = vi.spyOn(navigation, 'persistedDashboardUrl');
    const before = structuredClone(getState(store));
    fixture.nativeElement.querySelector('#create_casefile_delete_return').click();
    await fixture.whenStable();
    expect(destination).toHaveBeenCalledWith('checker');
    expect(router.serializeUrl(vi.mocked(router.navigateByUrl).mock.calls[0][0] as UrlTree)).toBe(
      '/cases/draft/check-and-validate/tabs#to-review',
    );
    expect(getState(store)).toEqual(before);
    expect(globalStore.bannerError()).toEqual(GLOBAL_ERROR_STATE);
  });

  it.each(['false', 'rejected'])('retains data and allows recovery after %s navigation', async (failure) => {
    const component = create();
    const before = structuredClone(getState(store));
    if (failure === 'false') vi.mocked(router.navigateByUrl).mockResolvedValueOnce(false);
    else vi.mocked(router.navigateByUrl).mockRejectedValueOnce(new Error('Synthetic navigation failure'));
    await component.handleReturn();
    expect(getState(store)).toEqual(before);
    expect(globalStore.bannerError()).toMatchObject({
      error: true,
      title: GENERIC_HTTP_ERROR_TITLE,
      message: GENERIC_HTTP_ERROR_MESSAGE,
    });
    expect(scrollToTop).toHaveBeenCalledOnce();
    await component.handleReturn();
    expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
    expect(getState(store)).toEqual(before);
    expect(globalStore.bannerError()).toEqual(GLOBAL_ERROR_STATE);
  });

  it('ignores repeated Return calls while navigation is pending', async () => {
    const component = create();
    let finish!: (accepted: boolean) => void;
    vi.mocked(router.navigateByUrl).mockReturnValueOnce(new Promise<boolean>((resolve) => (finish = resolve)));
    const first = component.handleReturn();
    await component.handleReturn();
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
    finish(true);
    await first;
  });

  it.each(['false', 'rejected'])('does not report a late %s failure after the shell exits', async (failure) => {
    const component = create();
    let finish!: (accepted: boolean) => void;
    let reject!: (error: Error) => void;
    vi.mocked(router.navigateByUrl).mockReturnValueOnce(
      new Promise<boolean>((resolve, rejectPromise) => {
        finish = resolve;
        reject = rejectPromise;
      }),
    );
    const pending = component.handleReturn();
    fixture.destroy();
    store.resetStore();
    if (failure === 'false') finish(false);
    else reject(new Error('Synthetic late navigation failure'));
    await pending;
    expect(globalStore.bannerError()).toEqual(GLOBAL_ERROR_STATE);
    expect(scrollToTop).not.toHaveBeenCalled();
    expect(store.draft()).toBeNull();
    await component.handleReturn();
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
  });

  it('stops consuming route results after destruction', () => {
    create();
    fixture.destroy();
    store.resetStore();
    routeData.next({ draftCasefile: deleteResult() });
    expect(store.draft()).toBeNull();
  });
});
