import { CasesDraftNavigationService } from '../services/cases-draft-navigation.service';
import { CasesDraftDashboardService } from '../services/cases-draft-dashboard.service';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CasesDraftPlaceholderComponent } from './cases-draft-placeholder.component';

describe('draft placeholder metadata', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: CasesDraftDashboardService, useValue: { reportError: vi.fn() } },
        provideRouter([
          { path: 'missing', component: CasesDraftPlaceholderComponent, data: { placeholderKind: 'details' } },
          {
            path: ':draftCasefileId',
            component: CasesDraftPlaceholderComponent,
            data: { placeholderKind: 'amendment' },
          },
        ]),
        {
          provide: GlobalStore,
          useValue: { authenticated: signal(false), userState: signal(null), featureFlags: signal({}) },
        },
      ],
    });
  });
  it('takes mode only from trusted route data and validates a safe internal Back destination', async () => {
    const harness = await RouterTestingHarness.create(
      '/123?placeholderKind=rejections&tab=approved&page=3&sort=statusDate&direction=descending&returnUrl=https://example.test#deleted',
    );
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Amend case');
    expect(harness.routeNativeElement?.textContent).toContain('Case amendment will be available here.');
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe(
      '/cases/draft/create-and-manage/tabs#deleted',
    );
  });
  it('keeps a missing ID safe when rendering an incomplete details route', async () => {
    const harness = await RouterTestingHarness.create('/missing');
    expect(harness.routeNativeElement?.textContent).toContain('This case could not be opened.');
  });
  it('rejects whitespace and signs rather than parsing a valid numerical prefix', async () => {
    const harness = await RouterTestingHarness.create('/%2B123');
    expect(harness.routeNativeElement?.textContent).toContain('This case could not be opened.');
    await harness.navigateByUrl('/123%20');
    expect(harness.routeNativeElement?.textContent).toContain('This case could not be opened.');
  });
});

describe('all rejected placeholder Back', () => {
  const reportError = vi.fn();
  beforeEach(() => {
    reportError.mockReset();
    const user = structuredClone(OPAL_USER_STATE_MOCK);
    user.status = 'active';
    user.business_unit_users = [
      {
        business_unit_id: 44,
        business_unit_user_id: 'BUU-SYNTHETIC',
        permissions: [{ permission_id: 21, permission_name: 'Create and Manage Draft Casefiles' }],
      },
    ];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'cases/create-casefile/check-case-details/:draftCasefileId',
            component: CasesDraftPlaceholderComponent,
            data: { placeholderKind: 'details' },
          },
        ]),
        {
          provide: GlobalStore,
          useValue: {
            authenticated: signal(true),
            userState: signal(user),
            featureFlags: signal({ 'release-1c-rm-create-case-files': true }),
          },
        },
        { provide: CasesDraftDashboardService, useValue: { reportError } },
      ],
    });
  });
  async function open() {
    const harness = await RouterTestingHarness.create();
    await TestBed.inject(CasesDraftNavigationService).navigateToPlaceholder('details', 123, 'all-rejected');
    harness.detectChanges();
    return { harness, component: harness.routeDebugElement!.componentInstance as CasesDraftPlaceholderComponent };
  }
  it('renders a pure list Back URL and returns with the captured context', async () => {
    const { harness, component } = await open();
    expect(harness.routeNativeElement!.querySelector('a')!.getAttribute('href')).toBe(
      '/cases/draft/create-and-manage/rejections',
    );
    const navigation = TestBed.inject(CasesDraftNavigationService);
    const back = vi.spyOn(navigation, 'returnFromPlaceholder').mockResolvedValue(true);
    const event = new MouseEvent('click', { cancelable: true });
    await component.backToAllRejected(event);
    expect(event.defaultPrevented).toBe(true);
    expect(back).toHaveBeenCalledWith('details', '123');
  });
  it.each([{ button: 1 }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }])(
    'preserves modified activation %s',
    async (options) => {
      const { component } = await open();
      const back = vi.spyOn(TestBed.inject(CasesDraftNavigationService), 'returnFromPlaceholder');
      const event = new MouseEvent('click', { ...options, cancelable: true });
      await component.backToAllRejected(event);
      expect(event.defaultPrevented).toBe(false);
      expect(back).not.toHaveBeenCalled();
    },
  );
  it('reports navigation rejection through the dashboard error mechanism', async () => {
    const { component } = await open();
    const error = new Error('Synthetic navigation error');
    vi.spyOn(TestBed.inject(CasesDraftNavigationService), 'returnFromPlaceholder').mockRejectedValue(error);
    await component.backToAllRejected(new MouseEvent('click'));
    expect(reportError).toHaveBeenCalledWith(error);
  });
});
