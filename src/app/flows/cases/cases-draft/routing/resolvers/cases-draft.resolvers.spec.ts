import { CASES_DRAFT_DASHBOARD_MODE } from '../../constants/cases-draft-dashboard-mode.token';
import { casesDraftCountResolver } from './cases-draft-count.resolver';
import { casesDraftTabResolver } from './cases-draft-tab.resolver';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, RouterStateSnapshot, ResolveFn } from '@angular/router';
import { EMPTY, firstValueFrom, Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routing } from '../cases-draft.routes';
import { CasesDraftDashboardService } from '../../services/cases-draft-dashboard.service';

const identity = { userId: 100, businessUnitId: 44, submittedBy: 'BUU-SYNTHETIC' };
const service = { getIdentity: vi.fn(), getList: vi.fn(), getRejectedCount: vi.fn() };
const snapshot = (fragment: string | null) =>
  ({ fragment, queryParamMap: convertToParamMap({}) }) as ActivatedRouteSnapshot;
function resolve<T>(key: string, fragment: string | null): Promise<T> {
  const resolver = routing[1].resolve![key] as ResolveFn<T>;
  return firstValueFrom(
    TestBed.runInInjectionContext(() => resolver(snapshot(fragment), {} as RouterStateSnapshot)) as Observable<T>,
  );
}
describe('draft initial route resolvers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.getIdentity.mockReturnValue(identity);
    service.getList.mockReturnValue(of({ count: 0, summaries: [] }));
    service.getRejectedCount.mockReturnValue(of(7));
    TestBed.configureTestingModule({ providers: [{ provide: CasesDraftDashboardService, useValue: service }] });
  });
  it.each(['approved', 'deleted', 'rejected', 'in-review'])(
    'loads initial fragment %s with current identity',
    async (tab) => {
      expect(await resolve('draftCasefiles', tab)).toEqual({ identity, tab, response: { count: 0, summaries: [] } });
      expect(service.getList).toHaveBeenCalledExactlyOnceWith(identity, tab);
    },
  );
  it.each([null, 'untrusted'])('normalises fragment %s to In review', async (tab) => {
    await resolve('draftCasefiles', tab);
    expect(service.getList).toHaveBeenCalledExactlyOnceWith(identity, 'in-review');
  });
  it('consults an independent rejected count for a non-Rejected arrival', async () => {
    expect(await resolve('rejectedCount', 'approved')).toBe(7);
    expect(service.getRejectedCount).toHaveBeenCalledExactlyOnceWith(identity);
  });
  it('lets initial Rejected list supply the badge without duplicate request', async () => {
    expect(await resolve('rejectedCount', 'rejected')).toBeNull();
    expect(service.getRejectedCount).not.toHaveBeenCalled();
  });
  it.each(['draftCasefiles', 'rejectedCount'])('cancels %s without an authorised identity', async (key) => {
    service.getIdentity.mockReturnValue(null);
    await expect(resolve(key, 'approved')).rejects.toThrow();
    expect(service.getList).not.toHaveBeenCalled();
    expect(service.getRejectedCount).not.toHaveBeenCalled();
  });
  it('propagates list failure instead of successful empty arrival', async () => {
    service.getList.mockReturnValue(throwError(() => new Error('Synthetic failure')));
    service.getRejectedCount.mockReturnValue(throwError(() => new Error('Synthetic failure')));
    await expect(resolve('draftCasefiles', 'approved')).rejects.toThrow('Synthetic failure');
  });
  it('allows independent count failure with a missing badge', async () => {
    service.getRejectedCount.mockReturnValue(throwError(() => new Error('Synthetic failure')));
    expect(await resolve('rejectedCount', 'approved')).toBeNull();
  });
  it.each([401, 403])('does not accept arrival after count HTTP %s denial', async (status) => {
    service.getRejectedCount.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
    await expect(resolve('rejectedCount', 'approved')).rejects.toBeInstanceOf(HttpErrorResponse);
  });
  it('cancels a list resolver with no emission', async () => {
    service.getList.mockReturnValue(EMPTY);
    await expect(resolve('draftCasefiles', 'approved')).rejects.toThrow();
  });
});

describe('checker initial resolver behavior', () => {
  const checker = { getIdentity: vi.fn(), getList: vi.fn(), getOutcomeCount: vi.fn() };
  beforeEach(() => {
    vi.clearAllMocks();
    checker.getIdentity.mockReturnValue(identity);
    checker.getList.mockReturnValue(of({ count: 0, summaries: [] }));
    checker.getOutcomeCount.mockReturnValue(of(7));
    TestBed.configureTestingModule({
      providers: [
        { provide: CASES_DRAFT_DASHBOARD_MODE, useValue: 'checker' },
        { provide: CasesDraftDashboardService, useValue: checker },
      ],
    });
  });
  const run = <T>(resolver: ResolveFn<T>, fragment: string | null) =>
    firstValueFrom(
      TestBed.runInInjectionContext(() => resolver(snapshot(fragment), {} as RouterStateSnapshot)) as Observable<T>,
    );
  it.each([null, 'to-review', 'rejected', 'failed', 'deleted'])('loads checker arrival %s', async (tab) => {
    expect(await run(casesDraftTabResolver, tab)).toMatchObject({ identity, tab: tab ?? 'to-review' });
  });
  it.each(['rejected', 'failed'] as const)('reuses the selected %s list count', async (outcome) => {
    expect(await run(casesDraftCountResolver(outcome), outcome)).toBeNull();
    expect(checker.getOutcomeCount).not.toHaveBeenCalled();
  });
  it.each(['rejected', 'failed'] as const)(
    'loads unselected %s count and tolerates its non-auth failure',
    async (outcome) => {
      expect(await run(casesDraftCountResolver(outcome), 'to-review')).toBe(7);
      expect(checker.getOutcomeCount).toHaveBeenCalledWith(identity, outcome);
      checker.getOutcomeCount.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      expect(await run(casesDraftCountResolver(outcome), 'to-review')).toBeNull();
    },
  );
  it.each([401, 403])('propagates HTTP%s count denial', async (status) => {
    checker.getOutcomeCount.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
    await expect(run(casesDraftCountResolver('failed'), 'to-review')).rejects.toBeInstanceOf(HttpErrorResponse);
  });
  it('cancels counts for missing BU identity', async () => {
    checker.getIdentity.mockReturnValue(null);
    await expect(run(casesDraftCountResolver('failed'), 'to-review')).rejects.toThrow();
    expect(checker.getOutcomeCount).not.toHaveBeenCalled();
  });
});
