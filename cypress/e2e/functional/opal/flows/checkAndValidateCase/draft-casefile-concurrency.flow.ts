import { performAuthentication } from '../../../../actions/login.actions';
import {
  createOwnedSubmittedDraft,
  rejectOwnedDraft,
  requestDraftChange,
} from '../../actions/checkAndValidateCase/draft-casefile-fixture.actions';
import { armDraftCasefileMutation } from '../../actions/checkAndValidateCase/draft-casefile-transport.actions';
import {
  readDraftSnapshot,
  assertUnchangedDraft,
  versionValue,
} from '../../actions/checkAndValidateCase/draft-casefile-evidence.actions';
import { DraftCasefileRecoveryActions } from '../../actions/checkAndValidateCase/draft-casefile-recovery.actions';
import { accessibilityActions } from '../../actions/accessibility/accessibility.actions';
import type { DraftCasefileJourney } from '../../actions/checkAndValidateCase/types/draft-casefile-journey.type';
import type { DraftCasefileFault } from '../../actions/checkAndValidateCase/types/draft-casefile-fault.type';
import type { IOwnedDraftCasefile } from '../../actions/checkAndValidateCase/interfaces/draft-casefile-owned.interface';
import type { IDraftCasefileSnapshot } from '../../actions/checkAndValidateCase/interfaces/draft-casefile-snapshot.interface';
import type { IDraftCasefileMonitor } from '../../actions/checkAndValidateCase/interfaces/draft-casefile-monitor.interface';

/** Each prepare call creates its own mutable context; no case or acceptance evidence is shared between examples. */
export class DraftCasefileConcurrencyFlow {
  private readonly ui = new DraftCasefileRecoveryActions();
  private journey: DraftCasefileJourney = 'reject';
  private fault: DraftCasefileFault = 'none';
  private owned?: IOwnedDraftCasefile;
  private before?: IDraftCasefileSnapshot;
  private winner?: IDraftCasefileSnapshot;
  private monitor?: IDraftCasefileMonitor;
  private correction = 'Corrected synthetic';
  private retried = false;
  private recovered = false;

  /**
   * Requires this example to have completed independent live setup.
   * @returns The validated result or Cypress chain consumed by the next action.
   */
  private context(): { owned: IOwnedDraftCasefile; before: IDraftCasefileSnapshot; monitor: IDraftCasefileMonitor } {
    if (!this.owned || !this.before || !this.monitor)
      throw new Error('Concurrency scenario has not completed its live setup');
    return { owned: this.owned, before: this.before, monitor: this.monitor };
  }

  /**
   * Creates a fresh owned case and hydrates the appropriate actor journey.
   * @param value Explicit synthetic correction or validated journey value.
   */
  public prepare(value: string): void {
    if (!['approve', 'reject', 'delete', 'resubmit'].includes(value))
      throw new Error('Unsupported concurrency journey');
    this.journey = value as DraftCasefileJourney;
    this.fault = 'none';
    this.owned = undefined;
    this.before = undefined;
    this.winner = undefined;
    this.monitor = undefined;
    this.correction = 'Corrected synthetic';
    this.retried = false;
    this.recovered = false;
    createOwnedSubmittedDraft().then((owned) => {
      this.owned = owned;
      if (this.journey === 'resubmit') rejectOwnedDraft(owned);
      if (this.journey !== 'resubmit') cy.then(() => performAuthentication(owned.checker));
      readDraftSnapshot(owned.id).then((snapshot) => {
        expect(snapshot.draft.casefile_status).to.equal(this.journey === 'resubmit' ? 'REJECTED' : 'SUBMITTED');
        expect(snapshot.draft.submitted_by).to.equal(owned.inputterId);
        this.before = snapshot;
      });
      this.ui.open(owned.id, this.journey);
      if (this.journey === 'resubmit' || this.journey === 'delete') {
        this.ui.captureOriginalReview();
        if (this.journey === 'resubmit') this.ui.correctRespondent(this.correction);
      }
      this.ui.choose(this.journey);
      this.ui.capture(this.journey);
    });
  }

  /**
   * Installs the method-and-resource-scoped transport monitor before dispatch.
   * @param fault One-shot fault or conflict selected for this example.
   */
  public inject(fault: string): void {
    if (!['lost-response', 'definite-failure', 'conflict', 'none'].includes(fault))
      throw new Error('Unsupported mutation fault');
    if (!this.owned) throw new Error('Owned fixture is missing');
    this.fault = fault as DraftCasefileFault;
    this.monitor = armDraftCasefileMutation(this.owned.id, this.journey === 'resubmit' ? 'PUT' : 'PATCH', this.fault);
  }

  /**
   * Submits the chosen change through the UI and observes its HTTP boundary.
   */
  public submit(): void {
    this.ui.submit(this.journey);
    this.waitForMutation();
    cy.then(() => {
      const { owned, monitor } = this.context();
      cy.writeFile(
        `functional-output/po10626/mutation-${owned.marker}-${owned.id}.json`,
        { id: owned.id, testRunReference: owned.marker, journey: this.journey, fault: this.fault, ...monitor },
        { log: false },
      );
    });
  }

  /**
   * Distinguishes a dropped browser response from definite HTTP failures.
   */
  private waitForMutation(): void {
    cy.wait('@draftMutation').then((call) => {
      if (this.fault === 'lost-response' && !this.retried) {
        expect(call.response?.statusCode, 'wire response proves the real commit before Fetch delivery loss').to.equal(
          200,
        );
        cy.wrap(this.monitor, { log: false }).its('droppedResponses').should('equal', 1);
        cy.then(() =>
          expect(this.monitor?.applicationAttempts, 'one application dispatch before recovery').to.equal(1),
        );
      } else {
        let expected = 200;
        if (!this.retried && this.fault === 'definite-failure') expected = 400;
        if (!this.retried && this.fault === 'conflict') expected = 409;
        expect(call.response?.statusCode, 'observed browser mutation response').to.equal(expected);
      }
    });
  }

  /**
   * Requires a real upstream commit response, browser failure and retained review.
   */
  public assertUncertain(): void {
    this.ui.assertFailure(this.journey);
    this.ui.assertReloadRequired(this.journey);
    cy.then(() => {
      const { before, monitor } = this.context();
      expect(monitor.attempts).to.equal(1);
      expect(monitor.upstreamSuccesses).to.equal(1);
      expect(monitor.droppedResponses).to.equal(1);
      expect(monitor.requestVersions[0]).to.equal(before.etag);
    });
  }

  /**
   * Proves pre-dispatch rejection left persisted state unchanged.
   */
  public assertDefiniteFailure(): void {
    this.ui.assertFailure(this.journey);
    const { owned, before, monitor } = this.context();
    readDraftSnapshot(owned.id).then((current) => {
      assertUnchangedDraft(before, current);
      expect(monitor.attempts).to.equal(1);
      expect(monitor.interceptedFailures).to.equal(1);
      expect(monitor.upstreamSuccesses).to.equal(0);
    });
  }

  /**
   * Corrects the retained draft and sends exactly one user-requested retry.
   * @param keyboard Whether to use native keyboard activation instead of a pointer click.
   */
  public retryExplicitly(keyboard = false): void {
    this.retried = true;
    if (this.journey === 'resubmit') {
      this.correction = 'Retried synthetic';
      this.ui.correctRespondent(this.correction);
    } else this.ui.reviseReason();
    this.ui.capture(this.journey);
    this.ui.submit(this.journey, keyboard);
    this.waitForMutation();
  }

  /**
   * Advances the saved record through a real independent API request while the UI retains its old version.
   */
  public compete(): void {
    this.inject('conflict');
    const { owned, before } = this.context();
    const body =
      this.journey === 'resubmit'
        ? {
            business_unit_id: before.draft.business_unit_id,
            casefile: structuredClone(before.draft.casefile),
          }
        : {
            business_unit_id: before.draft.business_unit_id,
            casefile_status: 'REJECTED',
            status_message: 'Synthetic winning concurrent decision',
          };
    requestDraftChange(before, this.journey === 'resubmit' ? 'PUT' : 'PATCH', body);
    readDraftSnapshot(owned.id).then((winner) => {
      expect(
        versionValue(winner.etag) > versionValue(before.etag),
        'competitor advanced the persisted version',
      ).to.equal(true);
      this.winner = winner;
    });
  }

  /**
   * Proves the stale browser request cannot overwrite the authoritative winner.
   */
  public assertConflict(): void {
    this.ui.assertSafeConflict();
    const { owned, before, monitor } = this.context();
    readDraftSnapshot(owned.id).then((current) => {
      if (!this.winner) throw new Error('Competing mutation has no authoritative result');
      assertUnchangedDraft(this.winner, current);
      expect(monitor.requestVersions).to.deep.equal([before.etag]);
      expect(monitor.lastStatus).to.equal(409);
    });
  }

  /**
   * Completes the supported reload/return journey without submitting another mutation.
   * @param keyboard Whether to use native keyboard activation instead of a pointer click.
   */
  public recover(keyboard = false): void {
    const { owned } = this.context();
    if (this.fault === 'conflict') this.ui.recoverConflict(owned.id, this.journey, keyboard);
    else this.ui.recover(owned.id, this.journey, keyboard || this.journey === 'delete');
    this.recovered = true;
    if (this.journey === 'delete') accessibilityActions.checkAccessibilityOnly();
  }

  /**
   * Reports differing field paths only; never include values or aggregate snapshots in failure output.
   * @param expected Complete aggregate expected after the explicit correction.
   * @param actual Saved aggregate returned by the authoritative API.
   * @param path Current field path without any values.
   * @returns Only the paths whose values differ.
   */
  private changedFields(expected: unknown, actual: unknown, path = 'casefile'): string[] {
    if (Cypress._.isEqual(expected, actual)) return [];
    if (typeof expected !== 'object' || !expected || typeof actual !== 'object' || !actual) return [path];
    const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
    return [...keys].flatMap((key) =>
      this.changedFields(Reflect.get(expected, key), Reflect.get(actual, key), `${path}.${key}`),
    );
  }

  /**
   * Checks the saved aggregate, complete timeline delta, actor and original identifier.
   * @param value Explicit synthetic correction or validated journey value.
   */
  public assertCommitted(value: string): void {
    if (value !== this.journey) throw new Error('Asserted journey does not match its owned setup');
    const { owned, before, monitor } = this.context();
    readDraftSnapshot(owned.id).then((current) => {
      const expectedEvent = { approve: 'Approved', reject: 'Rejected', delete: 'Deleted', resubmit: 'Resubmitted' }[
        this.journey
      ];
      // The consumer and lifecycle cleanup are delivered on the support branch.
      // Keep approval pending until a real recovery/cleanup run and its separate
      // producer/broker evidence are verified; this GET proves persisted state only.
      const statuses =
        this.journey === 'approve'
          ? ['PUBLISHING_PENDING', 'PUBLISHED', 'PUBLISHING_FAILED']
          : [expectedEvent.toUpperCase()];
      expect(statuses).to.include(current.draft.casefile_status);
      expect(current.draft.draft_casefile_id).to.equal(owned.id);
      expect(current.draft.created_date).to.equal(before.draft.created_date);
      expect(current.draft.business_unit_id).to.equal(before.draft.business_unit_id);
      expect(versionValue(current.etag) > versionValue(before.etag), 'version advanced').to.equal(true);
      const prefix = current.draft.timeline_data.slice(0, before.draft.timeline_data.length);
      expect(Cypress._.isEqual(prefix, before.draft.timeline_data), 'complete prior timeline retained').to.equal(true);
      expect(current.draft.timeline_data).to.have.length(before.draft.timeline_data.length + 1);
      const event = current.draft.timeline_data[before.draft.timeline_data.length];
      expect(event.status).to.equal(expectedEvent);
      expect(event.username).to.equal(this.journey === 'resubmit' ? owned.inputterName : owned.checkerName);
      if (this.journey === 'resubmit') {
        expect(current.draft.submitted_by).to.equal(owned.inputterId);
        expect(current.draft.submitted_by_name).to.equal(owned.inputterName);
        const expected = structuredClone(before.draft.casefile);
        const individual = expected.respondent_account.respondent.party_details.individual_details;
        if (!individual) throw new Error('Synthetic recovery fixture requires an individual respondent');
        individual.forenames = this.correction;
        expect(
          Cypress._.isEqual(current.draft.casefile, expected),
          `complete corrected aggregate saved; differing fields: ${this.changedFields(expected, current.draft.casefile).join(', ')}`,
        ).to.equal(true);
        expect(current.draft.casefile.respondent_account.remo_reference).to.equal(owned.marker);
        expect(String(Cypress._.get(current.draft.casefile_snapshot, 'respondent_account.respondent_name'))).to.contain(
          this.correction,
        );
      } else {
        expect(
          Cypress._.isEqual(current.draft.casefile, before.draft.casefile),
          'checker decision preserves casefile',
        ).to.equal(true);
        if (this.journey !== 'approve') {
          expect(event.reason_text).to.equal(this.ui.expectedReason());
          expect(
            Cypress._.isEqual(current.draft.casefile_snapshot, before.draft.casefile_snapshot),
            'decision snapshot unchanged',
          ).to.equal(true);
        }
      }
      if (this.retried) this.ui.assertRetrySuccess(this.journey, current);
      else if (this.recovered)
        this.ui.assertSavedPresentation(current, this.journey === 'delete', this.journey === 'resubmit');
      cy.then(() => {
        expect(monitor.attempts).to.equal(this.retried ? 2 : 1);
        expect(monitor.upstreamSuccesses).to.equal(1);
      });
    });
  }

  /**
   * Reads back the winning state after UI recovery and checks no replay occurred.
   */
  public assertWinner(): void {
    const { owned } = this.context();
    readDraftSnapshot(owned.id).then((current) => {
      if (!this.winner) throw new Error('Winning outcome is missing');
      assertUnchangedDraft(this.winner, current);
      this.ui.assertSavedPresentation(
        current,
        this.journey === 'resubmit' || this.journey === 'delete',
        this.journey === 'resubmit',
      );
    });
    this.assertFinalState();
  }

  /**
   * Checks all mutation attempts after recovery has settled.
   */
  public assertFinalState(): void {
    cy.then(() => {
      const { monitor } = this.context();
      expect(monitor.applicationAttempts, 'all application dispatches through completed recovery').to.equal(
        this.retried ? 2 : 1,
      );
      expect(monitor.attempts, 'all browser mutation attempts through completed recovery').to.equal(
        this.retried ? 2 : 1,
      );
      if (!this.retried) expect(this.recovered, 'the UI recovery boundary completed').to.equal(true);
    });
  }

  /**
   * Selects a transport fault or a real competing mutation for an accessibility example.
   * @param fault One-shot fault or conflict selected for this example.
   */
  public prepareRecovery(fault: string): void {
    if (fault === 'conflict') this.compete();
    else this.inject(fault);
  }

  /**
   * Checks the outcome-specific retained state before scanning its recovery page.
   */
  public assertRecovery(): void {
    if (this.fault === 'lost-response') this.assertUncertain();
    else if (this.fault === 'definite-failure') this.assertDefiniteFailure();
    else this.assertConflict();
  }

  /**
   * Uses native keyboard activation for explicit retry or authoritative reload.
   */
  public recoverUsingKeyboard(): void {
    if (this.fault === 'definite-failure') this.retryExplicitly(true);
    else this.recover(true);
  }

  /**
   * Checks the next saved outcome after keyboard recovery.
   */
  public assertAccessibleNextState(): void {
    if (this.fault === 'conflict') this.assertWinner();
    else {
      this.assertCommitted(this.journey);
      this.assertFinalState();
    }
  }
}
