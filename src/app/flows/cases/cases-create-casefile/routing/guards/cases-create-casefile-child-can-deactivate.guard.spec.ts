import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../constants/cases-create-casefile-routing-paths.constant';
import { casesCreateCasefileChildCanDeactivateGuard } from './cases-create-casefile-child-can-deactivate.guard';

const createRouterState = (url: string): RouterStateSnapshot => ({ url }) as RouterStateSnapshot;

describe('casesCreateCasefileChildCanDeactivateGuard', () => {
  const currentRoute = {} as ActivatedRouteSnapshot;
  const currentState = createRouterState(
    '/' +
      CASES_CREATE_CASEFILE_ROUTING_PATHS.root +
      '/' +
      CASES_CREATE_CASEFILE_ROUTING_PATHS.children.interestAndIndexation,
  );

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root,
    '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/',
    '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList,
    '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '?source=edit',
    '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '#content',
  ])('delegates the Create Casefile destination %s to the child component guard contract', (destination) => {
    const canDeactivate = vi.fn().mockReturnValue(false);
    const component = { canDeactivate };
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    const result = casesCreateCasefileChildCanDeactivateGuard(
      component,
      currentRoute,
      currentState,
      createRouterState(destination),
    );

    expect(result).toBe(false);
    expect(canDeactivate).toHaveBeenCalledOnce();
    expect(confirm).toHaveBeenCalledOnce();
  });

  it.each(['/dashboard', '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '-other'])(
    'allows the external destination %s through without consulting the child component',
    (destination) => {
      const canDeactivate = vi.fn().mockReturnValue(false);
      const component = { canDeactivate };

      const result = casesCreateCasefileChildCanDeactivateGuard(
        component,
        currentRoute,
        currentState,
        createRouterState(destination),
      );

      expect(result).toBe(true);
      expect(canDeactivate).not.toHaveBeenCalled();
    },
  );
});
