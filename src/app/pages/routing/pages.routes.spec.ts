import {
  BUSINESS_UNIT_ID_RESOLVER,
  businessUnitRoutePermissionsGuard,
} from '@hmcts/opal-frontend-common/guards/business-unit-route-permissions';
import { CasesDraftNavigationService } from '@app/flows/cases/cases-draft/services/cases-draft-navigation.service';
import { casesDraftAccessGuard } from '@app/flows/cases/cases-draft/routing/guards/cases-draft-access.guard';
import { accountGuard } from '@hmcts/opal-frontend-common/guards/account';
import { authGuard } from '@hmcts/opal-frontend-common/guards/auth';
import { canDeactivateGuard } from '@hmcts/opal-frontend-common/guards/can-deactivate';
import { PRIMARY_NAV_HIDDEN_ROUTE_DATA } from '@app/constants/route-data.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '@app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { describe, expect, it } from 'vitest';
import { routing } from './pages.routes';
import { release1cRmCreateCaseFilesFeatureFlagGuard } from '@app/flows/cases/utils/resolve-create-case-files-release.utils';

describe('page routes', () => {
  it('shares checker navigation above separately guarded dashboard and persisted groups', () => {
    const route = routing.find((candidate) => candidate.path === 'cases/draft/check-and-validate');
    expect(route?.providers).toContain(CasesDraftNavigationService);
    expect(route?.canActivate).toEqual([authGuard, accountGuard, release1cRmCreateCaseFilesFeatureFlagGuard]);
    const dashboard = route?.children?.find((child) => child.data?.['routePermissionId'] === 22);
    const persisted = route?.children?.find((child) => Array.isArray(child.data?.['routePermissionId']));
    expect(dashboard?.canActivateChild).toContain(businessUnitRoutePermissionsGuard);
    expect(persisted?.data?.['routePermissionId']).toEqual([21, 22]);
    expect(persisted?.canActivateChild).toContain(businessUnitRoutePermissionsGuard);
    expect(persisted?.providers).toContainEqual({
      provide: BUSINESS_UNIT_ID_RESOLVER,
      useFactory: expect.any(Function),
    });
  });
  it('registers the Create Casefile shell', () => {
    const route = routing.find(
      (candidate) => candidate.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.root && candidate.canDeactivate,
    );

    expect(route?.canActivate).toEqual([
      authGuard,
      accountGuard,
      release1cRmCreateCaseFilesFeatureFlagGuard,
      casesDraftAccessGuard,
    ]);
    expect(route?.canActivateChild).toEqual([release1cRmCreateCaseFilesFeatureFlagGuard, casesDraftAccessGuard]);
    expect(route?.canDeactivate).toEqual([canDeactivateGuard]);
    expect(route?.data).toEqual({ ...PRIMARY_NAV_HIDDEN_ROUTE_DATA, sectionKey: 'cases' });
    expect(route?.loadComponent).toEqual(expect.any(Function));
    expect(route?.children).toBeDefined();
  });
});

describe('persisted route boundary', () => {
  it('uses a read-authorised shell for persisted details while retaining the inputter amendment boundary', () => {
    const groups = routing.filter((route) => route.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.root);
    expect(groups).toHaveLength(3);
    expect(groups[0].loadComponent).toEqual(expect.any(Function));
    expect(groups[0].data?.['routePermissionId']).toEqual([21, 22]);
    expect(groups[0].children?.[0].data?.['casefileIntent']).toBe('inputter-view');
    expect(groups[0].children?.[0].resolve?.['draftCasefile']).toEqual(expect.any(Function));
    expect(groups[1].children?.[0].data?.['placeholderKind']).toBe('amendment');
    expect(groups[1].canActivateChild).toContain(casesDraftAccessGuard);
  });
  it('registers a visible containerless lazy dashboard with the access boundary on child navigation', () => {
    const route = routing.find((route) => route.path === 'cases/draft/create-and-manage');
    expect(route?.loadChildren).toEqual(expect.any(Function));
    expect(route?.loadComponent).toBeUndefined();
    expect(route?.data?.['hidePrimaryNav']).not.toBe(true);
    expect(route?.canActivateChild).toEqual([release1cRmCreateCaseFilesFeatureFlagGuard, casesDraftAccessGuard]);
  });
});
