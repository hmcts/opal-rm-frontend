import { PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { OpalUserService } from '@hmcts/opal-frontend-common/services/opal-user-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { LaunchDarklyService } from '@hmcts/opal-frontend-common/services/launch-darkly-service';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpalMaintenanceService } from '../../../services/opal-maintenance-service/opal-maintenance.service';
import { casesDraftAccessGuard } from './cases-draft-access.guard';

const permittedUser = () => ({
  ...structuredClone(OPAL_USER_STATE_MOCK),
  status: 'active' as const,
  business_unit_users: [
    {
      business_unit_id: 44,
      business_unit_user_id: 'BUU-SYNTHETIC',
      permissions: [{ permission_id: 21, permission_name: 'Create and Manage Draft Casefiles' }],
    },
  ],
});

describe('casesDraftAccessGuard', () => {
  const key = 'release-1c-rm-create-case-files';
  const flags = signal<Record<string, boolean>>({});
  const getUserState = vi.fn();
  const initializeFlags = vi.fn<() => Promise<void>>();
  const getDraftCasefiles = vi.fn();
  const getRejectedDraftCasefileCount = vi.fn();
  const runGuard = () =>
    TestBed.runInInjectionContext(() => casesDraftAccessGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
  const expectDenied = async () => {
    expect(TestBed.inject(Router).serializeUrl((await runGuard()) as UrlTree)).toBe('/access-denied');
    expect(getDraftCasefiles).not.toHaveBeenCalled();
    expect(getRejectedDraftCasefileCount).not.toHaveBeenCalled();
  };
  beforeEach(() => {
    flags.set({ [key]: true });
    getUserState.mockReset().mockReturnValue(of(permittedUser()));
    initializeFlags.mockReset().mockResolvedValue(undefined);
    getDraftCasefiles.mockReset();
    getRejectedDraftCasefileCount.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: GlobalStore, useValue: { featureFlags: flags } },
        { provide: OpalUserService, useValue: { getLoggedInUserState: getUserState } },
        {
          provide: LaunchDarklyService,
          useValue: { initializeLaunchDarklyFlags: initializeFlags, initializeLaunchDarklyClient: vi.fn() },
        },
        { provide: OpalMaintenanceService, useValue: { getDraftCasefiles, getRejectedDraftCasefileCount } },
      ],
    });
  });
  it('allows active, released BU 44 permission 21', async () => expect(await runGuard()).toBe(true));
  it.each([null, undefined])('denies unavailable identity %s', async (user) => {
    getUserState.mockReturnValue(of(user));
    await expectDenied();
  });
  it.each(['created', 'suspended', 'deactivated', null] as const)('denies status %s', async (status) => {
    getUserState.mockReturnValue(of({ ...permittedUser(), status }));
    await expectDenied();
  });
  it('denies permission held only in another BU', async () => {
    const user = permittedUser();
    user.business_unit_users[0].business_unit_id = 45;
    getUserState.mockReturnValue(of(user));
    await expectDenied();
  });
  it('denies a BU without permission', async () => {
    const user = permittedUser();
    user.business_unit_users[0].permissions = [];
    getUserState.mockReturnValue(of(user));
    await expectDenied();
  });
  it('denies no BU', async () => {
    getUserState.mockReturnValue(of({ ...permittedUser(), business_unit_users: [] }));
    await expectDenied();
  });
  it('denies a blank BU user ID', async () => {
    const user = permittedUser();
    user.business_unit_users[0].business_unit_user_id = ' ';
    getUserState.mockReturnValue(of(user));
    await expectDenied();
  });
  it('denies user state failures', async () => {
    getUserState.mockReturnValue(throwError(() => new Error('Unavailable')));
    await expectDenied();
  });
  it.each([false, undefined])('denies flag %s before consulting user state', async (enabled) => {
    flags.set(enabled === undefined ? {} : { [key]: enabled });
    await expectDenied();
    expect(getUserState).not.toHaveBeenCalled();
  });
  it('waits for flag initialization before consulting the latest identity', async () => {
    flags.set({});
    initializeFlags.mockImplementation(async () => flags.set({ [key]: true }));
    expect(await runGuard()).toBe(true);
  });
  it('cancels unresolved SSR release without retrieving user or collection state', async () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    flags.set({});
    expect(await runGuard()).toBe(false);
    expect(getUserState).not.toHaveBeenCalled();
    expect(initializeFlags).not.toHaveBeenCalled();
    expect(getDraftCasefiles).not.toHaveBeenCalled();
    expect(getRejectedDraftCasefileCount).not.toHaveBeenCalled();
  });
});
