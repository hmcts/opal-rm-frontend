import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { OpalUserService } from '@hmcts/opal-frontend-common/services/opal-user-service';
import { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { LaunchDarklyService } from '@hmcts/opal-frontend-common/services/launch-darkly-service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { dashboardSectionPermissionsGuard } from './dashboard-section-permissions.guard';

const createUserStateWithPermissions = (permissionIds: readonly number[]): IOpalUserState => {
  const userState = structuredClone(OPAL_USER_STATE_MOCK);
  const [firstBusinessUnit, secondBusinessUnit] = userState.business_unit_users;

  userState.business_unit_users = [
    {
      ...firstBusinessUnit,
      permissions: [],
    },
    {
      ...secondBusinessUnit,
      business_unit_id: 44,
      permissions: permissionIds.map((permissionId) => ({
        permission_id: permissionId,
        permission_name: `Permission ${permissionId}`,
      })),
    },
  ];

  return userState;
};

describe('dashboardSectionPermissionsGuard', () => {
  const key = 'release-1c-rm-create-case-files';
  const flags = signal<Record<string, boolean>>({});
  const initializeFlags = vi.fn<() => Promise<void>>();
  const getUserState = vi.fn();
  const runGuard = async (dashboardType = 'cases', sectionKey?: string) => {
    const route = {
      data: sectionKey ? { sectionKey } : {},
      paramMap: convertToParamMap({ dashboardType }),
    } as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => dashboardSectionPermissionsGuard(route, {} as RouterStateSnapshot));
  };
  const serialize = (result: unknown) => TestBed.inject(Router).serializeUrl(result as UrlTree);
  beforeEach(() => {
    flags.set({ [key]: true });
    initializeFlags.mockReset().mockResolvedValue(undefined);
    getUserState.mockReset().mockReturnValue(of(createUserStateWithPermissions([21])));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: GlobalStore, useValue: { featureFlags: flags } },
        { provide: OpalUserService, useValue: { getLoggedInUserState: getUserState } },
        {
          provide: LaunchDarklyService,
          useValue: { initializeLaunchDarklyFlags: initializeFlags, initializeLaunchDarklyClient: vi.fn() },
        },
      ],
    });
  });
  it.each([false, undefined])('denies when the flag is %s', async (enabled) => {
    flags.set(enabled === undefined ? {} : { [key]: enabled });
    expect(serialize(await runGuard())).toBe('/access-denied');
    expect(getUserState).not.toHaveBeenCalled();
  });
  it('denies enabled Cases for users with no permissions', async () => {
    getUserState.mockReturnValue(of(createUserStateWithPermissions([])));
    expect(serialize(await runGuard())).toBe('/access-denied');
  });
  it('denies when user state fails', async () => {
    getUserState.mockReturnValue(throwError(() => new Error('User state unavailable')));
    expect(serialize(await runGuard())).toBe('/access-denied');
  });
  it('allows the enabled and permitted Cases section', async () => {
    expect(await runGuard()).toBe(true);
  });
  it('waits for flag initialization', async () => {
    flags.set({});
    initializeFlags.mockImplementation(async () => {
      flags.set({ [key]: true });
    });
    expect(await runGuard()).toBe(true);
  });
  it.each(['search', 'reports', 'administration', 'unknown'])('denies unavailable section %s', async (section) => {
    expect(serialize(await runGuard(section))).toBe('/access-denied');
    expect(getUserState).not.toHaveBeenCalled();
  });
  it('uses explicit section metadata', async () => {
    expect(await runGuard('unknown', 'cases')).toBe(true);
  });
  it('falls back from invalid section metadata to the route param', async () => {
    expect(await runGuard('cases', 'unknown')).toBe(true);
  });
  it('denies the RM permission when it belongs to another business unit', async () => {
    const user = createUserStateWithPermissions([21]);
    user.business_unit_users[1].business_unit_id = 45;
    getUserState.mockReturnValue(of(user));
    expect(serialize(await runGuard())).toBe('/access-denied');
  });
  it('checks child navigation against the parent casefile section', async () => {
    getUserState.mockReturnValue(of(createUserStateWithPermissions([])));
    const route = {
      data: {},
      parent: { data: { sectionKey: 'cases' } },
      paramMap: convertToParamMap({}),
    } as unknown as ActivatedRouteSnapshot;
    const result = await TestBed.runInInjectionContext(() =>
      dashboardSectionPermissionsGuard(route, {} as RouterStateSnapshot),
    );
    expect(serialize(result)).toBe('/access-denied');
  });
});
