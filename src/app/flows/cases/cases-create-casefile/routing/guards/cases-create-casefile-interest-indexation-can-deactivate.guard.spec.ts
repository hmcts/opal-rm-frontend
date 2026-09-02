import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CasesCreateCasefileInterestIndexationComponent } from '../../cases-create-casefile-interest-indexation/cases-create-casefile-interest-indexation.component';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../constants/cases-create-casefile-routing-paths.constant';
import { casesCreateCasefileInterestIndexationCanDeactivateGuard } from './cases-create-casefile-interest-indexation-can-deactivate.guard';

const createRouterState = (url: string): RouterStateSnapshot => ({ url }) as RouterStateSnapshot;

describe('casesCreateCasefileInterestIndexationCanDeactivateGuard', () => {
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

  it('delegates Create Casefile destinations to the child component guard contract', () => {
    const canDeactivate = vi.fn().mockReturnValue(false);
    const component = { canDeactivate } as unknown as CasesCreateCasefileInterestIndexationComponent;
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const nextState = createRouterState(
      '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList,
    );

    const result = casesCreateCasefileInterestIndexationCanDeactivateGuard(
      component,
      currentRoute,
      currentState,
      nextState,
    );

    expect(result).toBe(false);
    expect(canDeactivate).toHaveBeenCalledOnce();
    expect(confirm).toHaveBeenCalledOnce();
  });

  it('allows external destinations through without consulting the child component', () => {
    const canDeactivate = vi.fn().mockReturnValue(false);
    const component = { canDeactivate } as unknown as CasesCreateCasefileInterestIndexationComponent;

    const result = casesCreateCasefileInterestIndexationCanDeactivateGuard(
      component,
      currentRoute,
      currentState,
      createRouterState('/dashboard'),
    );

    expect(result).toBe(true);
    expect(canDeactivate).not.toHaveBeenCalled();
  });
});
