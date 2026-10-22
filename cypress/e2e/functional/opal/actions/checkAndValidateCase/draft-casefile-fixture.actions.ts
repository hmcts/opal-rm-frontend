import type { Interception } from 'cypress/types/net-stubbing';
import type { IOpalUserStateResponse } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import type { IOwnedDraftCasefile } from './interfaces/draft-casefile-owned.interface';
import type { IDraftCasefileSnapshot } from './interfaces/draft-casefile-snapshot.interface';
import { CheckCaseDetailsFlow } from '../../flows/createDraftCasefile/check-case-details.flow';
import { performAuthentication } from '../../../../actions/login.actions';
import {
  configureDraftCasefileCleanup,
  persistDraftCasefileCleanupReceipts,
} from '../../../../../support/draftCasefiles';
import { readDraftSnapshot } from './draft-casefile-evidence.actions';

/**
 * Reads current provisioned membership without granting or changing permissions.
 * @param permission Required permission in Maintenance BU 44.
 * @returns The validated result or Cypress chain consumed by the next action.
 */
function requireMembership(permission: number): Cypress.Chainable<{ id: string; name: string }> {
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

/**
 * Uses existing provisioned users only; the checker default is evidenced by User Service migration V1_68.
 * @returns The validated result or Cypress chain consumed by the next action.
 */
export function createOwnedSubmittedDraft(): Cypress.Chainable<IOwnedDraftCasefile> {
  const inputter = String(Cypress.env('PO10626_INPUTTER_EMAIL') || 'opal-test@dev.platform.hmcts.net');
  const checker = String(Cypress.env('PO10626_CHECKER_EMAIL') || 'opal-test-10@dev.platform.hmcts.net');
  let checkerId: string;
  let inputterId: string;
  let inputterName: string;
  let checkerName: string;
  performAuthentication(checker);
  requireMembership(22).then((user) => {
    checkerId = user.id;
    checkerName = user.name;
  });
  cy.then(() => performAuthentication(inputter));
  requireMembership(21).then((user) => {
    inputterId = user.id;
    inputterName = user.name;
    expect(inputterId === checkerId, 'inputter and checker have independent BU identities').to.equal(false);
  });
  const creation = new CheckCaseDetailsFlow();
  creation.openLive();
  creation.submitLive();
  return cy.get<Interception>('@draftSubmission').then((call) => {
    expect(call.response?.statusCode, 'real fixture creation').to.equal(201);
    const id: unknown = call.response?.body?.draft_casefile_id;
    const marker: unknown = call.request.body?.casefile?.respondent_account?.remo_reference;
    if (
      typeof id !== 'number' ||
      !Number.isSafeInteger(id) ||
      id < 1 ||
      typeof marker !== 'string' ||
      !/^E2E-[0-9a-f]{16}$/.test(marker)
    ) {
      throw new Error('Live fixture did not return an owned ID and exact run marker');
    }
    configureDraftCasefileCleanup(id, marker, {
      actor: inputter,
      policy: Cypress.env('PO10626_DEFER_CLEANUP') === true ? 'deferred' : 'required',
    });
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
    return persistDraftCasefileCleanupReceipts().then(() => owned);
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
