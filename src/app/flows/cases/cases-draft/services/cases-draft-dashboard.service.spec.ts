import { CASES_DRAFT_DASHBOARD_MODE } from '../constants/cases-draft-dashboard-mode.token';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { EMPTY, firstValueFrom, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
import { CasesDraftDashboardService } from './cases-draft-dashboard.service';
import { createCasesDraftSummary } from '../mocks/cases-draft-summary.mock';

const identity = { userId: 100, businessUnitId: 44 as const, submittedBy: 'BUU-SYNTHETIC' };
const permittedUser = () => ({
  ...structuredClone(OPAL_USER_STATE_MOCK),
  status: 'active' as const,
  business_unit_users: [
    {
      business_unit_id: 44,
      business_unit_user_id: identity.submittedBy,
      permissions: [{ permission_id: 21, permission_name: 'Create and Manage Draft Casefiles' }],
    },
  ],
});
describe('stateless dashboard data', () => {
  const authenticated = signal(true);
  const userState = signal(permittedUser());
  const featureFlags = signal({ 'release-1c-rm-create-case-files': true });
  const setBannerError = vi.fn();
  const api = { getDraftCasefiles: vi.fn(), getRejectedDraftCasefileCount: vi.fn(), getDraftCasefileCount: vi.fn() };
  const dates = { getDateRange: vi.fn(() => ({ from: '2026-09-29', to: '2026-10-06' })) };
  let service: CasesDraftDashboardService;
  beforeEach(() => {
    vi.clearAllMocks();
    authenticated.set(true);
    userState.set(permittedUser());
    featureFlags.set({ 'release-1c-rm-create-case-files': true });
    api.getDraftCasefiles.mockReturnValue(of({ count: 1, summaries: [createCasesDraftSummary()] }));
    api.getDraftCasefileCount.mockReturnValue(of({ count: 101 }));
    api.getRejectedDraftCasefileCount.mockReturnValue(of({ count: 7 }));
    TestBed.configureTestingModule({
      providers: [
        CasesDraftDashboardService,
        { provide: GlobalStore, useValue: { authenticated, userState, featureFlags, setBannerError } },
        { provide: OpalMaintenanceService, useValue: api },
        { provide: DateService, useValue: dates },
      ],
    });
    service = TestBed.inject(CasesDraftDashboardService);
  });
  describe('checker consultations', () => {
    beforeEach(() => {
      const user = permittedUser();
      user.business_unit_users[0].permissions = [
        { permission_id: 22, permission_name: 'Check and Validate Draft Casefiles' },
      ];
      userState.set(user);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          CasesDraftDashboardService,
          { provide: CASES_DRAFT_DASHBOARD_MODE, useValue: 'checker' },
          { provide: GlobalStore, useValue: { authenticated, userState, featureFlags, setBannerError } },
          { provide: OpalMaintenanceService, useValue: api },
          { provide: DateService, useValue: dates },
        ],
      });
      service = TestBed.inject(CasesDraftDashboardService);
    });
    it('resolves permission 22 identity from the injected mode', () => {
      expect(service.getIdentity()).toMatchObject({ businessUnitId: 44, submittedBy: identity.submittedBy });
    });
    it.each([
      ['to-review', 'SUBMITTED,RESUBMITTED'],
      ['rejected', 'REJECTED'],
      ['failed', 'PUBLISHING_FAILED'],
      ['deleted', 'DELETED'],
    ] as const)('consults scoped checker %s', async (tab, status) => {
      await firstValueFrom(service.getList(identity, tab));
      expect(dates.getDateRange).toHaveBeenCalledWith(7, 0);
      expect(api.getDraftCasefiles).toHaveBeenCalledWith({
        business_unit_id: 44,
        not_submitted_by: identity.submittedBy,
        casefile_status: status,
        ...(tab === 'deleted'
          ? { casefile_status_from_date: '2026-09-29', casefile_status_to_date: '2026-10-06' }
          : {}),
      });
    });
    it.each([
      ['rejected', 'REJECTED'],
      ['failed', 'PUBLISHING_FAILED'],
    ] as const)('consults independent %s count on each subscription', async (tab, status) => {
      const source = service.getOutcomeCount(identity, tab);
      expect(api.getDraftCasefileCount).not.toHaveBeenCalled();
      expect(await firstValueFrom(source)).toBe(101);
      expect(await firstValueFrom(source)).toBe(101);
      expect(api.getDraftCasefileCount).toHaveBeenCalledTimes(2);
      expect(api.getDraftCasefileCount).toHaveBeenCalledWith({
        business_unit_id: 44,
        not_submitted_by: identity.submittedBy,
        casefile_status: status,
      });
      expect(dates.getDateRange).not.toHaveBeenCalled();
    });
    it('cancels an outcome request when checker access is lost', () => {
      api.getDraftCasefileCount.mockReturnValue(new Subject());
      const completed = vi.fn();
      service.getOutcomeCount(service.getIdentity()!, 'failed').subscribe({ complete: completed });
      authenticated.set(false);
      TestBed.tick();
      expect(completed).toHaveBeenCalledOnce();
      expect(setBannerError).not.toHaveBeenCalled();
    });
    it.each(['empty', 'decode', 'http'] as const)('handles outcome %s failure', async (failure) => {
      const error = failure === 'http' ? new HttpErrorResponse({ status: 500 }) : new Error('private detail');
      const source = failure === 'empty' ? EMPTY : throwError(() => error);
      api.getDraftCasefileCount.mockReturnValue(source);
      await expect(firstValueFrom(service.getOutcomeCount(identity, 'failed'))).rejects.toThrow();
      expect(setBannerError).toHaveBeenCalledTimes(failure === 'http' ? 0 : 1);
      expect(JSON.stringify(setBannerError.mock.calls)).not.toContain('private detail');
    });
  });
  it('consults only on subscription without retaining rows', async () => {
    expect(api.getDraftCasefiles).not.toHaveBeenCalled();
    const request = service.getList(identity, 'in-review');
    expect(api.getDraftCasefiles).not.toHaveBeenCalled();
    expect((await firstValueFrom(request)).count).toBe(1);
    await firstValueFrom(request);
    expect(api.getDraftCasefiles).toHaveBeenCalledTimes(2);
    expect(api.getDraftCasefiles).toHaveBeenCalledWith({
      business_unit_id: 44,
      submitted_by: identity.submittedBy,
      casefile_status: 'SUBMITTED,RESUBMITTED',
    });
  });
  it.each(['approved', 'deleted'] as const)('uses seven calendar days for %s', async (tab) => {
    await firstValueFrom(service.getList(identity, tab));
    expect(api.getDraftCasefiles).toHaveBeenCalledWith(
      expect.objectContaining({
        casefile_status_from_date: '2026-09-29',
        casefile_status_to_date: '2026-10-06',
      }),
    );
  });
  it('keeps inputter outcome counts in inclusion scope', async () => {
    expect(await firstValueFrom(service.getOutcomeCount(identity, 'rejected'))).toBe(101);
    expect(api.getDraftCasefileCount).toHaveBeenCalledWith({
      business_unit_id: 44,
      submitted_by: identity.submittedBy,
      casefile_status: 'REJECTED',
    });
  });
  it('returns the independent rejected count', async () => {
    expect(await firstValueFrom(service.getRejectedCount(identity))).toBe(7);
    expect(api.getRejectedDraftCasefileCount).toHaveBeenCalledWith(identity);
  });
  it.each(['authentication', 'flag', 'permission'] as const)('denies missing %s', (reason) => {
    if (reason === 'authentication') authenticated.set(false);
    if (reason === 'flag') featureFlags.set({ 'release-1c-rm-create-case-files': false });
    if (reason === 'permission') userState.set({ ...permittedUser(), business_unit_users: [] });
    expect(service.getIdentity()).toBeNull();
  });
  it('does not cancel a fresh replacement-identity request using the previous effect emission', () => {
    TestBed.tick();
    const replacement = permittedUser();
    replacement.business_unit_users[0].business_unit_user_id = 'BUU-NEW';
    userState.set(replacement);
    api.getDraftCasefiles.mockReturnValue(new Subject());
    const completed = vi.fn();
    const subscription = service.getList(service.getIdentity()!, 'in-review').subscribe({ complete: completed });
    expect(completed).not.toHaveBeenCalled();
    TestBed.tick();
    expect(completed).not.toHaveBeenCalled();
    subscription.unsubscribe();
  });
  it('cancels a pending resolver consultation on access loss without a generic failure banner', () => {
    api.getDraftCasefiles.mockReturnValue(new Subject());
    const completed = vi.fn();
    service.getList(service.getIdentity()!, 'approved').subscribe({ complete: completed });
    authenticated.set(false);
    TestBed.tick();
    expect(completed).toHaveBeenCalledOnce();
    expect(setBannerError).not.toHaveBeenCalled();
  });
  it('reads live BU identity', () => {
    expect(service.getIdentity()).toMatchObject({ businessUnitId: 44 as const, submittedBy: identity.submittedBy });
    const replacement = permittedUser();
    replacement.business_unit_users[0].business_unit_user_id = 'BUU-NEW';
    userState.set(replacement);
    expect(service.getIdentity()?.submittedBy).toBe('BUU-NEW');
  });
  it('reports decoding errors with the existing generic global banner', async () => {
    api.getDraftCasefiles.mockReturnValue(throwError(() => new Error('private detail')));
    await expect(firstValueFrom(service.getList(identity, 'in-review'))).rejects.toThrow('private detail');
    expect(setBannerError).toHaveBeenCalledWith(expect.objectContaining({ error: true }));
    expect(JSON.stringify(setBannerError.mock.calls)).not.toContain('private detail');
  });
  it('leaves HTTP failures to the existing interceptor', async () => {
    api.getDraftCasefiles.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await expect(firstValueFrom(service.getList(identity, 'in-review'))).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(setBannerError).not.toHaveBeenCalled();
  });
  it.each(['getList', 'getRejectedCount'] as const)('rejects %s completion without a value', async (method) => {
    api.getDraftCasefiles.mockReturnValue(EMPTY);
    api.getRejectedDraftCasefileCount.mockReturnValue(EMPTY);
    const result =
      method === 'getList'
        ? firstValueFrom(service.getList(identity, 'in-review'))
        : firstValueFrom(service.getRejectedCount(identity));
    await expect(result).rejects.toThrow();
    expect(setBannerError).toHaveBeenCalledOnce();
  });
});
