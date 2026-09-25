import { Component, PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { LaunchDarklyService } from '@hmcts/opal-frontend-common/services/launch-darkly-service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routing } from './pages.routes';

import { AuthService } from '@hmcts/opal-frontend-common/services/auth-service';
import { OpalUserService } from '@hmcts/opal-frontend-common/services/opal-user-service';
import { of } from 'rxjs';

@Component({ template: '<router-outlet />', imports: [RouterOutlet] })
class Shell {
  canDeactivate(): boolean {
    return true;
  }
}
@Component({ template: 'Case page' })
class CasePage {}
@Component({ template: 'Access denied' })
class DeniedPage {}

describe('create-casefile feature access', () => {
  const key = 'release-1c-rm-create-case-files';
  const flags = signal<Record<string, boolean>>({});
  const initializeFlags = vi.fn<() => Promise<void>>();
  const resolver = vi.fn(() => true);

  beforeEach(() => {
    flags.set({});
    initializeFlags.mockReset().mockResolvedValue(undefined);
    resolver.mockClear();
    const shell = routing.find((route) => route.path === 'cases/create-casefile')!;
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { checkAuthenticated: () => of(true) } },
        { provide: OpalUserService, useValue: { getLoggedInUserState: () => of({ status: 'active' }) } },
        { provide: GlobalStore, useValue: { featureFlags: flags } },
        {
          provide: LaunchDarklyService,
          useValue: {
            initializeLaunchDarklyFlags: initializeFlags,
            initializeLaunchDarklyClient: vi.fn(),
          },
        },
        provideRouter([
          {
            ...shell,
            loadComponent: async () => Shell,
            children: [
              { path: 'case-type', component: CasePage, resolve: { value: resolver } },
              { path: 'task-list', component: CasePage, resolve: { value: resolver } },
            ],
          },
          { path: 'access-denied', component: DeniedPage },
        ]),
      ],
    });
  });

  it.each([true, false])('uses a resolved SSR override of %s without starting LaunchDarkly', async (enabled) => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    flags.set({ [key]: enabled });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/cases/create-casefile/case-type');
    expect(TestBed.inject(Router).url).toBe(enabled ? '/cases/create-casefile/case-type' : '/access-denied');
    expect(initializeFlags).not.toHaveBeenCalled();
    expect(TestBed.inject(LaunchDarklyService).initializeLaunchDarklyClient).not.toHaveBeenCalled();
  });

  it.each(['/cases/create-casefile/case-type', '/cases/create-casefile/task-list'])(
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

  it.each([false, undefined])('denies a direct child URL for %s', async (value) => {
    flags.set(value === undefined ? {} : { [key]: value });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/cases/create-casefile/task-list');
    expect(TestBed.inject(Router).url).toBe('/access-denied');
    expect(harness.routeNativeElement?.textContent).toContain('Access denied');
    expect(resolver).not.toHaveBeenCalled();
  });

  it('allows enabled access and checks the next child navigation after disabling', async () => {
    flags.set({ [key]: true });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/cases/create-casefile/case-type');
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/case-type');
    expect(harness.routeNativeElement?.textContent).toContain('Case page');
    resolver.mockClear();
    flags.set({ [key]: false });
    await harness.navigateByUrl('/cases/create-casefile/task-list');
    expect(TestBed.inject(Router).url).toBe('/access-denied');
    expect(resolver).not.toHaveBeenCalled();
  });

  it('allows access when initialization populates true', async () => {
    initializeFlags.mockImplementation(async () => {
      flags.set({ [key]: true });
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/cases/create-casefile/case-type');
    expect(TestBed.inject(Router).url).toBe('/cases/create-casefile/case-type');
  });

  it('denies access when flag initialization fails', async () => {
    initializeFlags.mockRejectedValue(new Error('Flag initialization unavailable'));
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/cases/create-casefile/case-type');
    expect(TestBed.inject(Router).url).toBe('/access-denied');
    expect(resolver).not.toHaveBeenCalled();
  });
});
