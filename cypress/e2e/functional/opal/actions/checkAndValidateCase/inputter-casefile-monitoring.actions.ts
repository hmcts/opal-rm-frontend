import type { IOpalUserStateResponse } from '@hmcts/opal-frontend-common/services/opal-user-service/interfaces';
import type { CasesDraftInputterTab } from 'src/app/flows/cases/cases-draft/types/cases-draft-tab.type';
import type { IOpalMaintenanceDraftCasefileSummary } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-summary.interface';
import {
  decodeDraftCasefileCount,
  decodeDraftCasefileList,
} from 'src/app/flows/cases/services/opal-maintenance-service/utils/opal-maintenance-draft-casefile-response';
import { CASES_DRAFT_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-routing-paths.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as CREATE_PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { performAuthentication } from '../../../../actions/login.actions';
import { CasesDraftSelectors as S } from '../../../../../shared/selectors/cases-draft.selectors';
import { CreateCasefileSelectors as CREATE } from '../../../../../shared/selectors/create-casefile.selectors';
import { pressDashboardEnter } from '../../../../../support/utils/press-dashboard-enter';
import { InputterDashboardActions } from '../createDraftCasefile/inputter-dashboard.actions';
import { AllRejectedActions } from '../createDraftCasefile/all-rejected.actions';
import { accessibilityActions } from '../accessibility/accessibility.actions';
import { CasefilePermissionPreflightActions } from '../createDraftCasefile/casefile-permission-preflight.actions';
import { assertUnchangedDraft, decodeDraftSnapshot, readDraftSnapshot } from './draft-casefile-evidence.actions';
import { requireMembership } from './draft-casefile-fixture.actions';
import { monitoringCalendar } from './inputter-monitoring-date';
import { assertMonitoringAccounts } from './inputter-monitoring-publication';
import type { IOwnedDraftCasefile } from './interfaces/draft-casefile-owned.interface';
import type { IDraftCasefileSnapshot } from './interfaces/draft-casefile-snapshot.interface';

const DASHBOARD = '/' + PATHS.root + '/' + PATHS.children.tabs;
const ALL_REJECTED = '/' + PATHS.root + '/' + PATHS.children.rejections;
const STATUSES = {
  'in-review': 'SUBMITTED,RESUBMITTED',
  rejected: 'REJECTED',
  approved: 'PUBLISHING_PENDING,PUBLISHED',
  deleted: 'DELETED',
};

/** Observes real provider traffic and owns browser consultation; never supplies business responses. */
export class InputterCasefileMonitoringActions {
  private readonly dashboard = new InputterDashboardActions();
  private readonly rejections = new AllRejectedActions();
  private summaries: IOpalMaintenanceDraftCasefileSummary[] = [];
  private query: Record<string, unknown> = {};
  private collectionRequests = 0;
  private writes = 0;
  private dateResults: { days: number; response: boolean; dom: boolean }[] = [];
  private dashboardPage = '';
  private dashboardSort = '';
  private dashboardIds: number[] = [];
  private rejectionPage = '';
  private rejectionSort = '';
  private rejectionIds: number[] = [];
  private selected?: IDraftCasefileSnapshot;
  private deniedActor = '';
  private observing = false;

  /** Installs pass-through list, count and write monitors after all fixture lifecycle changes.
   * @param actor Actual primary inputter BU identity used by personal queries.
   */
  public observe(actor: string): void {
    this.observing = true;
    cy.intercept('GET', /\/opal-maintenance-service\/draft-casefiles(?:\?|$)/, (request) => {
      if (!this.observing) {
        request.continue();
        return;
      }
      this.collectionRequests++;
      const query = { ...request.query };
      expect(query['business_unit_id']).to.equal('44');
      const personal = query['submitted_by'] !== undefined;
      if (personal) expect(query['submitted_by']).to.equal(actor);
      else expect(query).to.deep.equal({ business_unit_id: '44', casefile_status: 'REJECTED' });
      const count = query['restrict'] === 'counts';
      request.alias = personal ? 'monitoringList' : 'monitoringAllRejected';
      if (count) request.alias = 'monitoringCount';
      if (count) {
        expect(query).to.deep.equal({
          business_unit_id: '44',
          submitted_by: actor,
          casefile_status: 'REJECTED',
          restrict: 'counts',
        });
      }
      request.continue((response) => {
        if (!this.observing) return;
        expect(response.statusCode, 'real dashboard provider status').to.equal(200);
        if (count) {
          decodeDraftCasefileCount(response.body);
          expect(Object.keys(response.body), 'counts-only privacy').to.deep.equal(['count']);
        } else {
          this.query = query;
          this.summaries = decodeDraftCasefileList(response.body).summaries;
        }
      });
    });
    cy.intercept(
      { method: '+(POST|PUT|PATCH|DELETE)', url: /\/opal-maintenance-service\/draft-casefiles(?:[/?]|$)/ },
      (request) => {
        if (this.observing) this.writes++;
        request.continue();
      },
    );
  }

  /** Hands subsequent traffic to scoped completion/checker observers without clearing intercepts. */
  public releaseObservation(): void {
    cy.then(() => {
      this.observing = false;
    });
  }

  /** Opens a fresh released personal dashboard and validates its independent count.
   * @param tab Initial lifecycle selection.
   */
  public open(tab: CasesDraftInputterTab): void {
    this.dashboard.open(tab);
    this.waitPersonal(tab);
    cy.get(S.heading).should('be.focused');
    if (tab !== 'rejected') {
      cy.wait('@monitoringCount').then(({ response }) => {
        const { count } = decodeDraftCasefileCount(response?.body);
        if (count > 0)
          cy.get(S.rejectedCount).should((badge) =>
            expect(badge.text().trim()).to.equal(count > 99 ? '99+' : String(count)),
          );
        else cy.get(S.rejectedCount).should('not.exist');
      });
    }
  }

  /** Selects a real tab through native Enter and observes its fresh GET.
   * @param tab Required lifecycle tab.
   */
  public consult(tab: CasesDraftInputterTab): void {
    cy.get(S.tab(tab)).focus().should('be.focused');
    this.dashboard.selectTab(tab);
    this.waitPersonal(tab);
    cy.get(S.tab(tab)).should('be.focused');
  }

  /** Checks personal filter identity and keeps unbounded tabs free from date fields.
   * @param tab Expected lifecycle tab.
   */
  private waitPersonal(tab: CasesDraftInputterTab): void {
    cy.wait('@monitoringList').then(() => {
      expect(this.query['casefile_status']).to.equal(STATUSES[tab]);
      const bounded = tab === 'approved' || tab === 'deleted';
      const keys = ['business_unit_id', 'submitted_by', 'casefile_status'];
      if (bounded) keys.push('casefile_status_from_date', 'casefile_status_to_date');
      expect(this.query).to.have.all.keys(keys);
    });
    cy.location('pathname').should('eq', DASHBOARD);
    cy.location('hash').should('eq', '#' + tab);
    cy.location('search').should('eq', '');
    cy.get(S.tab(tab)).should('have.attr', 'aria-current', 'page');
    cy.then(() => {
      if (this.summaries.length) cy.get(S.tableRows).should('have.length.greaterThan', 0);
      else cy.get(S.empty).should('be.visible');
    });
  }

  /** Checks only scenario-owned identities, allowing unrelated authorised BU work.
   * @param tab Current personal lifecycle tab.
   * @param owned All records owned by this scenario, including any other inputter fixture.
   * @param actor Primary inputter identity.
   */
  public expectPersonal(tab: CasesDraftInputterTab, owned: IOwnedDraftCasefile[], actor: string): void {
    cy.then(() => {
      for (const item of owned) {
        const matches = this.summaries.filter((row) => row.draft_casefile_id === item.id);
        if (item.inputterId !== actor) expect(matches, 'other inputter excluded from personal work').to.have.length(0);
        else if (matches.length) {
          expect(matches).to.have.length(1);
          expect(matches[0].submitted_by).to.equal(item.inputterId);
          expect(matches[0].business_unit_id).to.equal(44);
          expect(STATUSES[tab].split(',')).to.include(matches[0].casefile_status);
        }
      }
    });
    this.expectNoWrites();
  }

  /** Verifies expected owned rows in both provider response and paginated DOM.
   * @param expected Exact owned records expected in this consultation.
   * @param absent Owned records that must not appear in this consultation.
   * @param scanStates Whether every visited collection page needs the maintained strict Axe check.
   */
  public expectRows(expected: IOwnedDraftCasefile[], absent: IOwnedDraftCasefile[] = [], scanStates = false): void {
    cy.then(() => {
      for (const owned of expected) {
        const rows = this.summaries.filter((row) => row.draft_casefile_id === owned.id);
        expect(rows, 'exact owned response identity').to.have.length(1);
        expect(rows[0].submitted_by, 'persisted owning actor').to.equal(owned.inputterId);
        expect(rows[0].business_unit_id).to.equal(44);
      }
      for (const owned of absent)
        expect(this.summaries.some((row) => row.draft_casefile_id === owned.id)).to.equal(false);
    });
    this.collectIds(new Set(), expected, scanStates).then((ids) => {
      for (const owned of expected) expect(ids.has(owned.id), 'owned DOM row').to.equal(true);
      for (const owned of absent) expect(ids.has(owned.id), 'excluded owned DOM row').to.equal(false);
    });
    this.expectNoWrites();
  }

  /** Traverses actual client pagination with native keyboard events, without assuming shared-BU totals.
   * @param ids IDs already observed on previous pages.
   * @param expected Owned records whose visible actor labels must match on every page.
   * @param scanStates Whether each page must be scanned before leaving it.
   * @returns All rendered IDs across this collection's pages.
   */
  private collectIds(
    ids = new Set<number>(),
    expected: IOwnedDraftCasefile[] = [],
    scanStates = false,
  ): Cypress.Chainable<Set<number>> {
    return cy.get('body').then((body) => {
      body.find(S.tableRows).each((_, row) => {
        ids.add(Number(row.getAttribute('data-draft-id')));
      });
      for (const owned of expected) {
        const row = body.find(S.row(owned.id));
        if (row.length) {
          cy.get(S.row(owned.id)).should('be.visible');
          if (row.find(S.column('submittedByName')).length)
            cy.get(S.row(owned.id))
              .find(S.column('submittedByName'))
              .should((cell) => expect(cell.text().trim()).to.equal(owned.inputterName));
        }
      }
      if (scanStates) accessibilityActions.checkAccessibilityOnly();
      if (!body.find(S.allRejectedNext).length) return cy.wrap(ids, { log: false });
      this.changePage('next');
      return cy.then(() => this.collectIds(ids, expected, scanStates));
    });
  }

  /** Consults real lifecycle dates at seven and eight local calendar days, replacing AUT Date only.
   * @param owned The persisted record whose lifecycle date anchors both visits.
   * @param tab Its corresponding dashboard tab.
   */
  public consultDates(owned: IOwnedDraftCasefile, tab: CasesDraftInputterTab): void {
    readDraftSnapshot(owned.id).then((snapshot) => {
      for (const days of [7, 8]) {
        const calendar = monitoringCalendar(snapshot.draft.casefile_status_date, days);
        if (days === 7) cy.clock(calendar.now, ['Date']);
        else cy.clock().then((clock) => clock.setSystemTime(calendar.now));
        this.consult(tab === 'in-review' ? 'rejected' : 'in-review');
        this.consult(tab);
        cy.then(() => {
          if (tab === 'approved' || tab === 'deleted') {
            expect(this.query['casefile_status_from_date'], 'independent inclusive lower date').to.equal(calendar.from);
            expect(this.query['casefile_status_to_date'], 'independent consultation date').to.equal(calendar.to);
          }
          const response = this.summaries.some((row) => row.draft_casefile_id === owned.id);
          this.collectIds().then((ids) => this.dateResults.push({ days, response, dom: ids.has(owned.id) }));
        });
      }
    });
  }

  /** Asserts both observed consultations, including absence on every rendered page.
   * @param window Seven-day bounded or unbounded lifecycle policy.
   */
  public expectDateWindow(window: string): void {
    if (!['unbounded', 'seven-day'].includes(window)) throw new Error('Unknown monitoring window');
    cy.then(() => {
      expect(this.dateResults, 'two real consultations').to.have.length(2);
      for (const result of this.dateResults) {
        const visible = window === 'unbounded' || result.days === 7;
        expect(result.response, `D+${result.days} provider inclusion`).to.equal(visible);
        expect(result.dom, `D+${result.days} DOM inclusion`).to.equal(visible);
      }
    });
    this.expectNoWrites();
  }

  /** Follows the maintained same-tab View all rejected link. */
  public viewAllRejected(): void {
    // Traversing personal pagination may move focus; the maintained link method requires heading focus.
    cy.get(S.heading).focus();
    this.dashboard.viewAllRejected();
    cy.wait('@monitoringAllRejected');
    cy.location('pathname').should('eq', ALL_REJECTED);
    cy.get(S.allRejectedHeading).should('be.focused');
  }

  /** Requires the personal pagination baseline to contain exactly this scenario's 26 owned rejections.
   * @param owned All expected own rejected fixtures.
   */
  public requirePagination(owned: IOwnedDraftCasefile[]): void {
    cy.then(() => {
      expect(owned, '26 independent owned rejections').to.have.length(26);
      expect(
        this.summaries.map((row) => row.draft_casefile_id),
        'no conflicting personal rejected work',
      ).to.have.length(26);
      expect(this.summaries.map((row) => row.draft_casefile_id).sort((a, b) => a - b)).to.deep.equal(
        owned.map((row) => row.id).sort((a, b) => a - b),
      );
    });
  }

  /** Activates one applicant sort state through native Enter, retaining focus.
   * @param direction Expected ascending or descending sort state.
   */
  public sortPersonal(direction: string): void {
    if (!['ascending', 'descending'].includes(direction)) throw new Error('Unknown monitoring sort direction');
    cy.get(S.sort('applicant')).focus().should('be.focused');
    pressDashboardEnter();
    this.rejections.expectSort('applicant', direction);
    cy.get(S.sort('applicant')).should('be.focused');
  }

  /** Traverses a personal page and retains its actual consultation state for return verification.
   * @param direction Next or previous pagination direction.
   */
  public pagePersonal(direction: string): void {
    if (direction !== 'next' && direction !== 'previous') throw new Error('Unknown monitoring pagination direction');
    this.changePage(direction);
    cy.get(S.pageStatus)
      .invoke('text')
      .then((text) => {
        this.dashboardPage = text;
      });
    cy.get(S.sort('applicant'))
      .closest('th')
      .invoke('attr', 'aria-sort')
      .then((value) => {
        expect(value).to.equal('descending');
        this.dashboardSort = value!;
      });
    cy.get(S.tableRows).then((rows) => {
      this.dashboardIds = [...rows].map((row) => Number(row.getAttribute('data-draft-id')));
    });
  }

  /** Uses native sort/next/previous controls and records actual originating dashboard state. */
  public paginatePersonal(): void {
    this.sortPersonal('ascending');
    this.sortPersonal('descending');
    this.pagePersonal('next');
    this.pagePersonal('previous');
    this.pagePersonal('next');
  }

  /** Waits for the actual target page after each native event, including recursive collection traversal.
   * @param direction Supported relative page movement.
   */
  private changePage(direction: 'next' | 'previous'): void {
    cy.get(S.pagination)
      .find('a[aria-current="page"]')
      .invoke('attr', 'aria-label')
      .then((label) => {
        expect(label, 'actual current page label').to.match(/^Page [1-9]\d*$/);
        const current = Number(label?.split(' ').pop());
        const target = current + (direction === 'next' ? 1 : -1);
        const selector = direction === 'next' ? S.allRejectedNext : S.allRejectedPrevious;
        cy.get(selector).focus().should('be.focused');
        pressDashboardEnter();
        this.rejections.expectPage(target);
      });
  }

  /** Finds an owned cross-user rejection through real pagination and verifies a fresh matching detail GET.
   * @param owned The other inputter's independently persisted rejected record.
   * @param scanStates Whether each sort/page state must receive the maintained strict Axe check.
   */
  public openAmendment(owned: IOwnedDraftCasefile, scanStates = false): void {
    readDraftSnapshot(owned.id).then((snapshot) => {
      this.selected = snapshot;
    });
    cy.intercept('GET', `**/opal-maintenance-service/draft-casefiles/${owned.id}`, (request) => {
      request.continue((response) => {
        expect(response.statusCode, 'fresh selected detail GET').to.equal(200);
        const snapshot = decodeDraftSnapshot(owned.id, response.body, response.headers['etag']);
        expect(snapshot.draft.submitted_by).to.equal(owned.inputterId);
        expect(snapshot.draft.casefile.respondent_account.remo_reference).to.equal(owned.marker);
        if (!this.selected) throw new Error('Independent selected snapshot missing');
        assertUnchangedDraft(this.selected, snapshot);
      });
    }).as('monitoringSelectedDetail');
    this.locateRejected(owned.id, scanStates);
    cy.get(S.allRejectedPageStatus)
      .invoke('text')
      .then((text) => {
        this.rejectionPage = text;
      });
    cy.get(S.sort('applicant'))
      .closest('th')
      .invoke('attr', 'aria-sort')
      .then((value) => {
        this.rejectionSort = value!;
      });
    cy.get(S.tableRows).then((rows) => {
      this.rejectionIds = [...rows].map((row) => Number(row.getAttribute('data-draft-id')));
    });
    cy.get(S.row(owned.id))
      .find('a')
      .should('have.length', 1)
      .and('not.have.attr', 'target')
      .focus()
      .should('be.focused');
    pressDashboardEnter();
    cy.wait('@monitoringSelectedDetail');
    cy.location('pathname').should(
      'eq',
      '/' + CREATE_PATHS.root + '/' + CREATE_PATHS.children.taskList + '/' + owned.id,
    );
    cy.get(CREATE.caseDetails.heading).should('be.focused');
    cy.then(() => {
      if (!this.selected) throw new Error('Missing persisted amendment snapshot');
      const individual = this.selected.draft.casefile.respondent_account.respondent.party_details.individual_details;
      if (!individual?.forenames || !individual.surname) throw new Error('Owned amendment individual name is missing');
      cy.get(CREATE.caseDetails.heading).should('have.text', `${individual.forenames} ${individual.surname}`);
    });
    cy.get(CREATE.caseDetails.respondentStatus).should('contain.text', 'Provided');
    cy.get(CREATE.review.history).should('be.visible').and('contain.text', 'Rejected');
  }

  /** Locates an exact rejected row, scanning every intermediate sort/page before leaving it when requested.
   * @param id Exact selected rejected draft identity.
   * @param scanStates Whether all visited states require strict accessibility checks.
   */
  public locateRejected(id: number, scanStates = false): void {
    if (scanStates) {
      this.sortPersonal('ascending');
      accessibilityActions.checkAccessibilityOnly();
      this.sortPersonal('descending');
      accessibilityActions.checkAccessibilityOnly();
    } else this.rejections.sortDescending('applicant');
    this.firstPage(scanStates);
    this.findRow(id, scanStates);
  }

  /** Restarts pagination before a fresh ID search, including after an exhaustive owned-row scan.
   * @param scanStates Whether each returned-to page requires a strict accessibility check.
   */
  private firstPage(scanStates = false): void {
    cy.get('body').then((body) => {
      if (!body.find(S.allRejectedPrevious).length) return;
      this.changePage('previous');
      if (scanStates) accessibilityActions.checkAccessibilityOnly();
      this.firstPage(scanStates);
    });
  }

  /** Finds a specific persisted row, failing naturally if the real list omits it.
   * @param id Owned positive draft ID.
   * @param scanStates Whether each visited search page requires a strict accessibility check.
   */
  private findRow(id: number, scanStates = false): void {
    cy.get('body').then((body) => {
      if (body.find(S.row(id)).length) return;
      this.changePage('next');
      if (scanStates) accessibilityActions.checkAccessibilityOnly();
      this.findRow(id, scanStates);
    });
  }

  /** Uses maintained native Back actions without controlled setup. */
  public returnFromAmendment(): void {
    cy.get(CREATE.caseDetails.backLink).focus().should('be.focused');
    this.rejections.returnList();
    cy.wait('@monitoringAllRejected');
    cy.location('pathname').should('eq', ALL_REJECTED);
    cy.get(S.allRejectedHeading).should('be.focused');
    cy.get(S.allRejectedPageStatus)
      .invoke('text')
      .then((text) => expect(text).to.equal(this.rejectionPage));
    cy.get(S.sort('applicant'))
      .closest('th')
      .invoke('attr', 'aria-sort')
      .then((value) => expect(value).to.equal(this.rejectionSort));
    cy.get(S.tableRows).then((rows) => {
      expect([...rows].map((row) => Number(row.getAttribute('data-draft-id')))).to.deep.equal(this.rejectionIds);
    });
  }

  /** Returns to the originating personal dashboard through its real Back link. */
  public returnDashboard(): void {
    cy.get(S.allRejectedBack).focus().should('be.focused');
    this.rejections.returnDashboard();
    this.waitPersonal('rejected');
    cy.get(S.heading).should('be.focused');
  }

  /** Checks the exact retained page, sort and owned visible identities after fresh consultation. */
  public expectRestored(): void {
    cy.get(S.pageStatus)
      .invoke('text')
      .then((text) => expect(text).to.equal(this.dashboardPage));
    cy.get(S.sort('applicant'))
      .closest('th')
      .invoke('attr', 'aria-sort')
      .then((value) => expect(value).to.equal(this.dashboardSort));
    cy.get(S.tableRows).then((rows) => {
      expect([...rows].map((row) => Number(row.getAttribute('data-draft-id')))).to.deep.equal(this.dashboardIds);
    });
    cy.get('@monitoringSelectedDetail.all').should('have.length', 1);
    this.expectNoWrites();
  }

  /** Matches every generated account to an independent persisted snapshot.
   * @param owned Exact published or stable-pending fixture.
   * @param pending Expected pending state.
   * @param scanStates Whether every visited account-search page requires a strict accessibility scan.
   */
  public expectAccounts(owned: IOwnedDraftCasefile, pending: boolean, scanStates = false): void {
    this.firstPage(scanStates);
    this.findRow(owned.id, scanStates);
    readDraftSnapshot(owned.id).then((snapshot) => assertMonitoringAccounts(snapshot, pending));
    this.expectNoWrites();
  }

  /** Proves authorised entry before switching to an existing denied identity.
   * @param owned Primary user's independently submitted fixture.
   */
  public prepareDenied(owned: IOwnedDraftCasefile): void {
    this.expectRows([owned]);
    this.deniedActor = String(Cypress.env('PO10628_DENIED_EMAIL') || 'opal-test-4@dev.platform.hmcts.net');
    expect(this.deniedActor === owned.inputter, 'independent denied identity').to.equal(false);
    performAuthentication(this.deniedActor);
    new CasefilePermissionPreflightActions().assertPermission(false);
    cy.request<IOpalUserStateResponse>({ url: '/api/user-state', log: false }).then(({ body }) => {
      expect(
        body.domains['maintenance']?.business_unit_users.some(
          (unit) => unit.business_unit_user_id === owned.inputterId,
        ),
      ).to.equal(false);
    });
    cy.then(() => {
      this.collectionRequests = 0;
      this.writes = 0;
    });
  }

  /** Attempts the protected real destination as the already verified denied user. */
  public openDenied(): void {
    cy.visit(DASHBOARD + '#in-review');
  }

  /** Proves the guard exposes neither counts nor rows and issues no collection or mutation calls. */
  public expectDenied(): void {
    cy.location('pathname').should('eq', '/access-denied');
    for (const selector of [S.heading, S.tabs, S.tableRows, S.rejectedCount, S.table])
      cy.get(selector).should('not.exist');
    cy.then(() => expect(this.collectionRequests, 'denied collection/count requests').to.equal(0));
    this.expectNoWrites();
  }

  /** Requires a truly empty personal baseline without deleting unrelated data. */
  public requireEmptyDashboard(): void {
    requireMembership(21).then(({ id }) => {
      for (const statuses of Object.values(STATUSES)) {
        cy.request<unknown>({
          url: '/opal-maintenance-service/draft-casefiles',
          qs: { business_unit_id: 44, submitted_by: id, casefile_status: statuses },
          log: false,
        }).then(({ status, body }) => {
          expect(status).to.equal(200);
          const list = decodeDraftCasefileList(body);
          expect(list.count, 'genuinely empty personal baseline').to.equal(0);
          expect(list.summaries.map((row) => row.draft_casefile_id)).to.have.length(0);
        });
      }
      this.observe(id);
      this.open('in-review');
    });
  }

  /** Proves the current consulted lifecycle tab is actually empty. */
  public expectEmpty(): void {
    cy.then(() => expect(this.summaries.map((row) => row.draft_casefile_id)).to.have.length(0));
    cy.get(S.empty).should('be.visible');
    cy.get(S.tableRows).should('not.exist');
    this.expectNoWrites();
  }

  /** All monitoring and amendment-entry consultations must remain read-only. */
  private expectNoWrites(): void {
    cy.then(() => expect(this.writes, 'no browser lifecycle or amendment writes').to.equal(0));
  }
}
