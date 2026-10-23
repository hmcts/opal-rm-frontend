import type { IOpalUserStateResponse } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import type { IOwnedDraftCasefile } from './interfaces/draft-casefile-owned.interface';
import type { IDraftCasefileFixtureOptions } from './interfaces/draft-casefile-fixture-options.interface';
import type { IDraftCasefileSnapshot } from './interfaces/draft-casefile-snapshot.interface';
import { performAuthentication } from '../../../../actions/login.actions';
import { postSyntheticDraft } from './draft-casefile-api.actions';
import { readDraftSnapshot } from './draft-casefile-evidence.actions';

/**
 * Reads current provisioned membership without granting or changing permissions.
 * @param permission Required permission in Maintenance BU 44.
 * @returns The validated result or Cypress chain consumed by the next action.
 */
export function requireMembership(permission: number): Cypress.Chainable<{ id: string; name: string }> {
  return cy
    .request<IOpalUserStateResponse>({ url: '/api/user-state', failOnStatusCode: false, log: false })
    .then(({ status, body }) => {
      expect(status, 'live permission preflight').to.equal(200);
      expect(body.status, 'live test account status').to.equal('ACTIVE');
      const unit = body.domains['maintenance']?.business_unit_users.find((value) => value.business_unit_id === 44);
      if (!unit || !unit.permissions.some((value) => value.permission_id === permission)) {
        throw new Error(`Provisioned account needs Maintenance permission ${permission} in BU 44`);
      }
      return { id: unit.business_unit_user_id, name: body.name };
    });
}

/** Resolves the configured primary consistently for fixture creation and personal baseline checks.
 * @returns The existing primary provisioned-account identity.
 */
export function primaryDraftInputter(): string {
  return String(Cypress.env('PO10626_INPUTTER_EMAIL') || 'opal-test@dev.platform.hmcts.net');
}

/**
 * Uses existing provisioned users only; the checker default is evidenced by User Service migration V1_68.
 * @param options Provisioned actor overrides and optional synthetic payload variations.
 * @returns The validated result or Cypress chain consumed by the next action.
 */
export function createOwnedSubmittedDraft(
  options: IDraftCasefileFixtureOptions = {},
): Cypress.Chainable<IOwnedDraftCasefile> {
  const primaryInputter = primaryDraftInputter();
  const inputter = options.inputter ?? primaryInputter;
  const checker =
    options.checker ?? String(Cypress.env('PO10626_CHECKER_EMAIL') || 'opal-test-10@dev.platform.hmcts.net');
  if (!inputter.trim() || !checker.trim()) throw new Error('Fixture identities must be provisioned accounts');
  let primaryInputterId: string | undefined;
  let checkerId: string;
  let inputterId: string;
  let inputterName: string;
  let checkerName: string;
  performAuthentication(checker);
  requireMembership(22).then((user) => {
    checkerId = user.id;
    checkerName = user.name;
  });
  if (inputter !== primaryInputter) {
    cy.then(() => performAuthentication(primaryInputter));
    requireMembership(21).then((user) => {
      primaryInputterId = user.id;
      expect(user.id === checkerId, 'primary inputter and checker have independent BU identities').to.equal(false);
    });
  }
  cy.then(() => performAuthentication(inputter));
  requireMembership(21).then((user) => {
    inputterId = user.id;
    inputterName = user.name;
    if (primaryInputterId !== undefined)
      expect(inputterId === primaryInputterId, 'both inputters have independent BU identities').to.equal(false);
    expect(inputterId === checkerId, 'inputter and checker have independent BU identities').to.equal(false);
  });
  return postSyntheticDraft(inputter, options).then(({ id, marker, etag }) => {
    const owned: IOwnedDraftCasefile = {
      id,
      marker,
      inputter,
      checker,
      inputterId,
      checkerId,
      inputterName,
      checkerName,
    };
    return readDraftSnapshot(id).then((snapshot) => {
      expect(snapshot.etag, 'new fixture version').to.equal(etag);
      expect(snapshot.draft.casefile_status).to.equal('SUBMITTED');
      expect(snapshot.draft.submitted_by).to.equal(inputterId);
      expect(snapshot.draft.casefile.respondent_account.remo_reference).to.equal(marker);
      expect(snapshot.draft.timeline_data).to.have.length(1);
      expect(snapshot.draft.timeline_data[0].status).to.equal('Submitted');
      return owned;
    });
  });
}

/**
 * Competing/setup calls deliberately bypass browser intercepts but still use the real authenticated API.
 * @param snapshot Saved aggregate and opaque version used by the independent request.
 * @param method HTTP mutation method to forward or observe.
 * @param body Wire data read from or sent to the real API.
 * @returns The validated result or Cypress chain consumed by the next action.
 */
export function requestDraftChange(
  snapshot: IDraftCasefileSnapshot,
  method: 'PATCH' | 'PUT',
  body: object,
): Cypress.Chainable<Cypress.Response<unknown>> {
  return cy
    .request<unknown>({
      method,
      url: `/opal-maintenance-service/draft-casefiles/${snapshot.draft.draft_casefile_id}`,
      headers: { 'If-Match': snapshot.etag },
      body,
      failOnStatusCode: false,
      retryOnNetworkFailure: false,
      retryOnStatusCodeFailure: false,
      log: false,
    })
    .then((response) => {
      expect(response.status, `real ${method} setup/competing mutation`).to.equal(200);
      return response;
    });
}

/**
 * Creates a real rejected prerequisite, then restores its inputter session.
 * @param owned Identity and exact run marker of the owned case.
 */
export function rejectOwnedDraft(owned: IOwnedDraftCasefile): void {
  performAuthentication(owned.checker);
  readDraftSnapshot(owned.id).then((snapshot) =>
    requestDraftChange(snapshot, 'PATCH', {
      business_unit_id: snapshot.draft.business_unit_id,
      casefile_status: 'REJECTED',
      status_message: 'Synthetic correction requested',
    }),
  );
  cy.then(() => performAuthentication(owned.inputter));
}
