import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import {
  assertDashboardLandingPage,
  assertSignInPageVisible,
  assertSignOutLinkVisible,
  performLogin,
  signOut,
} from '../../e2e/actions/login.actions';
import { log } from '../utils/log.helper';

Given('I am logged in with email {string}', (email: string) => {
  log('step', 'Logging in via Cypress auth flow', { email });
  performLogin(email);
});

Then('The sign out link should be visible', () => {
  log('step', 'Verifying the sign out link');
  assertSignOutLinkVisible();
});

Then('I should be on the dashboard landing page', () => {
  log('step', 'Verifying the dashboard landing page');
  assertDashboardLandingPage();
});

When('I sign out from the header', () => {
  log('step', 'Signing out from the header');
  signOut();
});

Then('I am returned to the OPAL sign-in page', () => {
  log('step', 'Verifying the sign-in page');
  assertSignInPageVisible();
});
