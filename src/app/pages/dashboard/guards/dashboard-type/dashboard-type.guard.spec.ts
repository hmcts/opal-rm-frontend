import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, convertToParamMap } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSpyObj } from '@app/testing/create-spy-obj.helper';
import { dashboardTypeGuard } from './dashboard-type.guard';

describe('dashboardTypeGuard', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRouter: any;
  let expectedRedirectUrlTree: UrlTree;

  beforeEach(() => {
    mockRouter = createSpyObj('Router', ['createUrlTree']);
    expectedRedirectUrlTree = new UrlTree();
    mockRouter.createUrlTree.mockReturnValue(expectedRedirectUrlTree);

    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: mockRouter }],
    });
  });

  const runGuard = (dashboardType: string | null) => {
    const route = {
      paramMap: convertToParamMap(dashboardType ? { dashboardType } : {}),
    } as ActivatedRouteSnapshot;

    return TestBed.runInInjectionContext(() => dashboardTypeGuard(route, {} as RouterStateSnapshot));
  };

  it('allows known dashboard types', () => {
    const result = runGuard('accounts');

    expect(result).toBe(true);
    expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects unknown dashboard types to /dashboard', () => {
    const result = runGuard('unknown');

    expect(result).toBe(expectedRedirectUrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/', 'dashboard']);
  });

  it('redirects when the dashboard type is missing', () => {
    const result = runGuard(null);

    expect(result).toBe(expectedRedirectUrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/', 'dashboard']);
  });
});
