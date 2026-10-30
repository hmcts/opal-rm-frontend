import { performAuthentication } from '../../../../actions/login.actions';
import {
  RejectedCasefileJourneyActions,
  rejectedAmendmentKind,
} from '../../actions/checkAndValidateCase/rejected-casefile-journey.actions';
import { RejectedCasefileFixtureActions } from '../../actions/checkAndValidateCase/rejected-casefile-fixture.actions';
import { armDraftCasefileMutation } from '../../actions/checkAndValidateCase/draft-casefile-transport.actions';
import type { IRejectedAmendmentSession } from '../../actions/checkAndValidateCase/interfaces/rejected-amendment-session.interface';
import type { IRejectedCasefileContext } from '../../actions/checkAndValidateCase/interfaces/rejected-casefile-context.interface';

/** Owns fixture/authentication handoffs and the order of inputter/checker consultations. */
export class RejectedCasefileAmendmentFlow {
  private fixture = new RejectedCasefileFixtureActions();
  private session!: IRejectedAmendmentSession;
  private actions!: RejectedCasefileJourneyActions;

  /** Requires the independently prepared original creation context.
   * @returns This example's original context.
   */
  private context(): IRejectedCasefileContext {
    if (!this.session?.context) throw new Error('Rejected amendment context missing');
    return this.session.context;
  }

  /** Prepares one fresh owned rejection and authenticates its actual correcting inputter.
   * @param kind Exact supported outcome.
   * @param accessible Native keyboard activation.
   */
  public prepare(kind: string, accessible = false): void {
    const session: IRejectedAmendmentSession = {
      kind: rejectedAmendmentKind(kind),
      keyboard: accessible,
      collections: [],
      writes: [],
      observation: 0,
    };
    this.session = session;
    this.actions = new RejectedCasefileJourneyActions(session);
    if (session.kind === 'denied')
      this.fixture.foreignActor().then((foreign) => {
        session.foreign = foreign;
      });
    cy.then(() => this.fixture.prepare(session.kind === 'cross-user')).then((context) => {
      session.context = context;
      performAuthentication(context.amender.email);
      if (session.kind !== 'denied' && session.kind !== 'non-rejected')
        cy.then(() => this.actions.openRejectedForCorrection());
    });
  }

  /** Arms one retained monitor before observation, including both explicit retry attempts. */
  private armSubmission(): void {
    cy.then(() => {
      this.session.monitor = armDraftCasefileMutation(
        this.context().owned.id,
        'PUT',
        this.session.kind === 'retry' ? 'definite-failure' : 'none',
      );
    });
  }

  /** Submits the complete corrected replacement and independently observes the saved receipt. */
  public resubmit(): void {
    this.armSubmission();
    this.actions.observeCompletion();
    this.actions.submitReplacement();
    this.actions.waitReplacementReceipt();
  }

  /** Explicitly retries only after proving a definite unchanged failure, with the original monitor/version. */
  public retryResubmission(): void {
    this.armSubmission();
    this.actions.observeCompletion();
    this.actions.submitReplacement();
    this.actions.assertDefiniteFailure();
    this.actions.submitReplacement();
    this.actions.waitReplacementReceipt();
  }

  /** Saves the real winning correction before submitting the browser's stale original version. */
  public submitStaleReplacement(): void {
    cy.then(() => this.actions.commitCompetingReplacement());
    this.resubmit();
  }

  /** Attempts canonical entry using the verified foreign actor or actually resubmitted state. */
  public attemptDeniedEntry(): void {
    cy.then(() => {
      this.context();
      if (this.session.kind === 'denied') {
        if (!this.session.foreign) throw new Error('Verified foreign-BU inputter missing');
        performAuthentication(this.session.foreign.email);
      } else if (this.session.kind === 'non-rejected') this.actions.commitCompetingReplacement();
      else throw new Error('Denied entry requires the prepared protected case');
      cy.then(() => this.actions.observeCompletion());
      cy.then(() => this.actions.openDenied());
    });
  }

  /** Proves the complete receipt, origin removal, saved inputter detail and independent checker ownership rule. */
  public assertResubmitted(): void {
    cy.then(() => {
      const context = this.context();
      this.actions.assertResubmissionEvidence();
      this.actions.assertOriginOutcome();
      this.actions.dismissOriginNotice();
      this.actions.openInputterInReview();
      this.actions.assertInputterInReview();
      performAuthentication(context.owned.checker);
      cy.then(() => this.actions.openCheckerQueue());
      cy.then(() => this.actions.assertCheckerOutcome());
      cy.then(() => this.actions.assertFinalWrites());
      performAuthentication(context.amender.email);
    });
  }

  /** Proves canonical non-disclosing denial, then restores the owner for an unchanged authoritative read. */
  public assertDenied(): void {
    cy.then(() => {
      const context = this.context();
      this.actions.assertDeniedEntry();
      performAuthentication(context.amender.email);
      cy.then(() => this.actions.assertDeniedSaved());
    });
  }

  /** Requires safe-conflict feedback and real saved-case navigation before independently consulting the unchanged winner. */
  public assertStaleRecovery(): void {
    cy.then(() => {
      this.actions.assertStaleFeedback();
      this.actions.recoverStaleWinner();
      this.actions.assertSavedWinner();
    });
  }
}
