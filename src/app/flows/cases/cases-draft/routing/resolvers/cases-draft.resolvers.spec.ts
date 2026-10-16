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
