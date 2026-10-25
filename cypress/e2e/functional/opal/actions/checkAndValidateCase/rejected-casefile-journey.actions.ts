import { CASES_CREATE_CASEFILE_ROUTING_PATHS as CREATE } from '../../../../../../src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CASES_DRAFT_ROUTING_PATHS as INPUTTER } from '../../../../../../src/app/flows/cases/cases-draft/routing/constants/cases-draft-routing-paths.constant';
import { CASES_DRAFT_CHECKER_ROUTING_PATHS as CHECKER } from '../../../../../../src/app/flows/cases/cases-draft/routing/constants/cases-draft-checker-routing-paths.constant';
import { decodeDraftCasefileList } from '../../../../../../src/app/flows/cases/services/opal-maintenance-service/utils/opal-maintenance-draft-casefile-response';
import type { IOpalMaintenanceDraftCasefileSummary } from '../../../../../../src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-summary.interface';
import { CheckAndValidateCaseSelectors as S } from '../../../../../shared/selectors/check-and-validate-case.selectors';
import { CasesDraftSelectors as D } from '../../../../../shared/selectors/cases-draft.selectors';
import { CreateCasefileSelectors as C } from '../../../../../shared/selectors/create-casefile.selectors';
import { pressDashboardEnter } from '../../../../../support/utils/press-dashboard-enter';
import { performAuthentication } from '../../../../actions/login.actions';
import { InputterDashboardActions } from '../createDraftCasefile/inputter-dashboard.actions';
import { AllRejectedActions } from '../createDraftCasefile/all-rejected.actions';
import { InputterCasefileMonitoringActions } from './inputter-casefile-monitoring.actions';
import { CheckerDashboardWindowActions } from './checker-dashboard-window.actions';
import { DraftCasefileRecoveryActions } from './draft-casefile-recovery.actions';
import { RejectedCasefileFixtureActions } from './rejected-casefile-fixture.actions';
import {
  assertRejectedRetry,
  assertResubmittedCasefile,
  correctedRejectedCasefile,
} from './rejected-casefile-evidence.actions';
import { assertUnchangedDraft, decodeDraftSnapshot, readDraftSnapshot } from './draft-casefile-evidence.actions';
import { armDraftCasefileMutation } from './draft-casefile-transport.actions';
import type {
  RejectedAmendmentKind,
  IRejectedCasefileActor,
  IRejectedCasefileContext,
} from './interfaces/rejected-casefile-context.interface';
import type { IDraftCasefileSnapshot } from './interfaces/draft-casefile-snapshot.interface';
import type { IDraftCasefileMonitor } from './interfaces/draft-casefile-monitor.interface';

const COLLECTION = /\/opal-maintenance-service\/draft-casefiles(?:\?|$)/;
const MUTATIONS = /\/opal-maintenance-service\/draft-casefiles(?:[/?]|$)/;
const DASHBOARD = `/${INPUTTER.root}/${INPUTTER.children.tabs}`;
const REJECTIONS = `/${INPUTTER.root}/${INPUTTER.children.rejections}`;
const KINDS: RejectedAmendmentKind[] = ['same-user', 'cross-user', 'retry', 'stale', 'denied', 'non-rejected'];

/** Rejects unknown business choices before any fixture or navigation is scheduled.
 * @param kind Caller-supplied outcome.
 * @returns Exact supported business choice.
 */
export function rejectedAmendmentKind(kind: string): RejectedAmendmentKind {
  if (!KINDS.includes(kind as RejectedAmendmentKind)) throw new Error('Unsupported rejected amendment kind');
  return kind as RejectedAmendmentKind;
}

/** Real amendment orchestration; all observed business responses pass through unchanged. */
export class RejectedCasefileJourneyActions {
  private fixture = new RejectedCasefileFixtureActions();
  private entry = new InputterCasefileMonitoringActions();
  private recovery = new DraftCasefileRecoveryActions();
  private winnerReview = new DraftCasefileRecoveryActions();
  private context?: IRejectedCasefileContext;
  private foreign?: IRejectedCasefileActor;
  private kind?: RejectedAmendmentKind;
  private monitor?: IDraftCasefileMonitor;
  private receipt?: IDraftCasefileSnapshot;
  private saved?: IDraftCasefileSnapshot;
  private collections: { query: Record<string, unknown>; rows: IOpalMaintenanceDraftCasefileSummary[] }[] = [];
  private writes: { method: string; body: unknown; version: unknown }[] = [];
  private keyboard = false;
  private outcome = false;
  private observation = 0;

  /** Requires the original owned context, never relabeling creator A as amender B.
   * @returns Scenario-local rejected fixture.
   */
  private current(): IRejectedCasefileContext {
    if (!this.context || !this.kind) throw new Error('Rejected amendment context missing');
    return this.context;
  }

  /** Validates exact sequencing without silently changing an already prepared scenario.
   * @param kind Business choice used by the current step.
   */
  private requireKind(kind: RejectedAmendmentKind): void {
    rejectedAmendmentKind(kind);
    if (kind !== this.kind) throw new Error('Rejected amendment kind differs from prepared scenario');
    this.current();
  }

  /** Creates one guarded real rejection, then enters its actual originating collection.
   * @param kind Exact supported outcome.
   * @param accessible Native keyboard activation for the accessibility caller.
   */
  public prepare(kind: RejectedAmendmentKind, accessible = false): void {
    rejectedAmendmentKind(kind);
    this.context = undefined;
    this.foreign = undefined;
    this.monitor = undefined;
    this.receipt = undefined;
    this.saved = undefined;
    this.collections = [];
    this.writes = [];
    this.outcome = false;
    this.keyboard = accessible;
    this.kind = kind;
    this.entry = new InputterCasefileMonitoringActions();
    this.recovery = new DraftCasefileRecoveryActions();
    this.winnerReview = new DraftCasefileRecoveryActions();
    this.fixture.requireCleanup(kind === 'cross-user');
    if (kind === 'denied')
      this.fixture.foreignActor().then((foreign) => {
        this.foreign = foreign;
      });
    cy.then(() => this.fixture.prepare(kind === 'cross-user')).then((context) => {
      this.context = context;
      if (kind === 'denied' || kind === 'non-rejected') return;
      this.entry.observe(context.amender.id);
      this.entry.open('rejected');
      if (kind === 'cross-user') this.entry.viewAllRejected();
      this.entry.expectRows([context.owned]);
      this.entry.openAmendment(context.owned, accessible);
      this.entry.releaseObservation();
      cy.get(C.caseDetails.checkCaseButton).should('be.enabled');
      this.activate(C.caseDetails.checkCaseButton);
      cy.get(S.reviewHeading).should('have.text', 'Check case details');
      this.recovery.capture('resubmit');
      this.recovery.captureOriginalReview();
      cy.then(() => this.recovery.assertSavedPresentation(context.before, true, true));
      // The separate winner rendering is captured through the same real edit controls before the stale edit.
      if (kind === 'stale') {
        this.winnerReview.correctRespondent('Winning');
        this.winnerReview.capture('resubmit');
      }
      this.recovery.correctRespondent('Corrected');
      this.recovery.capture('resubmit');
      cy.then(() => this.observeCompletion());
    });
  }

  /** Observes request bodies and collection responses without intercepting maintained response callbacks. */
  private observeCompletion(): void {
    const observation = ++this.observation;
    cy.intercept('GET', COLLECTION, (request) => {
      if (observation !== this.observation) return;
      const query = { ...request.query };
      if (query['restrict']) return;
      if (query['not_submitted_by'] === undefined)
        request.alias =
          query['casefile_status'] === 'SUBMITTED,RESUBMITTED' ? 'amendmentInReview' : 'amendmentRejected';
      request.on('response', (response) => {
        expect(response.statusCode, 'actual amendment collection status').to.equal(200);
        if (observation === this.observation)
          this.collections.push({ query, rows: decodeDraftCasefileList(response.body).summaries });
      });
    });
    cy.intercept({ method: '+(POST|PUT|PATCH)', url: MUTATIONS }, (request) => {
      if (observation !== this.observation) return;
      this.writes.push({
        method: request.method,
        body: structuredClone(request.body),
        version: request.headers['if-match'],
      });
    });
  }

  /** Activates one real control, using native Enter when requested.
   * @param selector Central maintained control selector.
   */
  private activate(selector: string): void {
    if (this.keyboard) {
      cy.get(selector).should('be.visible').focus().should('be.focused');
      pressDashboardEnter();
    } else cy.get(selector).should('be.visible').click();
  }

  /** Checks current cleanup capability immediately before the UI dispatch. */
  private submit(): void {
    cy.then(() => {
      this.fixture.requireCleanup(this.kind === 'cross-user');
      this.recovery.submit('resubmit', this.keyboard);
    });
  }

  /** Sends one explicit complete competing PUT under the current authorised A session, leaving the SPA untouched.
   * @returns Chain completed only after observed cleanup authority is persisted.
   */
  private compete(): Cypress.Chainable<unknown> {
    const context = this.current();
    this.fixture.requireCleanup(false);
    return cy
      .request<unknown>({
        method: 'PUT',
        url: `/opal-maintenance-service/draft-casefiles/${context.owned.id}`,
        headers: { 'If-Match': context.before.etag },
        body: { business_unit_id: 44, casefile: correctedRejectedCasefile(context.before, 'Winning') },
        failOnStatusCode: false,
        retryOnNetworkFailure: false,
        retryOnStatusCodeFailure: false,
        log: false,
      })
      .then((response) =>
        readDraftSnapshot(context.owned.id).then((saved) =>
          this.fixture.recordCleanupActor(context, saved).then(() => {
            this.saved = saved;
            expect(response.status, 'real competing PUT').to.equal(200);
            const receipt = decodeDraftSnapshot(context.owned.id, response.body, response.headers['etag']);
            assertResubmittedCasefile(context, saved, 'Winning');
            assertUnchangedDraft(saved, receipt);
          }),
        ),
      );
  }

  /** Completes the real outcome without folding the explicit Then into a click-only step.
   * @param kind Exact prepared choice.
   */
  public complete(kind: RejectedAmendmentKind): void {
    cy.then(() => {
      this.requireKind(kind);
      const context = this.current();
      if (kind === 'denied') {
        if (!this.foreign) throw new Error('Verified foreign-BU inputter missing');
        performAuthentication(this.foreign.email);
        cy.then(() => this.observeCompletion());
        this.openDenied();
        return;
      }
      if (kind === 'non-rejected') {
        this.compete();
        cy.then(() => this.observeCompletion());
        this.openDenied();
        return;
      }
      if (kind === 'stale') this.compete();
      cy.then(() => {
        this.monitor = armDraftCasefileMutation(
          context.owned.id,
          'PUT',
          kind === 'retry' ? 'definite-failure' : 'none',
        );
      });
      cy.then(() => this.observeCompletion());
      this.submit();
      if (kind === 'retry') {
        cy.wait('@draftMutation').its('response.statusCode').should('equal', 400);
        this.recovery.assertFailure('resubmit');
        cy.get(S.amendmentSubmit).should('be.enabled');
        readDraftSnapshot(context.owned.id).then((saved) => assertUnchangedDraft(context.before, saved));
        cy.then(() => {
          expect(this.monitor?.attempts, 'one failed activation without automatic replay').to.equal(1);
          expect(this.monitor?.applicationAttempts).to.equal(1);
          expect(this.writes).to.have.length(1);
        });
        this.submit();
      }
      cy.wait('@draftMutation').then(({ response }) => {
        if (!response) throw new Error('Real amendment receipt missing');
        if (kind === 'stale') {
          expect(response.statusCode, 'actual stale PUT').to.equal(409);
          return;
        }
        // Persist observed authority before receipt, aggregate or UI outcome assertions can fail.
        readDraftSnapshot(context.owned.id).then((saved) =>
          this.fixture.recordCleanupActor(context, saved).then(() => {
            this.saved = saved;
            expect(response.statusCode, 'real UI resubmission').to.equal(200);
            this.receipt = decodeDraftSnapshot(context.owned.id, response.body, response.headers['etag']);
            if (this.monitor) this.monitor.upstreamEtag = this.receipt.etag;
          }),
        );
      });
    });
  }

  /** Attempts only the canonical protected amendment entry. */
  private openDenied(): void {
    cy.visit(`/${CREATE.root}/${CREATE.children.taskList}/${this.current().owned.id}`);
  }

  /** Requires the actual canonical refusal and no stale case/editor/task data. */
  private assertDenied(): void {
    cy.location('pathname').should('equal', '/error/permission-denied');
    for (const selector of [
      S.amendmentTasks,
      C.caseDetails.checkCaseButton,
      S.reviewSections,
      S.history,
      S.amendmentSubmit,
    ])
      cy.get(selector).should('not.exist');
  }

  /** Requires every observed write to be the same complete amendment with the original opaque ETag.
   * @param count Expected UI activations.
   */
  private assertWrites(count: number): void {
    const context = this.current();
    expect(this.writes, 'exact UI writes without POST/PATCH/replay').to.have.length(count);
    for (const write of this.writes) {
      expect(write.method).to.equal('PUT');
      expect(write.version).to.equal(context.before.etag);
      expect(
        Cypress._.isEqual(write.body, {
          business_unit_id: 44,
          casefile: correctedRejectedCasefile(context.before, 'Corrected'),
        }),
        'complete corrected replacement body without client audit fields',
      ).to.equal(true);
    }
  }

  /** Requires the exact real provider result for an owned lifecycle consultation.
   * @param status Actual status filter.
   * @param included Whether the owned ID belongs in this collection.
   * @param checker Whether this is the independent checker collection.
   */
  private assertProvider(status: string, included: boolean, checker = false): void {
    const context = this.current();
    const matches = this.collections.filter(
      ({ query }) =>
        query['casefile_status'] === status &&
        (checker
          ? query['not_submitted_by'] === context.owned.checkerId
          : query['not_submitted_by'] === undefined &&
            (this.kind === 'cross-user' && status === 'REJECTED'
              ? query['submitted_by'] === undefined
              : query['submitted_by'] === context.amender.id)),
    );
    expect(matches.length, 'actual matching provider consultation observed').to.be.greaterThan(0);
    for (const { query, rows } of matches) {
      const owned = rows.filter((row) => row.draft_casefile_id === context.owned.id);
      expect(query['business_unit_id'], 'provider owning BU').to.equal('44');
      if (included) {
        expect(owned, 'owned case in actual provider').to.have.length(1);
        expect(owned[0].submitted_by, 'actual latest submitter').to.equal(context.amender.id);
        expect(owned[0].submitted_by_name === context.amender.name, 'actual latest submitter name').to.equal(true);
        expect(owned[0].casefile_status).to.equal('RESUBMITTED');
        expect(
          Cypress._.get(owned[0].casefile_snapshot, 'respondent_account.respondent_name') ===
            Cypress._.get(this.saved?.draft.casefile_snapshot, 'respondent_account.respondent_name'),
          'corrected provider respondent name',
        ).to.equal(true);
      } else expect(owned, 'owned case absent from actual provider').to.have.length(0);
    }
  }

  /** Traverses all DOM pages through the maintained checker collector, including inputter/shared tables.
   * @param included Whether the exact owned identity must be rendered.
   */
  private collect(included: boolean): void {
    new CheckerDashboardWindowActions().collectIds().then((ids) => {
      expect(ids.has(this.current().owned.id), 'owned case across every real DOM page').to.equal(included);
    });
  }

  /** Restarts the maintained client pagination before locating an exact saved row. */
  private firstPage(): void {
    cy.get('body').then((body) => {
      if (body.find(D.pagination).length) {
        this.activate(D.allRejectedPage(1));
        cy.get(D.allRejectedPage(1)).should('have.attr', 'aria-current', 'page');
      }
    });
  }

  /** Opens the independently saved exact row after complete provider and DOM consultation.
   * @param checker Whether this is the checker destination.
   * @param winning Whether the stale winner's rendering is expected.
   */
  private openSaved(checker: boolean, winning = false): void {
    const context = this.current();
    this.firstPage();
    this.entry.locateRejected(context.owned.id, this.keyboard);
    cy.intercept({
      method: 'GET',
      pathname: `/opal-maintenance-service/draft-casefiles/${context.owned.id}`,
      times: 1,
    }).as('amendmentSavedDetail');
    this.activate(`${D.row(context.owned.id)} ${D.column('respondent')} a`);
    cy.wait('@amendmentSavedDetail').then(({ response }) => {
      if (!response || !this.saved) throw new Error('Saved browser detail evidence missing');
      expect(response.statusCode).to.equal(200);
      assertUnchangedDraft(this.saved, decodeDraftSnapshot(context.owned.id, response.body, response.headers['etag']));
    });
    if (checker)
      cy.location('pathname').should('equal', `/${CHECKER.root}/${CHECKER.children.review}/${context.owned.id}`);
    else
      cy.location('pathname').should(
        'equal',
        `/${CREATE.root}/${CREATE.children.checkCaseDetails}/${context.owned.id}`,
      );
    cy.then(() => (winning ? this.winnerReview : this.recovery).assertSavedPresentation(this.saved!, false, !checker));
    if (!checker) cy.get(S.amendmentSubmit).should('not.exist');
  }

  /** Proves origin notice, complete rejected removal, and actual inputter In review inclusion. */
  private inputterOutcome(): void {
    const cross = this.kind === 'cross-user';
    cy.then(() => {
      if (!this.saved) throw new Error('Independent saved outcome missing');
      this.recovery.assertRetrySuccess('resubmit', this.saved);
    });
    cy.wait('@amendmentRejected');
    cy.location('pathname').should('equal', cross ? REJECTIONS : DASHBOARD);
    if (!cross) cy.location('hash').should('equal', '#rejected');
    cy.then(() => this.assertProvider('REJECTED', false));
    this.firstPage();
    this.collect(false);
    this.activate(cross ? D.allRejectedDismiss : D.successDismiss);
    cy.get(cross ? D.allRejectedHeading : D.heading).should('be.focused');
    cy.get(cross ? D.allRejectedSuccess : D.success).should('not.exist');
    if (cross) new AllRejectedActions().returnDashboard();
    cy.then(() => {
      this.collections = [];
    });
    new InputterDashboardActions().selectTab('in-review');
    cy.wait('@amendmentInReview');
    cy.get(D.tab('in-review')).should('have.attr', 'aria-current', 'page');
    cy.get(D.heading).should('be.visible');
    cy.then(() => this.assertProvider('SUBMITTED,RESUBMITTED', true));
    this.firstPage();
    this.collect(true);
    this.openSaved(false);
  }

  /** Proves independent checker eligibility or latest-submitter exclusion and complete read-only review. */
  private checkerOutcome(): void {
    const context = this.current();
    const cross = this.kind === 'cross-user';
    performAuthentication(context.owned.checker);
    cy.then(() => {
      this.collections = [];
    });
    const checker = new CheckerDashboardWindowActions();
    checker.observe(context.owned.checkerId);
    cy.then(() => this.observeCompletion());
    checker.open();
    checker.select('to-review');
    cy.then(() => this.assertProvider('SUBMITTED,RESUBMITTED', !cross, true));
    checker
      .collectIds()
      .then((ids) =>
        expect(ids.has(context.owned.id), 'checker To review ownership rule across all pages').to.equal(!cross),
      );
    if (cross) {
      cy.visit(`/${CHECKER.root}/${CHECKER.children.review}/${context.owned.id}`);
      cy.then(() => this.recovery.assertSavedPresentation(this.saved!));
      for (const selector of [S.approve, S.reject, S.continue, S.deleteLink, S.deleteReason, S.deleteSubmit])
        cy.get(selector).should('not.exist');
    } else this.openSaved(true);
    readDraftSnapshot(context.owned.id).then((saved) => assertUnchangedDraft(this.saved!, saved));
    cy.then(() => this.assertWrites(this.kind === 'retry' ? 2 : 1));
    // Cleanup restores the observed legitimate actor rather than rewriting immutable creator metadata.
    performAuthentication(context.amender.email);
  }

  /** Requires native Cancel/OK departure protection, then safe actual saved winner navigation. */
  private staleOutcome(): void {
    const context = this.current();
    this.recovery.assertFailure('resubmit');
    this.recovery.assertReloadRequired('resubmit');
    cy.then(() => {
      this.assertWrites(1);
      expect(this.monitor?.attempts).to.equal(1);
      expect(this.monitor?.applicationAttempts).to.equal(1);
      expect(this.monitor?.lastStatus).to.equal(409);
      expect(this.monitor?.requestVersions).to.deep.equal([context.before.etag]);
    });
    readDraftSnapshot(context.owned.id).then((saved) => assertUnchangedDraft(this.saved!, saved));
    let reads = 0;
    cy.intercept('GET', `**/opal-maintenance-service/draft-casefiles/${context.owned.id}`, (request) => {
      reads++;
      request.on('response', (response) => {
        expect(response.statusCode).to.equal(200);
        assertUnchangedDraft(
          this.saved!,
          decodeDraftSnapshot(context.owned.id, response.body, response.headers['etag']),
        );
      });
    });
    for (const discard of [false, true]) {
      let confirmed = false;
      cy.then(() =>
        cy.once('window:confirm', (message) => {
          confirmed = true;
          expect(message, 'native unsaved correction warning').to.be.a('string').and.not.be.empty;
          return discard;
        }),
      );
      this.activate(S.back);
      cy.then(() => expect(confirmed, 'native departure warning presented').to.equal(true));
      if (!discard) {
        this.recovery.assertRetained('resubmit');
        cy.then(() => expect(reads, 'Cancel does not reload').to.equal(0));
      }
    }
    this.assertDenied();
    cy.then(() => expect(reads, 'confirmed Back reloads authoritative winner once').to.equal(1));
    new InputterDashboardActions().open('in-review');
    cy.wait('@amendmentInReview');
    cy.get(D.heading).should('be.visible');
    cy.then(() => this.assertProvider('SUBMITTED,RESUBMITTED', true));
    this.firstPage();
    this.collect(true);
    this.openSaved(false, true);
    readDraftSnapshot(context.owned.id).then((saved) => assertUnchangedDraft(this.saved!, saved));
    cy.then(() => this.assertWrites(1));
  }

  /** Rechecks complete receipt/GET, provider/DOM destinations and no replay in the explicit Then.
   * @param kind Exact prepared outcome.
   */
  public assertOutcome(kind: RejectedAmendmentKind): void {
    cy.then(() => {
      this.requireKind(kind);
      const context = this.current();
      if (kind === 'denied' || kind === 'non-rejected') {
        this.assertDenied();
        performAuthentication(context.amender.email);
        readDraftSnapshot(context.owned.id).then((saved) => assertUnchangedDraft(this.saved ?? context.before, saved));
        cy.then(() => expect(this.writes, 'denied entry sends no application writes').to.have.length(0));
      } else if (kind === 'stale') this.staleOutcome();
      else {
        if (!this.saved || !this.receipt || !this.monitor) throw new Error('Complete resubmission evidence missing');
        assertResubmittedCasefile(context, this.saved, 'Corrected');
        assertUnchangedDraft(this.saved, this.receipt);
        if (kind === 'retry') assertRejectedRetry(this.monitor, context.before.etag);
        else {
          expect(this.monitor.applicationAttempts).to.equal(1);
          expect(this.monitor.attempts).to.equal(1);
          expect(this.monitor.upstreamSuccesses).to.equal(1);
          expect(this.monitor.lastStatus).to.equal(200);
          expect(this.monitor.requestVersions).to.deep.equal([context.before.etag]);
        }
        this.assertWrites(kind === 'retry' ? 2 : 1);
        this.inputterOutcome();
        this.checkerOutcome();
      }
      cy.then(() => {
        this.outcome = true;
      });
      cy.then(() => expect(this.outcome, 'all business outcome checks completed').to.equal(true));
    });
  }
}
