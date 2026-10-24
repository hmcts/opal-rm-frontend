import { performAuthentication } from '../../../../actions/login.actions';
import { postSyntheticDraft } from './draft-casefile-api.actions';
import { readDraftSnapshot, versionValue } from './draft-casefile-evidence.actions';
import {
  createOwnedSubmittedDraft,
  rejectOwnedDraft,
  requestDraftChange,
  requireMembership,
} from './draft-casefile-fixture.actions';
import { InputterMonitoringFixtureActions } from './inputter-monitoring-fixture.actions';
import type { IOwnedDraftCasefile } from './interfaces/draft-casefile-owned.interface';

/** Real owned prerequisites for checker decisions; existing receipt teardown owns every observed creation. */
export class CheckerReviewFixtureActions {
  /** Operator preflight guard only; the switch itself does not establish cleanup compatibility. */
  public requireLifecycleCleanup(): void {
    if (Cypress.env('PO10625_LIFECYCLE_CLEANUP_VERIFIED') !== true) {
      throw new Error(
        'PO10625_LIFECYCLE_CLEANUP_VERIFIED must be boolean true after external lifecycle cleanup preflight',
      );
    }
  }

  /**
   * Creates Submitted normally, then uses a real rejection and fresh-version amendment when required.
   * @param status Persisted prerequisite for the checker journey.
   * @param publication Includes two minor creditors after the existing publication safety preflight.
   * @returns The created identity after authoritative lifecycle, ownership and version checks.
   */
  public create(status: 'SUBMITTED' | 'RESUBMITTED', publication = false): Cypress.Chainable<IOwnedDraftCasefile> {
    if (status === 'RESUBMITTED') this.requireLifecycleCleanup();
    if (publication) new InputterMonitoringFixtureActions().requirePublication();
    return createOwnedSubmittedDraft(publication ? { minorCreditorCount: 2 } : {}).then((owned) => {
      if (status === 'SUBMITTED') return cy.wrap(owned, { log: false });
      rejectOwnedDraft(owned);
      return readDraftSnapshot(owned.id).then((snapshot) => {
        expect(snapshot.draft.casefile_status, 'rejected resubmission prerequisite').to.equal('REJECTED');
        expect(snapshot.draft.submitted_by, 'same owned inputter').to.equal(owned.inputterId);
        expect(snapshot.draft.casefile.respondent_account.remo_reference, 'same owned marker').to.equal(owned.marker);
        this.requireLifecycleCleanup();
        return requestDraftChange(snapshot, 'PUT', {
          business_unit_id: snapshot.draft.business_unit_id,
          casefile: structuredClone(snapshot.draft.casefile),
        })
          .then(() => readDraftSnapshot(owned.id))
          .then((saved) => {
            expect(saved.draft.casefile_status, 'resubmitted fixture lifecycle').to.equal('RESUBMITTED');
            expect(saved.draft.submitted_by, 'same owned inputter').to.equal(owned.inputterId);
            expect(saved.draft.casefile.respondent_account.remo_reference, 'same owned marker').to.equal(owned.marker);
            expect(versionValue(saved.etag) > versionValue(snapshot.etag), 'fresh resubmission version').to.equal(true);
            expect(
              saved.draft.timeline_data.map((event) => event.status).sort(),
              'real resubmission lifecycle events',
            ).to.deep.equal(['Rejected', 'Resubmitted', 'Submitted']);
            return owned;
          });
      });
    });
  }

  /**
   * Uses one existing dual-role checker solely for the self-review decision-denial case.
   * @returns A normal Submitted creation owned by that same exact permission-21/22 BU identity.
   */
  public createSelfOwned(): Cypress.Chainable<IOwnedDraftCasefile> {
    const checker = String(Cypress.env('PO10626_CHECKER_EMAIL') || 'opal-test-10@dev.platform.hmcts.net');
    let inputterId: string;
    let inputterName: string;
    performAuthentication(checker);
    requireMembership(21).then((user) => {
      inputterId = user.id;
      inputterName = user.name;
    });
    requireMembership(22).then((user) => {
      expect(user.id, 'same dual-role BU identity').to.equal(inputterId);
    });
    return postSyntheticDraft(checker).then(({ id, marker, etag }) => {
      const owned: IOwnedDraftCasefile = {
        id,
        marker,
        inputter: checker,
        checker,
        inputterId,
        checkerId: inputterId,
        inputterName,
        checkerName: inputterName,
      };
      return readDraftSnapshot(id).then((snapshot) => {
        expect(snapshot.etag, 'new self-owned fixture version').to.equal(etag);
        expect(snapshot.draft.casefile_status, 'self-owned Submitted fixture').to.equal('SUBMITTED');
        expect(snapshot.draft.submitted_by, 'same self-owned inputter').to.equal(inputterId);
        expect(snapshot.draft.casefile.respondent_account.remo_reference, 'same self-owned marker').to.equal(marker);
        expect(
          snapshot.draft.timeline_data.map((event) => event.status),
          'real self-owned submission event',
        ).to.deep.equal(['Submitted']);
        return owned;
      });
    });
  }
}
