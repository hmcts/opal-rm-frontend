import { defaultCasesDraftNavigation } from '../utils/cases-draft-navigation';
import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
import type { IOpalMaintenanceDraftCasefileDetail } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-detail.interface';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Data, NavigationStart, provideRouter, Router, UrlTree } from '@angular/router';
import { getState } from '@ngrx/signals';
import { BehaviorSubject, Subject, of, EMPTY, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import type { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';

import { UtilsService } from '@hmcts/opal-frontend-common/services/utils-service';
import { CasesCreateCasefileStore } from '../../cases-create-casefile/stores/cases-create-casefile.store';
import { CASES_DRAFT_DASHBOARD_MODE } from '../constants/cases-draft-dashboard-mode.token';
import { createPersistedCasefileResolved } from '../mocks/cases-draft-casefile-resolved.mock';
import { CasesDraftCasefileStore } from '../stores/cases-draft-casefile.store';
import { CasesDraftNavigationService } from '../services/cases-draft-navigation.service';
import { CasesDraftDeleteComponent } from './cases-draft-delete.component';

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

describe('CasesDraftDeleteComponent', () => {
  let fixture: ComponentFixture<CasesDraftDeleteComponent>;
  let routeData: BehaviorSubject<Data>;
  let store: InstanceType<typeof CasesDraftCasefileStore>;
  let globalStore: InstanceType<typeof GlobalStore>;
  let router: Router;
  const userState = signal(checkerUser());
  const authenticated = signal(true);
  const featureFlags = signal<Record<string, boolean>>({ 'release-1c-rm-create-case-files': true });
  const scrollToTop = vi.fn();
  const api = { patchDraftCasefile: vi.fn(), getDraftCasefile: vi.fn() };

  beforeEach(async () => {
    userState.set(checkerUser());
    authenticated.set(true);
    featureFlags.set({ 'release-1c-rm-create-case-files': true });
    scrollToTop.mockReset();
    api.patchDraftCasefile.mockReset();
    api.getDraftCasefile.mockReset();
    routeData = new BehaviorSubject<Data>({ casefileIntent: 'checker-delete' });
    await TestBed.configureTestingModule({
      imports: [CasesDraftDeleteComponent],
      providers: [
        provideRouter([]),
        { provide: OpalMaintenanceService, useValue: api },
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

  afterEach(() => {
    fixture?.destroy();
    // The component host ID replaces TestBed's root ID, so remove its owned DOM explicitly.
    fixture?.nativeElement.remove();
  });

  function create(data: Data = { casefileIntent: 'checker-delete', draftCasefile: deleteResult() }) {
    TestBed.inject(ActivatedRoute).snapshot.data = data;
    routeData.next(data);
    fixture = TestBed.createComponent(CasesDraftDeleteComponent);
    return fixture.componentInstance;
  }

  it('renders the guarded shared form', () => {
    create();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
      'Are you sure you want to delete this case?',
    );
    expect(fixture.nativeElement.querySelector('textarea')?.getAttribute('maxlength')).toBe('250');
    expect(fixture.nativeElement.querySelector('#create_casefile_delete_submit')?.textContent).toContain(
      'Yes - delete case',
    );
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
    await component.handleDelete();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(store.draft()).toBeNull();
  });

  it('clears action eligibility when reused route data no longer contains a result', async () => {
    const component = create();
    fixture.detectChanges();
    routeData.next({});
    await component.handleDelete();
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
      await component.handleDelete();
      expect(fixture.nativeElement.querySelector('button')).toBeNull();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    },
  );

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
  ])('blocks deletion immediately after %s changes', async (condition) => {
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
    await component.handleDelete();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(component.respondentName()).toBe('');
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
    await component.handleDelete();
    fixture.detectChanges();
    expect(router.navigateByUrl).toHaveBeenCalledExactlyOnceWith('/error/permission-denied');
    expect(fixture.nativeElement.querySelector('#create_casefile_delete_identity')).toBeNull();
    expect(fixture.nativeElement.querySelector('textarea')).toBeNull();
    expect(api.patchDraftCasefile).not.toHaveBeenCalled();
  });

  it.each(['false', 'reject'])(
    'clears sensitive presentation and preserves shared feedback if permission-denial navigation %s',
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
      expect(fixture.nativeElement.querySelector('#create_casefile_delete_identity')).toBeNull();
      expect(fixture.nativeElement.querySelector('textarea')).toBeNull();
      expect(fixture.nativeElement.querySelector('button')).toBeNull();
      expect(globalStore.bannerError().error).toBe(true);
      expect(scrollToTop).toHaveBeenCalledOnce();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(getState(store)).toEqual(before);
      expect(router.navigateByUrl).toHaveBeenCalledExactlyOnceWith('/error/permission-denied');
    },
  );

  it('stops consuming route results after destruction', () => {
    create();
    fixture.destroy();
    store.resetStore();
    routeData.next({ draftCasefile: deleteResult() });
    expect(store.draft()).toBeNull();
  });
  it.each(['', '   \n'])('rejects meaningless reason %j without PATCH', async (value) => {
    const component = create();
    component.form.controls.create_casefile_delete_reason.setValue(value);
    fixture.detectChanges();
    await component.handleDelete();
    fixture.detectChanges();
    expect(api.patchDraftCasefile).not.toHaveBeenCalled();
    expect(component.formControlErrorMessages['create_casefile_delete_reason']).toBe('Enter reason');
    expect(component.formErrorSummaryMessage).toEqual([
      expect.objectContaining({ fieldId: 'create_casefile_delete_reason', message: 'Enter reason' }),
    ]);
  });
  it('keeps defensive over-limit input and rejects it without PATCH', async () => {
    const component = create();
    component.form.controls.create_casefile_delete_reason.setValue('R'.repeat(251));
    fixture.detectChanges();
    await component.handleDelete();
    expect(component.form.controls.create_casefile_delete_reason.value).toHaveLength(251);
    expect(component.formControlErrorMessages['create_casefile_delete_reason']).toBe(
      'Reason must be 250 characters or fewer',
    );
    expect(api.patchDraftCasefile).not.toHaveBeenCalled();
  });
  it('cancels to the selected review without mutating saved state or sending PATCH', async () => {
    const component = create();
    const before = structuredClone(getState(store));
    fixture.detectChanges();
    await component.handleCancel();
    const url = vi.mocked(router.navigateByUrl).mock.calls[0][0] as UrlTree;
    expect(router.serializeUrl(url)).toBe('/cases/draft/check-and-validate/review/17#to-review');
    expect(vi.mocked(router.navigateByUrl).mock.calls[0]).toHaveLength(1);
    expect(getState(store)).toEqual(before);
    expect(api.patchDraftCasefile).not.toHaveBeenCalled();
  });

  function deletedResponse() {
    const draft = createPersistedCasefileResolved({ intent: 'checker-delete' }).draft;
    draft.casefile_status = 'DELETED';
    return new HttpResponse({ status: 200, body: draft, headers: new HttpHeaders({ ETag: '"1"' }) });
  }
  it('dispatches once and preserves the exact reason, original ETag and saved aggregate', async () => {
    const pending = new Subject<HttpResponse<unknown>>();
    api.patchDraftCasefile.mockReturnValue(pending);
    const component = create();
    fixture.detectChanges();
    const before = structuredClone(getState(store));
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason\nSecond line');
    const first = component.handleDelete();
    await component.handleDelete();
    await component.handleCancel();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(api.patchDraftCasefile).toHaveBeenCalledExactlyOnceWith(
      17,
      {
        business_unit_id: 44,
        casefile_status: 'DELETED',
        status_message: 'Synthetic reason\nSecond line',
      },
      '"0"',
    );
    pending.next(deletedResponse());
    pending.complete();
    await first;
    expect(getState(store)).toEqual(before);
  });

  it.each([0, 400, 401, 403, 503])(
    'leaves HTTP %s feedback to the interceptor and keeps the reason editable',
    async (status) => {
      api.patchDraftCasefile.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
      const component = create();
      fixture.detectChanges();
      globalStore.setBannerError({
        ...globalStore.bannerError(),
        error: true,
        title: 'Synthetic shared title',
        message: 'Synthetic shared detail',
      });
      component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
      await component.handleDelete();
      fixture.detectChanges();
      expect(api.patchDraftCasefile).toHaveBeenCalledOnce();
      expect(api.getDraftCasefile).not.toHaveBeenCalled();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
      expect(component.form.controls.create_casefile_delete_reason.value).toBe('Synthetic reason');
      expect(component.form.controls.create_casefile_delete_reason.enabled).toBe(true);
      expect(fixture.nativeElement.querySelectorAll('button')).toHaveLength(1);
      expect(fixture.nativeElement.querySelector('#create_casefile_delete_check_status')).toBeNull();
      expect(fixture.nativeElement.querySelector('#create_casefile_delete_return')).toBeNull();
      expect(scrollToTop).toHaveBeenCalledOnce();
      expect(globalStore.bannerError()).toEqual(
        expect.objectContaining({ error: true, title: 'Synthetic shared title', message: 'Synthetic shared detail' }),
      );
    },
  );

  it.each([0, 401, 403, 409, 412, 500, 503])(
    'requires authoritative re-entry after uncertain HTTP %s without replaying PATCH',
    async (status) => {
      api.patchDraftCasefile.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
      const component = create();
      component.form.controls.create_casefile_delete_reason.setValue('Synthetic retained reason');
      fixture.detectChanges();
      const before = structuredClone(getState(store));
      globalStore.setBannerError({
        ...globalStore.bannerError(),
        error: true,
        title: 'Synthetic shared title',
        message: 'Synthetic shared detail',
      });
      await component.handleDelete();
      await component.handleDelete();
      fixture.detectChanges();
      expect(api.patchDraftCasefile).toHaveBeenCalledOnce();
      expect(api.getDraftCasefile).not.toHaveBeenCalled();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
      expect(getState(store)).toEqual({ ...before, requiresReload: true });
      expect(component.form.controls.create_casefile_delete_reason.value).toBe('Synthetic retained reason');
      expect(component.form.controls.create_casefile_delete_reason.enabled).toBe(true);
      expect(fixture.nativeElement.querySelector('#create_casefile_delete_submit').disabled).toBe(true);
      expect(fixture.nativeElement.querySelector('#create_casefile_delete_recovery')?.textContent).toContain(
        'Select No - cancel to reload the saved case before trying again.',
      );
      expect(fixture.nativeElement.querySelector('opal-lib-govuk-cancel-link')).not.toBeNull();
      expect(globalStore.bannerError().message).toBe('Synthetic shared detail');
    },
  );

  it.each([400, 422])('allows explicit retry after definite HTTP %s rejection', async (status) => {
    api.patchDraftCasefile.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
    const component = create();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic corrected reason');
    fixture.detectChanges();
    await component.handleDelete();
    expect(store.requiresReload()).toBe(false);
    await component.handleDelete();
    fixture.detectChanges();
    expect(api.patchDraftCasefile).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelector('#create_casefile_delete_submit').disabled).toBe(false);
    expect(fixture.nativeElement.querySelector('#create_casefile_delete_recovery')).toBeNull();
  });

  it.each([
    'unconfirmed status',
    'wrong ID',
    'wrong BU',
    'unchanged version',
    'missing version',
    'HTTP status',
    'empty body',
  ])('does not announce deletion for a receipt with %s', async (condition) => {
    let receipt: HttpResponse<IOpalMaintenanceDraftCasefileDetail | null> = deletedResponse();
    if (condition === 'unconfirmed status') receipt.body!.casefile_status = 'SUBMITTED';
    if (condition === 'wrong ID') receipt.body!.draft_casefile_id = 18;
    if (condition === 'wrong BU') {
      receipt.body!.business_unit_id = 99;
      receipt.body!.casefile.respondent_account.business_unit_id = 99;
    }
    if (condition === 'unchanged version') receipt = receipt.clone({ headers: new HttpHeaders({ ETag: '\"0\"' }) });
    if (condition === 'missing version') receipt = receipt.clone({ headers: new HttpHeaders() });
    if (condition === 'HTTP status') receipt = receipt.clone({ status: 202 });
    if (condition === 'empty body') receipt = receipt.clone({ body: null });
    api.patchDraftCasefile.mockReturnValue(of(receipt));
    const component = create();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic retained reason');
    fixture.detectChanges();
    await component.handleDelete();
    await component.handleDelete();
    fixture.detectChanges();
    expect(component.deleted()).toBe(false);
    expect(store.requiresReload()).toBe(true);
    expect(component.form.controls.create_casefile_delete_reason.value).toBe('Synthetic retained reason');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(TestBed.inject(CasesDraftNavigationService).consumeCheckerDeletion()).toBeNull();
    expect(api.patchDraftCasefile).toHaveBeenCalledOnce();
    expect(api.getDraftCasefile).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#create_casefile_delete_return')).toBeNull();
  });

  it('resets the deletion lock only when a fresh resolved entry supplies its current version', async () => {
    api.patchDraftCasefile.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 409 })));
    api.patchDraftCasefile.mockReturnValue(of(deletedResponse()));
    const component = create();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic retained reason');
    fixture.detectChanges();
    await component.handleDelete();
    expect(store.requiresReload()).toBe(true);
    await component.handleCancel();
    const fresh = deleteResult();
    fresh.etag = 'opaque-refreshed-version';
    routeData.next({ draftCasefile: fresh });
    expect(store.requiresReload()).toBe(false);
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason after fresh entry');
    await component.handleDelete();
    expect(api.patchDraftCasefile).toHaveBeenCalledTimes(2);
    expect(api.patchDraftCasefile).toHaveBeenLastCalledWith(
      17,
      expect.objectContaining({ casefile_status: 'DELETED', status_message: 'Synthetic reason after fresh entry' }),
      'opaque-refreshed-version',
    );
    expect(component.deleted()).toBe(true);
  });

  it('handles EMPTY completion without recording success or fetching latest status', async () => {
    api.patchDraftCasefile.mockReturnValue(EMPTY);
    const record = vi.spyOn(TestBed.inject(CasesDraftNavigationService), 'recordCheckerDecision');
    const component = create();
    fixture.detectChanges();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
    await component.handleDelete();
    expect(record).not.toHaveBeenCalled();
    expect(api.getDraftCasefile).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component.form.controls.create_casefile_delete_reason.enabled).toBe(true);
    expect(api.patchDraftCasefile).toHaveBeenCalledOnce();
  });

  it('does not dispatch a deletion without a saved version', async () => {
    const result = { ...deleteResult(), etag: '' };
    const component = create({ draftCasefile: result });
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
    fixture.detectChanges();
    const before = structuredClone(getState(store));

    await component.handleDelete();

    expect(api.patchDraftCasefile).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(TestBed.inject(CasesDraftNavigationService).consumeCheckerDecision()).toBeNull();
    expect(getState(store)).toEqual(before);
    expect(component.form.controls.create_casefile_delete_reason.value).toBe('Synthetic reason');
    expect(component.form.controls.create_casefile_delete_reason.enabled).toBe(true);
    expect(component.submitting()).toBe(false);
    expect(component.deleted()).toBe(false);
  });

  it('does not navigate or replay a completed deletion when its notice is rejected', async () => {
    const response = deletedResponse();
    response.body!.casefile_snapshot.respondent_account.respondent_name = '';
    api.patchDraftCasefile.mockReturnValue(of(response));
    const component = create();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
    fixture.detectChanges();
    const navigation = TestBed.inject(CasesDraftNavigationService);
    const selection = {
      tab: 'rejected' as const,
      page: 3,
      sort: 'applicant' as const,
      direction: 'descending' as const,
    };
    navigation.setSelection(selection);
    const record = vi.spyOn(navigation, 'recordCheckerDecision');
    const before = structuredClone(getState(store));

    await component.handleDelete();
    await component.handleDelete();

    expect(record).toHaveReturnedWith(false);
    expect(navigation.consumeCheckerDecision()).toBeNull();
    expect(navigation.selection()).toEqual(selection);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(api.patchDraftCasefile).toHaveBeenCalledOnce();
    expect(api.getDraftCasefile).not.toHaveBeenCalled();
    expect(getState(store)).toEqual(before);
    expect(component.deleted()).toBe(true);
    expect(component.submitting()).toBe(false);
  });

  it('records a confirmed deletion and returns to the selected To review queue', async () => {
    api.patchDraftCasefile.mockReturnValue(of(deletedResponse()));
    const navigation = TestBed.inject(CasesDraftNavigationService);
    const record = vi.spyOn(navigation, 'recordCheckerDecision');
    const selection = {
      tab: 'to-review' as const,
      page: 3,
      sort: 'applicant' as const,
      direction: 'descending' as const,
    };
    navigation.setSelection(selection);
    const component = create();
    fixture.detectChanges();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
    await component.handleDelete();
    const url = vi.mocked(router.navigateByUrl).mock.calls[0][0] as UrlTree;
    expect(router.serializeUrl(url)).toBe('/cases/draft/check-and-validate/tabs#to-review');
    expect(navigation.selection()).toEqual(selection);
    expect(record).toHaveBeenCalledExactlyOnceWith({
      identity: deleteResult().identity,
      draftCasefileId: 17,
      respondentName: deletedResponse().body!.casefile_snapshot.respondent_account.respondent_name,
      outcome: 'deleted',
    });
  });

  it('uses the default To review selection when entered from another queue', async () => {
    api.patchDraftCasefile.mockReturnValue(of(deletedResponse()));
    const component = create();
    fixture.detectChanges();
    const navigation = TestBed.inject(CasesDraftNavigationService);
    navigation.setSelection({ tab: 'rejected', page: 3, sort: 'applicant', direction: 'descending' });
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
    await component.handleDelete();
    expect(navigation.selection()).toEqual(defaultCasesDraftNavigation('to-review', 'checker'));
  });

  it.each(['route reuse', 'identity loss', 'destroyed', 'competing navigation'])(
    'ignores a late deletion response after %s',
    async (change) => {
      const pending = new Subject<HttpResponse<unknown>>();
      api.patchDraftCasefile.mockReturnValue(pending);
      const events = new Subject<NavigationStart>();
      vi.spyOn(router, 'events', 'get').mockReturnValue(events);
      const record = vi.spyOn(TestBed.inject(CasesDraftNavigationService), 'recordCheckerDecision');
      const component = create();
      fixture.detectChanges();
      component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
      const operation = component.handleDelete();
      if (change === 'route reuse') {
        const next = deleteResult();
        next.draft.draft_casefile_id = 18;
        routeData.next({ draftCasefile: next });
      }
      if (change === 'identity loss') userState.set({ ...userState(), user_id: 99 });
      if (change === 'destroyed') fixture.destroy();
      if (change === 'competing navigation') events.next(new NavigationStart(91, '/another-page'));
      pending.next(deletedResponse());
      pending.complete();
      await operation;
      expect(record).not.toHaveBeenCalled();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
      events.complete();
    },
  );

  it.each([false, new Error('Synthetic navigation failure')])(
    'does not submit again after a completed deletion whose navigation fails',
    async (failure) => {
      api.patchDraftCasefile.mockReturnValue(of(deletedResponse()));
      if (failure === false) vi.mocked(router.navigateByUrl).mockResolvedValueOnce(false);
      else vi.mocked(router.navigateByUrl).mockRejectedValueOnce(failure);
      const component = create();
      fixture.detectChanges();
      component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
      await component.handleDelete();
      await component.handleDelete();
      expect(api.patchDraftCasefile).toHaveBeenCalledOnce();
      expect(TestBed.inject(CasesDraftNavigationService).consumeCheckerDecision()).toBeNull();
    },
  );

  it.each([false, new Error('Synthetic navigation failure')])(
    'retries the return after a completed deletion without another PATCH (%s)',
    async (failure) => {
      api.patchDraftCasefile.mockReturnValue(of(deletedResponse()));
      if (failure === false) vi.mocked(router.navigateByUrl).mockResolvedValueOnce(false);
      else vi.mocked(router.navigateByUrl).mockRejectedValueOnce(failure);
      const component = create();
      component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
      fixture.detectChanges();
      await component.handleDelete();
      fixture.detectChanges();
      await fixture.whenStable();
      const retry = fixture.nativeElement.querySelector('#create_casefile_delete_return') as HTMLButtonElement;
      expect(retry.disabled).toBe(false);
      expect(document.activeElement).toBe(retry);
      expect(fixture.nativeElement.querySelector('#create_casefile_delete_submit')).toBeNull();
      expect(component.form.controls.create_casefile_delete_reason.disabled).toBe(true);
      retry.click();
      await fixture.whenStable();
      expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
      expect(api.patchDraftCasefile).toHaveBeenCalledOnce();
      expect(TestBed.inject(CasesDraftNavigationService).consumeCheckerDecision()).toEqual({
        identity: deleteResult().identity,
        draftCasefileId: 17,
        respondentName: deletedResponse().body!.casefile_snapshot.respondent_account.respondent_name,
        outcome: 'deleted',
      });
    },
  );

  it('blocks repeated return attempts while navigation is pending', async () => {
    api.patchDraftCasefile.mockReturnValue(of(deletedResponse()));
    let finishNavigation!: (accepted: boolean) => void;
    vi.mocked(router.navigateByUrl).mockReturnValueOnce(
      new Promise<boolean>((resolve) => {
        finishNavigation = resolve;
      }),
    );
    const component = create();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
    fixture.detectChanges();
    const deletion = component.handleDelete();
    await Promise.resolve();
    fixture.detectChanges();
    const retry = fixture.nativeElement.querySelector('#create_casefile_delete_return') as HTMLButtonElement;
    expect(retry.disabled).toBe(true);
    await component.handleReturnToReviewCases();
    await component.handleDelete();
    await component.handleCancel();
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
    expect(api.patchDraftCasefile).toHaveBeenCalledOnce();
    finishNavigation(false);
    await deletion;
    fixture.detectChanges();
    expect(retry.disabled).toBe(false);
  });

  it('cannot use the return action before deletion completes', async () => {
    const component = create();
    fixture.detectChanges();
    await component.handleReturnToReviewCases();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(TestBed.inject(CasesDraftNavigationService).consumeCheckerDecision()).toBeNull();
  });

  it('blocks return after the checker identity changes', async () => {
    api.patchDraftCasefile.mockReturnValue(of(deletedResponse()));
    vi.mocked(router.navigateByUrl).mockResolvedValueOnce(false);
    const component = create();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
    fixture.detectChanges();
    await component.handleDelete();
    userState.set({ ...userState(), user_id: 99 });
    await component.handleReturnToReviewCases();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#create_casefile_delete_return')).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
    expect(TestBed.inject(CasesDraftNavigationService).consumeCheckerDecision()).toBeNull();
  });

  it('does not clear a newer case notice when an old return fails after route reuse', async () => {
    api.patchDraftCasefile.mockReturnValue(of(deletedResponse()));
    let rejectNavigation!: (error: Error) => void;
    vi.mocked(router.navigateByUrl).mockReturnValueOnce(
      new Promise<boolean>((_resolve, reject) => {
        rejectNavigation = reject;
      }),
    );
    const component = create();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
    fixture.detectChanges();
    const oldDeletion = component.handleDelete();
    await Promise.resolve();
    const next = deleteResult();
    next.draft.draft_casefile_id = 18;
    routeData.next({ draftCasefile: next });
    const nextReceipt = deletedResponse();
    nextReceipt.body!.draft_casefile_id = 18;
    api.patchDraftCasefile.mockReturnValueOnce(of(nextReceipt));
    component.form.controls.create_casefile_delete_reason.setValue('Next synthetic reason');
    await component.handleDelete();
    rejectNavigation(new Error('Synthetic stale return failure'));
    await oldDeletion;
    expect(TestBed.inject(CasesDraftNavigationService).consumeCheckerDecision()?.draftCasefileId).toBe(18);
    expect(scrollToTop).not.toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
    expect(api.patchDraftCasefile).toHaveBeenCalledTimes(2);
  });

  it('ignores a return rejection after the delete page is destroyed', async () => {
    api.patchDraftCasefile.mockReturnValue(of(deletedResponse()));
    let rejectNavigation!: (error: Error) => void;
    vi.mocked(router.navigateByUrl).mockReturnValueOnce(
      new Promise<boolean>((_resolve, reject) => {
        rejectNavigation = reject;
      }),
    );
    const component = create();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
    fixture.detectChanges();
    const deletion = component.handleDelete();
    await Promise.resolve();
    fixture.destroy();
    rejectNavigation(new Error('Synthetic late return failure'));
    await deletion;
    expect(scrollToTop).not.toHaveBeenCalled();
    expect(api.patchDraftCasefile).toHaveBeenCalledOnce();
  });

  it('passes an opaque saved ETag to PATCH unchanged', async () => {
    const result = deleteResult();
    result.etag = '"opaque-version"';
    api.patchDraftCasefile.mockReturnValue(of(deletedResponse()));
    const component = create({ draftCasefile: result });
    fixture.detectChanges();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
    await component.handleDelete();
    expect(api.patchDraftCasefile).toHaveBeenCalledWith(
      17,
      expect.objectContaining({ casefile_status: 'DELETED' }),
      '"opaque-version"',
    );
  });

  it('resets the visible and announced character counts when the route reuses the page', async () => {
    const component = create();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.govuk-character-count__status')?.textContent).toContain('241 characters remaining');
    const next = deleteResult();
    next.draft.draft_casefile_id = 18;
    routeData.next({ draftCasefile: next });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.querySelector<HTMLTextAreaElement>('textarea')?.value).toBe('');
    expect(host.querySelector('.govuk-character-count__status')?.textContent).toContain('250 characters remaining');
    expect(host.querySelector('.govuk-character-count__sr-status')?.textContent).toContain('250 characters remaining');
  });
  it('prevents native submission and sends only one PATCH while the response is pending', async () => {
    const pending = new Subject<HttpResponse<unknown>>();
    api.patchDraftCasefile.mockReturnValue(pending);
    const component = create();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    const submit = new SubmitEvent('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submit);
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    expect(submit.defaultPrevented).toBe(true);
    expect(api.patchDraftCasefile).toHaveBeenCalledOnce();
    pending.next(deletedResponse());
    pending.complete();
    await fixture.whenStable();
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
  });

  it('preserves shared feedback and the editable reason when Cancel navigation rejects', async () => {
    const component = create();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
    fixture.detectChanges();
    globalStore.setBannerError({
      ...globalStore.bannerError(),
      error: true,
      title: 'Synthetic shared title',
      message: 'Synthetic shared detail',
    });
    vi.mocked(router.navigateByUrl).mockRejectedValueOnce(new Error('Synthetic navigation failure'));
    await component.handleCancel();
    expect(component.form.controls.create_casefile_delete_reason.value).toBe('Synthetic reason');
    expect(component.form.controls.create_casefile_delete_reason.enabled).toBe(true);
    expect(globalStore.bannerError().message).toBe('Synthetic shared detail');
    expect(scrollToTop).toHaveBeenCalledOnce();
    expect(api.patchDraftCasefile).not.toHaveBeenCalled();
  });

  it('ignores an old Cancel rejection after the routed component loads another case', async () => {
    let rejectNavigation!: (error: Error) => void;
    vi.mocked(router.navigateByUrl).mockReturnValueOnce(
      new Promise<boolean>((_resolve, reject) => {
        rejectNavigation = reject;
      }),
    );
    const component = create();
    fixture.detectChanges();
    const cancel = component.handleCancel();
    const next = deleteResult();
    next.draft.draft_casefile_id = 18;
    routeData.next({ draftCasefile: next });
    rejectNavigation(new Error('Synthetic stale failure'));
    await cancel;
    expect(scrollToTop).not.toHaveBeenCalled();
    expect(store.draft()?.draft_casefile_id).toBe(18);
    expect(component.navigating()).toBe(false);
  });
  it.each(['destroyed', 'shared feedback'] as const)(
    'keeps permission-navigation failure from replacing %s',
    async (condition) => {
      let rejectNavigation!: (error: Error) => void;
      vi.mocked(router.navigateByUrl).mockReturnValueOnce(
        new Promise<boolean>((_resolve, reject) => {
          rejectNavigation = reject;
        }),
      );
      create();
      fixture.detectChanges();
      userState.set({
        ...userState(),
        business_unit_users: [
          { ...userState().business_unit_users[0], permissions: [{ permission_id: 21, permission_name: 'Create' }] },
        ],
      });
      fixture.detectChanges();
      expect(router.navigateByUrl).toHaveBeenCalledExactlyOnceWith('/error/permission-denied');
      if (condition === 'destroyed') fixture.destroy();
      else
        globalStore.setBannerError({
          ...globalStore.bannerError(),
          error: true,
          title: 'Synthetic shared title',
          message: 'Synthetic shared detail',
        });
      const before = structuredClone(globalStore.bannerError());
      rejectNavigation(new Error('Synthetic permission navigation failure'));
      await fixture.whenStable();
      expect(globalStore.bannerError()).toEqual(before);
      expect(scrollToTop).not.toHaveBeenCalled();
    },
  );
});
