import { setCasefileReason } from '../createDraftCasefile/casefile-review-controls.actions';
import { CASES_DRAFT_CHECKER_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-checker-routing-paths.constant';
import { decodeDraftCasefileList } from 'src/app/flows/cases/services/opal-maintenance-service/utils/opal-maintenance-draft-casefile-response';
import { CasesDraftSelectors as D } from '../../../../../shared/selectors/cases-draft.selectors';
import { CreateCasefileSelectors as C } from '../../../../../shared/selectors/create-casefile.selectors';
import { pressDashboardEnter } from '../../../../../support/utils/press-dashboard-enter';
import { accessibilityActions } from '../accessibility/accessibility.actions';
import { CheckerDashboardWindowActions } from './checker-dashboard-window.actions';
import {
  CheckerReviewActions,
  assertCheckerAttempt,
  assertCheckerNoPatch,
  assertCheckerReceipt,
} from './checker-review-decisions.actions';
import type { ICheckerPreparedReview } from './checker-review-decisions.actions';
import { assertDeletedAggregate, assertDeletionRetry } from './checker-deletion-evidence.actions';
import type { CheckerDeletionKind } from './checker-deletion-evidence.actions';
import { assertUnchangedDraft, decodeDraftSnapshot, readDraftSnapshot } from './draft-casefile-evidence.actions';
import { armDraftCasefileMutation } from './draft-casefile-transport.actions';
import type { IDraftCasefileSnapshot } from './interfaces/draft-casefile-snapshot.interface';

/** Owns independent live deletion journeys and their actual persisted/UI evidence. */
export class CheckerDeletionActions {
  private readonly review = new CheckerReviewActions();
  private session?: ICheckerPreparedReview;
  private kind?: CheckerDeletionKind;
  private saved?: IDraftCasefileSnapshot;
  private reason = '';
  private scanning = false;
  private definiteFailureArmed = false;

  /** Validates the scenario before the maintained fixture can create anything.
   * @param kind Explicit business outcome.
   */
  public prepare(kind: string): void {
    if (!['success', 'cancel', 'blank', 'over-limit', 'retry'].includes(kind))
      throw new Error('Unsupported deletion kind');
    this.kind = kind as CheckerDeletionKind;
    this.review.prepareSubmittedReview((session) => {
      this.session = session;
      if (this.scanning) {
        cy.get(C.review.heading).should('be.focused');
        cy.get(C.review.delete).should('have.text', 'Delete case').focus().should('be.focused');
        pressDashboardEnter();
        cy.get(C.deletion.heading)
          .should('contain.text', 'Are you sure you want to delete this case?')
          .and('be.focused');
        cy.get(C.deletion.reason).should('have.value', '');
        this.scan();
      } else session.recovery.choose('delete');
      this.enterReason(this.reasonFor(kind, session));
      this.assertWarningIdentity();
      cy.get(C.deletion.submit).should('be.visible').and('have.class', 'govuk-button--warning');
      this.scan();
      session.recovery.capture('delete');
    });
  }

  /** Chooses the exact scenario reason without altering the saved case.
   * @param kind Validated functional outcome.
   * @param session Prepared owned review.
   * @returns Exact keyboard input.
   */
  private reasonFor(kind: string, session: ICheckerPreparedReview): string {
    if (kind === 'success') return 'D'.repeat(250);
    if (kind === 'over-limit') return 'D'.repeat(251);
    if (kind === 'blank') return '';
    if (this.scanning) return 'Synthetic concurrency decision';
    return session.recovery.expectedReason();
  }

  /** Types through the native field and requires the entire requested value, including 251 characters.
   * @param reason Exact untruncated input.
   */
  public enterReason(reason: string): void {
    this.reason = reason;
    setCasefileReason(C.deletion.reason, reason);
  }

  /** Requires the corrected visible boundary while the original case still has no mutation. */
  public assertCorrectedReason(): void {
    cy.get(C.deletion.reason).should('have.value', 'D'.repeat(250));
    cy.get(C.deletion.counter).should('contain.text', 'You have 0 characters remaining');
    assertCheckerNoPatch(this.context().monitor);
  }

  /** Requires the saved owned identity on the actual warning. */
  private assertWarningIdentity(): void {
    cy.get(C.deletion.identity).should(
      'have.text',
      String(Cypress._.get(this.context().before.draft.casefile_snapshot, 'respondent_account.respondent_name')),
    );
  }

  /** Runs the maintained strict scanner at a meaningful visited state. */
  public scan(): void {
    if (this.scanning) accessibilityActions.checkAccessibilityOnly();
  }

  /** Enables strict scans and native controls before the independent fixture is prepared. */
  public enableAccessibility(): void {
    this.scanning = true;
    this.review.enableAccessibility();
  }

  /** Uses native Tab from the reason through the actual warning submit control. */
  private activateWarningSubmit(): void {
    if (this.scanning) {
      cy.get(C.deletion.reason).focus().should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(C.deletion.submit).should('be.enabled').and('be.focused');
      pressDashboardEnter();
    } else this.context().recovery.submit('delete', false);
  }

  /** Requires retained warning context after the definite failure, before explicit retry. */
  private assertFailure(): void {
    if (this.scanning) {
      cy.get(C.globalErrorBanner).should('be.visible').invoke('text').should('not.be.empty');
      cy.get(C.review.confirmationHeading).should('not.exist');
      this.assertWarningIdentity();
      cy.get(C.deletion.reason).should('have.value', this.reason);
    } else this.context().recovery.assertFailure('delete');
    this.scan();
  }

  /** Requires the installed complete session, including a real no-write monitor.
   * @returns The scenario context.
   */
  private context(): ICheckerPreparedReview {
    if (!this.session || !this.kind) throw new Error('Deletion review session missing');
    if (!this.session.monitor) throw new Error('Deletion mutation monitor missing');
    return this.session;
  }

  /** Dispatches a real transition; the shared teardown cleans up the owned fixture. */
  private submitDeletion(): void {
    this.activateWarningSubmit();
  }

  /** Activates a validation-only warning without waiting for a mutation that must not occur. */
  public submitValidation(): void {
    cy.then(() => {
      this.context();
      if (this.reason !== '' && this.reason.length !== 251) throw new Error('Invalid deletion validation reason');
      this.activateWarningSubmit();
    });
  }

  /** Replaces the original monitor once, before either explicit retry activation. */
  public armDefiniteFailure(): void {
    cy.then(() => {
      const session = this.context();
      if (this.kind !== 'retry' || this.definiteFailureArmed) throw new Error('Invalid deletion retry setup');
      session.monitor = armDraftCasefileMutation(session.owned.id, 'PATCH', 'definite-failure');
      this.definiteFailureArmed = true;
    });
  }

  /** Submits one owned transition and decodes only its acknowledged successful receipt. */
  public submitOnce(): void {
    cy.then(() => {
      const session = this.context();
      if (this.kind !== 'success' && this.kind !== 'retry') throw new Error('Invalid deletion transition');
      this.submitDeletion();
      cy.wait('@draftMutation').then(({ response }) => {
        if (!response) throw new Error('Deletion receipt missing');
        if (response.statusCode === 400) {
          if (!this.definiteFailureArmed || session.monitor.interceptedFailures !== 1 || session.monitor.attempts !== 1)
            throw new Error('Unexpected deletion failure receipt');
          return;
        }
        this.saved = assertCheckerReceipt(
          response.statusCode,
          response.body,
          response.headers['etag'],
          session.owned,
          session.before.etag,
        );
        assertDeletedAggregate(session.before, this.saved, session.owned, this.reason);
      });
    });
  }

  /** Proves a definite rejection retained the original aggregate before the next explicit activation. */
  public assertDefiniteFailure(): void {
    cy.then(() => {
      const session = this.context();
      expect(this.saved, 'no successful receipt before retry').to.equal(undefined);
      expect(session.monitor.applicationAttempts, 'one failed UI activation').to.equal(1);
      expect(session.monitor.attempts, 'one failed wire attempt').to.equal(1);
      expect(session.monitor.interceptedFailures, 'one definite rejection before provider').to.equal(1);
      expect(session.monitor.upstreamSuccesses, 'no provider success before retry').to.equal(0);
      expect(session.monitor.requestVersions).to.deep.equal([session.before.etag]);
      this.assertFailure();
      cy.get(C.deletion.submit).should('be.enabled');
      cy.get(C.deletion.recovery).should('not.exist');
      cy.get(D.success).should('not.exist');
      readDraftSnapshot(session.owned.id).then((saved) => assertUnchangedDraft(session.before, saved));
    });
  }

  /** Returns to the same owned review and checks the actual reloaded receipt. */
  public cancelToReview(): void {
    cy.then(() => {
      const session = this.context();
      cy.intercept({
        method: 'GET',
        pathname: `/opal-maintenance-service/draft-casefiles/${session.owned.id}`,
        times: 1,
      }).as('deletionCancelledDetail');
      const cancel = cy.contains(C.deletion.cancel, 'No - cancel').should('be.visible');
      if (this.scanning) {
        cy.get(C.deletion.reason).focus().should('be.focused');
        cy.press(Cypress.Keyboard.Keys.TAB);
        cy.get(C.deletion.submit).should('be.focused');
        cy.press(Cypress.Keyboard.Keys.TAB);
        cancel.should('be.focused');
        pressDashboardEnter();
      } else cancel.click();
      cy.wait('@deletionCancelledDetail').then(({ response }) => {
        if (!response) throw new Error('Cancelled review receipt missing');
        expect(response.statusCode).to.equal(200);
        assertUnchangedDraft(
          session.before,
          decodeDraftSnapshot(session.owned.id, response.body, response.headers['etag']),
        );
      });
      cy.location('pathname').should('equal', `/${PATHS.root}/${PATHS.children.review}/${session.owned.id}`);
      session.recovery.assertSavedPresentation(session.before);
      cy.get(C.review.decisionContinue).should('be.enabled');
      for (const selector of [C.review.decisionApprove, C.review.decisionReject]) {
        cy.get(selector)
          .should('have.attr', 'type', 'radio')
          .and('be.enabled')
          .then(($input) => {
            cy.get(`label[for="${$input.attr('id')}"]`).should('be.visible');
          });
      }
      cy.get(C.review.delete).should('be.visible');
      if (this.scanning) cy.get(C.review.heading).should('be.focused');
      this.scan();
      this.kind = 'cancel';
    });
  }

  /** Proves exact visible validation and native linked focus with the original typed value.
   * @param expectedMessage Explicit scenario contract, when supplied.
   */
  public assertValidation(expectedMessage?: string): void {
    cy.then(() => {
      const deletion = C.deletion;
      const message = this.reason === '' ? 'Enter reason' : 'Reason must be 250 characters or fewer';
      if (expectedMessage !== undefined) expect(expectedMessage, 'selected validation contract').to.equal(message);
      cy.get(deletion.summary).should('be.visible').and('be.focused');
      cy.get(deletion.reasonError)
        .should('be.visible')
        .and(($error) => expect($error.text().replace('Error:', '').trim()).to.equal(message));
      cy.get(deletion.summaryLink).should('have.text', message).focus().should('be.focused');
      pressDashboardEnter();
      cy.get(C.deletion.reason)
        .should('be.focused')
        .and('have.value', this.reason)
        .and('have.attr', 'aria-describedby')
        .and('include', 'create_casefile_delete_reason-error-message');
      cy.get(deletion.counter)
        .should('be.visible')
        .and(
          'contain.text',
          this.reason === '' ? 'You have 250 characters remaining' : 'You have 1 character too many',
        );
      assertCheckerNoPatch(this.context().monitor);
    });
  }

  /** Checks all business evidence independently after the interaction. */
  public assertOutcome(): void {
    cy.then(() => {
      const session = this.context();
      if (this.kind === 'success' || this.kind === 'retry') {
        if (!this.saved) throw new Error('Saved deletion receipt missing');
        if (this.kind === 'retry') assertDeletionRetry(session.monitor, session.before.etag);
        else assertCheckerAttempt(session.monitor, session.before.etag, 200);
        session.recovery.assertRetrySuccess('delete', this.saved);
        cy.location('hash').should('equal', '#to-review');
        if (this.scanning) cy.get(D.heading).should('be.focused');
        this.scan();
        readDraftSnapshot(session.owned.id).then((saved) => {
          assertDeletedAggregate(session.before, saved, session.owned, this.reason);
          assertUnchangedDraft(this.saved!, saved);
        });
        this.review.assertOwnedAbsentFromQueue();
        cy.then(() => this.review.releaseQueueObservation());
        this.consultCollection('deleted');
      } else {
        cy.then(() => assertCheckerNoPatch(session.monitor));
        readDraftSnapshot(session.owned.id).then((saved) => assertUnchangedDraft(session.before, saved));
        if (this.kind !== 'cancel') this.cancelToReview();
        cy.then(() => this.review.releaseQueueObservation());
        this.consultCollection('to-review');
        cy.then(() => assertCheckerNoPatch(session.monitor));
      }
    });
  }

  /** Requires independent provider inclusion and every actual DOM page through the maintained window helper.
   * @param tab Saved lifecycle collection.
   */
  private consultCollection(tab: 'deleted' | 'to-review'): void {
    const session = this.context();
    const window = new CheckerDashboardWindowActions();
    if (this.scanning) window.enableAccessibility();
    let providerIncluded = false;
    window.observe(session.owned.checkerId);
    cy.intercept('GET', /\/opal-maintenance-service\/draft-casefiles(?:\?|$)/, (request) => {
      if (
        !request.query['restrict'] &&
        request.query['casefile_status'] === (tab === 'deleted' ? 'DELETED' : 'SUBMITTED,RESUBMITTED')
      ) {
        // Response event composes with the maintained pass-through window observer.
        request.on('response', (response) => {
          expect(response.statusCode, 'actual deletion collection status').to.equal(200);
          const rows = decodeDraftCasefileList(response.body).summaries.filter(
            (row) => row.draft_casefile_id === session.owned.id,
          );
          expect(rows, 'owned case in actual provider collection').to.have.length(1);
          expect(rows[0].submitted_by).to.equal(session.owned.inputterId);
          expect(rows[0].casefile_status).to.equal(tab === 'deleted' ? 'DELETED' : 'SUBMITTED');
          providerIncluded = true;
        });
      }
    });
    window.open();
    window.select(tab);
    window.collectIds().then((ids) => {
      expect(providerIncluded, 'provider inclusion was independently observed').to.equal(true);
      expect(ids.has(session.owned.id), 'owned case in actual DOM collection').to.equal(true);
      if (tab === 'deleted') this.openDeletedRow();
    });
  }

  /** Returns from collected last page and opens only the exact retained Deleted row. */
  private openDeletedRow(): void {
    const session = this.context();
    cy.get('body').then((body) => {
      if (body.find(D.pagination).length) {
        cy.get(D.allRejectedPage(1)).focus().should('be.focused');
        pressDashboardEnter();
        cy.get(D.allRejectedPage(1)).should('have.attr', 'aria-current', 'page');
        this.scan();
      }
    });
    this.locateDeletedRow(session.owned.id);
    cy.intercept({
      method: 'GET',
      pathname: `/opal-maintenance-service/draft-casefiles/${session.owned.id}`,
      times: 1,
    }).as('retainedDeletedDetail');
    cy.get(`${D.row(session.owned.id)} ${D.column('respondent')} a`)
      .should('be.visible')
      .focus()
      .should('be.focused');
    pressDashboardEnter();
    cy.wait('@retainedDeletedDetail').then(({ response }) => {
      if (!response) throw new Error('Retained Deleted detail receipt missing');
      expect(response.statusCode).to.equal(200);
      assertUnchangedDraft(this.saved!, decodeDraftSnapshot(session.owned.id, response.body, response.headers['etag']));
    });
    cy.location('pathname').should('equal', `/${PATHS.root}/${PATHS.children.view}/${session.owned.id}`);
    session.recovery.assertSavedPresentation(this.saved!);
    if (this.scanning) cy.get(C.review.heading).should('be.focused');
    this.scan();
    cy.get(
      `${C.review.decisionApprove}, ${C.review.decisionReject}, ${C.review.decisionContinue}, ${C.review.delete}, ${C.deletion.reason}, ${C.deletion.submit}`,
    ).should('not.exist');
  }

  /** Minimal owned-row lookup after maintained complete collection, using actual pagination readiness.
   * @param id Required owned identity.
   */
  private locateDeletedRow(id: number): void {
    cy.get('body').then((body) => {
      if (body.find(D.row(id)).length) return;
      cy.get(D.pagination)
        .find('a[aria-current="page"]')
        .invoke('attr', 'aria-label')
        .then((label) => {
          expect(label).to.match(/^Page [1-9]\d*$/);
          const next = Number(label!.split(' ').pop()) + 1;
          cy.get(D.allRejectedNext).should('be.visible').focus().should('be.focused');
          pressDashboardEnter();
          cy.get(D.allRejectedPage(next)).should('have.attr', 'aria-current', 'page');
          this.scan();
          this.locateDeletedRow(id);
        });
    });
  }
}
