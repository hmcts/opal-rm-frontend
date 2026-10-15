import { assertDashboardLandingPage } from '../../../../actions/login.actions';
import type { IOpalUserStateResponse } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';

/** Verifies live prerequisites for the currently authenticated casefile user. */
export class CasefilePermissionPreflightActions {
  /**
   * Requires ACTIVE Maintenance membership and checks BU 44 permission 21.
   * @param expectedAllowed Whether the signed-in user must have create-casefile permission.
   */
  public assertPermission(expectedAllowed: boolean): void {
    cy.request<IOpalUserStateResponse>({ url: '/api/user-state', log: false }).then(({ body }) => {
      expect(body.status === 'ACTIVE', 'Provisioned RM account must be ACTIVE').to.equal(true);
      const maintenance = body.domains['maintenance'];
      expect(Boolean(maintenance), 'Maintenance domain must be provisioned').to.equal(true);
      if (!maintenance) throw new Error('Maintenance domain is missing');
      const allowed = maintenance.business_unit_users.some(
        (unit) =>
          unit.business_unit_id === 44 && unit.permissions.some((permission) => permission.permission_id === 21),
      );
      expect(allowed, 'Signed-in account permission 21 for RM BU 44').to.equal(expectedAllowed);
    });
    if (expectedAllowed) assertDashboardLandingPage();
  }
}
