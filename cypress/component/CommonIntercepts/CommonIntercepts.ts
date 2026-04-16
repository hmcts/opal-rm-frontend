import { IOpalUserState } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';

export function interceptAuthenticatedUser(authenticated = true) {
  return cy
    .intercept('GET', '/sso/authenticated', {
      statusCode: authenticated ? 200 : 401,
      body: authenticated ? { authenticated: true } : false,
    })
    .as('getAuthenticatedUser');
}

export function interceptUserState(userState: IOpalUserState) {
  return cy
    .intercept('GET', '**/users/**/state', {
      statusCode: 200,
      body: userState,
    })
    .as('getUserState');
}
