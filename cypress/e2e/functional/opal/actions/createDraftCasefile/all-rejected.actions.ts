import { CreateCasefileSelectors as CREATE } from '../../../../../shared/selectors/create-casefile.selectors';
import { CasesDraftSelectors as S } from '../../../../../shared/selectors/cases-draft.selectors';
import { pressDashboardEnter } from '../../../../../support/utils/press-dashboard-enter';
import { CASES_DRAFT_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-routing-paths.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as CREATE_PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { INPUTTER_USER, inputterRows } from '../../mocks/createDraftCasefile/inputter-dashboard.mock';
import { allRejectedRows } from '../../mocks/createDraftCasefile/all-rejected.mock';
import { accessibilityActions } from '../accessibility/accessibility.actions';

const COLLECTION = /\/opal-maintenance-service\/draft-casefiles(?:\?|$)/;
const PERSISTED = /\/opal-maintenance-service\/draft-casefiles\/[^?]+(?:\?|$)/;
const DASHBOARD = '/' + PATHS.root + '/' + PATHS.children.tabs;
const LIST = '/' + PATHS.root + '/' + PATHS.children.rejections;
const OTHER_QUERY = { business_unit_id: '44', casefile_status: 'REJECTED', not_submitted_by: 'BUU-SYNTHETIC' };
const OWN_QUERY = { business_unit_id: '44', casefile_status: 'REJECTED', submitted_by: 'BUU-SYNTHETIC' };

/** Owns real-browser interaction and exclusive synthetic provider boundaries. */
export class AllRejectedActions {
  private rejectionRequests: Record<string, unknown>[] = [];
  private dashboardRequests: Record<string, unknown>[] = [];
  private otherRows = allRejectedRows();
  private user = structuredClone(INPUTTER_USER);
  private listFailures = 0;

  /** Resets every mutable fixture and observes collection/persisted traffic separately. */
  public available(): void {
    this.rejectionRequests = [];
    this.dashboardRequests = [];
    this.otherRows = allRejectedRows();
    this.user = structuredClone(INPUTTER_USER);
    this.listFailures = 0;
    cy.intercept('GET', '**/api/user-state', (request) => request.reply({ body: structuredClone(this.user) }));
    cy.intercept('GET', PERSISTED, cy.spy().as('rejectedPersistedReads'));
    cy.intercept(
      { method: '+(POST|PUT|PATCH|DELETE)', url: /\/opal-maintenance-service\/draft-casefiles(?:[/?]|$)/ },
      cy.spy().as('rejectedWrites'),
    );
    cy.intercept('GET', COLLECTION, (request) => {
      if (request.query['not_submitted_by'] === undefined) {
        expect(request.query).to.deep.equal(OWN_QUERY);
        this.dashboardRequests.push({ ...request.query });
        const summaries = inputterRows('rejected');
        request.reply({ body: { count: summaries.length, summaries: structuredClone(summaries) } });
        return;
      }
      expect(request.query).to.deep.equal(OTHER_QUERY);
      this.rejectionRequests.push({ ...request.query });
      if (this.listFailures > 0) {
        this.listFailures--;
        request.reply({ statusCode: 503, body: { operation_id: 'SYNTHETIC-CONSULTATION' } });
        return;
      }
      const body = { count: this.otherRows.length, summaries: structuredClone(this.otherRows) };
      request.reply({ body });
    }).as('rejectedCollection');
  }

  /** Open dashboard for the controlled browser journey.
   */
  public openDashboard(): void {
    cy.visit(DASHBOARD + '#rejected');
    cy.get(S.table).should('be.visible');
  }
  /** Enter list for the controlled browser journey.
   */
  public enterList(): void {
    cy.get(S.allRejected).should('not.have.attr', 'target');
    cy.get(S.allRejected).click();
  }
  /** Open direct for the controlled browser journey.
   */
  public openDirect(): void {
    cy.visit(LIST);
  }
  /** Refresh for the controlled browser journey.
   */
  public refresh(): void {
    cy.reload();
  }
  /** Return dashboard for the controlled browser journey.
   */
  public returnDashboard(): void {
    cy.get(S.allRejectedBack).focus();
    pressDashboardEnter();
  }

  /** Checks collection presentation and the absence of requests/counts outside the contract.
   * @param expectedRequests Number of fresh exclusive consultations.
   * @param paginated Whether this collection requires pagination. */
  public expectCollection(expectedRequests = 1, paginated = true): void {
    cy.location('pathname').should('eq', LIST);
    cy.location('search').should('eq', '');
    cy.location('hash').should('eq', '');
    cy.get(S.allRejectedHeading).should('have.text', 'All rejected cases').and('be.focused');
    cy.get(S.table)
      .find('th')
      .should((cells) =>
        expect([...cells].map((cell) => cell.textContent?.trim())).to.deep.equal([
          'Respondent',
          'Applicant',
          'Case type',
          'Submitted by',
          'Created',
          'Rejected',
        ]),
      );
    cy.get(S.tabs).should('not.exist');
    cy.get(S.create).should('not.exist');
    cy.get('opal-lib-moj-notification-badge, opal-lib-govuk-pagination').should('not.exist');
    cy.get(S.table).should((table) => expect(table.text()).to.match(/synthetic submitter/i));
    if (paginated) cy.get('opal-lib-moj-pagination .moj-pagination__results').should('contain.text', 'total results');
    cy.get(S.allRejectedPageStatus)
      .should('have.class', 'govuk-visually-hidden')
      .and('have.attr', 'aria-atomic', 'true');
    cy.then(() => expect(this.rejectionRequests).to.have.length(expectedRequests));
    this.assertNoPersistence();
  }
  /** Expect defaults for the controlled browser journey.
   */
  public expectDefaults(): void {
    this.expectCollection(2);
    this.expectSort('statusDate', 'ascending');
    this.expectPage(1);
    cy.get(S.tableRows).first().should('have.attr', 'data-draft-id', '1');
    cy.get(S.allRejectedSuccess).should('not.exist');
  }
  /** Expect initial rows for the controlled browser journey.
   */
  public expectInitialRows(): void {
    this.expectCollection();
    this.expectSort('statusDate', 'ascending');
    this.expectPage(1);
    cy.get(S.tableRows).should((rows) =>
      expect([...rows].map((row) => row.getAttribute('data-draft-id'))).to.deep.equal(
        Array.from({ length: 25 }, (_, index) => String(index + 1)),
      ),
    );
  }
  /** Sort descending for the controlled browser journey.
   * @param key Expected or configured key.
   */
  public sortDescending(key: string): void {
    cy.get(S.sort(key)).focus();
    pressDashboardEnter();
    this.expectSort(key, 'ascending');
    cy.get(S.sort(key)).should('be.focused');
    pressDashboardEnter();
    this.expectSort(key, 'descending');
  }
  /** Next page for the controlled browser journey.
   */
  public nextPage(): void {
    cy.get(S.allRejectedNext).focus();
    pressDashboardEnter();
    this.expectPage(2);
  }
  /** Dashboard page for the controlled browser journey.
   */
  public dashboardPage(): void {
    cy.get(S.pagination).contains('a', '2').focus();
    pressDashboardEnter();
    cy.get(S.pageStatus).should('contain.text', 'page 2 of 2');
  }
  /** Expect sort for the controlled browser journey.
   * @param key Expected or configured key.
   * @param direction Expected or configured direction.
   */
  public expectSort(key: string, direction: string): void {
    cy.get(S.sort(key)).closest('th').should('have.attr', 'aria-sort', direction);
  }
  /** Expect page for the controlled browser journey.
   * @param page Expected or configured page.
   */
  public expectPage(page: number): void {
    cy.get(S.allRejectedPage(page)).should('have.attr', 'aria-current', 'page');
  }

  /** Open details for the controlled browser journey.
   */
  public openDetails(): void {
    cy.get(S.tableRows)
      .find('a')
      .first()
      .invoke('attr', 'href')
      .then((href) => {
        expect(href).to.match(/\/check-case-details\/[1-9]\d*$/);
        cy.get(S.tableRows).find('a').first().focus();
        pressDashboardEnter();
        cy.location('pathname').should('eq', href!);
        cy.location('search').should('eq', '');
      });
    cy.get(S.placeholderHeading).should('have.text', 'Check case details').and('be.focused');
    cy.get(S.placeholderBack).should('have.text', 'Back').and('have.attr', 'href', LIST);
    this.assertNoPersistence();
  }
  /** Return list for the controlled browser journey.
   */
  public returnList(): void {
    cy.get(S.placeholderBack).focus();
    pressDashboardEnter();
  }
  /** Browser back for the controlled browser journey.
   */
  public browserBack(): void {
    cy.go('back');
  }
  /** Refresh rows for the controlled browser journey.
   */
  public refreshRows(): void {
    cy.then(() => {
      this.otherRows = this.otherRows.map((row) => ({
        ...row,
        submitted_by_name: 'Refreshed synthetic submitter ' + String(row.draft_casefile_id).padStart(2, '0'),
      }));
    });
  }
  /** Shrink rows for the controlled browser journey.
   */
  public shrinkRows(): void {
    cy.then(() => {
      this.otherRows = allRejectedRows(1);
    });
  }
  /** Expect restored list for the controlled browser journey.
   * @param shrunk Expected or configured shrunk.
   */
  public expectRestoredList(shrunk = false): void {
    this.expectCollection(2, !shrunk);
    this.expectSort('submittedByName', 'descending');
    cy.get(S.tableRows).should('have.length', 1);
    cy.get(S.row(1)).should('be.visible');
    if (shrunk) cy.get(S.pagination).should('not.exist');
    else {
      this.expectPage(2);
      cy.get(S.row(1)).should('contain.text', 'Refreshed synthetic submitter 01');
    }
  }
  /** Expect restored dashboard for the controlled browser journey.
   */
  public expectRestoredDashboard(): void {
    cy.location('pathname').should('eq', DASHBOARD);
    cy.location('hash').should('eq', '#rejected');
    cy.location('search').should('eq', '');
    this.expectSort('applicant', 'descending');
    cy.get(S.tableRows).should('have.length', 1);
    cy.get(S.row(1)).should('be.visible');
    cy.then(() => expect(this.dashboardRequests).to.deep.equal([OWN_QUERY, OWN_QUERY]));
    this.assertNoPersistence();
  }
  /** Empty for the controlled browser journey.
   */
  public empty(): void {
    this.available();
    this.otherRows = allRejectedRows(0);
  }
  /** Expect empty for the controlled browser journey.
   */
  public expectEmpty(): void {
    cy.get(S.allRejectedHeading).should('be.focused');
    cy.get(S.allRejectedEmpty).should('have.text', 'There are no rejected cases.');
    cy.get(S.table).should('not.exist');
    cy.get(S.pagination).should('not.exist');
    cy.then(() => expect(this.rejectionRequests).to.have.length(1));
    this.assertNoPersistence();
  }
  /** Fail once for the controlled browser journey.
   */
  public failOnce(): void {
    this.available();
    this.listFailures = 1;
  }
  /** Expect failure for the controlled browser journey.
   */
  public expectFailure(): void {
    cy.location('pathname').should('eq', DASHBOARD);
    cy.get(CREATE.globalErrorBanner).should('be.visible');
    cy.get(S.allRejectedHeading).should('not.exist');
    cy.get(S.allRejectedEmpty).should('not.exist');
    cy.then(() => expect(this.rejectionRequests).to.have.length(1));
    this.assertNoPersistence();
  }
  /** Denied role for the controlled browser journey.
   * @param role Expected or configured role.
   */
  public deniedRole(role: string): void {
    this.available();
    if (role === 'cross-business-unit') this.user.domains['maintenance']!.business_unit_users[0].business_unit_id = 45;
    else if (role === 'dual')
      this.user.domains['maintenance']!.business_unit_users[0].permissions.push({
        permission_id: 22,
        permission_name: 'Check and Validate Draft Casefiles',
      });
    else if (role === 'checker-only')
      this.user.domains['maintenance']!.business_unit_users[0].permissions = [
        { permission_id: 22, permission_name: 'Check and Validate Draft Casefiles' },
      ];
  }
  /** Expect denied for the controlled browser journey.
   */
  public expectDenied(): void {
    cy.location('pathname').should('eq', '/access-denied');
    cy.then(() => expect(this.rejectionRequests).to.have.length(0));
    this.assertNoPersistence();
  }
  /** Direct shell for the controlled browser journey.
   * @param kind Expected or configured kind.
   */
  public directShell(kind: string): void {
    const child = kind === 'details' ? CREATE_PATHS.children.checkCaseDetails : CREATE_PATHS.children.taskList;
    cy.visit('/' + CREATE_PATHS.root + '/' + child + '/123');
  }

  /** Checks safe fallback navigation from a directly opened protected shell.
   * @param kind Protected destination kind. */
  public expectDirectShell(kind: string): void {
    cy.get(S.placeholderHeading)
      .should('have.text', kind === 'details' ? 'Check case details' : 'Amend case')
      .and('be.focused');
    cy.get(S.placeholderBack)
      .should('have.text', 'Back')
      .and('have.attr', 'href', DASHBOARD + '#in-review');
    cy.location('search').should('eq', '');
    cy.then(() => expect(this.rejectionRequests).to.have.length(0));
    this.assertNoPersistence();
  }
  /** Assert no persistence for the controlled browser journey.
   */
  public assertNoPersistence(): void {
    cy.get('@rejectedPersistedReads').should('not.have.been.called');
    cy.get('@rejectedWrites').should('not.have.been.called');
  }
  /** Capture for the controlled browser journey.
   * @param state Expected or configured state.
   */
  public capture(state: string): void {
    cy.viewport(1440, 1000);
    cy.screenshot('po10607-e2e-' + state);
  }
  /** Reflow for the controlled browser journey.
   */
  public reflow(): void {
    cy.viewport(320, 900);
    cy.document().then((document) => expect(document.documentElement.scrollWidth).to.be.at.most(320));
    cy.get(S.scrollRegion).should('have.prop', 'tagName', 'SECTION');
    cy.get(S.scrollRegion).should('not.have.attr', 'tabindex');
    cy.get(S.scrollRegion).should('be.visible');
    accessibilityActions.checkAccessibilityOnly();
    cy.screenshot('po10607-e2e-reflow-320');
  }
}
