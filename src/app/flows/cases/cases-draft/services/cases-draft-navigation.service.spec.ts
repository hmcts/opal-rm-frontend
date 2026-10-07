import { createEnvironmentInjector, EnvironmentInjector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import type { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CasesCreateCasefileStore } from '../../cases-create-casefile/stores/cases-create-casefile.store';
import type { ICasesDraftNavigation } from '../interfaces/cases-draft-navigation.interface';
import { defaultCasesDraftNavigation } from '../utils/cases-draft-navigation';
import { CASES_DRAFT_DASHBOARD_MODE } from '../constants/cases-draft-dashboard-mode.token';
import { CasesDraftNavigationService } from './cases-draft-navigation.service';

const permittedUser = (): IOpalUserState => ({
  ...structuredClone(OPAL_USER_STATE_MOCK),
  user_id: 100,
  status: 'active',
  business_unit_users: [
    {
      business_unit_id: 44,
      business_unit_user_id: 'BUU-SYNTHETIC',
      permissions: [{ permission_id: 21, permission_name: 'Create and Manage Draft Casefiles' }],
    },
  ],
});

describe('CasesDraftNavigationService', () => {
  const flag = 'release-1c-rm-create-case-files';
  const authenticated = signal(true);
  const userState = signal<IOpalUserState | null>(null);
  const featureFlags = signal<Record<string, boolean>>({});
  const selected: ICasesDraftNavigation = { tab: 'approved', page: 2, sort: 'approved', direction: 'descending' };
  let service: CasesDraftNavigationService;
  let router: Router;
  const flush = () => TestBed.tick();
  const remember = () => {
    service.setSelection(selected);
    service.rememberCreateOrigin();
  };
  const expectCleared = () => {
    expect(service.selection()).toEqual(defaultCasesDraftNavigation());
    expect(router.serializeUrl(service.creationReturnUrl())).toBe('/cases/draft/create-and-manage/tabs#in-review');
  };
  beforeEach(() => {
    authenticated.set(true);
    userState.set(permittedUser());
    featureFlags.set({ [flag]: true });
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: GlobalStore, useValue: { authenticated, userState, featureFlags } }],
    });
    service = TestBed.inject(CasesDraftNavigationService);
    router = TestBed.inject(Router);
  });
  it('keeps dashboard metadata independent from the oldest-first rejection list', () => {
    const navigation = TestBed.inject(CasesDraftNavigationService);
    navigation.setSelection({ tab: 'rejected', page: 3, sort: 'created', direction: 'descending' });
    navigation.rememberAllRejectedDashboardOrigin();
    expect(navigation.allRejectedSelection()).toEqual({ page: 1, sort: 'statusDate', direction: 'ascending' });
    navigation.setAllRejectedSelection({ page: 2, sort: 'submittedByName', direction: 'descending' });
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(navigation.allRejectedDashboardUrl())).toBe(
      '/cases/draft/create-and-manage/tabs#rejected',
    );
    expect(router.serializeUrl(navigation.allRejectedPlaceholderUrl('details', 123))).toBe(
      '/cases/create-casefile/check-case-details/123',
    );
    expect(router.serializeUrl(navigation.allRejectedPlaceholderUrl('amendment', 123))).toBe(
      '/cases/create-casefile/task-list/123',
    );
  });
  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])('rejects unsafe identifier %s', (id) => {
    const navigation = TestBed.inject(CasesDraftNavigationService);
    expect(() => navigation.allRejectedPlaceholderUrl('details', id)).toThrow('Invalid draft casefile identifier');
  });

  it('restores independent list and dashboard state after a details return', async () => {
    const navigation = TestBed.inject(CasesDraftNavigationService);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const dashboard = { tab: 'rejected' as const, page: 3, sort: 'created' as const, direction: 'descending' as const };
    const list = { page: 2, sort: 'submittedByName' as const, direction: 'descending' as const };
    navigation.setSelection(dashboard);
    await navigation.navigateToAllRejected();
    navigation.setAllRejectedSelection(list);
    await navigation.navigateToPlaceholder('details', 123, 'all-rejected');
    expect(navigation.contextForPlaceholder('details', '123')).not.toBeNull();
    expect(navigation.contextForPlaceholder('details', '124')).toBeNull();
    expect(navigation.contextForPlaceholder('amendment', '123')).toBeNull();
    expect(navigation.contextForPlaceholder('details', '01')).toBeNull();
    await navigation.returnFromPlaceholder('details', '123');
    expect(navigation.allRejectedSelection()).toEqual(list);
    expect(navigation.contextForPlaceholder('details', '123')).toBeNull();
    await navigation.returnFromAllRejected();
    expect(navigation.selection()).toEqual(dashboard);
    expect(navigation.allRejectedSelection()).toEqual(list);
  });
  it('rolls cancelled row context back without losing selection', async () => {
    const navigation = TestBed.inject(CasesDraftNavigationService);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(false);
    navigation.setAllRejectedSelection({ page: 2, sort: 'created', direction: 'descending' });
    expect(await navigation.navigateToPlaceholder('details', 123, 'all-rejected')).toBe(false);
    expect(navigation.contextForPlaceholder('details', '123')).toBeNull();
    expect(navigation.allRejectedSelection()).toEqual({ page: 2, sort: 'created', direction: 'descending' });
  });
  it('keeps PO-10606 creation cancellation restoration intact', () => {
    const navigation = TestBed.inject(CasesDraftNavigationService);
    const saved = { tab: 'rejected' as const, page: 3, sort: 'created' as const, direction: 'descending' as const };
    navigation.setSelection(saved);
    navigation.rememberCreateOrigin();
    navigation.setSelection({ tab: 'in-review', page: 1, sort: 'created', direction: 'ascending' });
    expect(TestBed.inject(Router).serializeUrl(navigation.prepareCreationReturn())).toBe(
      '/cases/draft/create-and-manage/tabs#rejected',
    );
    expect(navigation.selection()).toEqual(saved);
  });

  const dashboardState: ICasesDraftNavigation = { tab: 'rejected', page: 3, sort: 'created', direction: 'descending' };
  const listState = { page: 2, sort: 'submittedByName' as const, direction: 'descending' as const };
  const success = () => ({
    origin: 'all-rejected',
    identity: { userId: 100, businessUnitId: 44, submittedBy: 'BUU-SYNTHETIC' },
    draftCasefileId: 123,
    respondentForename: ' Synthetic ',
    respondentSurname: ' Respondent ',
  });
  it('copies valid selections and rejects invalid state without changing the table', () => {
    const value = { ...listState };
    service.setAllRejectedSelection(value);
    value.page = 9;
    service.setAllRejectedSelection({ ...listState, page: 0 });
    expect(service.allRejectedSelection()).toEqual(listState);
  });
  it('uses the default rejected dashboard when entry originated on another tab', async () => {
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    service.setSelection(selected);
    await service.navigateToAllRejected();
    await service.returnFromAllRejected();
    expect(service.selection()).toEqual(defaultCasesDraftNavigation('rejected'));
  });
  it.each(['cancel', 'throw'] as const)('rolls back list entry and dashboard Back on %s', async (outcome) => {
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    service.setSelection(dashboardState);
    await service.navigateToAllRejected();
    service.setSelection(selected);
    if (outcome === 'cancel') navigate.mockResolvedValue(false);
    else navigate.mockRejectedValue(new Error('Synthetic navigation error'));
    const entry = service.navigateToAllRejected();
    if (outcome === 'cancel') expect(await entry).toBe(false);
    else await expect(entry).rejects.toThrow('Synthetic navigation error');
    const back = service.returnFromAllRejected();
    if (outcome === 'cancel') expect(await back).toBe(false);
    else await expect(back).rejects.toThrow('Synthetic navigation error');
    expect(service.selection()).toEqual(selected);
    navigate.mockResolvedValue(true);
    await service.returnFromAllRejected();
    expect(service.selection()).toEqual(dashboardState);
  });
  it.each(['cancel', 'throw'] as const)('preserves old row context and list selection on %s', async (outcome) => {
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    service.setAllRejectedSelection(listState);
    await service.navigateToPlaceholder('amendment', 123, 'all-rejected');
    if (outcome === 'cancel') navigate.mockResolvedValue(false);
    else navigate.mockRejectedValue(new Error('Synthetic navigation error'));
    const entry = service.navigateToPlaceholder('details', 124, 'all-rejected');
    if (outcome === 'cancel') expect(await entry).toBe(false);
    else await expect(entry).rejects.toThrow('Synthetic navigation error');
    expect(service.contextForPlaceholder('amendment', '123')).not.toBeNull();
    expect(service.contextForPlaceholder('details', '124')).toBeNull();
    const back = service.returnFromPlaceholder('amendment', '123');
    if (outcome === 'cancel') expect(await back).toBe(false);
    else await expect(back).rejects.toThrow('Synthetic navigation error');
    expect(service.contextForPlaceholder('amendment', '123')).not.toBeNull();
    expect(service.allRejectedSelection()).toEqual(listState);
  });
  it('retains context across browser Back but clears it on a same-ID dashboard entry', async () => {
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await service.navigateToPlaceholder('details', 123, 'all-rejected');
    expect(service.contextForPlaceholder('details', '123')).not.toBeNull();
    service.setAllRejectedSelection(listState);
    await router.navigateByUrl(service.allRejectedUrl());
    expect(service.contextForPlaceholder('details', '123')).not.toBeNull();
    await service.navigateToPlaceholder('details', 123);
    expect(service.contextForPlaceholder('details', '123')).toBeNull();
  });
  it.each([null, '', '0', '-1', '+123', '01', '123 ', '1.5', '9007199254740992'])(
    'rejects invalid context ID %s',
    async (id) => {
      vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
      await service.navigateToPlaceholder('details', 123, 'all-rejected');
      expect(service.contextForPlaceholder('details', id)).toBeNull();
      expect(await service.returnFromPlaceholder('details', id)).toBe(false);
      expect(service.contextForPlaceholder('review', '123')).toBeNull();
    },
  );
  it('rejects unsafe row navigation before changing captured context', async () => {
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await service.navigateToPlaceholder('details', 123, 'all-rejected');
    await expect(service.navigateToPlaceholder('amendment', 0, 'all-rejected')).rejects.toThrow(
      'Invalid draft casefile identifier',
    );
    expect(service.contextForPlaceholder('details', '123')).not.toBeNull();
    expect(navigate).toHaveBeenCalledTimes(1);
  });
  it('accepts the largest safe identifier and uses pure URL construction', async () => {
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await service.navigateToPlaceholder('details', Number.MAX_SAFE_INTEGER, 'all-rejected');
    expect(service.contextForPlaceholder('details', String(Number.MAX_SAFE_INTEGER))).not.toBeNull();
    const context = service.contextForPlaceholder('details', String(Number.MAX_SAFE_INTEGER));
    service.allRejectedDashboardUrl();
    service.allRejectedUrl();
    service.allRejectedPlaceholderUrl('amendment', 124);
    expect(service.contextForPlaceholder('details', String(Number.MAX_SAFE_INTEGER))).toEqual(context);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0]).toHaveLength(1);
    expect((navigate.mock.calls[0][0] as import('@angular/router').UrlTree).queryParams).toEqual({});
  });
  it('consumes only an explicitly recorded validated success once and can dismiss it', () => {
    expect(service.consumeAllRejectedResubmission()).toBeNull();
    const event = success();
    expect(service.recordAllRejectedResubmission(event)).toBe(true);
    event.respondentForename = 'Changed';
    event.identity.submittedBy = 'Changed';
    expect(service.consumeAllRejectedResubmission()).toEqual({
      ...success(),
      respondentForename: 'Synthetic',
      respondentSurname: 'Respondent',
    });
    expect(service.consumeAllRejectedResubmission()).toBeNull();
    service.recordAllRejectedResubmission(success());
    service.clearAllRejectedSuccess();
    expect(service.consumeAllRejectedResubmission()).toBeNull();
    service.recordAllRejectedResubmission(success());
    expect(service.recordAllRejectedResubmission({ success: true })).toBe(false);
    expect(service.consumeAllRejectedResubmission()).toBeNull();
  });
  it.each([
    'global user',
    'BU user',
    'BU',
    'permission',
    'status',
    'missing user',
    'authentication',
    'release',
    'missing flag',
  ])('hides list origins and success immediately on %s change', async (change) => {
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    service.setSelection(dashboardState);
    await service.navigateToAllRejected();
    service.setAllRejectedSelection(listState);
    await service.navigateToPlaceholder('details', 123, 'all-rejected');
    service.recordAllRejectedResubmission(success());
    flush();
    const user = permittedUser();
    if (change === 'global user') user.user_id = 101;
    if (change === 'BU user') user.business_unit_users[0].business_unit_user_id = 'OTHER-SYNTHETIC';
    if (change === 'BU') user.business_unit_users[0].business_unit_id = 45;
    if (change === 'permission') user.business_unit_users[0].permissions = [];
    if (change === 'status') user.status = 'suspended';
    userState.set(change === 'missing user' ? null : user);
    if (change === 'authentication') authenticated.set(false);
    if (change === 'release') featureFlags.set({ [flag]: false });
    if (change === 'missing flag') featureFlags.set({});
    expect(service.allRejectedSelection()).toEqual({ page: 1, sort: 'statusDate', direction: 'ascending' });
    expect(service.contextForPlaceholder('details', '123')).toBeNull();
    expect(router.serializeUrl(service.allRejectedDashboardUrl())).toBe('/cases/draft/create-and-manage/tabs#rejected');
    expect(service.consumeAllRejectedResubmission()).toBeNull();
    flush();
    authenticated.set(true);
    userState.set(permittedUser());
    featureFlags.set({ [flag]: true });
    flush();
    expect(service.allRejectedSelection()).toEqual({ page: 1, sort: 'statusDate', direction: 'ascending' });
    expect(service.contextForPlaceholder('details', '123')).toBeNull();
  });
  it.each(['entry', 'row', 'dashboard Back', 'placeholder Back'] as const)(
    'does not roll %s metadata into a new identity after an in-flight navigation',
    async (operation) => {
      const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
      await service.navigateToPlaceholder('details', 123, 'all-rejected');
      let resolve!: (value: boolean) => void;
      navigate.mockImplementation(
        () =>
          new Promise<boolean>((done) => {
            resolve = done;
          }),
      );
      let pending: Promise<boolean>;
      if (operation === 'entry') pending = service.navigateToAllRejected();
      else if (operation === 'row') pending = service.navigateToPlaceholder('details', 124, 'all-rejected');
      else if (operation === 'dashboard Back') pending = service.returnFromAllRejected();
      else pending = service.returnFromPlaceholder('details', '123');
      userState.set({ ...permittedUser(), user_id: 101 });
      service.setAllRejectedSelection(listState);
      resolve(operation === 'placeholder Back');
      await pending;
      expect(service.contextForPlaceholder('details', '123')).toBeNull();
      expect(service.contextForPlaceholder('details', '124')).toBeNull();
      expect(service.allRejectedSelection()).toEqual(listState);
    },
  );
  it('refuses protected memory operations without live inputter permission', async () => {
    authenticated.set(false);
    service.setAllRejectedSelection(listState);
    service.rememberAllRejectedDashboardOrigin();
    expect(await service.navigateToAllRejected()).toBe(false);
    expect(await service.navigateToPlaceholder('details', 123, 'all-rejected')).toBe(false);
    expect(await service.returnFromAllRejected()).toBe(false);
    expect(service.recordAllRejectedResubmission(success())).toBe(false);
  });
  it('returns to the default rejected dashboard with no remembered origin', async () => {
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await service.returnFromAllRejected();
    expect(service.selection()).toEqual(defaultCasesDraftNavigation('rejected'));
  });
  it('starts with the default selection and return URL', () => {
    flush();
    expectCleared();
  });
  it('retains initial valid incoming metadata through the first lifecycle effect', () => {
    service.setSelection({ ...defaultCasesDraftNavigation('approved'), page: 2 });
    flush();
    expect(service.selection()).toEqual({ ...defaultCasesDraftNavigation('approved'), page: 2 });
  });
  it('copies input selection and snapshots the create origin', () => {
    const input = { ...selected };
    service.setSelection(input);
    input.page = 9;
    service.rememberCreateOrigin();
    service.setSelection(defaultCasesDraftNavigation('rejected'));
    flush();
    expect(service.selection()).toEqual(defaultCasesDraftNavigation('rejected'));
    expect(router.serializeUrl(service.creationReturnUrl())).toBe('/cases/draft/create-and-manage/tabs#approved');
  });
  it('restores the remembered local table state before cancellation returns without URL metadata', () => {
    service.setSelection(selected);
    service.rememberCreateOrigin();
    service.setSelection(defaultCasesDraftNavigation('rejected'));
    expect(router.serializeUrl(service.prepareCreationReturn())).toBe('/cases/draft/create-and-manage/tabs#approved');
    expect(service.selection()).toEqual(selected);
  });
  it('restores the captured local table state before cancellation returns without query parameters', () => {
    remember();
    service.setSelection(defaultCasesDraftNavigation('rejected'));
    const destination = service.prepareCreationReturn();
    expect(router.serializeUrl(destination)).toBe('/cases/draft/create-and-manage/tabs#approved');
    expect(destination.queryParams).toEqual({});
    expect(service.selection()).toEqual(selected);
  });
  it.each(['absent', 'cleared'])('returns to default In review when the creation origin is %s', (origin) => {
    service.setSelection({ tab: 'in-review', page: 2, sort: 'respondent', direction: 'descending' });
    if (origin === 'cleared') {
      service.rememberCreateOrigin();
      service.clearCreateOrigin();
    }
    const destination = service.prepareCreationReturn();
    expect(router.serializeUrl(destination)).toBe('/cases/draft/create-and-manage/tabs#in-review');
    expect(destination.queryParams).toEqual({});
    expect(service.selection()).toEqual(defaultCasesDraftNavigation());
  });
  it('clears old create origins for a direct new creation', () => {
    remember();
    service.clearCreateOrigin();
    expect(router.serializeUrl(service.creationReturnUrl())).toContain('#in-review');
    expect(service.selection()).toEqual(selected);
  });
  it('keeps dashboard metadata independent of real creation-store resets', () => {
    remember();
    const creation = TestBed.inject(CasesCreateCasefileStore);
    creation.setSubmissionSucceeded(true);
    creation.resetStore();
    flush();
    expect(creation.submissionSucceeded()).toBe(false);
    expect(service.selection()).toEqual(selected);
    expect(router.serializeUrl(service.creationReturnUrl())).toContain('#approved');
  });
  it.each([
    'global user',
    'BU user',
    'BU',
    'permission',
    'status',
    'missing user',
    'authentication',
    'release',
    'missing flag',
  ])('clears selection and origin after %s changes', (change) => {
    remember();
    flush();
    const user = permittedUser();
    if (change === 'global user') user.user_id = 101;
    if (change === 'BU user') user.business_unit_users[0].business_unit_user_id = 'OTHER-SYNTHETIC';
    if (change === 'BU') user.business_unit_users[0].business_unit_id = 45;
    if (change === 'permission') user.business_unit_users[0].permissions = [];
    if (change === 'status') user.status = 'suspended';
    userState.set(change === 'missing user' ? null : user);
    if (change === 'authentication') authenticated.set(false);
    if (change === 'release') featureFlags.set({ [flag]: false });
    if (change === 'missing flag') featureFlags.set({});
    flush();
    expectCleared();
  });
  it('retains selection when equivalent authorised identity is re-emitted', () => {
    remember();
    flush();
    userState.set(permittedUser());
    flush();
    expect(service.selection()).toEqual(selected);
  });
  it('does not restore a prior user selection after access returns', () => {
    remember();
    flush();
    authenticated.set(false);
    flush();
    authenticated.set(true);
    flush();
    expectCleared();
  });
  it('clears incoming metadata on the first effect when access is already absent', () => {
    authenticated.set(false);
    remember();
    flush();
    expectCleared();
  });
  it('creates a closed dashboard URL from only validated metadata', () => {
    service.setSelection({ tab: 'rejected', page: 3, sort: 'applicant', direction: 'descending' });
    expect(router.serializeUrl(service.dashboardUrl())).toBe('/cases/draft/create-and-manage/tabs#rejected');
    expect(router.serializeUrl(service.dashboardUrl(defaultCasesDraftNavigation()))).toContain('#in-review');
  });
  it.each([
    ['details', '/cases/create-casefile/check-case-details/12'],
    ['amendment', '/cases/create-casefile/task-list/12'],
    ['rejections', '/cases/draft/create-and-manage/rejections'],
  ] as const)('creates the fixed %s destination with restorable metadata', (kind, path) => {
    service.setSelection({ tab: 'rejected', page: 3, sort: 'applicant', direction: 'descending' });
    const tree = service.placeholderUrl(kind, 12);
    expect(router.serializeUrl(tree)).toBe(path + '#rejected');
    expect(tree.queryParams).toEqual({});
    expect(tree.fragment).toBe(service.selection().tab);
  });
  it.each(['details', 'amendment'] as const)('rejects invalid identifiers for %s', (kind) => {
    for (const id of [undefined, 0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])
      expect(() => service.placeholderUrl(kind, id)).toThrow('Invalid draft casefile identifier');
  });
  it('does not require an identifier for all rejections', () => {
    expect(router.serializeUrl(service.placeholderUrl('rejections'))).toBe(
      '/cases/draft/create-and-manage/rejections#in-review',
    );
  });
});

describe('checker CasesDraftNavigationService', () => {
  const authenticated = signal(true);
  const userState = signal<IOpalUserState | null>(null);
  const featureFlags = signal<Record<string, boolean>>({});
  let service: CasesDraftNavigationService;
  let router: Router;
  const checkerUser = () => {
    const user = permittedUser();
    user.business_unit_users[0].permissions = [
      { permission_id: 22, permission_name: 'Check and Validate Draft Casefiles' },
    ];
    return user;
  };
  beforeEach(() => {
    authenticated.set(true);
    userState.set(checkerUser());
    featureFlags.set({ 'release-1c-rm-create-case-files': true });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: GlobalStore, useValue: { authenticated, userState, featureFlags } },
        { provide: CASES_DRAFT_DASHBOARD_MODE, useValue: 'checker' },
      ],
    });
    service = TestBed.inject(CasesDraftNavigationService);
    router = TestBed.inject(Router);
  });
  it('cannot retain inputter list metadata, placeholder context or success', async () => {
    const navigate = vi.spyOn(router, 'navigateByUrl');
    service.setAllRejectedSelection({ page: 2, sort: 'created', direction: 'descending' });
    service.rememberAllRejectedDashboardOrigin();
    expect(service.allRejectedSelection()).toEqual({ page: 1, sort: 'statusDate', direction: 'ascending' });
    expect(await service.navigateToAllRejected()).toBe(false);
    expect(await service.navigateToPlaceholder('details', 123, 'all-rejected')).toBe(false);
    expect(await service.returnFromAllRejected()).toBe(false);
    expect(service.contextForPlaceholder('details', '123')).toBeNull();
    expect(
      service.recordAllRejectedResubmission({
        origin: 'all-rejected',
        identity: { userId: 100, businessUnitId: 44, submittedBy: 'BUU-SYNTHETIC' },
        draftCasefileId: 123,
        respondentForename: 'Synthetic',
        respondentSurname: 'Respondent',
      }),
    ).toBe(false);
    expect(service.consumeAllRejectedResubmission()).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });
  it('starts with the checker default and constructs its dashboard URL', () => {
    TestBed.tick();
    expect(service.selection()).toEqual(defaultCasesDraftNavigation(undefined, 'checker'));
    expect(router.serializeUrl(service.dashboardUrl())).toBe('/cases/draft/check-and-validate/tabs#to-review');
  });
  it('constructs an internal review URL from its default selection', () => {
    expect(router.serializeUrl(service.placeholderUrl('review', 123))).toBe(
      '/cases/draft/check-and-validate/review/123#to-review',
    );
  });
  it('retains failed queue metadata in an internal view URL and through the first identity effect', () => {
    service.setSelection({ tab: 'failed', page: 2, sort: 'applicant', direction: 'descending' });
    TestBed.tick();
    const tree = service.placeholderUrl('view', 123);
    expect(router.serializeUrl(tree)).toBe('/cases/draft/check-and-validate/view/123#failed');
    expect(tree.queryParams).toEqual({});
    expect(tree.fragment).toBe(service.selection().tab);
  });
  it.each(['review', 'view'] as const)('rejects unsafe identifiers before constructing %s URL', (kind) => {
    for (const id of [undefined, 0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => service.placeholderUrl(kind, id)).toThrow('Invalid draft casefile identifier');
    }
  });
  it.each(['BU user', 'permission', 'authentication', 'release'])(
    'clears checker metadata after %s changes',
    (change) => {
      service.setSelection({ tab: 'failed', page: 2, sort: 'applicant', direction: 'descending' });
      TestBed.tick();
      const user = checkerUser();
      if (change === 'BU user') user.business_unit_users[0].business_unit_user_id = 'OTHER-SYNTHETIC';
      if (change === 'permission') user.business_unit_users[0].permissions = [];
      if (change === 'authentication') authenticated.set(false);
      if (change === 'release') featureFlags.set({});
      userState.set(user);
      TestBed.tick();
      expect(service.selection()).toEqual(defaultCasesDraftNavigation(undefined, 'checker'));
    },
  );
  it('preserves the independent inputter creation origin when checker metadata changes', () => {
    const user = permittedUser();
    user.business_unit_users[0].permissions.push({
      permission_id: 22,
      permission_name: 'Check and Validate Draft Casefiles',
    });
    userState.set(user);
    TestBed.tick();
    const inputterInjector = createEnvironmentInjector(
      [CasesDraftNavigationService, { provide: CASES_DRAFT_DASHBOARD_MODE, useValue: 'inputter' }],
      TestBed.inject(EnvironmentInjector),
    );
    try {
      const inputter = inputterInjector.get(CasesDraftNavigationService);
      inputter.setSelection(defaultCasesDraftNavigation('rejected'));
      inputter.rememberCreateOrigin();
      service.setSelection({ tab: 'failed', page: 2, sort: 'applicant', direction: 'descending' });
      service.rememberCreateOrigin();
      service.clearCreateOrigin();
      TestBed.tick();
      expect(router.serializeUrl(inputter.creationReturnUrl())).toBe('/cases/draft/create-and-manage/tabs#rejected');
    } finally {
      inputterInjector.destroy();
    }
  });
});
