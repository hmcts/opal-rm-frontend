import { CASES_DRAFT_CHECKER_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-checker-routing-paths.constant';
import type { CasesDraftCheckerTab } from 'src/app/flows/cases/cases-draft/types/cases-draft-tab.type';
import type { IOpalMaintenanceDraftCasefileSummary } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-summary.interface';
import {
  decodeDraftCasefileCount,
  decodeDraftCasefileList,
} from 'src/app/flows/cases/services/opal-maintenance-service/utils/opal-maintenance-draft-casefile-response';
import { CasesDraftSelectors as S } from '../../../../../shared/selectors/cases-draft.selectors';
import { PrimaryNavigationLocators as P } from '../../../../../shared/selectors/primary-navigation.locators';
import { pressDashboardEnter } from '../../../../../support/utils/press-dashboard-enter';
import { performAuthentication } from '../../../../actions/login.actions';
import { accessibilityActions } from '../accessibility/accessibility.actions';
import { InputterMonitoringFixtureActions } from './inputter-monitoring-fixture.actions';
import { requireMembership } from './draft-casefile-fixture.actions';
import { readDraftSnapshot } from './draft-casefile-evidence.actions';
import { monitoringCalendar } from './inputter-monitoring-date';
import type { IOwnedDraftCasefile } from './interfaces/draft-casefile-owned.interface';

const TABS = {
  'to-review': { status: 'SUBMITTED,RESUBMITTED', empty: 'There are no cases to review.' },
  rejected: { status: 'REJECTED', empty: 'There are no rejected cases.' },
  deleted: { status: 'DELETED', empty: 'No cases have been deleted in the past 7 days.' },
  failed: { status: 'PUBLISHING_FAILED', empty: 'There are no failed cases.' },
};
type Calendar = ReturnType<typeof monitoringCalendar>;
type WindowResult = { days: number; response: boolean; dom: boolean };

/** Requires the exact checker filter without inferring scope from rendered rows.
 * @param query Actual pass-through query.
 * @param actor Verified permission22 identity.
 * @param calendar Independent consultation endpoints.
 */
export function assertCheckerWindowQuery(query: Record<string, unknown>, actor: string, calendar: Calendar): void {
  expect(query['casefile_status'], 'supported checker status').to.be.oneOf(
    Object.values(TABS).map((tab) => tab.status),
  );
  const expected: Record<string, unknown> = {
    business_unit_id: '44',
    not_submitted_by: actor,
    casefile_status: query['casefile_status'],
  };
  if (query['restrict'] !== undefined) {
    expect(query['casefile_status'], 'independent outcome count').to.be.oneOf(['REJECTED', 'PUBLISHING_FAILED']);
    expected['restrict'] = 'counts';
  } else if (query['casefile_status'] === 'DELETED') {
    expected['casefile_status_from_date'] = calendar.from;
    expected['casefile_status_to_date'] = calendar.to;
  }
  expect(query, 'exact checker query').to.deep.equal(expected);
}

/** Rejects a zero label when either real collection evidence disagrees.
 * @param body Actual collection response.
 */
export function assertCheckerEmptyCollection(body: unknown): void {
  const list = decodeDraftCasefileList(body);
  expect(list.count, 'genuinely empty checker count').to.equal(0);
  expect(list.summaries, 'genuinely empty checker collection').to.have.length(0);
}

/** Requires all four consultations and independent provider/rendered outcomes.
 * @param results Recorded observations, never constructed expected responses.
 * @param window Explicit business rule.
 */
export function assertCheckerWindowResults(results: WindowResult[], window: string): void {
  if (window !== 'unbounded' && window !== 'seven-day') throw new Error('Unknown checker window');
  expect(
    results.map((result) => result.days),
    'four real calendar consultations',
  ).to.deep.equal([0, 3, 7, 8]);
  for (const result of results) {
    const included = window === 'unbounded' || result.days <= 7;
    expect(result.response, `D+${result.days} provider inclusion`).to.equal(included);
    expect(result.dom, `D+${result.days} DOM inclusion`).to.equal(included);
  }
}

/** Owns real checker responses, native UI consultation and scenario-local evidence. */
export class CheckerDashboardWindowActions {
  private owned?: IOwnedDraftCasefile;
  private status?: 'REJECTED' | 'DELETED';
  private timestamp?: string;
  private calendar?: Calendar;
  private rows: IOpalMaintenanceDraftCasefileSummary[] = [];
  private body: unknown;
  private query: Record<string, unknown> = {};
  private results: WindowResult[] = [];
  private emptyTabs: CasesDraftCheckerTab[] = [];
  private counts = new Map<string, number>();
  private writes = 0;
  private scanning = false;

  /** Enables the maintained strict scan without adding exemptions. */
  public enableAccessibility(): void {
    this.scanning = true;
  }

  /** Runs before every transition away from a meaningful visited state. */
  private scan(): void {
    if (this.scanning) accessibilityActions.checkAccessibilityOnly();
  }

  /** Creates one real outcome with required owner/marker cleanup.
   * @param status Required persisted outcome.
   */
  public prepare(status: string): void {
    if (status !== 'REJECTED' && status !== 'DELETED') throw new Error('Unsupported checker outcome');
    this.status = status;
    new InputterMonitoringFixtureActions().create(status).then((owned) => {
      this.owned = owned;
      readDraftSnapshot(owned.id).then((snapshot) => {
        expect(snapshot.draft.casefile_status).to.equal(status);
        expect(snapshot.draft.submitted_by).to.equal(owned.inputterId);
        expect(snapshot.draft.casefile.respondent_account.remo_reference).to.equal(owned.marker);
        this.timestamp = snapshot.draft.casefile_status_date;
        monitoringCalendar(this.timestamp, 0);
      });
      performAuthentication(owned.checker);
      requireMembership(22).then(({ id }) => {
        expect(id, 'actual independent checker').to.equal(owned.checkerId);
        expect(id).not.to.equal(owned.inputterId);
        this.observe(id);
      });
    });
  }

  /** Installs pass-through observers after setup, preserving actual provider data.
   * @param actor Actual permission22 BU identity.
   */
  public observe(actor: string): void {
    cy.intercept('GET', /\/opal-maintenance-service\/draft-casefiles(?:\?|$)/, (request) => {
      const query = { ...request.query };
      assertCheckerWindowQuery(query, actor, this.calendar ?? monitoringCalendar(new Date().toISOString(), 0));
      const count = query['restrict'] === 'counts';
      request.alias = count ? 'checkerWindowCount' : 'checkerWindowList';
      request.continue((response) => {
        expect(response.statusCode, 'actual checker provider status').to.equal(200);
        if (count) {
          expect(Object.keys(response.body), 'counts-only privacy').to.deep.equal(['count']);
          this.counts.set(String(query['casefile_status']), decodeDraftCasefileCount(response.body).count);
        } else {
          this.query = query;
          this.body = response.body;
          const list = decodeDraftCasefileList(response.body);
          this.rows = list.summaries;
          if (query['casefile_status'] === 'REJECTED' || query['casefile_status'] === 'PUBLISHING_FAILED')
            this.counts.set(String(query['casefile_status']), list.count);
          for (const row of this.rows) {
            expect(row.business_unit_id, 'actual checker BU row').to.equal(44);
            expect(row.submitted_by, 'actual checker own work excluded').not.to.equal(actor);
            expect(String(query['casefile_status']).split(','), 'actual checker status row').to.include(
              row.casefile_status,
            );
          }
        }
      });
    });
    cy.intercept(
      { method: '+(POST|PUT|PATCH|DELETE)', url: /\/opal-maintenance-service\/draft-casefiles(?:[/?]|$)/ },
      (request) => {
        this.writes++;
        request.continue();
      },
    );
  }

  /** Traverses native Cases entry and checks routed heading focus separately from tab focus. */
  public open(): void {
    cy.visit('/dashboard');
    this.enter(P.items, P.labels.cases);
    cy.location('pathname').should('equal', '/dashboard/cases');
    this.scan();
    this.enter(S.checkerEntry);
    this.waitList('to-review');
    cy.wait('@checkerWindowCount');
    cy.wait('@checkerWindowCount');
    cy.get(S.heading).should('have.text', 'Review cases').and('be.focused');
    this.scan();
  }

  /** Native Enter on a real visible control.
   * @param selector Maintained selector.
   * @param text Optional navigation label.
   */
  private enter(selector: string, text?: string): void {
    const element = text ? cy.contains(selector, text) : cy.get(selector);
    element.should('be.visible').focus().should('be.focused');
    pressDashboardEnter();
  }

  /** Requires the just-observed actual list to match the selected lifecycle.
   * @param tab Selected tab.
   */
  private waitList(tab: CasesDraftCheckerTab): void {
    cy.wait('@checkerWindowList').then(() => expect(this.query['casefile_status']).to.equal(TABS[tab].status));
    cy.location('pathname').should('equal', '/' + PATHS.root + '/' + PATHS.children.tabs);
    cy.location('hash').should('equal', '#' + tab);
    cy.location('search').should('equal', '');
    cy.get(S.tab(tab)).should('have.attr', 'aria-current', 'page');
    cy.then(() => {
      if (this.rows.length) cy.get(S.tableRows).should('have.length.greaterThan', 0);
      else cy.get(S.empty).should('be.visible').and('have.text', TABS[tab].empty);
    });
  }

  /** Selects a fresh tab through native keyboard activation.
   * @param tab Target lifecycle.
   */
  public select(tab: CasesDraftCheckerTab): void {
    cy.location('hash').then((hash) => {
      this.enter(S.tab(tab));
      if (hash !== '#' + tab) {
        this.waitList(tab);
        const counts = tab === 'rejected' || tab === 'failed' ? 1 : 2;
        for (let index = 0; index < counts; index++) cy.wait('@checkerWindowCount');
      }
      cy.get(S.tab(tab)).should('be.focused').and('have.attr', 'aria-current', 'page');
      this.scan();
    });
  }

  /** Replaces AUT Date only for this consultation, restoring it before the next visit.
   * @param days Calendar offset from the actual persisted lifecycle timestamp.
   */
  public consultDay(days: number): void {
    cy.then(() => {
      if (!this.timestamp || !this.status || !this.owned) throw new Error('Checker outcome baseline missing');
      this.calendar = monitoringCalendar(this.timestamp, days);
      cy.clock(this.calendar.now, ['Date']);
      this.select('to-review');
      this.select(this.status === 'REJECTED' ? 'rejected' : 'deleted');
      cy.then(() => {
        const owned = this.owned!;
        const matches = this.rows.filter((row) => row.draft_casefile_id === owned.id);
        expect(matches.length, 'unique owned response').to.be.lessThan(2);
        if (matches.length) {
          expect(matches[0].submitted_by).to.equal(owned.inputterId);
          expect(matches[0].casefile_status_date, 'same actual persisted lifecycle date').to.equal(this.timestamp);
        }
        const response = matches.length === 1;
        this.collectIds().then((ids) => this.results.push({ days, response, dom: ids.has(owned.id) }));
      });
      cy.clock().then((clock) => clock.restore());
      cy.then(() => {
        this.calendar = undefined;
      });
    });
  }

  /** Collects all real pagination rows, requiring every observed row to be visible.
   * @param ids Already visited identities.
   * @returns Identities actually rendered across every page.
   */
  public collectIds(ids = new Set<number>()): Cypress.Chainable<Set<number>> {
    return cy.get('body').then((body) => {
      body.find(S.tableRows).each((_, row) => {
        const id = Number(row.getAttribute('data-draft-id'));
        expect(Number.isSafeInteger(id) && id > 0, 'real rendered row identity').to.equal(true);
        cy.get(S.row(id)).should('be.visible');
        ids.add(id);
      });
      this.scan();
      if (!body.find(S.allRejectedNext).length) return cy.wrap(ids, { log: false });
      cy.get(S.pagination)
        .find('a[aria-current="page"]')
        .invoke('attr', 'aria-label')
        .then((label) => {
          expect(label).to.match(/^Page [1-9]\d*$/);
          const target = Number(label!.split(' ').pop()) + 1;
          this.enter(S.allRejectedNext);
          cy.get(S.pagination).find(`a[aria-label="Page ${target}"]`).should('have.attr', 'aria-current', 'page');
        });
      return cy.then(() => this.collectIds(ids));
    });
  }

  /** Rechecks all stored real response/DOM results in the explicit Then.
   * @param window Expected business rule.
   */
  public assertWindow(window?: string): void {
    cy.then(() => {
      const expected = this.status === 'REJECTED' ? 'unbounded' : 'seven-day';
      if (window !== undefined) expect(window, 'feature window matches fixture').to.equal(expected);
      assertCheckerWindowResults(this.results, expected);
      expect(this.writes, 'no consultation mutation').to.equal(0);
    });
  }

  /** Authenticates the checker and proves real empty collections/counts without creating or deleting anything. */
  public prepareEmpty(): void {
    performAuthentication(String(Cypress.env('PO10626_CHECKER_EMAIL') || 'opal-test-10@dev.platform.hmcts.net'));
    requireMembership(22).then(({ id }) => {
      const calendar = monitoringCalendar(new Date().toISOString(), 0);
      for (const tab of Object.keys(TABS) as CasesDraftCheckerTab[]) {
        const qs = {
          business_unit_id: 44,
          not_submitted_by: id,
          casefile_status: TABS[tab].status,
          ...(tab === 'deleted'
            ? { casefile_status_from_date: calendar.from, casefile_status_to_date: calendar.to }
            : {}),
        };
        cy.request<unknown>({
          method: 'GET',
          url: '/opal-maintenance-service/draft-casefiles',
          qs,
          failOnStatusCode: false,
          retryOnNetworkFailure: false,
          retryOnStatusCodeFailure: false,
          log: false,
        }).then(({ status, body }) => {
          expect(status, 'actual empty checker preflight').to.equal(200);
          assertCheckerEmptyCollection(body);
        });
        if (tab === 'rejected' || tab === 'failed')
          cy.request<unknown>({
            method: 'GET',
            url: '/opal-maintenance-service/draft-casefiles',
            qs: { ...qs, restrict: 'counts' },
            failOnStatusCode: false,
            retryOnNetworkFailure: false,
            retryOnStatusCodeFailure: false,
            log: false,
          }).then(({ status, body }) => {
            expect(status, 'actual empty count preflight').to.equal(200);
            expect(Object.keys(body as object), 'counts-only preflight').to.deep.equal(['count']);
            expect(decodeDraftCasefileCount(body).count, 'genuinely zero checker preflight count').to.equal(0);
          });
      }
      this.observe(id);
    });
  }

  /** Visits each rendered empty lifecycle tab and retains actual collection evidence. */
  public consultEmpty(): void {
    for (const tab of Object.keys(TABS) as CasesDraftCheckerTab[]) {
      this.select(tab);
      this.expectEmptyTab(tab);
    }
  }

  /** Requires true empty copy, no rendered rows and zero actual outcome counts.
   * @param tab Tab just visited.
   */
  private expectEmptyTab(tab: CasesDraftCheckerTab): void {
    cy.then(() => {
      assertCheckerEmptyCollection(this.body);
      expect(this.counts.get('REJECTED'), 'actual zero rejected count').to.equal(0);
      expect(this.counts.get('PUBLISHING_FAILED'), 'actual zero failed count').to.equal(0);
      this.emptyTabs.push(tab);
    });
    cy.get(S.empty).should('have.text', TABS[tab].empty).and('be.visible');
    cy.get(S.tableRows).should('not.exist');
    cy.get(S.rejectedCount).should('not.exist');
    cy.get(S.failedCount).should('not.exist');
    this.scan();
  }

  /** Explicit Then rechecks all visited empty tabs and final real DOM/provider state. */
  public assertEmpty(): void {
    cy.then(() => {
      expect(this.emptyTabs, 'every real empty tab').to.deep.equal(Object.keys(TABS));
      assertCheckerEmptyCollection(this.body);
      expect(this.counts.get('REJECTED')).to.equal(0);
      expect(this.counts.get('PUBLISHING_FAILED')).to.equal(0);
      expect(this.writes, 'empty journey creates or deletes no records').to.equal(0);
    });
    cy.get(S.empty).should('be.visible').and('have.text', TABS.failed.empty);
    cy.get(S.tableRows).should('not.exist');
    cy.get(S.rejectedCount).should('not.exist');
    cy.get(S.failedCount).should('not.exist');
  }
}
