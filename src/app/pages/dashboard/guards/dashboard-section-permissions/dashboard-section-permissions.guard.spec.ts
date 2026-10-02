import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, convertToParamMap } from '@angular/router';
import { PAGES_ROUTING_PATHS as COMMON_PAGES_ROUTING_PATHS } from '@hmcts/opal-frontend-common/pages/routing/constants';
import { OpalUserService } from '@hmcts/opal-frontend-common/services/opal-user-service';
import { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { beforeEach, describe, expect, it } from 'vitest';
import { firstValueFrom, isObservable, of, throwError } from 'rxjs';
import { createSpyObj } from '@app/testing/create-spy-obj.helper';
import { CASES_PERMISSIONS } from '@app/flows/cases/constants/cases-permissions.constant';
import { dashboardSectionPermissionsGuard } from './dashboard-section-permissions.guard';

const createUserStateWithPermissions = (permissionIds: readonly number[]): IOpalUserState => {
  const userState = structuredClone(OPAL_USER_STATE_MOCK);
  const [firstBusinessUnit, secondBusinessUnit] = userState.business_unit_users;

  userState.business_unit_users = [
    {
      ...firstBusinessUnit,
      permissions: [],
    },
    {
      ...secondBusinessUnit,
      business_unit_id: 44,
      permissions: permissionIds.map((permissionId) => ({
        permission_id: permissionId,
        permission_name: `Permission ${permissionId}`,
      })),
    },
  ];

  return userState;
};

describe('dashboardSectionPermissionsGuard', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRouter: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockOpalUserService: any;

  const runGuard = async ({ sectionKey, dashboardType }: { sectionKey?: string; dashboardType?: string | null }) => {
    const route = {
      data: sectionKey ? { sectionKey } : {},
      paramMap: convertToParamMap(dashboardType ? { dashboardType } : {}),
    } as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() =>
      dashboardSectionPermissionsGuard(route, {} as RouterStateSnapshot),
    );
    return isObservable(result) ? firstValueFrom(result) : result;
  };

  beforeEach(() => {
    mockRouter = createSpyObj('Router', ['createUrlTree']);
    mockOpalUserService = createSpyObj('OpalUserService', ['getLoggedInUserState']);

    mockRouter.createUrlTree.mockReturnValue(new UrlTree());
    mockOpalUserService.getLoggedInUserState.mockReturnValue(of(createUserStateWithPermissions([])));

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: OpalUserService, useValue: mockOpalUserService },
      ],
    });
  });

  it('checks child navigation using the casefile parent section', async () => {
    const route = {
      data: {},
      parent: { data: { sectionKey: 'cases' } } as unknown as ActivatedRouteSnapshot,
      paramMap: convertToParamMap({}),
    } as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() =>
      dashboardSectionPermissionsGuard(route, {} as RouterStateSnapshot),
    );
    expect(isObservable(result) ? await firstValueFrom(result) : result).toBeInstanceOf(UrlTree);
  });

  it('allows access when no dashboard section can be resolved', async () => {
    const result = await runGuard({ dashboardType: 'unknown' });

    expect(result).toBe(true);
    expect(mockOpalUserService.getLoggedInUserState).not.toHaveBeenCalled();
  });

  it.each(['search', 'reports', 'administration'])('denies %s until RM permissions are defined', async (sectionKey) => {
    mockOpalUserService.getLoggedInUserState.mockReturnValue(of(createUserStateWithPermissions([6, 14, 15, 21])));
    expect(await runGuard({ sectionKey })).toBeInstanceOf(UrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith([`/${COMMON_PAGES_ROUTING_PATHS.children.accessDenied}`]);
  });

  it('redirects to access denied when the user lacks the required permission', async () => {
    const expectedUrlTree = new UrlTree();
    mockRouter.createUrlTree.mockReturnValue(expectedUrlTree);

    const result = await runGuard({ dashboardType: 'cases' });

    expect(result).toBe(expectedUrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith([`/${COMMON_PAGES_ROUTING_PATHS.children.accessDenied}`]);
  });

  it('denies case access when permission 21 belongs to another business unit', async () => {
    const state = createUserStateWithPermissions([21]);
    state.business_unit_users[1].business_unit_id = 45;
    mockOpalUserService.getLoggedInUserState.mockReturnValue(of(state));
    expect(await runGuard({ sectionKey: 'cases' })).toBeInstanceOf(UrlTree);
  });

  it('allows case access for permission 21 in the RM business unit', async () => {
    mockOpalUserService.getLoggedInUserState.mockReturnValue(of(createUserStateWithPermissions([21])));
    expect(await runGuard({ sectionKey: 'cases' })).toBe(true);
  });

  it('returns false when the user state lookup errors', async () => {
    mockOpalUserService.getLoggedInUserState.mockReturnValue(throwError(() => new Error('boom')));

    const result = await runGuard({ dashboardType: 'cases' });

    expect(result).toBe(false);
  });

  it('uses the route param when there is no sectionKey in route data', async () => {
    mockOpalUserService.getLoggedInUserState.mockReturnValue(
      of(createUserStateWithPermissions([CASES_PERMISSIONS[0]])),
    );

    const result = await runGuard({ dashboardType: 'cases' });

    expect(result).toBe(true);
  });
});
