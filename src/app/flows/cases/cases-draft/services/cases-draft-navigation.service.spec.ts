import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import type { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { beforeEach, describe, expect, it } from 'vitest';
import { CasesCreateCasefileStore } from '../../cases-create-casefile/stores/cases-create-casefile.store';
import type { ICasesDraftNavigation } from '../interfaces/cases-draft-navigation.interface';
import { defaultCasesDraftNavigation } from '../utils/cases-draft-navigation';
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
  it('creates a fragment-only dashboard URL while retaining local table state', () => {
    const selection = {
      ...defaultCasesDraftNavigation('rejected'),
      page: 3,
      sort: 'applicant' as const,
      direction: 'descending' as const,
    };
    service.setSelection(selection);
    const tree = service.dashboardUrl();
    expect(router.serializeUrl(tree)).toBe('/cases/draft/create-and-manage/tabs#rejected');
    expect(tree.queryParams).toEqual({});
    expect(service.selection()).toEqual(selection);
    expect(router.serializeUrl(service.dashboardUrl(defaultCasesDraftNavigation()))).toBe(
      '/cases/draft/create-and-manage/tabs#in-review',
    );
  });
  it.each([
    ['details', '/cases/create-casefile/check-case-details/12'],
    ['amendment', '/cases/create-casefile/task-list/12'],
    ['rejections', '/cases/draft/create-and-manage/rejections'],
  ] as const)('creates the fixed %s destination with only the source fragment', (kind, path) => {
    service.setSelection({
      ...defaultCasesDraftNavigation('rejected'),
      page: 3,
      sort: 'applicant',
      direction: 'descending',
    });
    const tree = service.placeholderUrl(kind, 12);
    expect(router.serializeUrl(tree)).toBe(path + '#rejected');
    expect(tree.queryParams).toEqual({});
    expect(service.selection()).toEqual({ tab: 'rejected', page: 3, sort: 'applicant', direction: 'descending' });
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
