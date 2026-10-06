import { createEnvironmentInjector, EnvironmentInjector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import type { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { beforeEach, describe, expect, it } from 'vitest';
import { CasesCreateCasefileStore } from '../../cases-create-casefile/stores/cases-create-casefile.store';
import type { ICasesDraftNavigation } from '../interfaces/cases-draft-navigation.interface';
import { defaultCasesDraftNavigation, parseCasesDraftNavigation } from '../utils/cases-draft-navigation';
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
    expect(router.serializeUrl(service.creationReturnUrl())).toBe(
      '/cases/draft/create-and-manage/tabs?page=1&sort=created&direction=ascending#in-review',
    );
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
  it('starts with the default selection and return URL', () => {
    flush();
    expectCleared();
  });
  it('retains initial valid incoming metadata through the first lifecycle effect', () => {
    service.setSelection(parseCasesDraftNavigation('approved', convertToParamMap({ page: '2' })));
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
    expect(router.serializeUrl(service.creationReturnUrl())).toBe(
      '/cases/draft/create-and-manage/tabs?page=2&sort=approved&direction=descending#approved',
    );
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
    expect(router.serializeUrl(service.creationReturnUrl())).toContain(
      'page=1&sort=created&direction=ascending#in-review',
    );
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
    expect(router.serializeUrl(service.creationReturnUrl())).toContain(
      'page=2&sort=approved&direction=descending#approved',
    );
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
    service.setSelection(
      parseCasesDraftNavigation(
        'rejected',
        convertToParamMap({
          page: '3',
          sort: 'applicant',
          direction: 'descending',
          returnUrl: 'https://example.invalid',
        }),
      ),
    );
    expect(router.serializeUrl(service.dashboardUrl())).toBe(
      '/cases/draft/create-and-manage/tabs?page=3&sort=applicant&direction=descending#rejected',
    );
    expect(router.serializeUrl(service.dashboardUrl(defaultCasesDraftNavigation()))).toContain(
      'page=1&sort=created&direction=ascending#in-review',
    );
  });
  it.each([
    ['details', '/cases/create-casefile/check-case-details/12'],
    ['amendment', '/cases/create-casefile/task-list/12'],
    ['rejections', '/cases/draft/create-and-manage/rejections'],
  ] as const)('creates the fixed %s destination with restorable metadata', (kind, path) => {
    service.setSelection(
      parseCasesDraftNavigation(
        'rejected',
        convertToParamMap({
          page: '3',
          sort: 'applicant',
          direction: 'descending',
          returnUrl: 'https://example.invalid',
        }),
      ),
    );
    const tree = service.placeholderUrl(kind, 12);
    expect(router.serializeUrl(tree)).toBe(path + '?tab=rejected&page=3&sort=applicant&direction=descending');
    expect(parseCasesDraftNavigation(tree.queryParamMap.get('tab'), tree.queryParamMap)).toEqual(service.selection());
  });
  it.each(['details', 'amendment'] as const)('rejects invalid identifiers for %s', (kind) => {
    for (const id of [undefined, 0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])
      expect(() => service.placeholderUrl(kind, id)).toThrow('Invalid draft casefile identifier');
  });
  it('does not require an identifier for all rejections', () => {
    expect(router.serializeUrl(service.placeholderUrl('rejections'))).toBe(
      '/cases/draft/create-and-manage/rejections?tab=in-review&page=1&sort=created&direction=ascending',
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
  it('starts with the checker default and constructs its dashboard URL', () => {
    TestBed.tick();
    expect(service.selection()).toEqual(defaultCasesDraftNavigation(undefined, 'checker'));
    expect(router.serializeUrl(service.dashboardUrl())).toBe(
      '/cases/draft/check-and-validate/tabs?page=1&sort=created&direction=ascending#to-review',
    );
  });
  it('constructs an internal review URL from its default selection', () => {
    expect(router.serializeUrl(service.placeholderUrl('review', 123))).toBe(
      '/cases/draft/check-and-validate/review/123?tab=to-review&page=1&sort=created&direction=ascending',
    );
  });
  it('retains failed queue metadata in an internal view URL and through the first identity effect', () => {
    service.setSelection({ tab: 'failed', page: 2, sort: 'applicant', direction: 'descending' });
    TestBed.tick();
    const tree = service.placeholderUrl('view', 123);
    expect(router.serializeUrl(tree)).toBe(
      '/cases/draft/check-and-validate/view/123?tab=failed&page=2&sort=applicant&direction=descending',
    );
    expect(parseCasesDraftNavigation(tree.queryParamMap.get('tab'), tree.queryParamMap, 'checker')).toEqual(
      service.selection(),
    );
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
      expect(router.serializeUrl(inputter.creationReturnUrl())).toBe(
        '/cases/draft/create-and-manage/tabs?page=1&sort=statusDate&direction=ascending#rejected',
      );
    } finally {
      inputterInjector.destroy();
    }
  });
});
