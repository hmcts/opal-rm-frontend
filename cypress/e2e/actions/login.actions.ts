import { LoginLocators as L } from '../../shared/selectors/login.locators';
import { createScopedLogger } from '../../support/utils/log.helper';
import { isLocalOrPrEnvironment } from './auth-environment.actions';

const log = createScopedLogger('LoginActions');
const DASHBOARD_PATH_PATTERN = /^\/dashboard(\/[a-z-]+)?$/;

const waitForDashboardLanding = () => {
  cy.location('pathname', { timeout: 20_000 }).should('match', DASHBOARD_PATH_PATTERN);
  cy.get(L.accountNavigationLink, { timeout: 20_000 }).should('contain.text', 'Sign out');
};

export function performLogin(email: string): void {
  const password = Cypress.env('CYPRESS_TEST_PASSWORD') || '';

  log('action', 'Logging in', { email });

  cy.session(
    email,
    () => {
      cy.visit('/');

      cy.location('href').then((href) => {
        if (isLocalOrPrEnvironment()) {
          log('navigate', 'Using the local sign-in stub', { href });
          cy.get(L.usernameInput, { timeout: 20_000 }).should('be.visible').clear().type(email, { delay: 0 });
          cy.get(L.submitBtn, { timeout: 20_000 }).click();
          waitForDashboardLanding();
          return;
        }

        log('navigate', 'Using Microsoft SSO', { href });
        cy.origin('https://login.microsoftonline.com', { args: { email, password } }, ({ email, password }) => {
          cy.get('input[type="email"]', { timeout: 12_000 }).type(email, { delay: 0 });
          cy.get('input[type="submit"]').click();
          cy.get('input[type="password"]', { timeout: 12_000 }).type(password, { log: false, delay: 0 });
          cy.get('input[type="submit"]').click();
          cy.get('#idBtn_Back', { timeout: 12_000 }).click();
        });

        waitForDashboardLanding();
      });
    },
    {
      cacheAcrossSpecs: true,
      validate() {
        cy.request({
          method: 'GET',
          url: '/sso/authenticated',
          failOnStatusCode: false,
        }).then(({ status, body }) => {
          expect(status).to.eq(200);
          expect(body).to.eq(true);
        });
      },
    },
  );

  cy.visit('/');
  waitForDashboardLanding();
}

export function assertSignOutLinkVisible(): void {
  log('assert', 'Checking the sign out link is visible');
  cy.get(L.accountNavigationLink, { timeout: 20_000 }).should('be.visible').and('contain.text', 'Sign out');
}

export function assertDashboardLandingPage(): void {
  log('assert', 'Checking the dashboard landing page');
  cy.location('pathname', { timeout: 20_000 }).should('match', DASHBOARD_PATH_PATTERN);
}

export function signOut(): void {
  log('action', 'Signing out from the header');

  cy.contains(L.accountNavigationLink, 'Sign out', { timeout: 20_000 }).click();
}

export function assertSignInPageVisible(): void {
  log('assert', 'Checking the OPAL sign-in page is shown');
  cy.location('pathname', { timeout: 20_000 }).should('eq', '/sign-in');
  cy.get(L.signInHeading, { timeout: 20_000 }).should('contain.text', 'Sign in');
  cy.get(L.usernameInput, { timeout: 20_000 }).should('be.visible');
}
