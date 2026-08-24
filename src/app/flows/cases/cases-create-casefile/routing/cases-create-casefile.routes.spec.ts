import { canDeactivateGuard } from '@hmcts/opal-frontend-common/guards/can-deactivate';
import { TitleResolver } from '@hmcts/opal-frontend-common/resolvers/title';
import { describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from './constants/cases-create-casefile-routing-paths.constant';
import { routing } from './cases-create-casefile.routes';

describe('Create Casefile routes', () => {
  it('redirects the empty child route to Case Type', () => {
    expect(routing[0]).toEqual({
      path: '',
      redirectTo: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.caseType,
      pathMatch: 'full',
    });
  });

  it('registers Case Type without temporary permission metadata', () => {
    const route = routing.find((candidate) => candidate.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.children.caseType);

    expect(route?.canDeactivate).toEqual([canDeactivateGuard]);
    expect(route?.canActivate).toBeUndefined();
    expect(route?.loadComponent).toEqual(expect.any(Function));
    expect(route?.data).toEqual({ title: 'Create a case' });
    expect(route?.resolve).toEqual({ title: TitleResolver });
  });

  it('registers the temporary Task List route without permission metadata', () => {
    const route = routing.find((candidate) => candidate.path === CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList);

    expect(route?.canActivate).toBeUndefined();
    expect(route?.loadComponent).toEqual(expect.any(Function));
    expect(route?.data).toEqual({ title: 'Task List' });
    expect(route?.resolve).toEqual({ title: TitleResolver });
  });
});
