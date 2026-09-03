import { CanDeactivateFn } from '@angular/router';
import { canDeactivateGuard } from '@hmcts/opal-frontend-common/guards/can-deactivate';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../constants/cases-create-casefile-routing-paths.constant';

const createCasefileRootUrl = '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root;
// The shared base marks this runtime route contract protected, while the shared guard types it as public.
const childCanDeactivateGuard = canDeactivateGuard as unknown as CanDeactivateFn<unknown>;

export const casesCreateCasefileChildCanDeactivateGuard: CanDeactivateFn<unknown> = (
  component,
  currentRoute,
  currentState,
  nextState,
) => {
  const [destinationPath] = nextState.url.split(/[?#]/, 1);
  const destinationIsWithinCreateCasefile = (destinationPath + '/').startsWith(createCasefileRootUrl + '/');

  return destinationIsWithinCreateCasefile
    ? childCanDeactivateGuard(component, currentRoute, currentState, nextState)
    : true;
};
