import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { GlobalStore } from '@hmcts/opal-frontend-common/stores/global';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { EMPTY, finalize, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpalMaintenanceService } from '../../services/opal-maintenance-service/opal-maintenance.service';
import type { IOpalMaintenanceDraftCasefileListResponse } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-list-response.interface';
import { createCasesDraftSummary } from '../mocks/cases-draft-summary.mock';
import { CasesDraftDashboardService } from './cases-draft-dashboard.service';

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
const failure = (status = 500) => new HttpErrorResponse({ status, error: { operation_id: 'synthetic-reference' } });

describe('CasesDraftDashboardService', () => {
  const key = 'release-1c-rm-create-case-files';
  let owner: CasesDraftDashboardService;
  let review: Subject<IOpalMaintenanceDraftCasefileListResponse>;
  let approved: Subject<IOpalMaintenanceDraftCasefileListResponse>;
  let rejected: Subject<IOpalMaintenanceDraftCasefileListResponse>;
  let deleted: Subject<IOpalMaintenanceDraftCasefileListResponse>;
  let count: Subject<{ count: number }>;
  const userState = signal(permittedUser());
  const featureFlags = signal<Record<string, boolean>>({ [key]: true });
  const authenticated = signal(true);
  const api = {
    getDraftCasefiles: vi.fn<OpalMaintenanceService['getDraftCasefiles']>(),
    getRejectedDraftCasefileCount: vi.fn<OpalMaintenanceService['getRejectedDraftCasefileCount']>(),
  };
  const getDateRange = vi.fn().mockReturnValue({ from: '2026-09-28', to: '2026-10-05' });
  const navigateByUrl = vi.fn().mockResolvedValue(true);
  const load = (tab: Parameters<CasesDraftDashboardService['load']>[0]) => {
    owner.load(tab);
    TestBed.tick();
  };
  const readyReview = () => review.next({ count: 1, summaries: [createCasesDraftSummary()] });
  const expectDenied = () => {
    expect(owner.list()).toEqual({ status: 'denied', rows: [], count: null, correlationReference: null });
    expect(owner.badge()).toEqual({ status: 'denied', count: null, label: null, correlationReference: null });
  };
  beforeEach(() => {
    userState.set(permittedUser());
    featureFlags.set({ [key]: true });
    authenticated.set(true);
    review = new Subject();
    approved = new Subject();
    rejected = new Subject();
    deleted = new Subject();
    count = new Subject();
    api.getDraftCasefiles.mockReset().mockImplementation((params) => {
      switch (params.casefile_status) {
        case 'PUBLISHED':
          return approved;
        case 'REJECTED':
          return rejected;
        case 'DELETED':
          return deleted;
        default:
          return review;
      }
    });
    api.getRejectedDraftCasefileCount.mockReset().mockImplementation(() => count);
    getDateRange.mockClear();
    navigateByUrl.mockReset().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        CasesDraftDashboardService,
        { provide: GlobalStore, useValue: { userState, featureFlags, authenticated } },
        { provide: OpalMaintenanceService, useValue: api },
        { provide: DateService, useValue: { getDateRange } },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });
    owner = TestBed.inject(CasesDraftDashboardService);
  });
  it('does not consult until routed load and starts once after the first effect', () => {
    TestBed.tick();
    expect(owner.list().status).toBe('idle');
    expect(owner.badge().status).toBe('idle');
    expect(api.getDraftCasefiles).not.toHaveBeenCalled();
    expect(api.getRejectedDraftCasefileCount).not.toHaveBeenCalled();
    load('in-review');
    expect(api.getDraftCasefiles).toHaveBeenCalledTimes(1);
    expect(api.getRejectedDraftCasefileCount).toHaveBeenCalledTimes(1);
    expect(owner.list().status).toBe('loading');
    expect(owner.badge().status).toBe('loading');
  });
  it('uses the rejected list count without a second consultation', () => {
    load('rejected');
    rejected.next({ count: 102, summaries: [createCasesDraftSummary({ casefile_status: 'REJECTED' })] });
    expect(api.getRejectedDraftCasefileCount).not.toHaveBeenCalled();
    expect(owner.badge()).toMatchObject({ status: 'ready', count: 102, label: '99+' });
    expect(owner.list().rows.map((row) => row.id)).toEqual([123]);
  });
  it('never lets the previous tab overwrite current rows or badge', () => {
    load('in-review');
    load('approved');
    approved.next({
      count: 1,
      summaries: [createCasesDraftSummary({ casefile_status: 'PUBLISHED', draft_casefile_id: 456 })],
    });
    readyReview();
    expect(owner.list().rows.map((row) => row.id)).toEqual([456]);
    expect(owner.list().status).toBe('ready');
  });
  it('reloads the same tab and clears previous rows synchronously', () => {
    load('in-review');
    readyReview();
    count.next({ count: 4 });
    owner.load('in-review');
    expect(owner.list()).toMatchObject({ status: 'loading', rows: [], count: null });
    expect(owner.badge()).toMatchObject({ status: 'loading', count: null });
    expect(api.getDraftCasefiles).toHaveBeenCalledTimes(2);
  });
  it('keeps successful count when selected list fails', () => {
    load('approved');
    count.next({ count: 4 });
    approved.error(failure());
    expect(owner.badge()).toMatchObject({ status: 'ready', count: 4, label: '4' });
    expect(owner.list()).toMatchObject({ status: 'error', rows: [], correlationReference: 'synthetic-reference' });
  });
  it('allows a pending list to succeed after badge fails', () => {
    load('in-review');
    count.error(failure());
    readyReview();
    expect(owner.list().status).toBe('ready');
    expect(owner.badge()).toMatchObject({
      status: 'error',
      count: null,
      label: null,
      correlationReference: 'synthetic-reference',
    });
  });
  it('allows a pending badge to succeed after list fails', () => {
    load('in-review');
    review.error(failure());
    count.next({ count: 0 });
    expect(owner.list().status).toBe('error');
    expect(owner.badge()).toMatchObject({ status: 'ready', count: 0, label: null });
  });
  it('filters foreign BU, submitter and wrong tab statuses while retaining the wire count', () => {
    load('approved');
    approved.next({
      count: 4,
      summaries: [
        createCasesDraftSummary({ casefile_status: 'PUBLISHED', draft_casefile_id: 456 }),
        createCasesDraftSummary({ casefile_status: 'PUBLISHED', business_unit_id: 45 }),
        createCasesDraftSummary({ casefile_status: 'PUBLISHED', submitted_by: 'BUU-OTHER' }),
        createCasesDraftSummary({ casefile_status: 'PUBLISHING_PENDING' }),
      ],
    });
    expect(owner.list().rows.map((row) => row.id)).toEqual([456]);
    expect(owner.list().count).toBe(4);
  });
  it('returns empty for a valid response with no matching rows', () => {
    load('deleted');
    deleted.next({ count: 0, summaries: [] });
    expect(owner.list()).toEqual({ status: 'empty', rows: [], count: 0, correlationReference: null });
  });
  it('takes only the first successful response', () => {
    load('in-review');
    readyReview();
    review.next({ count: 0, summaries: [] });
    count.next({ count: 1 });
    count.next({ count: 8 });
    expect(owner.list().count).toBe(1);
    expect(owner.badge().count).toBe(1);
  });
  it('retries only failed list once during rapid clicks and rebuilds date range', () => {
    load('approved');
    count.next({ count: 3 });
    approved.error(failure());
    approved = new Subject();
    getDateRange.mockReturnValueOnce({ from: '2026-09-29', to: '2026-10-06' });
    owner.retryList();
    owner.retryList();
    expect(api.getDraftCasefiles).toHaveBeenCalledTimes(2);
    expect(api.getRejectedDraftCasefileCount).toHaveBeenCalledTimes(1);
    expect(api.getDraftCasefiles).toHaveBeenLastCalledWith({
      business_unit_id: 44,
      submitted_by: 'BUU-SYNTHETIC',
      casefile_status: 'PUBLISHED',
      casefile_status_from_date: '2026-09-29',
      casefile_status_to_date: '2026-10-06',
    });
    expect(getDateRange).toHaveBeenLastCalledWith(7, 0);
    expect(owner.list().status).toBe('loading');
    expect(owner.badge().count).toBe(3);
    approved.next({ count: 0, summaries: [] });
    expect(owner.list().status).toBe('empty');
  });
  it('retries only failed badge once during rapid clicks', () => {
    load('in-review');
    readyReview();
    count.error(failure());
    count = new Subject();
    owner.retryBadge();
    owner.retryBadge();
    expect(api.getDraftCasefiles).toHaveBeenCalledTimes(1);
    expect(api.getRejectedDraftCasefileCount).toHaveBeenCalledTimes(2);
    expect(owner.list().status).toBe('ready');
    expect(owner.badge().status).toBe('loading');
    count.next({ count: 9 });
    expect(owner.badge()).toMatchObject({ status: 'ready', count: 9 });
  });
  it('retries rejected list and clears its failed badge to unknown pending state', () => {
    load('rejected');
    rejected.error(failure());
    expect(owner.badge().status).toBe('error');
    owner.retryBadge();
    expect(api.getDraftCasefiles).toHaveBeenCalledTimes(1);
    rejected = new Subject();
    owner.retryList();
    owner.retryList();
    expect(owner.badge()).toMatchObject({ status: 'loading', count: null });
    rejected.next({ count: 0, summaries: [] });
    expect(owner.badge()).toMatchObject({ status: 'ready', count: 0, label: null });
    expect(api.getRejectedDraftCasefileCount).not.toHaveBeenCalled();
  });
  it('ignores retry in idle, loading and ready states', () => {
    owner.retryList();
    owner.retryBadge();
    load('in-review');
    owner.retryList();
    owner.retryBadge();
    readyReview();
    count.next({ count: 1 });
    owner.retryList();
    owner.retryBadge();
    expect(api.getDraftCasefiles).toHaveBeenCalledTimes(1);
    expect(api.getRejectedDraftCasefileCount).toHaveBeenCalledTimes(1);
  });
  it.each(['flag', 'permission', 'authentication'] as const)(
    'hides rows synchronously on %s removal and cancels pending work',
    (reason) => {
      load('in-review');
      readyReview();
      if (reason === 'flag') featureFlags.set({ [key]: false });
      if (reason === 'permission') userState.set({ ...permittedUser(), business_unit_users: [] });
      if (reason === 'authentication') authenticated.set(false);
      expectDenied();
      count.next({ count: 9 });
      expectDenied();
      TestBed.tick();
      expect(navigateByUrl).toHaveBeenCalledWith('/access-denied');
      owner.load('approved');
      owner.retryList();
      owner.retryBadge();
      approved.next({ count: 0, summaries: [] });
      expectDenied();
      expect(api.getDraftCasefiles).toHaveBeenCalledTimes(1);
    },
  );
  it('hides old rows before effect flush and reloads with replacement identity', () => {
    load('in-review');
    readyReview();
    const replacement = permittedUser();
    replacement.user_id += 1;
    replacement.business_unit_users[0].business_unit_user_id = 'BUU-REPLACEMENT';
    const staleCount = count;
    review = new Subject();
    count = new Subject();
    userState.set(replacement);
    expectDenied();
    staleCount.next({ count: 7 });
    expectDenied();
    TestBed.tick();
    expect(api.getDraftCasefiles).toHaveBeenLastCalledWith(
      expect.objectContaining({ submitted_by: 'BUU-REPLACEMENT' }),
    );
    review.next({
      count: 1,
      summaries: [createCasesDraftSummary({ submitted_by: 'BUU-REPLACEMENT', draft_casefile_id: 456 })],
    });
    count.next({ count: 3 });
    expect(owner.list().rows.map((row) => row.id)).toEqual([456]);
    expect(owner.badge().count).toBe(3);
  });
  it('does not consult the old identity when a routed load precedes its effect', () => {
    load('in-review');
    readyReview();
    const replacement = permittedUser();
    replacement.user_id += 1;
    replacement.business_unit_users[0].business_unit_user_id = 'BUU-REPLACEMENT';
    userState.set(replacement);
    owner.load('approved');
    expectDenied();
    expect(api.getDraftCasefiles).toHaveBeenCalledTimes(1);
    TestBed.tick();
    expect(api.getDraftCasefiles).toHaveBeenCalledTimes(2);
    expect(api.getDraftCasefiles).toHaveBeenLastCalledWith(
      expect.objectContaining({ submitted_by: 'BUU-REPLACEMENT', casefile_status: 'PUBLISHED' }),
    );
  });
  it('never lets a previous count overwrite the new tab count', () => {
    load('in-review');
    const previousCount = count;
    count = new Subject();
    load('approved');
    count.next({ count: 3 });
    previousCount.next({ count: 9 });
    expect(owner.badge()).toMatchObject({ status: 'ready', count: 3 });
  });
  it.each(['flag', 'identity', 'deactivate', 'destroy', 'http-denial'] as const)(
    'releases both pending HTTP streams on %s',
    (reason) => {
      const listReleased = vi.fn();
      const badgeReleased = vi.fn();
      api.getDraftCasefiles.mockReturnValue(review.pipe(finalize(listReleased)));
      api.getRejectedDraftCasefileCount.mockReturnValue(count.pipe(finalize(badgeReleased)));
      load('in-review');
      if (reason === 'flag') featureFlags.set({ [key]: false });
      if (reason === 'identity') {
        const replacement = permittedUser();
        replacement.user_id += 1;
        userState.set(replacement);
      }
      if (reason === 'deactivate') owner.deactivate();
      if (reason === 'destroy') TestBed.resetTestingModule();
      if (reason === 'http-denial') review.error(failure(403));
      if (reason === 'flag' || reason === 'identity') TestBed.tick();
      expect(listReleased).toHaveBeenCalledTimes(1);
      expect(badgeReleased).toHaveBeenCalledTimes(1);
    },
  );
  it('does not reload for an equivalent identity object', () => {
    load('in-review');
    userState.set(permittedUser());
    TestBed.tick();
    expect(api.getDraftCasefiles).toHaveBeenCalledTimes(1);
  });
  it.each([401, 403])('denies and cancels pending badge after list HTTP %s', (status) => {
    load('in-review');
    review.error(failure(status));
    expectDenied();
    count.next({ count: 9 });
    expectDenied();
    owner.load('approved');
    TestBed.tick();
    expect(api.getDraftCasefiles).toHaveBeenCalledTimes(1);
    expect(navigateByUrl).toHaveBeenCalledTimes(1);
  });
  it.each([401, 403])('denies and cancels pending list after badge HTTP %s', (status) => {
    load('in-review');
    count.error(failure(status));
    readyReview();
    expectDenied();
  });
  it('stops synchronous merged operations after synchronous denial', () => {
    api.getDraftCasefiles.mockReturnValue(throwError(() => failure(403)));
    api.getRejectedDraftCasefileCount.mockReturnValue(of({ count: 9 }));
    load('in-review');
    expectDenied();
    expect(api.getRejectedDraftCasefileCount).not.toHaveBeenCalled();
  });
  it('retains denial when navigation rejects', async () => {
    navigateByUrl.mockRejectedValue(new Error('Synthetic navigation failure'));
    load('in-review');
    count.error(failure(401));
    await Promise.resolve();
    expectDenied();
  });
  it.each(['list', 'badge'] as const)('treats %s completion without a value as error', (operation) => {
    load('in-review');
    if (operation === 'list') review.complete();
    else count.complete();
    expect(operation === 'list' ? owner.list() : owner.badge()).toMatchObject({
      status: 'error',
      count: null,
      correlationReference: null,
    });
  });
  it('handles synchronous empty and successful streams independently', () => {
    api.getDraftCasefiles.mockReturnValue(EMPTY);
    api.getRejectedDraftCasefileCount.mockReturnValue(of({ count: 5 }));
    load('in-review');
    expect(owner.list().status).toBe('error');
    expect(owner.badge().count).toBe(5);
  });
  it.each(['deactivate', 'destroy'] as const)('clears data and prevents late replies after %s', (operation) => {
    load('in-review');
    readyReview();
    if (operation === 'deactivate') owner.deactivate();
    else TestBed.resetTestingModule();
    count.next({ count: 9 });
    expect(owner.list()).toMatchObject({ status: 'idle', rows: [], count: null });
    expect(owner.badge()).toMatchObject({ status: 'idle', count: null });
    owner.load('approved');
    owner.retryList();
    owner.retryBadge();
    expect(api.getDraftCasefiles).toHaveBeenCalledTimes(1);
  });
  it('denies an initially unauthorized load without API consultations', () => {
    authenticated.set(false);
    load('in-review');
    expectDenied();
    expect(api.getDraftCasefiles).not.toHaveBeenCalled();
    expect(api.getRejectedDraftCasefileCount).not.toHaveBeenCalled();
  });
});
