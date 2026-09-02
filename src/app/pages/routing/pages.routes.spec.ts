import { accountGuard } from '@hmcts/opal-frontend-common/guards/account';
import { authGuard } from '@hmcts/opal-frontend-common/guards/auth';
import { canDeactivateGuard } from '@hmcts/opal-frontend-common/guards/can-deactivate';
import { PRIMARY_NAV_HIDDEN_ROUTE_DATA } from '@app/constants/route-data.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '@app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { describe, expect, it } from 'vitest';
import { routing } from './pages.routes';

describe('page routes', () => {
  it('registers the Create Casefile shell', () => {
    const route = routing.find((candidate) => candidate.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.root);

    expect(route?.canActivate).toEqual([authGuard, accountGuard]);
    expect(route?.canDeactivate).toEqual([canDeactivateGuard]);
    expect(route?.data).toEqual(PRIMARY_NAV_HIDDEN_ROUTE_DATA);
    expect(route?.loadComponent).toEqual(expect.any(Function));
    expect(route?.children).toBeDefined();
  });
});
