import { casefileStatusLabel } from '../utils/cases-draft-casefile-history';
import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
import { CASES_DRAFT_DELETE_CANCEL_NAVIGATION_INFO } from '../constants/cases-draft-delete-cancel-navigation-info.constant';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Data, provideRouter, Router, UrlTree } from '@angular/router';
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
  const api = { deleteDraftCasefile: vi.fn(), getDraftCasefile: vi.fn() };

  beforeEach(async () => {
    userState.set(checkerUser());
    authenticated.set(true);
    featureFlags.set({ 'release-1c-rm-create-case-files': true });
    scrollToTop.mockReset();
    api.deleteDraftCasefile.mockReset();
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
    await component.handleDelete();
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
    await component.handleDelete();
    fixture.detectChanges();
    expect(router.navigateByUrl).toHaveBeenCalledExactlyOnceWith('/error/permission-denied');
    expect(fixture.nativeElement.querySelector('#create_casefile_delete_identity')).toBeNull();
    expect(fixture.nativeElement.querySelector('textarea')).toBeNull();
    expect(fixture.nativeElement.querySelector('#create_casefile_delete_return')).toBeNull();
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
    expect(api.deleteDraftCasefile).not.toHaveBeenCalled();
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
    expect(api.deleteDraftCasefile).not.toHaveBeenCalled();
  });
  it('cancels to the selected review without mutating saved state or sending PATCH', async () => {
    const component = create();
    const before = structuredClone(getState(store));
    fixture.detectChanges();
    await component.handleCancel();
    const url = vi.mocked(router.navigateByUrl).mock.calls[0][0] as UrlTree;
    expect(router.serializeUrl(url)).toBe('/cases/draft/check-and-validate/review/17#to-review');
    expect(vi.mocked(router.navigateByUrl).mock.calls[0][1]).toEqual({
      info: CASES_DRAFT_DELETE_CANCEL_NAVIGATION_INFO,
    });
    expect(getState(store)).toEqual(before);
    expect(api.deleteDraftCasefile).not.toHaveBeenCalled();
  });

  function deletedResponse() {
    const draft = createPersistedCasefileResolved({ intent: 'checker-delete' }).draft;
    draft.casefile_status = 'DELETED';
    return new HttpResponse({ status: 200, body: draft, headers: new HttpHeaders({ ETag: '"1"' }) });
  }
  it('dispatches once and preserves the exact reason, original ETag and saved aggregate', async () => {
    const pending = new Subject<HttpResponse<unknown>>();
    api.deleteDraftCasefile.mockReturnValue(pending);
    const component = create();
    fixture.detectChanges();
    const before = structuredClone(getState(store));
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason\nSecond line');
    const first = component.handleDelete();
    await component.handleDelete();
    expect(api.deleteDraftCasefile).toHaveBeenCalledExactlyOnceWith(
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
  it('retains completion after failed navigation and retries navigation without another PATCH', async () => {
    api.deleteDraftCasefile.mockReturnValue(of(deletedResponse()));
    vi.mocked(router.navigateByUrl).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const component = create();
    fixture.detectChanges();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
    await component.handleDelete();
    expect(component.phase()).toBe('complete');
    await component.handleReturnToReviewCases();
    expect(api.deleteDraftCasefile).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
  });
  it('ignores an old response after the route is reused for a newer case', async () => {
    const pending = new Subject<HttpResponse<unknown>>();
    api.deleteDraftCasefile.mockReturnValue(pending);
    const component = create();
    fixture.detectChanges();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
    const first = component.handleDelete();
    const next = createPersistedCasefileResolved({ intent: 'checker-delete' });
    next.draft.draft_casefile_id = 18;
    routeData.next({ draftCasefile: next });
    pending.next(deletedResponse());
    pending.complete();
    await first;
    expect(store.draft()?.draft_casefile_id).toBe(18);
    expect(component.phase()).toBe('ready');
    expect(component.form.controls.create_casefile_delete_reason.value).toBe('');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
  it('resets the visible and announced shared counts when the route reuses the page', async () => {
    const component = create();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const textarea = host.querySelector<HTMLTextAreaElement>('#create_casefile_delete_reason');
    const assertCount = (expected: string) => {
      expect(host.querySelector('.govuk-character-count__status')?.textContent?.trim()).toBe(expected);
      expect(host.querySelector('.govuk-character-count__sr-status')?.textContent?.trim()).toBe(expected);
    };
    assertCount('You have 241 characters remaining');
    const next = createPersistedCasefileResolved({ intent: 'checker-delete' });
    next.draft.draft_casefile_id = 18;
    routeData.next({ draftCasefile: next });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.querySelector('#create_casefile_delete_reason')).toBe(textarea);
    expect(textarea?.value).toBe('');
    expect(component.form.controls.create_casefile_delete_reason.value).toBe('');
    assertCount('You have 250 characters remaining');
    expect(api.deleteDraftCasefile).not.toHaveBeenCalled();
  });

  it.each(['empty completion', 'network error'] as const)('locks an %s without replay', async (kind) => {
    api.deleteDraftCasefile.mockReturnValue(
      kind === 'empty completion' ? EMPTY : throwError(() => new HttpErrorResponse({ status: 0 })),
    );
    const component = create();
    fixture.detectChanges();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
    await component.handleDelete();
    expect(component.phase()).toBe('unresolved');
    expect(component.form.controls.create_casefile_delete_reason.value).toBe('Synthetic reason');
    expect(component.form.controls.create_casefile_delete_reason.disabled).toBe(true);
    await component.handleDelete();
    expect(api.deleteDraftCasefile).toHaveBeenCalledOnce();
    expect(api.getDraftCasefile).not.toHaveBeenCalled();
  });
  it('checks still-reviewable state without changing the original attempt or replaying', async () => {
    api.deleteDraftCasefile.mockReturnValue(EMPTY);
    const latest = createPersistedCasefileResolved({ intent: 'checker-delete' });
    api.getDraftCasefile.mockReturnValue(of({ draft: latest.draft, etag: '"4"' }));
    const component = create();
    fixture.detectChanges();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
    await component.handleDelete();
    await component.handleCheckLatestStatus();
    expect(api.getDraftCasefile).toHaveBeenCalledExactlyOnceWith(17);
    expect(component.phase()).toBe('unresolved');
    expect(store.etag()).toBe('"0"');
    expect(component.form.controls.create_casefile_delete_reason.value).toBe('Synthetic reason');
    expect(component.recoveryText()).toBe(
      'At the last check, this case was awaiting review. We could not confirm the earlier deletion request.',
    );
    await component.handleDelete();
    expect(api.deleteDraftCasefile).toHaveBeenCalledOnce();
  });
  it('uses neutral observed wording after authoritative DELETED recovery', async () => {
    api.deleteDraftCasefile.mockReturnValue(EMPTY);
    const response = deletedResponse();
    api.getDraftCasefile.mockReturnValue(of({ draft: response.body!, etag: '"1"' }));
    const navigation = TestBed.inject(CasesDraftNavigationService);
    const record = vi.spyOn(navigation, 'recordCheckerDeletion');
    const component = create();
    fixture.detectChanges();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
    await component.handleDelete();
    await component.handleCheckLatestStatus();
    expect(record).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'observed', draftCasefileId: 17 }));
    expect(api.deleteDraftCasefile).toHaveBeenCalledOnce();
  });

  it.each(['false', 'rejected'])(
    'retains completion after %s dashboard return and retries navigation only',
    async (failure) => {
      api.deleteDraftCasefile.mockReturnValue(of(deletedResponse()));
      if (failure === 'false') vi.mocked(router.navigateByUrl).mockResolvedValueOnce(false);
      else vi.mocked(router.navigateByUrl).mockRejectedValueOnce(new Error('Synthetic navigation failure'));
      const component = create();
      fixture.detectChanges();
      component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
      await component.handleDelete();
      expect(component.phase()).toBe('complete');
      expect(component.returnFailed()).toBe(true);
      await component.handleReturnToReviewCases();
      expect(api.deleteDraftCasefile).toHaveBeenCalledOnce();
      expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
    },
  );

  it.each(['authentication', 'release', 'identity', 'permission'])(
    'ignores pending deletion after loss of %s',
    async (condition) => {
      const pending = new Subject<HttpResponse<unknown>>();
      api.deleteDraftCasefile.mockReturnValue(pending);
      const navigation = TestBed.inject(CasesDraftNavigationService);
      const record = vi.spyOn(navigation, 'recordCheckerDeletion');
      const component = create();
      fixture.detectChanges();
      component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
      const deletion = component.handleDelete();
      if (condition === 'authentication') authenticated.set(false);
      if (condition === 'release') featureFlags.set({});
      if (condition === 'identity') userState.set({ ...userState(), user_id: 99 });
      if (condition === 'permission')
        userState.set({
          ...userState(),
          business_unit_users: [
            { ...userState().business_unit_users[0], permissions: [{ permission_id: 21, permission_name: 'Create' }] },
          ],
        });
      fixture.detectChanges();
      pending.next(deletedResponse());
      pending.complete();
      await deletion;
      expect(record).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('textarea')).toBeNull();
      expect(router.navigateByUrl).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ state: expect.anything() }),
      );
    },
  );

  it.each(['id', 'business unit', 'version'])(
    'rejects recovery with incorrect %s and preserves the original attempt',
    async (kind) => {
      api.deleteDraftCasefile.mockReturnValue(EMPTY);
      const latest = deleteResult();
      if (kind === 'id') latest.draft.draft_casefile_id = 18;
      if (kind === 'business unit') latest.draft.business_unit_id = 45;
      api.getDraftCasefile.mockReturnValue(
        of({ draft: latest.draft, etag: kind === 'version' ? '"9223372036854775808"' : '"4"' }),
      );
      const component = create();
      fixture.detectChanges();
      component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
      await component.handleDelete();
      await component.handleCheckLatestStatus();
      expect(component.phase()).toBe('unresolved');
      expect(store.etag()).toBe('"0"');
      expect(router.navigateByUrl).not.toHaveBeenCalled();
      await component.handleDelete();
      expect(api.deleteDraftCasefile).toHaveBeenCalledOnce();
    },
  );

  it.each(['REJECTED', 'PUBLISHING_PENDING', 'PUBLISHED', 'PUBLISHING_FAILED'] as const)(
    'shows observed %s without replay',
    async (status) => {
      api.deleteDraftCasefile.mockReturnValue(EMPTY);
      const latest = deleteResult();
      latest.draft.casefile_status = status;
      api.getDraftCasefile.mockReturnValue(of({ draft: latest.draft, etag: '"4"' }));
      const component = create();
      fixture.detectChanges();
      component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
      await component.handleDelete();
      await component.handleCheckLatestStatus();
      expect(component.recoveryText()).toContain(casefileStatusLabel(status, 'checker'));
      expect(component.phase()).toBe('unresolved');
      await component.handleDelete();
      expect(api.deleteDraftCasefile).toHaveBeenCalledOnce();
    },
  );

  it('allows only one explicit status check at a time', async () => {
    api.deleteDraftCasefile.mockReturnValue(EMPTY);
    const pending = new Subject<{ draft: ReturnType<typeof deleteResult>['draft']; etag: string }>();
    api.getDraftCasefile.mockReturnValue(pending);
    const component = create();
    fixture.detectChanges();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
    await component.handleDelete();
    const first = component.handleCheckLatestStatus();
    await component.handleCheckLatestStatus();
    expect(api.getDraftCasefile).toHaveBeenCalledExactlyOnceWith(17);
    pending.next({ draft: deleteResult().draft, etag: '"4"' });
    pending.complete();
    await first;
    expect(component.checking()).toBe(false);
  });

  it.each([
    [400, 'ready'],
    [401, 'denied'],
    [403, 'denied'],
    [503, 'unresolved'],
  ] as const)('handles PATCH HTTP %s without repeating a decision', async (status, expectedPhase) => {
    api.deleteDraftCasefile.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
    const component = create();
    fixture.detectChanges();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
    await component.handleDelete();
    fixture.detectChanges();
    expect(component.phase()).toBe(expectedPhase);
    expect(component.form.controls.create_casefile_delete_reason.value).toBe(
      [401, 403].includes(status) ? '' : 'Synthetic reason',
    );
    expect(api.deleteDraftCasefile).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
  it('ignores a decision response after destruction without recording success', async () => {
    const pending = new Subject<HttpResponse<unknown>>();
    api.deleteDraftCasefile.mockReturnValue(pending);
    const record = vi.spyOn(TestBed.inject(CasesDraftNavigationService), 'recordCheckerDeletion');
    const component = create();
    fixture.detectChanges();
    component.form.controls.create_casefile_delete_reason.setValue('Synthetic reason');
    const deletion = component.handleDelete();
    fixture.destroy();
    store.resetStore();
    pending.next(deletedResponse());
    pending.complete();
    await deletion;
    expect(record).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(store.draft()).toBeNull();
  });
});
