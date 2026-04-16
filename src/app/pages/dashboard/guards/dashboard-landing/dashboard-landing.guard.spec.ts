import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot } from '@angular/router';
import { OpalUserService } from '@hmcts/opal-frontend-common/services/opal-user-service';
import { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { OPAL_USER_STATE_MOCK } from '@hmcts/opal-frontend-common/services/opal-user-service/mocks';
import { beforeEach, describe, expect, it } from 'vitest';
import { firstValueFrom, isObservable, of, throwError } from 'rxjs';
import { createSpyObj } from '@app/testing/create-spy-obj.helper';
import { dashboardLandingGuard } from './dashboard-landing.guard';
import { SEARCH_PERMISSIONS } from '@app/flows/search/constants/search-permissions.constant';
import { ACCOUNTS_PERMISSIONS } from '@app/flows/accounts/constants/accounts-permissions.constant';

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
      permissions: permissionIds.map((permissionId) => ({
        permission_id: permissionId,
        permission_name: `Permission ${permissionId}`,
      })),
    },
  ];

  return userState;
};

describe('dashboardLandingGuard', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRouter: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockOpalUserService: any;

  const runGuard = async () => {
    const result = TestBed.runInInjectionContext(() => dashboardLandingGuard({} as never, {} as RouterStateSnapshot));
    return isObservable(result) ? firstValueFrom(result) : result;
  };

  beforeEach(() => {
    mockRouter = createSpyObj('Router', ['createUrlTree']);
    mockOpalUserService = createSpyObj('OpalUserService', ['getLoggedInUserState']);

    mockRouter.createUrlTree.mockImplementation((commands: string[]) => commands.join('/'));
    mockOpalUserService.getLoggedInUserState.mockReturnValue(of(createUserStateWithPermissions([])));

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: OpalUserService, useValue: mockOpalUserService },
      ],
    });
  });

  it('routes to Search when the user has a search permission', async () => {
    mockOpalUserService.getLoggedInUserState.mockReturnValue(
      of(createUserStateWithPermissions([SEARCH_PERMISSIONS[0]])),
    );

    const result = await runGuard();

    expect(result).toBe('//dashboard/search');
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/', 'dashboard', 'search']);
  });

  it('routes to Accounts when search is unavailable but accounts is permitted', async () => {
    mockOpalUserService.getLoggedInUserState.mockReturnValue(
      of(createUserStateWithPermissions([ACCOUNTS_PERMISSIONS[0]])),
    );

    const result = await runGuard();

    expect(result).toBe('//dashboard/accounts');
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/', 'dashboard', 'accounts']);
  });

  it('falls back to the default accounts dashboard when user state lookup fails', async () => {
    mockOpalUserService.getLoggedInUserState.mockReturnValue(throwError(() => new Error('boom')));

    const result = await runGuard();

    expect(result).toBe('//dashboard/accounts');
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/', 'dashboard', 'accounts']);
  });
});
