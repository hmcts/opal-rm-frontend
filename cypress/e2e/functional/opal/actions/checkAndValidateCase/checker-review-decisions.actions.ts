import type { IOpalUserStateResponse } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import {
  decodeDraftCasefileCount,
  decodeDraftCasefileList,
} from 'src/app/flows/cases/services/opal-maintenance-service/utils/opal-maintenance-draft-casefile-response';
import type { IOpalMaintenanceDraftCasefileSummary } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-summary.interface';
import { CASES_DRAFT_CHECKER_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-checker-routing-paths.constant';
import { CasesDraftSelectors as D } from '../../../../../shared/selectors/cases-draft.selectors';
import { CheckAndValidateCaseSelectors as S } from '../../../../../shared/selectors/check-and-validate-case.selectors';
import { CreateCasefileSelectors as C } from '../../../../../shared/selectors/create-casefile.selectors';
import { PrimaryNavigationLocators as P } from '../../../../../shared/selectors/primary-navigation.locators';
import { pressDashboardEnter } from '../../../../../support/utils/press-dashboard-enter';
import { performAuthentication } from '../../../../actions/login.actions';
import { accessibilityActions } from '../accessibility/accessibility.actions';
import { AllRejectedActions } from '../createDraftCasefile/all-rejected.actions';
import { CheckerReviewFixtureActions } from './checker-review-fixture.actions';
import { InputterMonitoringFixtureActions } from './inputter-monitoring-fixture.actions';
import { InputterCasefileMonitoringActions } from './inputter-casefile-monitoring.actions';
import { DraftCasefileRecoveryActions } from './draft-casefile-recovery.actions';
import {
  assertUnchangedDraft,
  decodeDraftSnapshot,
  readDraftSnapshot,
  versionValue,
} from './draft-casefile-evidence.actions';
import { requestDraftChange } from './draft-casefile-fixture.actions';
import { armDraftCasefileMutation, installDraftCasefileFetchMonitor } from './draft-casefile-transport.actions';
import type { IDraftCasefileMonitor } from './interfaces/draft-casefile-monitor.interface';
import type { IDraftCasefileSnapshot } from './interfaces/draft-casefile-snapshot.interface';
import type { IOwnedDraftCasefile } from './interfaces/draft-casefile-owned.interface';

/** Validates the actual decision receipt without requiring asynchronously generated accounts.
 * @param status Actual HTTP status.
 * @param body Actual response body.
 * @param etag Actual response version.
 * @param owned Scenario identity.
 * @param original Opaque version opened by the checker.
 * @returns Validated complete response snapshot.
 */
export function assertCheckerReceipt(
  status: number,
  body: unknown,
  etag: unknown,
  owned: IOwnedDraftCasefile,
  original: string,
): IDraftCasefileSnapshot {
  expect(status, 'actual decision HTTP status').to.equal(200);
  const snapshot = decodeDraftSnapshot(owned.id, body, etag);
  expect(snapshot.draft.business_unit_id, 'decision receipt BU').to.equal(44);
  expect(snapshot.draft.submitted_by, 'decision receipt owner').to.equal(owned.inputterId);
  expect(snapshot.draft.casefile.respondent_account.remo_reference, 'decision receipt marker').to.equal(owned.marker);
  expect(versionValue(snapshot.etag) > versionValue(original), 'decision advanced ETag').to.equal(true);
  return snapshot;
}

/** Proves an actual application dispatch and wire attempt with the original opaque version.
 * @param monitor Maintained browser mutation monitor.
 * @param original Original matching detail version.
 * @param status Actual expected HTTP result.
 */
export function assertCheckerAttempt(monitor: IDraftCasefileMonitor, original: string, status: number): void {
  expect(monitor.applicationAttempts, 'one UI decision dispatch').to.equal(1);
  expect(monitor.attempts, 'one UI PATCH attempt').to.equal(1);
  expect(monitor.requestVersions, 'original UI If-Match').to.deep.equal([original]);
  expect(monitor.lastStatus, 'actual UI PATCH response').to.equal(status);
  expect(monitor.upstreamSuccesses, 'actual UI acknowledgements').to.equal(status === 200 ? 1 : 0);
}

/** Requires an installed no-write monitor rather than treating absent evidence as zero.
 * @param monitor Maintained browser mutation observations.
 */
export function assertCheckerNoPatch(monitor: IDraftCasefileMonitor | undefined): void {
  if (!monitor) throw new Error('No-PATCH monitor missing');
  expect(monitor.attempts, 'zero wire PATCH').to.equal(0);
  expect(monitor.applicationAttempts, 'zero application PATCH').to.equal(0);
  expect(monitor.requestVersions, 'no attempted PATCH version').to.deep.equal([]);
  expect(monitor.upstreamSuccesses, 'no acknowledged PATCH').to.equal(0);
  expect(monitor.lastStatus, 'no PATCH receipt').to.equal(undefined);
}

/** Proves the independent concurrent rejection won and the stale UI changed nothing.
 * @param before Old checker version.
 * @param winner Independent saved competing result.
 * @param after Fresh persisted read after the stale UI attempt.
 * @param owned Scenario identity and winning checker.
 */
export function assertCheckerWinner(
  before: IDraftCasefileSnapshot,
  winner: IDraftCasefileSnapshot,
  after: IDraftCasefileSnapshot,
  owned: IOwnedDraftCasefile,
): void {
  expect(versionValue(winner.etag) > versionValue(before.etag), 'winner advanced ETag').to.equal(true);
  expect(winner.draft.draft_casefile_id).to.equal(owned.id);
  expect(winner.draft.submitted_by).to.equal(owned.inputterId);
  expect(winner.draft.casefile.respondent_account.remo_reference).to.equal(owned.marker);
  expect(winner.draft.casefile_status, 'persisted winning status').to.equal('REJECTED');
  expect(winner.draft.timeline_data).to.have.length(before.draft.timeline_data.length + 1);
  const additions = winner.draft.timeline_data.filter(
    (event) => !before.draft.timeline_data.some((old) => Cypress._.isEqual(old, event)),
  );
  expect(additions, 'one new winning event').to.have.length(1);
  expect(additions[0].status).to.equal('Rejected');
  expect(additions[0].username).to.equal(owned.checkerName);
  expect(additions[0].reason_text).to.equal('Synthetic winning concurrent decision');
  assertUnchangedDraft(winner, after);
}

/** Owns actual navigation and pass-through observation. Each new Given creates a fresh instance. */
export class CheckerReviewActions {
  private readonly fixture = new CheckerReviewFixtureActions();
  private readonly recovery = new DraftCasefileRecoveryActions();
  private readonly publication = new InputterMonitoringFixtureActions();
  private readonly inputter = new InputterCasefileMonitoringActions();
  private owned?: IOwnedDraftCasefile;
  private before?: IDraftCasefileSnapshot;
  private saved?: IDraftCasefileSnapshot;
  private winner?: IDraftCasefileSnapshot;
  private monitor?: IDraftCasefileMonitor;
  private rows: IOpalMaintenanceDraftCasefileSummary[] = [];
  private scanning = false;
  private protectedKind = '';
  private fixtureKind = '';
  private detailReads = 0;
  private checkerObservation = true;

  /** Requires an explicitly supported checker decision.
   * @param decision Feature decision.
   * @returns Narrowed supported value.
   */
  private decision(decision: string): 'approve' | 'reject' {
    if (decision !== 'approve' && decision !== 'reject') throw new Error('Unsupported checker decision');
    return decision;
  }

  /** Returns the scenario-owned identity.
   * @returns Owned record.
   */
  private requireOwned(): IOwnedDraftCasefile {
    if (!this.owned) throw new Error('Checker fixture missing');
    return this.owned;
  }

  /** Returns the independent original detail version.
   * @returns Original aggregate.
   */
  private baseline(): IDraftCasefileSnapshot {
    if (!this.before) throw new Error('Checker baseline missing');
    return this.before;
  }

  /** Runs the shared strict scan for every meaningful state visited by accessibility journeys. */
  private scan(): void {
    if (this.scanning) accessibilityActions.checkAccessibilityOnly();
  }

  /** Activates a native focused control.
   * @param selector Shared semantic selector.
   */
  private enter(selector: string): void {
    cy.get(selector).should('be.visible').focus().should('be.focused');
    pressDashboardEnter();
  }

  /** Creates the independently owned prerequisite after all transition safety checks.
   * @param status Submitted or Resubmitted.
   * @param kind Publication, decision, validation or stale fixture.
   */
  public prepare(status: string, kind: string): void {
    if (status !== 'SUBMITTED' && status !== 'RESUBMITTED') throw new Error('Unsupported checker prerequisite');
    if (!['publication', 'decision', 'validation', 'stale'].includes(kind))
      throw new Error('Unsupported checker fixture');
    if (kind !== 'validation') this.fixture.requireLifecycleCleanup();
    this.fixtureKind = kind;
    this.fixture.create(status, kind === 'publication').then((owned) => {
      this.owned = owned;
      readDraftSnapshot(owned.id).then((before) => {
        this.before = before;
      });
      performAuthentication(owned.checker);
      this.observeQueue(owned);
      this.openQueue();
      this.openOwned();
    });
  }

  /** Observes provider-owned checker collection/count responses without replacing them.
   * @param owned Scenario record and checker identity.
   */
  private observeQueue(owned: IOwnedDraftCasefile): void {
    cy.intercept('GET', /\/opal-maintenance-service\/draft-casefiles(?:\?|$)/, (request) => {
      if (!this.checkerObservation) {
        request.continue();
        return;
      }
      const query = { ...request.query };
      expect(query['business_unit_id']).to.equal('44');
      expect(query['not_submitted_by']).to.equal(owned.checkerId);
      const count = query['restrict'] === 'counts';
      if (count) {
        expect(query).to.have.all.keys('business_unit_id', 'not_submitted_by', 'casefile_status', 'restrict');
        expect(query['casefile_status']).to.be.oneOf(['REJECTED', 'PUBLISHING_FAILED']);
        request.alias = 'checkerCount';
      } else {
        expect(query).to.deep.equal({
          business_unit_id: '44',
          not_submitted_by: owned.checkerId,
          casefile_status: 'SUBMITTED,RESUBMITTED',
        });
        request.alias = 'checkerQueue';
      }
      request.continue((response) => {
        expect(response.statusCode, 'actual checker collection response').to.equal(200);
        if (count) {
          decodeDraftCasefileCount(response.body);
          expect(Object.keys(response.body)).to.deep.equal(['count']);
        } else this.rows = decodeDraftCasefileList(response.body).summaries;
      });
    });
  }

  /** Enters through Cases and the checker link before selecting the real To review collection. */
  private openQueue(): void {
    cy.visit('/dashboard');
    cy.contains(P.items, P.labels.cases).focus().should('be.focused');
    pressDashboardEnter();
    cy.location('pathname').should('equal', '/dashboard/cases');
    this.scan();
    this.enter(D.checkerEntry);
    cy.wait('@checkerQueue');
    cy.wait('@checkerCount');
    cy.wait('@checkerCount');
    cy.get(D.heading).should('have.text', 'Review cases').and('be.focused');
    this.scan();
    this.enter(D.tab('to-review'));
    cy.get(D.tab('to-review')).should('be.focused').and('have.attr', 'aria-current', 'page');
    this.scan();
  }

  /** Waits for the actual destination page before another lookup or scan.
   * @param direction Relative queue movement.
   */
  private changeQueuePage(direction: 'next' | 'previous'): void {
    cy.get(D.pagination)
      .find('a[aria-current="page"]')
      .invoke('attr', 'aria-label')
      .then((label) => {
        expect(label, 'actual checker page label').to.match(/^Page [1-9]\d*$/);
        const current = Number(label?.split(' ').pop());
        const target = current + (direction === 'next' ? 1 : -1);
        this.enter(direction === 'next' ? D.allRejectedNext : D.allRejectedPrevious);
        new AllRejectedActions().expectPage(target);
      });
  }

  /** Locates the owned row through actual client pagination before native activation.
   * @param id Required owned identity.
   */
  private locate(id: number): void {
    cy.get('body').then((body) => {
      if (body.find(D.row(id)).length) return;
      expect(body.find(D.allRejectedNext), 'owned queue row reachable').to.have.length(1);
      this.changeQueuePage('next');
      this.scan();
      this.locate(id);
    });
  }

  /** Opens only the exact owned queue row and requires the real matching detail GET. */
  private openOwned(): void {
    const owned = this.requireOwned();
    cy.then(() => {
      const matches = this.rows.filter((row) => row.draft_casefile_id === owned.id);
      expect(matches, 'owned queue response identity').to.have.length(1);
      expect(matches[0].submitted_by).to.equal(owned.inputterId);
      expect(matches[0].business_unit_id).to.equal(44);
      expect(matches[0].casefile_status).to.equal(this.baseline().draft.casefile_status);
    });
    cy.intercept(
      { method: 'GET', url: `**/opal-maintenance-service/draft-casefiles/${owned.id}`, times: 1 },
      (request) => {
        this.detailReads++;
        request.continue((response) => {
          expect(response.statusCode, 'actual owned review GET').to.equal(200);
          assertUnchangedDraft(this.baseline(), decodeDraftSnapshot(owned.id, response.body, response.headers['etag']));
        });
      },
    ).as('checkerDetail');
    this.locate(owned.id);
    cy.get(D.row(owned.id))
      .find(D.column('submittedByName'))
      .should((cell) => expect(cell.text().trim()).to.equal(owned.inputterName));
    this.enter(`${D.row(owned.id)} ${D.column('respondent')} a`);
    cy.wait('@checkerDetail');
    cy.location('pathname').should('equal', `/${PATHS.root}/${PATHS.children.review}/${owned.id}`);
    cy.get(S.reviewHeading).should('be.visible');
    this.recovery.capture('approve');
    this.scan();
    cy.then(() => {
      this.monitor = armDraftCasefileMutation(owned.id, 'PATCH', 'none');
    });
  }

  /** Selects the rendered decision and observes one actual successful UI PATCH.
   * @param decision Supported checker decision.
   */
  public decide(decision: string): void {
    const chosen = this.decision(decision);
    if (chosen === 'approve' && this.fixtureKind !== 'publication')
      throw new Error('Approval requires a publication fixture');
    this.recovery.choose(chosen);
    this.scan();
    this.recovery.submit(chosen, this.scanning);
    cy.wait('@draftMutation').then(({ response }) => {
      if (!response) throw new Error('Actual decision receipt missing');
      this.saved = assertCheckerReceipt(
        response.statusCode,
        response.body,
        response.headers['etag'],
        this.requireOwned(),
        this.baseline().etag,
      );
      expect(this.saved.draft.casefile_status, 'actual decision receipt lifecycle').to.be.oneOf(
        chosen === 'approve' ? ['PUBLISHING_PENDING', 'PUBLISHED'] : ['REJECTED'],
      );
      this.assertAddedEvent(this.saved, chosen);
    });
  }

  /** Requires persisted status, exact additional history, notice and absence from the real queue.
   * @param decision Supported checker decision.
   */
  public assertDecision(decision: string): void {
    const chosen = this.decision(decision);
    const owned = this.requireOwned();
    cy.then(() => {
      if (!this.monitor || !this.saved) throw new Error('Decision observation missing');
      assertCheckerAttempt(this.monitor, this.baseline().etag, 200);
      this.recovery.assertRetrySuccess(chosen, this.saved);
    });
    this.scan();
    cy.wait('@checkerQueue');
    readDraftSnapshot(owned.id).then((saved) => {
      if (!this.saved) throw new Error('Decision receipt missing');
      expect(versionValue(saved.etag) >= versionValue(this.saved.etag)).to.equal(true);
      expect(saved.draft.casefile_status).to.be.oneOf(
        chosen === 'approve' ? ['PUBLISHING_PENDING', 'PUBLISHED'] : ['REJECTED'],
      );
      this.assertAddedEvent(saved, chosen);
      this.saved = saved;
    });
    cy.then(() =>
      expect(
        this.rows.some((row) => row.draft_casefile_id === owned.id),
        'owned case left provider To review',
      ).to.equal(false),
    );
    this.firstQueuePage();
    this.assertAbsentFromPages(owned.id);
    if (chosen === 'reject') this.inputterRejection();
  }

  /** Requires the complete unchanged prior history plus one exact checker event.
   * @param saved Independent persisted outcome.
   * @param decision Decision to verify.
   */
  private assertAddedEvent(saved: IDraftCasefileSnapshot, decision: 'approve' | 'reject'): void {
    const before = this.baseline().draft.timeline_data;
    for (const old of before)
      expect(
        saved.draft.timeline_data.some((event) => Cypress._.isEqual(old, event)),
        'prior lifecycle retained',
      ).to.equal(true);
    const additions = saved.draft.timeline_data.filter((event) => !before.some((old) => Cypress._.isEqual(old, event)));
    expect(additions).to.have.length(1);
    expect(additions[0].status).to.equal(decision === 'approve' ? 'Approved' : 'Rejected');
    expect(additions[0].username).to.equal(this.requireOwned().checkerName);
    if (decision === 'reject') expect(additions[0].reason_text).to.equal(this.recovery.expectedReason());
  }

  /** Returns through actual pagination so absence is checked over the whole collection. */
  private firstQueuePage(): void {
    cy.get('body').then((body) => {
      if (!body.find(D.allRejectedPrevious).length) return;
      this.changeQueuePage('previous');
      this.scan();
      this.firstQueuePage();
    });
  }

  /** Requires absence on every actual collection page.
   * @param id Owned record that must have left review.
   */
  private assertAbsentFromPages(id: number): void {
    cy.get(D.row(id)).should('not.exist');
    this.scan();
    cy.get('body').then((body) => {
      if (!body.find(D.allRejectedNext).length) return;
      this.changeQueuePage('next');
      this.assertAbsentFromPages(id);
    });
  }

  /** Follows the real rejected inputter row into its persisted detail and exact timeline. */
  private inputterRejection(): void {
    const owned = this.requireOwned();
    cy.then(() => {
      this.checkerObservation = false;
      performAuthentication(owned.inputter);
    });
    cy.then(() => {
      this.inputter.observe(owned.inputterId);
      this.inputter.open('rejected');
      this.inputter.expectRows([owned], [], this.scanning);
      this.inputter.openAmendment(owned, this.scanning);
    });
    cy.then(() => {
      if (!this.saved) throw new Error('Saved rejection missing');
      cy.get(C.review.history).within(() => {
        cy.get(S.timelineItem).should('have.length', this.saved!.draft.timeline_data.length);
        for (const event of this.saved!.draft.timeline_data) {
          cy.root().should('contain.text', event.status).and('contain.text', event.username);
          if (event.reason_text) cy.root().should('contain.text', event.reason_text);
        }
      });
    });
    this.scan();
  }

  /** Requires actual complete publication and every generated number on its exact inputter row. */
  public assertPublication(): void {
    const owned = this.requireOwned();
    cy.then(() => {
      this.checkerObservation = false;
      performAuthentication(owned.inputter);
    });
    this.publication.readPublished(owned).then((saved) => {
      expect(saved.draft.casefile_status).to.equal('PUBLISHED');
      this.inputter.observe(owned.inputterId);
      this.inputter.open('approved');
      this.inputter.expectRows([owned], [], this.scanning);
      this.inputter.expectAccounts(owned, false, this.scanning);
      this.scan();
    });
  }

  /** Selects Reject with an actually blank textarea and attempts validation without any PATCH. */
  public rejectBlank(): void {
    cy.get(S.reject).check();
    cy.get(S.reason).should('be.visible').clear().should('have.value', '');
    this.scan();
    this.recovery.submit('reject', this.scanning);
  }

  /** Proves exact linked validation, native focus, zero writes and an unchanged fresh aggregate. */
  public assertValidation(): void {
    cy.get(C.review.decisionSummary)
      .should('be.visible')
      .and('be.focused')
      .and('contain.text', 'Enter reason for rejection');
    this.scan();
    cy.get(C.review.rejectionReasonSummaryLink)
      .should('have.text', 'Enter reason for rejection')
      .focus()
      .should('be.focused');
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get(S.reason)
      .should('be.focused')
      .and('have.attr', 'aria-describedby')
      .and('include', 'create_casefile_review_rejection_reason-error-message');
    cy.get(C.review.rejectionReasonError).should('contain.text', 'Enter reason for rejection');
    if (this.scanning) {
      cy.get(S.reason).type('Synthetic corrected reason');
      this.scan();
    }
    this.assertNoMutation();
  }

  /** Proves that the installed monitor remained active while no lifecycle PATCH occurred. */
  private assertNoMutation(): void {
    cy.then(() => assertCheckerNoPatch(this.monitor));
    const owned = this.requireOwned();
    readDraftSnapshot(owned.id).then((saved) => assertUnchangedDraft(this.baseline(), saved));
  }

  /** Creates separate self-owned or permission-denied protection prerequisites.
   * @param kind Self or denied.
   */
  public prepareProtection(kind: string): void {
    if (kind !== 'self' && kind !== 'denied') throw new Error('Unsupported checker protection');
    this.protectedKind = kind;
    const creation = kind === 'self' ? this.fixture.createSelfOwned() : this.fixture.create('SUBMITTED');
    creation.then((owned) => {
      this.owned = owned;
      readDraftSnapshot(owned.id).then((saved) => {
        this.before = saved;
      });
      if (kind === 'denied') {
        const denied = String(Cypress.env('PO10625_DENIED_EMAIL') || 'opal-test-4@dev.platform.hmcts.net');
        expect([owned.inputter, owned.checker]).not.to.include(denied);
        performAuthentication(denied);
        cy.request<IOpalUserStateResponse>({ url: '/api/user-state', log: false }).then(({ status, body }) => {
          expect(status, 'actual denied actor preflight').to.equal(200);
          expect(body.status).to.equal('ACTIVE');
          const units = body.domains['maintenance']?.business_unit_users ?? [];
          expect(
            units.some(
              (unit) =>
                unit.business_unit_id === 44 && unit.permissions.some((permission) => permission.permission_id === 22),
            ),
            'actual actor lacks permission22',
          ).to.equal(false);
        });
      }
    });
  }

  /** Attempts the real protected checker route, with pass-through detail and mutation monitors. */
  public attemptProtectedDecision(): void {
    const owned = this.requireOwned();
    cy.intercept('GET', `**/opal-maintenance-service/draft-casefiles/${owned.id}`, (request) => {
      this.detailReads++;
      request.continue();
    }).as('protectedDetail');
    this.monitor = armDraftCasefileMutation(owned.id, 'PATCH', 'none');
    cy.visit(`/${PATHS.root}/${PATHS.children.review}/${owned.id}`, {
      onBeforeLoad: (window) => {
        if (!this.monitor) throw new Error('Protection monitor missing');
        const restore = installDraftCasefileFetchMonitor(window, owned.id, 'PATCH', 'none', this.monitor);
        Cypress.once('test:after:run', restore);
      },
    });
  }

  /** Proves actual read-only review or denied route, then restores the owner for a fresh unchanged read. */
  public assertProtected(): void {
    if (this.protectedKind === 'self') {
      cy.wait('@protectedDetail').then(({ response }) => {
        expect(response?.statusCode).to.equal(200);
        assertUnchangedDraft(
          this.baseline(),
          decodeDraftSnapshot(this.requireOwned().id, response?.body, response?.headers['etag']),
        );
      });
      cy.get(S.reviewHeading).should('be.visible');
      cy.get(S.status).should('have.text', 'To review');
    } else {
      cy.location('pathname').should('equal', '/access-denied');
      for (const selector of [S.reviewHeading, S.reviewSections, S.history]) cy.get(selector).should('not.exist');
      cy.then(() => expect(this.detailReads, 'denied case detail requests').to.equal(0));
    }
    for (const selector of [S.approve, S.reject, S.reason, S.continue, S.deleteLink])
      cy.get(selector).should('not.exist');
    this.scan();
    cy.then(() => performAuthentication(this.requireOwned().inputter));
    this.assertNoMutation();
  }

  /** Advances the server independently while retaining the original rendered decision and ETag.
   * @param decision Intended stale checker decision.
   */
  public compete(decision: string): void {
    const chosen = this.decision(decision);
    this.recovery.choose(chosen);
    this.scan();
    requestDraftChange(this.baseline(), 'PATCH', {
      business_unit_id: 44,
      casefile_status: 'REJECTED',
      status_message: 'Synthetic winning concurrent decision',
    });
    readDraftSnapshot(this.requireOwned().id).then((winner) => {
      this.winner = winner;
      assertCheckerWinner(this.baseline(), winner, winner, this.requireOwned());
    });
    this.recovery.submit(chosen, this.scanning);
    cy.wait('@draftMutation').its('response.statusCode').should('equal', 409);
  }

  /** Proves the actual shared conflict page, single stale UI attempt and unchanged independent winner. */
  public assertConflict(): void {
    this.recovery.assertSafeConflict();
    this.scan();
    cy.then(() => {
      if (!this.monitor) throw new Error('Stale monitor missing');
      assertCheckerAttempt(this.monitor, this.baseline().etag, 409);
    });
    readDraftSnapshot(this.requireOwned().id).then((saved) => {
      if (!this.winner) throw new Error('Persisted competing winner missing');
      assertCheckerWinner(this.baseline(), this.winner, saved, this.requireOwned());
    });
  }

  /** Runs broad independent accessibility journeys with strict scans and native keyboard controls.
   * @param kind Publication, rejection, validation, self, denied or stale.
   */
  public accessible(kind: string): void {
    if (!['publication', 'rejection', 'validation', 'self', 'denied', 'stale'].includes(kind))
      throw new Error('Unsupported checker accessibility journey');
    this.scanning = true;
    if (kind === 'self' || kind === 'denied') {
      this.prepareProtection(kind);
      cy.then(() => {
        this.attemptProtectedDecision();
        this.assertProtected();
      });
      return;
    }
    const fixtureKind = kind === 'rejection' ? 'decision' : kind;
    this.prepare('SUBMITTED', fixtureKind);
    cy.then(() => {
      if (kind === 'validation') {
        this.rejectBlank();
        this.assertValidation();
      } else if (kind === 'stale') {
        this.compete('approve');
        this.assertConflict();
      } else {
        const decision = kind === 'publication' ? 'approve' : 'reject';
        this.decide(decision);
        this.assertDecision(decision);
        if (kind === 'publication') this.assertPublication();
      }
    });
  }
}
