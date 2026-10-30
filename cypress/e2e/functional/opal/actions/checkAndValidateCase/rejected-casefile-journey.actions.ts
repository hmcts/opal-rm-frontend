import { CASES_CREATE_CASEFILE_ROUTING_PATHS as CREATE } from '../../../../../../src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CASES_DRAFT_ROUTING_PATHS as INPUTTER } from '../../../../../../src/app/flows/cases/cases-draft/routing/constants/cases-draft-routing-paths.constant';
import { CASES_DRAFT_CHECKER_ROUTING_PATHS as CHECKER } from '../../../../../../src/app/flows/cases/cases-draft/routing/constants/cases-draft-checker-routing-paths.constant';
import { decodeDraftCasefileList } from '../../../../../../src/app/flows/cases/services/opal-maintenance-service/utils/opal-maintenance-draft-casefile-response';
import { CheckAndValidateCaseSelectors as S } from '../../../../../shared/selectors/check-and-validate-case.selectors';
import { CasesDraftSelectors as D } from '../../../../../shared/selectors/cases-draft.selectors';
import { CreateCasefileSelectors as C } from '../../../../../shared/selectors/create-casefile.selectors';
import { activateCasefileControl } from '../createDraftCasefile/casefile-review-controls.actions';
import { InputterDashboardActions } from '../createDraftCasefile/inputter-dashboard.actions';
import { accessibilityActions } from '../accessibility/accessibility.actions';
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
import type { RejectedAmendmentKind, IRejectedCasefileContext } from './interfaces/rejected-casefile-context.interface';
import type { IRejectedAmendmentSession } from './interfaces/rejected-amendment-session.interface';

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

/** Page and network evidence for one Flow-owned rejected amendment session. */
export class RejectedCasefileJourneyActions {
  private fixture = new RejectedCasefileFixtureActions();
  private entry = new InputterCasefileMonitoringActions();
  private recovery = new DraftCasefileRecoveryActions();
  private winnerReview = new DraftCasefileRecoveryActions();

  /** Shares only this example's evidence with the owning Flow.
   * @param session Fresh feature-local scenario state.
   */
  constructor(private readonly session: IRejectedAmendmentSession) {}

  /** Requires the original owned context, never relabeling creator A as amender B.
   * @returns Scenario-local rejected fixture.
   */
  private current(): IRejectedCasefileContext {
    if (!this.session.context) throw new Error('Rejected amendment context missing');
    return this.session.context;
  }

  /** Opens and edits the actual originating rejection using maintained controls. */
  public openRejectedForCorrection(): void {
    const context = this.current();
    this.entry.observe(context.amender.id);
    this.entry.open('rejected');
    this.scan();
    if (this.session.kind === 'cross-user') {
      this.entry.viewAllRejected();
      this.scan();
    }
    this.entry.expectRows([context.owned], [], this.session.keyboard);
    this.entry.openAmendment(context.owned, this.session.keyboard);
    this.entry.releaseObservation();
    this.recovery.assertSavedHistory(context.before, true);
    cy.get(C.caseDetails.checkCaseButton).should('be.enabled');
    this.scan();
    this.activate(C.caseDetails.checkCaseButton);
    cy.get(C.review.heading).should('have.text', 'Check case details');
    this.recovery.capture('resubmit');
    this.recovery.captureOriginalReview();
    cy.then(() => this.recovery.assertReviewDetails(context.before, true));
    this.scan();
    // The separate winner rendering is captured through the same real edit controls before the stale edit.
    if (this.session.kind === 'stale') {
      this.winnerReview.correctRespondent('Winning', this.session.keyboard, () => this.scan());
      this.winnerReview.capture('resubmit');
      this.scan();
    }
    this.recovery.correctRespondent('Corrected', this.session.keyboard, () => this.scan());
    this.recovery.capture('resubmit');
    this.scan();
  }

  /** Strictly scans material states at desktop and narrow widths before any departure. */
  private scan(): void {
    if (!this.session.keyboard) return;
    for (const width of [1280, 320]) {
      cy.viewport(width, 900);
      cy.document().should((document) => {
        expect(document.defaultView!.innerWidth, 'actual CSS viewport width').to.equal(width);
        expect(
          Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
          'horizontal overflow',
        ).to.be.at.most(document.documentElement.clientWidth);
      });
      accessibilityActions.checkAccessibilityOnly();
    }
    cy.viewport(1280, 900);
  }

  /** Captures raw completion responses; validation waits until observed cleanup authority is persisted. */
  public observeCompletion(): void {
    cy.then(() => {
      const observation = ++this.session.observation;
      cy.intercept('GET', COLLECTION, (request) => {
        if (observation !== this.session.observation) return;
        const query = { ...request.query };
        if (query['restrict']) return;
        const crossUserRejected =
          this.session.kind === 'cross-user' &&
          query['casefile_status'] === 'REJECTED' &&
          query['not_submitted_by'] === this.current().amender.id &&
          query['submitted_by'] === undefined;
        const personal = query['not_submitted_by'] === undefined && query['submitted_by'] === this.current().amender.id;
        if (personal || crossUserRejected)
          request.alias =
            query['casefile_status'] === 'SUBMITTED,RESUBMITTED' ? 'amendmentInReview' : 'amendmentRejected';
        request.on('response', (response) => {
          if (observation === this.session.observation)
            this.session.collections.push({ query, statusCode: response.statusCode, body: response.body });
        });
      });
      cy.intercept({ method: '+(POST|PUT|PATCH)', url: MUTATIONS }, (request) => {
        if (observation !== this.session.observation) return;
        this.session.writes.push({
          method: request.method,
          body: structuredClone(request.body),
          version: request.headers['if-match'],
        });
      });
    });
  }

  /** Activates one real control, using native Enter when requested.
   * @param selector Central maintained control selector.
   */
  private activate(selector: string): void {
    if (this.session.keyboard)
      cy.get(selector).should((control) => {
        expect(control[0].matches('a[href], button, input, select, textarea'), 'semantic keyboard control').to.equal(
          true,
        );
      });
    activateCasefileControl(selector, this.session.keyboard);
  }

  /** Submits the retained replacement through the real UI. */
  public submitReplacement(): void {
    cy.then(() => {
      this.recovery.submit('resubmit', this.session.keyboard);
    });
  }

  /** Sends one explicit complete competing PUT under the current authorised A session, leaving the SPA untouched.
   * @returns Chain completed only after observed cleanup authority is persisted.
   */
  public commitCompetingReplacement(): Cypress.Chainable<unknown> {
    const context = this.current();
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
            this.session.saved = saved;
            expect(response.status, 'real competing PUT').to.equal(200);
            const receipt = decodeDraftSnapshot(context.owned.id, response.body, response.headers['etag']);
            assertResubmittedCasefile(context, saved, 'Winning');
            assertUnchangedDraft(saved, receipt);
          }),
        ),
      );
  }

  /** Requires the definite failure and unchanged authoritative original before an explicit retry. */
  public assertDefiniteFailure(): void {
    cy.wait('@draftMutation').its('response.statusCode').should('equal', 400);
    this.recovery.assertFailure('resubmit');
    cy.get(C.review.submit).should('be.enabled');
    this.scan();
    cy.then(() =>
      readDraftSnapshot(this.current().owned.id).then((saved) => assertUnchangedDraft(this.current().before, saved)),
    );
    cy.then(() => {
      expect(this.session.monitor?.attempts, 'one failed activation without automatic replay').to.equal(1);
      expect(this.session.monitor?.applicationAttempts).to.equal(1);
      expect(this.session.writes).to.have.length(1);
    });
  }

  /** Independently persists observed authority before decoding or asserting the raw UI receipt. */
  public waitReplacementReceipt(): void {
    cy.wait('@draftMutation').then(({ response }) => {
      const context = this.current();
      if (!response) throw new Error('Real amendment receipt missing');
      if (this.session.kind === 'stale') {
        expect(response.statusCode, 'actual stale PUT').to.equal(409);
        return;
      }
      return readDraftSnapshot(context.owned.id).then((saved) =>
        this.fixture.recordCleanupActor(context, saved).then(() => {
          this.session.saved = saved;
          expect(response.statusCode, 'real UI resubmission').to.equal(200);
          this.session.receipt = decodeDraftSnapshot(context.owned.id, response.body, response.headers['etag']);
          if (this.session.monitor) this.session.monitor.upstreamEtag = this.session.receipt.etag;
        }),
      );
    });
  }

  /** Attempts only the canonical protected amendment entry. */
  public openDenied(): void {
    cy.visit(`/${CREATE.root}/${CREATE.children.taskList}/${this.current().owned.id}`);
  }

  /** Requires the actual canonical refusal and no stale case/editor/task data. */
  public assertDeniedEntry(): void {
    cy.location('pathname').should('equal', '/error/permission-denied');
    for (const selector of [
      S.amendmentTasks,
      C.caseDetails.checkCaseButton,
      S.reviewSections,
      S.history,
      C.review.submit,
    ])
      cy.get(selector).should('not.exist');
    this.scan();
  }

  /** Requires every observed write to be the same complete amendment with the original opaque ETag.
   * @param count Expected UI activations.
   */
  private assertWrites(count: number): void {
    const context = this.current();
    expect(this.session.writes, 'exact UI writes without POST/PATCH/replay').to.have.length(count);
    for (const write of this.session.writes) {
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
    const matches = this.session.collections.filter(
      ({ query }) =>
        query['casefile_status'] === status &&
        (checker
          ? query['not_submitted_by'] === context.owned.checkerId
          : this.session.kind === 'cross-user' && status === 'REJECTED'
            ? query['not_submitted_by'] === context.amender.id && query['submitted_by'] === undefined
            : query['not_submitted_by'] === undefined && query['submitted_by'] === context.amender.id),
    );
    expect(matches.length, 'actual matching provider consultation observed').to.be.greaterThan(0);
    for (const { query, statusCode, body } of matches) {
      expect(statusCode, 'actual amendment collection status').to.equal(200);
      const rows = decodeDraftCasefileList(body).summaries;
      const owned = rows.filter((row) => row.draft_casefile_id === context.owned.id);
      expect(query['business_unit_id'], 'provider owning BU').to.equal('44');
      if (included) {
        expect(owned, 'owned case in actual provider').to.have.length(1);
        expect(owned[0].submitted_by, 'actual latest submitter').to.equal(context.amender.id);
        expect(owned[0].submitted_by_name === context.amender.name, 'actual latest submitter name').to.equal(true);
        expect(owned[0].casefile_status).to.equal('RESUBMITTED');
        expect(
          Cypress._.get(owned[0].casefile_snapshot, 'respondent_account.respondent_name') ===
            Cypress._.get(this.session.saved?.draft.casefile_snapshot, 'respondent_account.respondent_name'),
          'corrected provider respondent name',
        ).to.equal(true);
      } else expect(owned, 'owned case absent from actual provider').to.have.length(0);
    }
  }

  /** Traverses all DOM pages through the maintained checker collector, including inputter/shared tables.
   * @param included Whether the exact owned identity must be rendered.
   */
  private collect(included: boolean): void {
    const collector = new CheckerDashboardWindowActions();
    if (this.session.keyboard) collector.enableAccessibility();
    collector.collectIds().then((ids) => {
      expect(ids.has(this.current().owned.id), 'owned case across every real DOM page').to.equal(included);
    });
  }

  /** Restarts the maintained client pagination before locating an exact saved row. */
  private firstPage(): void {
    cy.get('body').then((body) => {
      if (body.find(D.pagination).length) {
        this.scan();
        this.activate(D.allRejectedPage(1));
        cy.get(D.allRejectedPage(1)).should('have.attr', 'aria-current', 'page');
        this.scan();
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
    this.entry.locateRejected(context.owned.id, this.session.keyboard);
    cy.intercept({
      method: 'GET',
      pathname: `/opal-maintenance-service/draft-casefiles/${context.owned.id}`,
      times: 1,
    }).as('amendmentSavedDetail');
    this.activate(`${D.row(context.owned.id)} ${D.column('respondent')} a`);
    cy.wait('@amendmentSavedDetail').then(({ response }) => {
      if (!response || !this.session.saved) throw new Error('Saved browser detail evidence missing');
      expect(response.statusCode).to.equal(200);
      assertUnchangedDraft(
        this.session.saved,
        decodeDraftSnapshot(context.owned.id, response.body, response.headers['etag']),
      );
    });
    if (checker)
      cy.location('pathname').should('equal', `/${CHECKER.root}/${CHECKER.children.review}/${context.owned.id}`);
    else
      cy.location('pathname').should(
        'equal',
        `/${CREATE.root}/${CREATE.children.checkCaseDetails}/${context.owned.id}`,
      );
    cy.then(() =>
      (winning ? this.winnerReview : this.recovery).assertSavedPresentation(this.session.saved!, false, !checker),
    );
    if (!checker) cy.get(C.review.submit).should('not.exist');
    this.scan();
  }

  /** Proves origin notice, complete rejected removal, and actual inputter In review inclusion. */
  public assertOriginOutcome(): void {
    const cross = this.session.kind === 'cross-user';
    cy.then(() => {
      if (!this.session.saved) throw new Error('Independent saved outcome missing');
      this.recovery.assertRetrySuccess('resubmit', this.session.saved);
    });
    cy.wait('@amendmentRejected');
    cy.location('pathname').should('equal', cross ? REJECTIONS : DASHBOARD);
    if (!cross) cy.location('hash').should('equal', '#rejected');
    cy.then(() => this.assertProvider('REJECTED', false));
    this.scan();
    this.firstPage();
    this.collect(false);
    this.scan();
  }

  /** Dismisses the origin notice and checks its restored focus. */
  public dismissOriginNotice(): void {
    const cross = this.session.kind === 'cross-user';
    this.activate(cross ? D.allRejectedDismiss : D.successDismiss);
    cy.get(cross ? D.allRejectedHeading : D.heading).should('be.focused');
    cy.get(cross ? D.allRejectedSuccess : D.success).should('not.exist');
    this.scan();
    if (cross) {
      new AllRejectedActions().returnDashboard();
      this.scan();
    }
  }

  /** Opens the inputter In review consultation after the origin outcome. */
  public openInputterInReview(): void {
    cy.then(() => {
      this.session.collections = [];
    });
    if (this.session.keyboard) this.activate(D.tab('in-review'));
    else new InputterDashboardActions().selectTab('in-review');
  }

  /** Requires complete provider/DOM inclusion and the independently saved read-only detail. */
  public assertInputterInReview(): void {
    cy.wait('@amendmentInReview');
    cy.get(D.tab('in-review')).should('have.attr', 'aria-current', 'page');
    cy.get(D.heading).should('be.visible');
    cy.get(`${D.table}, ${D.empty}`).should('be.visible');
    cy.then(() => this.assertProvider('SUBMITTED,RESUBMITTED', true));
    this.scan();
    this.firstPage();
    this.collect(true);
    this.openSaved(false);
  }

  /** Proves independent checker eligibility or latest-submitter exclusion and complete read-only review. */
  public openCheckerQueue(): void {
    const context = this.current();
    cy.then(() => {
      this.session.collections = [];
    });
    const checker = new CheckerDashboardWindowActions();
    checker.observe(context.owned.checkerId);
    cy.then(() => this.observeCompletion());
    if (this.session.keyboard) checker.enableAccessibility();
    checker.open();
    this.scan();
    checker.select('to-review');
    this.scan();
  }

  /** Proves checker eligibility or latest-submitter exclusion and full read-only saved detail. */
  public assertCheckerOutcome(): void {
    const context = this.current();
    const cross = this.session.kind === 'cross-user';
    const checker = new CheckerDashboardWindowActions();
    if (this.session.keyboard) checker.enableAccessibility();
    cy.then(() => this.assertProvider('SUBMITTED,RESUBMITTED', !cross, true));
    checker
      .collectIds()
      .then((ids) =>
        expect(ids.has(context.owned.id), 'checker To review ownership rule across all pages').to.equal(!cross),
      );
    if (cross) {
      cy.visit(`/${CHECKER.root}/${CHECKER.children.review}/${context.owned.id}`);
      cy.then(() => this.recovery.assertSavedPresentation(this.session.saved!));
      for (const selector of [
        C.review.decisionApprove,
        C.review.decisionReject,
        C.review.decisionContinue,
        C.review.delete,
        C.deletion.reason,
        C.deletion.submit,
      ])
        cy.get(selector).should('not.exist');
      this.scan();
    } else this.openSaved(true);
    readDraftSnapshot(context.owned.id).then((saved) => assertUnchangedDraft(this.session.saved!, saved));
  }

  /** Requires the shared safe-conflict page and one refused original-version replacement. */
  public assertStaleFeedback(): void {
    const context = this.current();
    this.recovery.assertSafeConflict();
    this.scan();
    cy.then(() => {
      this.assertWrites(1);
      expect(this.session.monitor?.attempts).to.equal(1);
      expect(this.session.monitor?.applicationAttempts).to.equal(1);
      expect(this.session.monitor?.lastStatus).to.equal(409);
      expect(this.session.monitor?.requestVersions).to.deep.equal([context.before.etag]);
    });
    readDraftSnapshot(context.owned.id).then((saved) => assertUnchangedDraft(this.session.saved!, saved));
  }

  /** Re-enters the complete saved winner through real Cases, dashboard, tab and owned-row controls. */
  public recoverStaleWinner(): void {
    const context = this.current();
    this.recovery.recoverConflict(context.owned.id, 'resubmit', this.session.keyboard, () => this.scan());
    this.scan();
    this.winnerReview.assertSavedPresentation(this.session.saved!, false, true);
    readDraftSnapshot(context.owned.id).then((saved) => assertUnchangedDraft(this.session.saved!, saved));
    cy.then(() => this.assertWrites(1));
  }

  /** Consults the authoritative winner through inputter provider, DOM and complete saved detail. */
  public assertSavedWinner(): void {
    const context = this.current();
    new InputterDashboardActions().open('in-review');
    cy.wait('@amendmentInReview');
    cy.get(D.heading).should('be.visible');
    cy.get(`${D.table}, ${D.empty}`).should('be.visible');
    cy.then(() => this.assertProvider('SUBMITTED,RESUBMITTED', true));
    this.scan();
    this.firstPage();
    this.collect(true);
    this.openSaved(false, true);
    readDraftSnapshot(context.owned.id).then((saved) => assertUnchangedDraft(this.session.saved!, saved));
    cy.then(() => this.assertWrites(1));
  }

  /** Rechecks the full aggregate, original identity/version and immutable creator against the real receipt. */
  public assertResubmissionEvidence(): void {
    const context = this.current();
    const { saved, receipt, monitor, kind } = this.session;
    if (!saved || !receipt || !monitor) throw new Error('Complete resubmission evidence missing');
    assertResubmittedCasefile(context, saved, 'Corrected');
    assertUnchangedDraft(saved, receipt);
    if (kind === 'retry') assertRejectedRetry(monitor, context.before.etag);
    else {
      expect(monitor.applicationAttempts).to.equal(1);
      expect(monitor.attempts).to.equal(1);
      expect(monitor.upstreamSuccesses).to.equal(1);
      expect(monitor.lastStatus).to.equal(200);
      expect(monitor.requestVersions).to.deep.equal([context.before.etag]);
    }
    this.assertWrites(kind === 'retry' ? 2 : 1);
  }

  /** Requires the independently authorised aggregate to remain unchanged after denied entry. */
  public assertDeniedSaved(): void {
    const context = this.current();
    readDraftSnapshot(context.owned.id).then((saved) =>
      assertUnchangedDraft(this.session.saved ?? context.before, saved),
    );
    cy.then(() => expect(this.session.writes, 'denied entry sends no application writes').to.have.length(0));
  }

  /** Proves the final exact write count after all inputter/checker visits. */
  public assertFinalWrites(): void {
    this.assertWrites(this.session.kind === 'retry' ? 2 : 1);
  }
}
