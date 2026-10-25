import type { IOpalUserStateResponse } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import { performAuthentication } from '../../../../actions/login.actions';
import {
  configureDraftCasefileCleanup,
  persistDraftCasefileCleanupReceipts,
} from '../../../../../support/draftCasefiles';
import { CheckerReviewFixtureActions } from './checker-review-fixture.actions';
import { readDraftSnapshot } from './draft-casefile-evidence.actions';
import { createOwnedSubmittedDraft, rejectOwnedDraft, requireMembership } from './draft-casefile-fixture.actions';
import type {
  IRejectedCasefileActor,
  IRejectedCasefileContext,
} from './interfaces/rejected-casefile-context.interface';
import type { IDraftCasefileSnapshot } from './interfaces/draft-casefile-snapshot.interface';

/** Real rejected fixtures; immutable creation ownership and observed cleanup authority remain separate. */
export class RejectedCasefileFixtureActions {
  /** Guards before creation and every lifecycle dispatch.
   * @param transfer Whether another inputter can become latest submitter.
   */
  public requireCleanup(transfer: boolean): void {
    new CheckerReviewFixtureActions().requireLifecycleCleanup();
    if (transfer && Cypress.env('PO10623_TRANSFER_CLEANUP_VERIFIED') !== true)
      throw new Error(
        'PO10623_TRANSFER_CLEANUP_VERIFIED must be boolean true after external ownership-transfer cleanup preflight',
      );
  }

  /** Creates rich normal Submitted data, rejects independently and reads a fresh Rejected baseline.
   * @param transfer Select independent checker B as the actual amender.
   * @returns Owned creator A, complete baseline A and actual authenticated amender.
   */
  public prepare(transfer: boolean): Cypress.Chainable<IRejectedCasefileContext> {
    this.requireCleanup(transfer);
    if (transfer) {
      const checker = String(Cypress.env('PO10626_CHECKER_EMAIL') || 'opal-test-10@dev.platform.hmcts.net');
      performAuthentication(checker);
      requireMembership(21).then((inputter) =>
        requireMembership(22).then((reviewer) => {
          expect(inputter.id, 'same B21 and B22 identity before creation').to.equal(reviewer.id);
        }),
      );
    }
    return cy
      .then(() => {
        this.requireCleanup(transfer);
        return createOwnedSubmittedDraft({ minorCreditorCount: 2, uniqueNames: true });
      })
      .then((owned) => {
        cy.then(() => this.requireCleanup(transfer));
        cy.then(() => rejectOwnedDraft(owned));
        return readDraftSnapshot(owned.id).then((before) => {
          expect(before.draft.casefile_status, 'real rejected prerequisite').to.equal('REJECTED');
          expect(before.draft.draft_casefile_id, 'same owned ID').to.equal(owned.id);
          expect(before.draft.business_unit_id, 'owning BU').to.equal(44);
          expect(before.draft.submitted_by, 'immutable original inputter').to.equal(owned.inputterId);
          expect(before.draft.casefile.respondent_account.remo_reference, 'exact original marker').to.equal(
            owned.marker,
          );
          expect(
            before.draft.timeline_data.map((event) => event.status),
            'complete Submitted and Rejected history',
          ).to.deep.equal(['Submitted', 'Rejected']);
          expect(before.draft.timeline_data[0].username, 'original submission actor').to.equal(owned.inputterName);
          expect(before.draft.timeline_data[1].username, 'independent rejecting actor').to.equal(owned.checkerName);
          expect(before.draft.timeline_data[1].reason_text, 'real exact rejection reason').to.equal(
            'Synthetic correction requested',
          );
          const amender = transfer
            ? { email: owned.checker, id: owned.checkerId, name: owned.checkerName }
            : { email: owned.inputter, id: owned.inputterId, name: owned.inputterName };
          if (transfer) performAuthentication(amender.email);
          return cy.wrap({ owned, before, amender }, { log: false });
        });
      });
  }

  /** Validates a configured ACTIVE foreign-BU inputter without granting any role.
   * @returns The actual non-owning BU identity; caller must restore authorised session after denial.
   */
  public foreignActor(): Cypress.Chainable<IRejectedCasefileActor> {
    const configured: unknown = Cypress.env('PO10623_FOREIGN_BU_INPUTTER_EMAIL');
    if (typeof configured !== 'string' || !configured.trim())
      throw new Error('PO10623_FOREIGN_BU_INPUTTER_EMAIL must identify an existing foreign-BU inputter');
    const email = configured.trim();
    performAuthentication(email);
    return cy
      .request<IOpalUserStateResponse>({ url: '/api/user-state', failOnStatusCode: false, log: false })
      .then(({ status, body }) => {
        expect(status, 'foreign actor user-state preflight').to.equal(200);
        expect(body.status, 'foreign actor ACTIVE').to.equal('ACTIVE');
        const units = body.domains['maintenance']?.business_unit_users ?? [];
        expect(
          units.some(
            (unit) =>
              unit.business_unit_id === 44 && unit.permissions.some((permission) => permission.permission_id === 21),
          ),
          'foreign actor has no owning BU permission 21',
        ).to.equal(false);
        const foreign = units.find(
          (unit) =>
            unit.business_unit_id !== 44 && unit.permissions.some((permission) => permission.permission_id === 21),
        );
        if (!foreign?.business_unit_user_id || !body.name)
          throw new Error('Foreign actor needs permission 21 in another Maintenance BU');
        return { email, id: foreign.business_unit_user_id, name: body.name };
      });
  }

  /** Records only an independently observed latest submitter against the original creation receipt.
   * @param context Immutable owned creation and known A/B identities.
   * @param saved Actual authoritative GET after the attempted transition.
   * @returns Persisted maintained required-cleanup receipt.
   */
  public recordCleanupActor(
    context: IRejectedCasefileContext,
    saved: IDraftCasefileSnapshot,
  ): Cypress.Chainable<unknown> {
    this.requireCleanup(false);
    const { owned } = context;
    expect(saved.draft.draft_casefile_id, 'cleanup observed original ID').to.equal(owned.id);
    expect(saved.draft.business_unit_id, 'cleanup observed original BU').to.equal(
      context.before.draft.business_unit_id,
    );
    expect(saved.draft.business_unit_id, 'cleanup owning BU').to.equal(44);
    expect(saved.draft.casefile.respondent_account.remo_reference, 'cleanup exact observed marker').to.equal(
      owned.marker,
    );
    let actor: string;
    if (saved.draft.submitted_by === owned.inputterId && saved.draft.submitted_by_name === owned.inputterName)
      actor = owned.inputter;
    else if (saved.draft.submitted_by === owned.checkerId && saved.draft.submitted_by_name === owned.checkerName) {
      expect(owned.checkerId === owned.inputterId, 'independent transfer identity').to.equal(false);
      this.requireCleanup(true);
      actor = owned.checker;
    } else throw new Error('Observed cleanup submitter is not an exact known A or B identity');
    configureDraftCasefileCleanup(owned.id, owned.marker, { actor, policy: 'required' });
    return persistDraftCasefileCleanupReceipts().then<unknown>((receipts) => receipts);
  }
}
