import { casesDraftAccessGuard } from '@app/flows/cases/cases-draft/routing/guards/cases-draft-access.guard';
import { dashboardSectionPermissionsGuard } from '../dashboard/guards/dashboard-section-permissions/dashboard-section-permissions.guard';
import { accountGuard } from '@hmcts/opal-frontend-common/guards/account';
import { authGuard } from '@hmcts/opal-frontend-common/guards/auth';
import { canDeactivateGuard } from '@hmcts/opal-frontend-common/guards/can-deactivate';
import { PRIMARY_NAV_HIDDEN_ROUTE_DATA } from '@app/constants/route-data.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '@app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { describe, expect, it } from 'vitest';
import { routing, release1cRmCreateCaseFilesFeatureFlagGuard } from './pages.routes';

describe('page routes', () => {
  it('registers the Create Casefile shell', () => {
    const route = routing.find(
      (candidate) => candidate.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.root && candidate.loadComponent,
    );

    expect(route?.canActivate).toEqual([
      authGuard,
      accountGuard,
      release1cRmCreateCaseFilesFeatureFlagGuard,
      dashboardSectionPermissionsGuard,
    ]);
    expect(route?.canActivateChild).toEqual([
      release1cRmCreateCaseFilesFeatureFlagGuard,
      dashboardSectionPermissionsGuard,
    ]);
    expect(route?.canDeactivate).toEqual([canDeactivateGuard]);
    expect(route?.data).toEqual({ ...PRIMARY_NAV_HIDDEN_ROUTE_DATA, sectionKey: 'cases' });
    expect(route?.loadComponent).toEqual(expect.any(Function));
    expect(route?.children).toBeDefined();
  });
});

describe('persisted route boundary', () => {
  it('places only two ID children in a containerless guarded group before the create shell', () => {
    const groups = routing.filter((route) => route.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.root);
    expect(groups).toHaveLength(2);
    expect(groups[0].loadComponent).toBeUndefined();
    expect(groups[0].canDeactivate).toBeUndefined();
    expect(groups[0].data).toEqual({ ...PRIMARY_NAV_HIDDEN_ROUTE_DATA, sectionKey: 'cases' });
    expect(groups[0].children?.map((route) => route.path)).toEqual([
      'check-case-details/:draftCasefileId',
      'task-list/:draftCasefileId',
    ]);
    expect(groups[0].canActivate).toEqual([
      authGuard,
      accountGuard,
      release1cRmCreateCaseFilesFeatureFlagGuard,
      casesDraftAccessGuard,
    ]);
    expect(groups[0].canActivateChild).toEqual([release1cRmCreateCaseFilesFeatureFlagGuard, casesDraftAccessGuard]);
    expect(groups[0].children?.map((route) => route.data?.['placeholderKind'])).toEqual(['details', 'amendment']);
  });
  it('registers a visible containerless lazy dashboard with the access boundary on child navigation', () => {
    const route = routing.find((route) => route.path === 'cases/draft/create-and-manage');
    expect(route?.loadChildren).toEqual(expect.any(Function));
    expect(route?.loadComponent).toBeUndefined();
    expect(route?.data?.['hidePrimaryNav']).not.toBe(true);
    expect(route?.canActivateChild).toEqual([release1cRmCreateCaseFilesFeatureFlagGuard, casesDraftAccessGuard]);
  });
});
