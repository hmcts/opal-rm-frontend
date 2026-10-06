import { CreateCasefileSelectors } from '../../../../../shared/selectors/create-casefile.selectors';
import { CasesDraftSelectors as S } from '../../../../../shared/selectors/cases-draft.selectors';
import { pressDashboardEnter } from '../../../../../support/utils/press-dashboard-enter';
import { accessibilityActions } from '../accessibility/accessibility.actions';
import { CASES_DRAFT_CHECKER_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-checker-routing-paths.constant';
import { CASES_DRAFT_CHECKER_TABS as TABS } from 'src/app/flows/cases/cases-draft/constants/cases-draft-checker-tabs.constant';
import type { CasesDraftCheckerTab } from 'src/app/flows/cases/cases-draft/types/cases-draft-tab.type';
import type { IOpalMaintenanceDraftCasefileSummary as Summary } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-summary.interface';
import {
  checkerUser,
  checkerRows,
  CHECKER_SCOPE_ROWS,
  CHECKER_FAILURE,
} from '../../mocks/createDraftCasefile/checker-dashboard.mock';
import type { CheckerRole, CheckerDestination } from '../../mocks/createDraftCasefile/checker-dashboard.mock';
import { inputterRows } from '../../mocks/createDraftCasefile/inputter-dashboard.mock';

const COLLECTION = /\/opal-maintenance-service\/draft-casefiles(?:\?|$)/;
const PERSISTED = /\/opal-maintenance-service\/draft-casefiles\/[^?]+(?:\?|$)/;
const DASHBOARD = '/' + PATHS.root + '/' + PATHS.children.tabs;
const QUEUES = Object.keys(TABS) as CasesDraftCheckerTab[];

/** Owns synthetic HTTP responses, native keyboard interactions and routed browser assertions. */
export class CheckerDashboardActions {
  private collections = {} as Record<CasesDraftCheckerTab, Summary[]>;
  private requests: Record<string, unknown>[] = [];
  private listFailures = 0;
  private countFailures = 0;
  private user = checkerUser('checker');
  private heldTab: CasesDraftCheckerTab | null = null;
  private release: ((denied?: boolean) => void) | null = null;
  private failureStatus = 503;
  private failureReference = 'SYNTHETIC-RETRY';
  private failureRetriable = true;

  /** Resets the controlled user/collection boundaries without modifying application flags.
   * @param role Synthetic role at the HTTP boundary. */
  public prepare(role: CheckerRole): void {
    this.user = checkerUser(role);
    this.requests = [];
    this.listFailures = 0;
    this.countFailures = 0;
    this.heldTab = null;
    this.release = null;
    this.failureStatus = 503;
    this.failureReference = 'SYNTHETIC-RETRY';
    this.failureRetriable = true;
    this.collections = Object.fromEntries(QUEUES.map((tab) => [tab, checkerRows(tab)])) as Record<
      CasesDraftCheckerTab,
      Summary[]
    >;
    this.collections['to-review'] = structuredClone(CHECKER_SCOPE_ROWS);
    cy.intercept('GET', '**/api/user-state', (request) => request.reply({ body: structuredClone(this.user) }));
    const details = cy.spy().as('checkerDetails');
    cy.intercept('GET', PERSISTED, (request) => {
      details(request);
      request.reply({ statusCode: 404, body: {} });
    });
    const mutation = cy.spy().as('checkerMutation');
    cy.intercept(
      { method: '+(POST|PUT|PATCH|DELETE)', url: /\/opal-maintenance-service\/draft-casefiles(?:[/?]|$)/ },
      (request) => {
        mutation(request);
        request.reply({ statusCode: 405, body: {} });
      },
    );
    cy.intercept('GET', COLLECTION, (request) => {
      this.requests.push({ ...request.query });
      const countOnly = request.query['restrict'] === 'counts';
      const tab = QUEUES.find((key) => TABS[key].statuses === request.query['casefile_status']);
      if (!tab) {
        request.reply({ statusCode: 400, body: {} });
        return;
      }
      if (request.query['submitted_by']) {
        const inputterTab = tab === 'to-review' ? 'in-review' : tab;
        const summaries = inputterRows(inputterTab as 'in-review' | 'rejected' | 'deleted').map((row) => ({
          ...row,
          submitted_by: 'BUU-CHECKER',
        }));
        request.reply({ body: countOnly ? { count: summaries.length } : { count: summaries.length, summaries } });
        return;
      }
      const failure = countOnly && tab === 'failed' ? this.countFailures-- > 0 : !countOnly && this.listFailures-- > 0;
      if (failure) {
        request.reply({
          statusCode: this.failureStatus,
          body: { ...CHECKER_FAILURE, operation_id: this.failureReference, retriable: this.failureRetriable },
        });
        return;
      }
      const summaries = structuredClone(this.collections[tab]);
      const count = summaries.filter(
        (row) =>
          row.business_unit_id === 44 &&
          row.submitted_by !== 'BUU-CHECKER' &&
          TABS[tab].statuses.split(',').includes(row.casefile_status),
      ).length;
      const body = countOnly ? { count } : { count, summaries };
      if (tab === this.heldTab && !countOnly) {
        this.heldTab = null;
        return new Promise<void>((resolve) => {
          this.release = (denied = false) => {
            request.reply(denied ? { statusCode: 403, body: { ...CHECKER_FAILURE, retriable: false } } : { body });
            resolve();
          };
        });
      }
      return request.reply({ body });
    }).as('checkerCollection');
  }

  /** Traverses the permission-sensitive Cases entry. */
  public enterFromCases(): void {
    cy.visit('/dashboard/cases');
    cy.get(S.checkerEntry).should('be.visible');
    cy.viewport(1440, 1000);
    cy.screenshot('po10606-after-cases-entry');
    cy.get(S.checkerEntry).click();
  }

  /** Checks permanent queues and defensive scope filtering for both authorised roles. */
  public expectQueuesAndOtherWork(): void {
    cy.location('pathname').should('eq', DASHBOARD);
    cy.location('hash').should('eq', '#to-review');
    for (const tab of QUEUES) cy.get(S.tab(tab)).should('be.visible').and('contain.text', TABS[tab].label);
    cy.get(S.table).should('be.visible');
    cy.get(S.row(1)).should('contain.text', 'Synthetic submitter');
    for (const id of [900, 901, 902]) cy.get(S.row(id)).should('not.exist');
    cy.get(S.create).should('not.exist');
    cy.get(S.allRejected).should('not.exist');
    cy.get(S.rejectedCount).should('contain.text', '26');
    cy.get(S.failedCount).should('contain.text', '26');
    this.assertNoPersistence();
  }

  /** Proves all recorded checker consultations use BU identity exclusion and exact queue contracts. */
  public expectRequestScope(): void {
    cy.then(() => {
      expect(this.requests.length).to.be.greaterThan(0);
      for (const query of this.requests) {
        expect(query['business_unit_id']).to.eq('44');
        expect(query['not_submitted_by']).to.eq('BUU-CHECKER');
        expect(query).not.to.have.property('submitted_by');
        expect(Object.values(TABS).map((tab) => tab.statuses)).to.include(query['casefile_status']);
        if (query['restrict']) expect(query['restrict']).to.eq('counts');
        if (query['casefile_status'] !== 'DELETED') {
          expect(query).not.to.have.property('casefile_status_from_date');
          expect(query).not.to.have.property('casefile_status_to_date');
        } else {
          const from = Date.parse(String(query['casefile_status_from_date']));
          const to = Date.parse(String(query['casefile_status_to_date']));
          expect(to - from).to.eq(7 * 24 * 60 * 60 * 1000);
          expect(query).not.to.have.property('restrict');
        }
      }
    });
  }

  /** Changes queue through native Enter.
   * @param tab Lifecycle tab to activate. */
  public selectTab(tab: CasesDraftCheckerTab): void {
    cy.get(S.tab(tab)).focus().should('be.focused');
    pressDashboardEnter();
    cy.location('hash').should('eq', '#' + tab);
  }

  /** Retains rejected page two and applicant descending using local sort/page controls. */
  public selectRejectedPage(): void {
    cy.visit(DASHBOARD + '#rejected');
    cy.get(S.table).should('be.visible');
    for (const direction of ['ascending', 'descending']) {
      cy.get(S.sort('applicant')).focus();
      pressDashboardEnter();
      cy.get('th[columnKey="applicant"]').should('have.attr', 'aria-sort', direction);
    }
    cy.get(S.pagination).contains('a', '2').focus();
    pressDashboardEnter();
    cy.get(S.pageStatus).should('contain.text', 'Review cases, page 2 of 2');
    cy.get(S.row(1)).should('be.visible');
  }

  /** Opens read-only details and supplies a smaller fresh collection before native Back. */
  public viewRejectedAndShrink(): void {
    cy.get(S.row(1)).find('a').focus();
    pressDashboardEnter();
    cy.get(S.placeholderHeading).should('have.text', 'View case details').and('be.focused');
    this.assertNoPersistence();
    cy.then(() => {
      this.collections.rejected = checkerRows('rejected', 1);
      this.collections.rejected[0].casefile_snapshot.respondent_account!.respondent_name =
        'Refreshed synthetic respondent';
    });
    cy.get(S.placeholderBack).focus();
    pressDashboardEnter();
  }

  /** Checks metadata restoration, a fresh list and clamping to the smaller result. */
  public expectFreshClampedReturn(): void {
    cy.get(S.row(1)).should('contain.text', 'Refreshed synthetic respondent');
    cy.location('hash').should('eq', '#rejected');
    cy.location('search').should('eq', '');
    cy.get('th[columnKey="applicant"]').should('have.attr', 'aria-sort', 'descending');
    cy.then(() =>
      expect(
        this.requests.filter((request) => request['casefile_status'] === 'REJECTED' && !request['restrict']),
      ).to.have.length(2),
    );
    this.assertNoPersistence();
  }

  /** Fails only the next list consultation. */
  public failFirstList(): void {
    cy.then(() => {
      this.listFailures = 1;
      this.failureRetriable = false;
    });
  }
  /** Fails only the next independent Failed count. */
  public failFirstFailedCount(): void {
    cy.then(() => {
      this.countFailures = 1;
    });
  }

  /** Verifies initial failure follows the existing common error route. */
  public expectInitialError(): void {
    cy.location('pathname').should('eq', '/error/internal-server');
    cy.get(S.table).should('not.exist');
    cy.get(S.retryList).should('not.exist');
    this.assertNoPersistence();
  }
  /** Checks an unavailable independent count is omitted while the list remains usable. */
  public expectCountFailureWithTable(): void {
    cy.get(S.table).should('be.visible');
    cy.get(S.failedCount).should('not.exist');
    cy.get(S.countRetry('failed')).should('not.exist');
  }

  /** Opens a guarded destination directly.
   * @param destination Named protected route.
   * @param id Synthetic positive or malformed identifier. */
  public openProtected(destination: CheckerDestination, id = '123'): void {
    const path =
      destination === 'dashboard' ? PATHS.children.tabs : PATHS.children[destination] + '/' + encodeURIComponent(id);
    cy.visit('/' + PATHS.root + '/' + path);
  }
  /** Checks guard denial before any collection or persistence traffic. */
  public expectDenied(): void {
    if (this.user.status === 'DEACTIVATED') {
      cy.location('pathname').should('eq', '/account-created');
      cy.contains('h1', 'User account created').should('be.visible');
      cy.get(S.heading).should('not.exist');
      cy.get(S.table).should('not.exist');
    } else {
      cy.location('pathname').should('eq', '/access-denied');
      cy.contains('h1', 'Access Denied').should('be.visible');
    }
    cy.get('@checkerCollection.all').should('have.length', 0);
    this.assertNoPersistence();
  }
  /** Checks checker-only users cannot start or directly enter creation. */
  public prohibitCreation(): void {
    cy.visit('/dashboard/cases');
    cy.get(S.checkerEntry).should('be.visible');
    cy.get(S.inputterEntry).should('not.exist');
    cy.visit('/cases/create-casefile/case-type');
    this.expectDenied();
  }
  /** Verifies oldest original creation order including a recently resubmitted case. */
  public inspectQueues(): void {
    this.enterFromCases();
    cy.get(S.tableRows).first().should('have.attr', 'data-draft-id', '1');
    cy.get(S.tableRows).eq(1).should('have.attr', 'data-draft-id', '2');
    cy.get('th[columnKey="created"]').should('have.attr', 'aria-sort', 'ascending');
    for (const tab of QUEUES.slice(1)) {
      this.selectTab(tab);
      cy.get(S.table).should('be.visible');
      cy.get(S.tableRows).should('have.length', 25);
      cy.get(S.row(1)).find(S.column('statusDate')).should('be.visible');
    }
    this.expectRequestScope();
    cy.then(() => {
      for (const tab of QUEUES)
        expect(
          this.requests.filter((request) => request['casefile_status'] === TABS[tab].statuses && !request['restrict']),
        ).to.have.length(1);
    });
    this.assertNoPersistence();
  }
  /** Checks route configuration rejects caller-supplied mode and IDs remain safe.
   * @param kind Protected shell destination.
   * @param id Synthetic positive or malformed identifier. */
  public safeShell(kind: 'review' | 'view', id: string): void {
    cy.visit(
      '/' +
        PATHS.root +
        '/' +
        kind +
        '/' +
        encodeURIComponent(id) +
        '?mode=inputter&tab=failed&page=2&sort=applicant&direction=descending#rejected',
    );
    cy.get(S.placeholderHeading)
      .should('have.text', kind === 'review' ? 'Review case' : 'View case details')
      .and('be.focused');
    const valid = /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id));
    if (!valid) cy.contains('p', 'This case could not be opened. Return to Review cases.').should('be.visible');
    cy.get(S.placeholderBack).should('have.attr', 'href').and('include', DASHBOARD).and('include', '#rejected');
    cy.get('@checkerCollection.all').should('have.length', 0);
    this.assertNoPersistence();
  }
  /** Observes the narrowly scoped persisted reads and mutations forbidden by this ticket. */
  public assertNoPersistence(): void {
    cy.get('@checkerDetails').should('not.have.been.called');
    cy.get('@checkerMutation').should('not.have.been.called');
  }

  /** Holds a response explicitly, avoiding a sleep-based race fixture. */
  public pendingOutcome(): void {
    this.enterFromCases();
    cy.get(S.table).should('be.visible');
    cy.then(() => {
      this.heldTab = 'failed';
    });
    this.selectTab('failed');
    cy.get(S.loading).should('contain.text', 'Loading Failed cases.');
  }
  /** Leaves a pending outcome, obtains its count and gives a newer selected list precedence. */
  public recoverPendingOutcome(): void {
    this.selectTab('to-review');
    cy.get(S.table).should('be.visible');
    cy.get(S.failedCount).should('contain.text', '26');
    cy.then(() => {
      this.collections.failed = checkerRows('failed', 1);
    });
    this.selectTab('failed');
    cy.get(S.failedCount).should('contain.text', '1');
    cy.get(S.tableRows).should('have.length', 1);
    cy.then(() => {
      expect(this.release, 'controlled delayed response').not.to.eq(null);
      this.release!();
    });
    cy.get(S.failedCount).should('contain.text', '1');
    cy.get(S.tableRows).should('have.length', 1);
    this.assertNoPersistence();
  }
  /** Models permission loss through a controlled provider 403 while the list is pending. */
  public revokePendingAccess(): void {
    cy.then(() => {
      this.user = checkerUser('inputter');
      expect(this.release, 'controlled pending list').not.to.eq(null);
      this.release!(true);
    });
    cy.location('pathname').should('eq', '/error/permission-denied');
    cy.get(S.table).should('not.exist');
    cy.get(S.failedCount).should('not.exist');
    cy.then(() => expect(this.requests.filter((request) => !request['restrict'])).to.have.length(2));
    this.assertNoPersistence();
  }
  /** Proves separate in-memory return state and fragment-only shell links for dual roles. */
  public independentReturns(): void {
    cy.visit('/cases/draft/create-and-manage/tabs#rejected');
    cy.get(S.table).should('be.visible');
    for (const direction of ['ascending', 'descending']) {
      cy.get(S.sort('applicant')).click();
      cy.get('th[columnKey="applicant"]').should('have.attr', 'aria-sort', direction);
    }
    cy.get(S.pagination).contains('a', '2').click();
    cy.get(S.pageStatus).should('contain.text', 'Create cases, page 2 of 2');
    cy.get(S.row(1)).find('a').click();
    cy.get(S.placeholderHeading).should('have.text', 'Check case details');
    cy.location('search').should('eq', '');
    cy.get(S.placeholderBack).should('have.attr', 'href', '/cases/draft/create-and-manage/tabs#rejected');
    cy.get(S.placeholderBack).click();
    cy.get(S.pageStatus).should('contain.text', 'Page 2 of 2, showing cases 26 to 26 of 26');
    cy.get(S.tableRows).should('have.length', 1);
    cy.get(S.row(1)).should('be.visible');
    cy.get('th[columnKey="applicant"]').should('have.attr', 'aria-sort', 'descending');
    cy.location('search').should('eq', '');
    cy.get(S.primaryNavigation).contains('a', 'Cases').click();
    cy.get(S.checkerEntry).click();
    this.selectTab('deleted');
    cy.get(S.row(1)).find('a').click();
    cy.get(S.placeholderBack).should('have.attr', 'href', DASHBOARD + '#deleted');
    cy.get(S.placeholderBack).click();
    cy.location('hash').should('eq', '#deleted');
    cy.location('search').should('eq', '');
    this.assertNoPersistence();
  }

  /** Exercises existing common error routes after successful arrival.
   * @param kind List or independent count.
   * @param status Provider HTTP status.
   * @param reference Synthetic operation reference. */
  public laterFailure(kind: string, status: number, reference: string): void {
    this.enterFromCases();
    cy.get(S.table).should('be.visible');
    cy.get(S.failedCount).should('contain.text', '26');
    cy.then(() => {
      this.failureStatus = status;
      this.failureRetriable = false;
      this.failureReference = reference === 'oversized' ? 'x'.repeat(101) : reference;
      if (kind === 'count') this.countFailures = 1;
      else this.listFailures = 1;
    });
    cy.get(S.tab('deleted')).click();
    const destination =
      status === 403 ? 'permission-denied' : status === 409 ? 'concurrency-failure' : 'internal-server';
    cy.location('pathname').should('eq', '/error/' + destination);
    cy.get(S.retryList).should('not.exist');
    cy.get(S.table).should('not.exist');
    cy.screenshot('po10606-common-error-' + kind + '-' + status);
    this.assertNoPersistence();
  }
  /** Supplies explicit accessible dashboard states with controlled loading completion.
   * @param state Accessible dashboard state. */
  public state(state: string): void {
    this.prepare('checker');
    if (state === 'empty')
      cy.then(() => {
        this.collections['to-review'] = [];
      });
    if (state === 'count-error') this.failFirstFailedCount();
    this.enterFromCases();
    if (state === 'loading' || state === 'list-error') {
      cy.get(S.table).should('be.visible');
      if (state === 'loading')
        cy.then(() => {
          this.heldTab = 'deleted';
        });
      else
        cy.then(() => {
          this.listFailures = 1;
          this.failureRetriable = true;
        });
      this.selectTab('deleted');
    }
    const selector = {
      empty: S.empty,
      'list-error': CreateCasefileSelectors.globalErrorBanner,
      'count-error': S.table,
      loading: S.loading,
      populated: S.table,
    }[state];
    if (!selector) throw new Error('Unsupported checker accessibility state: ' + state);
    cy.get(selector).should('be.visible');
  }
  /** Preserves loading-state evidence and releases its controlled response after scanning.
   * @param state Accessible dashboard state. */
  public captureState(state: string): void {
    cy.screenshot('po10606-after-state-' + state);
    cy.then(() => {
      this.release?.();
    });
  }
  /** Scans Cases entry and all four populated queues using shared Axe assertions. */
  public screenshotTables(): void {
    cy.visit('/dashboard/cases');
    cy.get(S.checkerEntry).should('be.visible');
    accessibilityActions.checkAccessibilityOnly();
    cy.get(S.checkerEntry).click();
    for (const tab of QUEUES) {
      this.selectTab(tab);
      cy.get(S.table).should('be.visible');
      accessibilityActions.checkAccessibilityOnly();
      cy.screenshot('po10606-after-' + tab);
    }
  }
  /** Checks narrow-width labelled scrolling, keyboard reachability and document reflow. */
  public reflow(): void {
    cy.viewport(320, 900);
    cy.document().then((document) => expect(document.documentElement.scrollWidth).to.be.at.most(320));
    cy.get(S.scrollRegion).should('have.attr', 'tabindex', '0').and('have.attr', 'aria-label').and('not.be.empty');
    cy.get(S.scrollRegion).focus().should('be.focused');
    cy.press(Cypress.Keyboard.Keys.RIGHT);
    cy.screenshot('po10606-after-reflow-320');
  }
  /** Captures an accessible review/view shell after safe direct entry.
   * @param kind Protected shell destination. */
  public captureShell(kind: string): void {
    cy.screenshot('po10606-after-' + kind + '-shell');
  }
}
