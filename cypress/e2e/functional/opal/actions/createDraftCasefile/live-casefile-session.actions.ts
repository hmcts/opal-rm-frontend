import { performAuthentication, assertDashboardLandingPage } from '../../../../actions/login.actions';
import { isLocalOrPrEnvironment } from '../../../../actions/auth-environment.actions';
import type { IOpalUserStateResponse } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';

/** Authenticates configured live users and verifies their permission prerequisites. */
export class LiveCasefileSessionActions {
  /**
   * Requires a provisioned live account whose BU 44 create permission matches the requested role.
   * @param role Expected BU 44 create permission for the configured account.
   */
  public authenticate(role: 'authorised' | 'denied'): void {
    const emailKey = role === 'authorised' ? 'CYPRESS_TEST_EMAIL' : 'RM_DENIED_USER_EMAIL';
    const passwordKey = role === 'authorised' ? 'CYPRESS_TEST_PASSWORD' : 'RM_DENIED_USER_PASSWORD';
    const email = String(Cypress.env(emailKey) ?? '').trim();
    const password = String(Cypress.env(passwordKey) ?? '');
    expect(email.length > 0, `Missing configured ${role} RM account`).to.equal(true);
    if (!isLocalOrPrEnvironment()) {
      expect(password.length > 0, `Missing configured ${role} RM password`).to.equal(true);
    }
    if (role === 'denied') {
      const authorisedEmail = String(Cypress.env('CYPRESS_TEST_EMAIL') ?? '').trim();
      expect(email !== authorisedEmail, 'Denied and authorised accounts must differ').to.equal(true);
    }
    performAuthentication(email, password, `rm-casefile-${role}`);
    cy.request<IOpalUserStateResponse>({ url: '/api/user-state', log: false }).then(({ body }) => {
      expect(body.status, 'Provisioned RM account must be ACTIVE').to.equal('ACTIVE');
      const maintenance = body.domains['maintenance'];
      expect(Boolean(maintenance), 'Maintenance domain must be provisioned').to.equal(true);
      if (!maintenance) throw new Error('Maintenance domain is missing');
      const allowed = maintenance.business_unit_users.some(
        (unit) =>
          unit.business_unit_id === 44 && unit.permissions.some((permission) => permission.permission_id === 21),
      );
      expect(allowed, `${role} account permission 21 for RM BU 44`).to.equal(role === 'authorised');
    });
    if (role === 'authorised') assertDashboardLandingPage();
  }
}
