import { CASES_DRAFT_CHECKER_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-checker-routing-paths.constant';
import { decodeDraftCasefileList } from 'src/app/flows/cases/services/opal-maintenance-service/utils/opal-maintenance-draft-casefile-response';
import { CasesDraftSelectors as D } from '../../../../../shared/selectors/cases-draft.selectors';
import { CheckAndValidateCaseSelectors as S } from '../../../../../shared/selectors/check-and-validate-case.selectors';
import { CreateCasefileSelectors as C } from '../../../../../shared/selectors/create-casefile.selectors';
import { pressDashboardEnter } from '../../../../../support/utils/press-dashboard-enter';
import { accessibilityActions } from '../accessibility/accessibility.actions';
import { CheckerDashboardWindowActions } from './checker-dashboard-window.actions';
import { CheckerReviewFixtureActions } from './checker-review-fixture.actions';
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

  /** Validates the scenario before the maintained fixture can create anything.
   * @param kind Explicit business outcome.
   */
  public prepare(kind: string): void {
    if (!['success', 'cancel', 'blank', 'over-limit', 'retry'].includes(kind))
      throw new Error('Unsupported deletion kind');
    this.kind = kind as CheckerDeletionKind;
    this.review.prepareSubmittedReview(kind === 'success' || kind === 'retry', (session) => {
      this.session = session;
      if (this.scanning) {
        cy.get(S.reviewHeading).should('be.focused');
        cy.get(S.deleteLink).should('have.text', 'Delete case').focus().should('be.focused');
        pressDashboardEnter();
        cy.get(S.deleteHeading).should('contain.text', 'Are you sure you want to delete this case?').and('be.focused');
        cy.get(S.deleteReason).should('have.value', '');
        this.scan();
      } else session.recovery.choose('delete');
      this.enterReason(this.reasonFor(kind, session));
      this.assertWarningIdentity();
      cy.get(S.deleteSubmit).should('be.visible').and('have.class', 'govuk-button--warning');
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
  private enterReason(reason: string): void {
    this.reason = reason;
    cy.get(S.deleteReason).clear();
    if (reason) cy.get(S.deleteReason).type(reason);
    cy.get(S.deleteReason).should('have.value', reason);
  }

  /** Requires the saved owned identity on the actual warning. */
  private assertWarningIdentity(): void {
    cy.get(S.deleteIdentity).should(
      'have.text',
      String(Cypress._.get(this.context().before.draft.casefile_snapshot, 'respondent_account.respondent_name')),
    );
  }

  /** Runs the maintained strict scanner at a meaningful visited state. */
  private scan(): void {
    if (this.scanning) accessibilityActions.checkAccessibilityOnly();
  }

  /** Completes one independent broad keyboard journey with its persisted business outcome.
   * @param kind Explicit accessibility outcome, validated before fixture creation.
   */
  public accessible(kind: string): void {
    if (!['success', 'validation', 'cancel', 'retry'].includes(kind))
      throw new Error('Unsupported deletion accessibility kind');
    this.scanning = true;
    this.review.enableAccessibility();
    this.prepare(kind === 'validation' ? 'blank' : kind);
    cy.then(() => {
      if (kind === 'validation') this.validateAccessibly();
      else this.act();
    });
    this.assertOutcome();
  }

  /** Exercises blank, visible 251 and corrected 250 states without dispatching a mutation. */
  private validateAccessibly(): void {
    this.act();
    cy.then(() => {
      this.assertValidation();
      this.scan();
      cy.then(() => assertCheckerNoPatch(this.context().monitor));
      cy.then(() => {
        this.kind = 'over-limit';
        this.enterReason('D'.repeat(251));
        this.activateWarningSubmit();
        cy.then(() => {
          this.assertValidation();
          this.scan();
          cy.then(() => assertCheckerNoPatch(this.context().monitor));
          this.enterReason('D'.repeat(250));
          cy.get(C.deletion.counter).should('contain.text', 'You have 0 characters remaining');
          this.scan();
          this.cancelToReview();
          cy.then(() => {
            this.kind = 'cancel';
          });
        });
      });
    });
  }

  /** Uses native Tab from the reason through the actual warning submit control. */
  private activateWarningSubmit(): void {
    if (this.scanning) {
      cy.get(S.deleteReason).focus().should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.deleteSubmit).should('be.enabled').and('be.focused');
      pressDashboardEnter();
    } else this.context().recovery.submit('delete', false);
  }

  /** Requires retained warning context after the definite failure, before explicit retry. */
  private assertFailure(): void {
    if (this.scanning) {
      cy.get(C.globalErrorBanner).should('be.visible').invoke('text').should('not.be.empty');
      cy.get(C.review.confirmationHeading).should('not.exist');
      this.assertWarningIdentity();
      cy.get(S.deleteReason).should('have.value', this.reason);
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

  /** Dispatches a real transition only after checking cleanup at this precise boundary. */
  private submitDeletion(): void {
    new CheckerReviewFixtureActions().requireLifecycleCleanup();
    this.activateWarningSubmit();
  }

  /** Runs the selected interaction without conflating it with the final business assertion. */
  public act(): void {
    cy.then(() => {
      const session = this.context();
      if (this.kind === 'cancel') {
        this.cancelToReview();
        return;
      }
      if (this.kind === 'blank' || this.kind === 'over-limit') {
        this.activateWarningSubmit();
        return;
      }
      if (this.kind === 'retry') {
        // Replace the original no-fault monitor once, before the first activation only.
        session.monitor = armDraftCasefileMutation(session.owned.id, 'PATCH', 'definite-failure');
        cy.then(() => this.submitDeletion());
        cy.wait('@draftMutation').its('response.statusCode').should('equal', 400);
        cy.then(() => {
          expect(session.monitor.applicationAttempts, 'one failed UI activation').to.equal(1);
          expect(session.monitor.attempts, 'one failed wire attempt').to.equal(1);
          expect(session.monitor.interceptedFailures, 'one definite rejection before provider').to.equal(1);
          expect(session.monitor.upstreamSuccesses, 'no provider success before retry').to.equal(0);
          expect(session.monitor.requestVersions).to.deep.equal([session.before.etag]);
        });
        this.assertFailure();
        cy.get(S.deleteSubmit).should('be.enabled');
        cy.get(S.deleteRecovery).should('not.exist');
        cy.get(S.dashboardSuccess).should('not.exist');
        readDraftSnapshot(session.owned.id).then((saved) => assertUnchangedDraft(session.before, saved));
        // Explicit second UI activation keeps the same monitor, original reason and opaque version.
        cy.then(() => this.submitDeletion());
      } else this.submitDeletion();
      cy.wait('@draftMutation').then(({ response }) => {
        if (!response) throw new Error('Deletion receipt missing');
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

  /** Returns to the same owned review and checks the actual reloaded receipt. */
  private cancelToReview(): void {
    const session = this.context();
    cy.intercept({
      method: 'GET',
      pathname: `/opal-maintenance-service/draft-casefiles/${session.owned.id}`,
      times: 1,
    }).as('deletionCancelledDetail');
    const cancel = cy.contains(S.cancel, 'No - cancel').should('be.visible');
    if (this.scanning) {
      cy.get(S.deleteReason).focus().should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.deleteSubmit).should('be.focused');
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
    cy.get(S.continue).should('be.enabled');
    for (const selector of [S.approve, S.reject]) {
      cy.get(selector)
        .should('have.attr', 'type', 'radio')
        .and('be.enabled')
        .then(($input) => {
          cy.get(`label[for="${$input.attr('id')}"]`).should('be.visible');
        });
    }
    cy.get(S.deleteLink).should('be.visible');
    if (this.scanning) cy.get(S.reviewHeading).should('be.focused');
    this.scan();
  }

  /** Proves exact visible validation and native linked focus with the original typed value. */
  private assertValidation(): void {
    const deletion = C.deletion;
    const message = this.kind === 'blank' ? 'Enter reason' : 'Reason must be 250 characters or fewer';
    cy.get(deletion.summary).should('be.visible').and('be.focused');
    cy.get(deletion.reasonError)
      .should('be.visible')
      .and(($error) => expect($error.text().replace('Error:', '').trim()).to.equal(message));
    cy.get(deletion.summaryLink).should('have.text', message).focus().should('be.focused');
    pressDashboardEnter();
    cy.get(S.deleteReason)
      .should('be.focused')
      .and('have.value', this.reason)
      .and('have.attr', 'aria-describedby')
      .and('include', 'create_casefile_delete_reason-error-message');
    cy.get(deletion.counter)
      .should('be.visible')
      .and(
        'contain.text',
        this.kind === 'blank' ? 'You have 250 characters remaining' : 'You have 1 character too many',
      );
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
        if (this.kind !== 'cancel') this.assertValidation();
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
    if (this.scanning) cy.get(S.reviewHeading).should('be.focused');
    this.scan();
    cy.get(`${S.approve}, ${S.reject}, ${S.continue}, ${S.deleteLink}, ${S.deleteReason}, ${S.deleteSubmit}`).should(
      'not.exist',
    );
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
