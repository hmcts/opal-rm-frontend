import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IOpalMaintenanceDraftCasefileListResponse } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-list-response.interface';
import type { ICasesDraftIdentity } from '../interfaces/cases-draft-identity.interface';
import { createCasesDraftSummary } from '../mocks/cases-draft-summary.mock';
import type { CasesDraftTab, CasesDraftOutcomeTab } from '../types/cases-draft-tab.type';
import { CasesDraftDashboardService } from './cases-draft-dashboard.service';
import { CasesDraftCheckerLoadService } from './cases-draft-checker-load.service';

const identity: ICasesDraftIdentity = { userId: 100, businessUnitId: 44, submittedBy: 'BUU-CHECKER' };
describe('checker consultation owner', () => {
  const lists: Array<{ tab: CasesDraftTab; stream: Subject<IOpalMaintenanceDraftCasefileListResponse> }> = [];
  const counts: Array<{ tab: CasesDraftOutcomeTab; stream: Subject<number> }> = [];
  const boundary = {
    getList: vi.fn((_identity: ICasesDraftIdentity, tab: CasesDraftTab) => {
      const stream = new Subject<IOpalMaintenanceDraftCasefileListResponse>();
      lists.push({ tab, stream });
      return stream.asObservable();
    }),
    getOutcomeCount: vi.fn((_identity: ICasesDraftIdentity, tab: CasesDraftOutcomeTab) => {
      const stream = new Subject<number>();
      counts.push({ tab, stream });
      return stream.asObservable();
    }),
  };
  beforeEach(() => {
    vi.clearAllMocks();
    lists.length = 0;
    counts.length = 0;
    TestBed.configureTestingModule({
      providers: [CasesDraftCheckerLoadService, { provide: CasesDraftDashboardService, useValue: boundary }],
    });
  });
  it('refreshes every component arrival but deduplicates same-instance metadata changes', () => {
    const owner = TestBed.inject(CasesDraftCheckerLoadService);
    owner.refreshArrival(identity, 'to-review');
    lists[0].stream.next({ count: 0, summaries: [] });
    owner.activate(identity, 'to-review');
    expect(lists).toHaveLength(1);
    owner.refreshArrival(identity, 'to-review');
    expect(lists).toHaveLength(2);
    expect(counts).toHaveLength(4);
    expect(lists[0].stream.observed).toBe(false);
  });
  it('recovers first-entry failure only on explicit retry and hides stale rows', () => {
    const owner = TestBed.inject(CasesDraftCheckerLoadService);
    owner.activate(identity, 'to-review');
    expect(owner.listState()).toMatchObject({ status: 'loading', rows: null });
    lists[0].stream.error(
      new HttpErrorResponse({ status: 500, error: { operation_id: 'synthetic-ref', detail: 'Private detail' } }),
    );
    expect(owner.listState()).toMatchObject({
      status: 'failure',
      rows: null,
      count: null,
      correlationReference: 'synthetic-ref',
    });
    expect(lists).toHaveLength(1);
    owner.retryList();
    lists[1].stream.next({ count: 0, summaries: [] });
    expect(owner.listState()).toMatchObject({ status: 'success', rows: [], count: 0 });
  });
  it('filters wrong BU, own submitter and unexpected status before rendering while preserving provider count', () => {
    const owner = TestBed.inject(CasesDraftCheckerLoadService);
    owner.activate(identity, 'to-review');
    lists[0].stream.next({
      count: 8,
      summaries: [
        createCasesDraftSummary(),
        createCasesDraftSummary({ draft_casefile_id: 2, submitted_by: identity.submittedBy }),
        createCasesDraftSummary({ draft_casefile_id: 3, business_unit_id: 99 }),
        createCasesDraftSummary({ draft_casefile_id: 4, casefile_status: 'REJECTED' }),
      ],
    });
    expect(owner.listState()).toMatchObject({ status: 'success', count: 8 });
    const state = owner.listState();
    expect(state?.status === 'success' ? state.rows.map((row) => row.id) : []).toEqual([123]);
  });
  it('does not duplicate same-tab activation or retries during loading', () => {
    const owner = TestBed.inject(CasesDraftCheckerLoadService);
    owner.activate(identity, 'to-review');
    owner.activate({ ...identity }, 'to-review');
    owner.retryList();
    owner.retryCount('rejected');
    expect(lists).toHaveLength(1);
    expect(counts).toHaveLength(2);
  });
  it('consults a count after abandoning a selected outcome pending list', () => {
    const owner = TestBed.inject(CasesDraftCheckerLoadService);
    owner.activate(identity, 'rejected');
    expect(counts.map((request) => request.tab)).toEqual(['failed']);
    owner.activate(identity, 'deleted');
    expect(counts.map((request) => request.tab)).toEqual(['failed', 'rejected']);
    expect(lists[0].stream.observed).toBe(false);
    lists[0].stream.next({ count: 91, summaries: [] });
    expect(owner.listState()?.tab).toBe('deleted');
    expect(owner.counts().rejected).toEqual({ status: 'loading', count: null });
  });
  it.each(['success', 'error'] as const)('newer selected list overrides an older count %s', (outcome) => {
    const owner = TestBed.inject(CasesDraftCheckerLoadService);
    owner.activate(identity, 'to-review');
    const older = counts[0].stream;
    owner.activate(identity, 'rejected');
    lists[1].stream.next({ count: 7, summaries: [] });
    expect(older.observed).toBe(false);
    if (outcome === 'success') older.next(99);
    else older.error(new Error('Synthetic failure'));
    expect(owner.counts().rejected).toEqual({ status: 'success', count: 7 });
  });
  it('replaces an earlier count success with selected list count', () => {
    const owner = TestBed.inject(CasesDraftCheckerLoadService);
    owner.activate(identity, 'to-review');
    counts[0].stream.next(99);
    owner.activate(identity, 'rejected');
    lists[1].stream.next({ count: 0, summaries: [] });
    expect(owner.counts().rejected).toEqual({ status: 'success', count: 0 });
  });
  it('retains selected outcome failure after departure and retries count without refetching table', () => {
    const owner = TestBed.inject(CasesDraftCheckerLoadService);
    owner.activate(identity, 'failed');
    lists[0].stream.error(new Error('Synthetic decode failure'));
    owner.activate(identity, 'to-review');
    lists[1].stream.next({ count: 0, summaries: [] });
    expect(owner.counts().failed).toEqual({ status: 'failure', count: null, correlationReference: null });
    owner.retryCount('failed');
    counts.at(-1)!.stream.next(3);
    expect(owner.counts().failed).toEqual({ status: 'success', count: 3 });
    expect(lists).toHaveLength(2);
  });
  it('retries selected outcome through its list and badge', () => {
    const owner = TestBed.inject(CasesDraftCheckerLoadService);
    owner.activate(identity, 'rejected');
    lists[0].stream.error(new Error('Synthetic error'));
    owner.retryCount('rejected');
    lists[1].stream.next({ count: 2, summaries: [] });
    expect(owner.counts().rejected).toEqual({ status: 'success', count: 2 });
    expect(counts.map((request) => request.tab)).toEqual(['failed']);
  });
  it('retains independent count failure beside a successfully loaded list', () => {
    const owner = TestBed.inject(CasesDraftCheckerLoadService);
    owner.activate(identity, 'to-review');
    lists[0].stream.next({ count: 0, summaries: [] });
    counts[0].stream.error(new HttpErrorResponse({ status: 500, error: { operation_id: '<unsafe>' } }));
    expect(owner.listState()?.status).toBe('success');
    expect(owner.counts().rejected).toEqual({ status: 'failure', count: null, correlationReference: null });
    owner.activate(identity, 'deleted');
    expect(counts).toHaveLength(2);
  });
  it.each(['user', 'BU user'] as const)('clears old scope on changed %s and ignores old responses', (change) => {
    const owner = TestBed.inject(CasesDraftCheckerLoadService);
    owner.activate(identity, 'to-review');
    const replacement = { ...identity, ...(change === 'user' ? { userId: 101 } : { submittedBy: 'BUU-NEW' }) };
    owner.activate(replacement, 'to-review');
    expect(lists[0].stream.observed).toBe(false);
    expect(counts[0].stream.observed).toBe(false);
    lists[0].stream.next({ count: 99, summaries: [] });
    counts[0].stream.next(99);
    expect(owner.listState()).toMatchObject({ status: 'loading', identity: replacement });
    expect(owner.counts().rejected).toEqual({ status: 'loading', count: null });
  });
  it('clears access loss and makes retries inert without identity', () => {
    const owner = TestBed.inject(CasesDraftCheckerLoadService);
    owner.retryList();
    owner.retryCount('failed');
    expect(lists).toHaveLength(0);
    owner.activate(identity, 'to-review');
    owner.activate(null, 'to-review');
    owner.retryList();
    owner.retryCount('failed');
    expect(owner.listState()).toBeNull();
    expect(owner.counts().failed).toEqual({ status: 'idle', count: null });
    expect(lists[0].stream.observed).toBe(false);
    expect(counts.every((request) => !request.stream.observed)).toBe(true);
  });
  it.each([
    ['list', 401],
    ['list', 403],
    ['count', 401],
    ['count', 403],
  ] as const)('makes %s %s denial terminal for the arrival', (kind, status) => {
    const owner = TestBed.inject(CasesDraftCheckerLoadService);
    owner.activate(identity, 'to-review');
    const error = new HttpErrorResponse({ status });
    if (kind === 'list') lists[0].stream.error(error);
    else counts[0].stream.error(error);
    expect(owner.denied()).toBe(true);
    expect(owner.listState()).toBeNull();
    expect(owner.counts()).toEqual({
      rejected: { status: 'idle', count: null },
      failed: { status: 'idle', count: null },
    });
    owner.retryList();
    owner.retryCount('failed');
    owner.activate(identity, 'deleted');
    expect(lists).toHaveLength(1);
    expect(counts.every((request) => !request.stream.observed)).toBe(true);
  });
  it('releases subscriptions and personal state on injector destruction', () => {
    const owner = TestBed.inject(CasesDraftCheckerLoadService);
    owner.activate(identity, 'to-review');
    TestBed.resetTestingModule();
    expect(owner.listState()).toBeNull();
    expect(lists[0].stream.observed).toBe(false);
    expect(counts.every((request) => !request.stream.observed)).toBe(true);
  });
});
