import { Component, signal } from '@angular/core';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { OpalMaintenanceService } from '../../../services/opal-maintenance-service/opal-maintenance.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { EMPTY, EmptyError, finalize, firstValueFrom, Observable, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CasesDraftDashboardService } from '../../services/cases-draft-dashboard.service';
import { createCasesDraftSummary } from '../../mocks/cases-draft-summary.mock';
import type { CasesDraftAllRejectedResolvedState } from '../../types/cases-draft-all-rejected-resolved-state.type';
import { casesDraftAllRejectedResolver } from './cases-draft-all-rejected.resolver';

const identity = { userId: 100, businessUnitId: 44 as const, submittedBy: 'BUU-SYNTHETIC' };
const data = { getIdentity: vi.fn(), getAllRejectedList: vi.fn() };
const run = () =>
  firstValueFrom(
    TestBed.runInInjectionContext(() =>
      casesDraftAllRejectedResolver({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as Observable<CasesDraftAllRejectedResolvedState>,
  );

describe('all-rejected route resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    data.getIdentity.mockReturnValue(identity);
    data.getAllRejectedList.mockReturnValue(of({ count: 0, summaries: [] }));
    TestBed.configureTestingModule({ providers: [{ provide: CasesDraftDashboardService, useValue: data }] });
  });
  it('keeps only eligible summaries and ignores an unrelated count', async () => {
    data.getAllRejectedList.mockReturnValue(
      of({
        count: 99,
        summaries: [
          createCasesDraftSummary({ draft_casefile_id: 1, casefile_status: 'REJECTED', submitted_by: 'BUU-OTHER' }),
          createCasesDraftSummary({
            draft_casefile_id: 2,
            casefile_status: 'REJECTED',
            submitted_by: identity.submittedBy,
          }),
          createCasesDraftSummary({ draft_casefile_id: 3, casefile_status: 'SUBMITTED', submitted_by: 'BUU-OTHER' }),
          createCasesDraftSummary({
            draft_casefile_id: 4,
            business_unit_id: 45,
            casefile_status: 'REJECTED',
            submitted_by: 'BUU-OTHER',
          }),
        ],
      }),
    );
    const result = await run();
    expect(result.status).toBe('success');
    if (result.status === 'success') expect(result.rows.map((row) => row.id)).toEqual([1]);
    expect(data.getAllRejectedList).toHaveBeenCalledExactlyOnceWith(identity);
  });
  it('distinguishes recoverable decoding failure from an empty success', async () => {
    data.getAllRejectedList.mockReturnValue(throwError(() => new Error('Synthetic decoding failure')));
    expect(await run()).toEqual({ status: 'failure', identity });
  });
  it.each([401, 403])('propagates HTTP %s access failure', async (status) => {
    data.getAllRejectedList.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
    await expect(run()).rejects.toBeInstanceOf(HttpErrorResponse);
  });
  it('cancels without requesting when the identity is absent', async () => {
    data.getIdentity.mockReturnValue(null);
    await expect(run()).rejects.toThrow();
    expect(data.getAllRejectedList).not.toHaveBeenCalled();
  });
  it('resolves an empty eligible collection successfully despite a positive count', async () => {
    data.getAllRejectedList.mockReturnValue(
      of({
        count: 99,
        summaries: [createCasesDraftSummary({ casefile_status: 'REJECTED', submitted_by: identity.submittedBy })],
      }),
    );
    expect(await run()).toEqual({ status: 'success', identity, rows: [] });
  });
  it.each([
    new HttpErrorResponse({ status: 0 }),
    new HttpErrorResponse({ status: 500 }),
    new HttpErrorResponse({ status: 500, error: { retriable: true } }),
    new EmptyError(),
  ])('resolves a recoverable network/server/empty-provider failure %s', async (error) => {
    data.getAllRejectedList.mockReturnValue(throwError(() => error));
    expect(await run()).toEqual({ status: 'failure', identity });
  });
  it.each([400, 409, 500])('propagates non-retriable HTTP %s', async (status) => {
    const error = new HttpErrorResponse({ status, error: { retriable: false } });
    data.getAllRejectedList.mockReturnValue(throwError(() => error));
    await expect(run()).rejects.toBe(error);
  });
  it('keeps scope cancellation silent instead of resolving a failure', async () => {
    data.getAllRejectedList.mockReturnValue(EMPTY);
    await expect(run()).rejects.toBeInstanceOf(EmptyError);
  });
  it('unsubscribes the consultation when its resolver subscription is cancelled', () => {
    const pending = new Subject();
    const teardown = vi.fn();
    data.getAllRejectedList.mockReturnValue(pending.pipe(finalize(teardown)));
    const next = vi.fn();
    const subscription = TestBed.runInInjectionContext(() =>
      casesDraftAllRejectedResolver({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as Observable<CasesDraftAllRejectedResolvedState>;
    const consumer = subscription.subscribe(next);
    consumer.unsubscribe();
    pending.next({ count: 0, summaries: [] });
    expect(teardown).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
  });
});

@Component({ template: '' })
class ResolverDestinationComponent {}

describe('all-rejected resolver cancellation through the real router and service', () => {
  const authenticated = signal(true);
  const featureFlags = signal({ 'release-1c-rm-create-case-files': true });
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
  const userState = signal(permittedUser());
  const setBannerError = vi.fn();
  const api = { getDraftCasefiles: vi.fn() };
  let router: Router;
  beforeEach(() => {
    vi.clearAllMocks();
    authenticated.set(true);
    featureFlags.set({ 'release-1c-rm-create-case-files': true });
    userState.set(permittedUser());
    TestBed.configureTestingModule({
      providers: [
        CasesDraftDashboardService,
        { provide: GlobalStore, useValue: { authenticated, featureFlags, userState, setBannerError } },
        { provide: DateService, useValue: { getDateRange: vi.fn() } },
        { provide: OpalMaintenanceService, useValue: api },
        provideRouter([
          {
            path: 'rejections',
            component: ResolverDestinationComponent,
            resolve: { rejected: casesDraftAllRejectedResolver },
          },
          { path: 'elsewhere', component: ResolverDestinationComponent },
        ]),
      ],
    });
    router = TestBed.inject(Router);
  });
  it.each(['navigation', 'replacement', 'permission', 'flag', 'authentication', 'destruction'] as const)(
    'unsubscribes pending resolution on %s without exposing old rows',
    async (reason) => {
      const pending = new Subject();
      const teardown = vi.fn();
      let markStarted!: () => void;
      const started = new Promise<void>((resolve) => {
        markStarted = resolve;
      });
      api.getDraftCasefiles.mockImplementation(() => {
        markStarted();
        return pending.pipe(finalize(teardown));
      });
      const arrival = router.navigateByUrl('/rejections');
      await started;
      TestBed.tick();
      if (reason === 'navigation') await router.navigateByUrl('/elsewhere');
      if (reason === 'destruction') TestBed.resetTestingModule();
      if (reason === 'authentication') authenticated.set(false);
      if (reason === 'flag') featureFlags.set({ 'release-1c-rm-create-case-files': false });
      if (reason === 'permission') userState.set({ ...permittedUser(), business_unit_users: [] });
      if (reason === 'replacement') {
        const replacement = permittedUser();
        replacement.business_unit_users[0].business_unit_user_id = 'BUU-NEW';
        userState.set(replacement);
      }
      if (reason !== 'destruction') TestBed.tick();
      expect(teardown).toHaveBeenCalledOnce();
      pending.next({ count: 0, summaries: [] });
      expect(await arrival).toBe(false);
      expect(router.routerState.snapshot.root.firstChild?.data['rejected']).toBeUndefined();
      expect(setBannerError).not.toHaveBeenCalled();
    },
  );
});
