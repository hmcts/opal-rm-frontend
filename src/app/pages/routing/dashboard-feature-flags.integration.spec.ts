import { Component, PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { AuthService } from '@hmcts/opal-frontend-common/services/auth-service';
import { OpalUserService } from '@hmcts/opal-frontend-common/services/opal-user-service';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { LaunchDarklyService } from '@hmcts/opal-frontend-common/services/launch-darkly-service';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routing } from './pages.routes';
import { DASHBOARD_SECTION_PERMISSIONS } from '../dashboard/constants/dashboard-section-permissions.constant';

@Component({ template: 'Cases dashboard' })
class Dashboard {}
@Component({ template: 'Access denied' })
class Denied {}

describe('dashboard release routing', () => {
  const key = 'release-1c-rm-create-case-files';
  const flags = signal<Record<string, boolean>>({});
  const initializeFlags = vi.fn<() => Promise<void>>();
  const getUserState = vi.fn();

  beforeEach(() => {
    flags.set({});
    initializeFlags.mockReset().mockResolvedValue(undefined);
    const user = structuredClone(OPAL_USER_STATE_MOCK);
    user.status = 'active';
    user.business_unit_users[0].permissions = Object.values(DASHBOARD_SECTION_PERMISSIONS)
      .flat()
      .map((id) => ({
        permission_id: id,
        permission_name: `Permission ${id}`,
      }));
    getUserState.mockReset().mockReturnValue(of(user));
    TestBed.configureTestingModule({
      providers: [
        { provide: GlobalStore, useValue: { featureFlags: flags } },
        { provide: AuthService, useValue: { checkAuthenticated: () => of(true) } },
        { provide: OpalUserService, useValue: { getLoggedInUserState: getUserState } },
        {
          provide: LaunchDarklyService,
          useValue: {
            initializeLaunchDarklyFlags: initializeFlags,
            initializeLaunchDarklyClient: vi.fn(),
          },
        },
        provideRouter([
          ...routing
            .filter((route) => route.path === '' || route.path?.startsWith('dashboard'))
            .map((route) => (route.loadComponent ? { ...route, loadComponent: async () => Dashboard } : route)),
          { path: 'access-denied', component: Denied },
          { path: 'account-created', component: Denied },
        ]),
      ],
    });
  });

  it.each([true, false])('uses a resolved SSR override of %s without starting LaunchDarkly', async (enabled) => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    flags.set({ [key]: enabled });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/dashboard');
    expect(TestBed.inject(Router).url).toBe(enabled ? '/dashboard/cases' : '/access-denied');
    expect(initializeFlags).not.toHaveBeenCalled();
    expect(TestBed.inject(LaunchDarklyService).initializeLaunchDarklyClient).not.toHaveBeenCalled();
  });

  it.each(['/dashboard', '/dashboard/cases'])(
    'defers unresolved SSR navigation to %s without redirecting or rendering content',
    async (url) => {
      TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
      initializeFlags.mockRejectedValue(new Error('Browser SDK must not run on the server'));
      const harness = await RouterTestingHarness.create();
      const router = TestBed.inject(Router);
      const result = await router.navigateByUrl(url);
      expect(result).toBe(false);
      expect(router.url).not.toBe('/access-denied');
      expect(harness.routeNativeElement).toBeNull();
      expect(initializeFlags).not.toHaveBeenCalled();
      expect(TestBed.inject(LaunchDarklyService).initializeLaunchDarklyClient).not.toHaveBeenCalled();
    },
  );

  it.each(['/', '/dashboard', '/dashboard/cases', '/dashboard/unknown'])(
    'denies %s when no release is enabled',
    async (url) => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(url);
      expect(TestBed.inject(Router).url).toBe('/access-denied');
      expect(harness.routeNativeElement?.textContent).toContain('Access denied');
    },
  );

  it('lands on Cases when only the create release is enabled', async () => {
    flags.set({ [key]: true });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/dashboard');
    expect(TestBed.inject(Router).url).toBe('/dashboard/cases');
    expect(harness.routeNativeElement?.textContent).toContain('Cases dashboard');
  });

  it.each(['search', 'reports', 'administration'])('denies the unreleased %s dashboard', async (section) => {
    flags.set({ [key]: true, 'release-1a': true, 'release-1b': true });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/dashboard/${section}`);
    expect(TestBed.inject(Router).url).toBe('/access-denied');
  });

  it('waits for flags to initialize before choosing a dashboard', async () => {
    initializeFlags.mockImplementation(async () => {
      flags.set({ [key]: true });
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/dashboard');
    expect(TestBed.inject(Router).url).toBe('/dashboard/cases');
  });

  it('denies an active user without Cases permissions', async () => {
    flags.set({ [key]: true });
    const user = structuredClone(OPAL_USER_STATE_MOCK);
    user.status = 'active';
    user.business_unit_users.forEach((unit) => {
      unit.permissions = [];
    });
    getUserState.mockReturnValue(of(user));
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/dashboard');
    expect(TestBed.inject(Router).url).toBe('/access-denied');
  });

  it('settles when Back to dashboard is used with all releases disabled', async () => {
    const harness = await RouterTestingHarness.create('/access-denied');
    await harness.navigateByUrl('/dashboard');
    expect(TestBed.inject(Router).url).toBe('/access-denied');
    expect(TestBed.inject(Router).currentNavigation()).toBeNull();
  });
});
