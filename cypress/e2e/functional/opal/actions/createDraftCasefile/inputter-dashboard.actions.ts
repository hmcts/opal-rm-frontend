import { selectedPersistedCasefile, stubPersistedCasefileReferences } from './check-case-details-modes.actions';
import { CasesDraftSelectors as S } from '../../../../../shared/selectors/cases-draft.selectors';
import { CreateCasefileSelectors as CREATE } from '../../../../../shared/selectors/create-casefile.selectors';
import { ReleaseFlagsSelectors as RELEASE } from '../../../../../shared/selectors/release-flags.selectors';
import { accessibilityActions } from '../accessibility/accessibility.actions';
import { pressDashboardEnter } from '../../../../../support/utils/press-dashboard-enter';
import { CASES_DRAFT_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-routing-paths.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as CREATE_PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CASES_DRAFT_TABS } from 'src/app/flows/cases/cases-draft/constants/cases-draft-tabs.constant';
import type { CasesDraftInputterTab } from 'src/app/flows/cases/cases-draft/types/cases-draft-tab.type';
import type { IOpalMaintenanceDraftCasefileSummary } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-summary.interface';
import { allRejectedRows } from '../../mocks/createDraftCasefile/all-rejected.mock';
import { INPUTTER_USER, inputterRows, PUBLISHED_ROWS } from '../../mocks/createDraftCasefile/inputter-dashboard.mock';

const COLLECTION = /\/opal-maintenance-service\/draft-casefiles(?:\?|$)/;
const PERSISTED = /\/opal-maintenance-service\/draft-casefiles\/[^?]+(?:\?|$)/;
const DASHBOARD = '/' + PATHS.root + '/' + PATHS.children.tabs;

/** Owns browser interaction and narrowly bounded synthetic HTTP data for the inputter journey. */
export class InputterDashboardActions {
  private collections: Partial<Record<CasesDraftInputterTab, IOpalMaintenanceDraftCasefileSummary[]>> = {};
  private requests: Record<string, unknown>[] = [];
  private listFailures = 0;
  private badgeFailures = 0;
  private listDelay = 0;

  /** Resets synthetic request boundaries and observes only collection or persisted case traffic. */
  public prepare(): void {
    this.collections = {};
    this.requests = [];
    this.listFailures = 0;
    this.badgeFailures = 0;
    this.listDelay = 0;
    cy.intercept('GET', '**/api/user-state', { body: structuredClone(INPUTTER_USER) });
    const details = cy.spy().as('dashboardDetails');
    cy.intercept('GET', PERSISTED, (request) => {
      details(request);
      const id = Number(new URL(request.url).pathname.split('/').pop());
      expect(id, 'supported selected inputter fixture').to.be.oneOf([1, 123]);
      request.reply({ body: selectedPersistedCasefile(id, 'REJECTED', 'BUU-SYNTHETIC'), headers: { ETag: '"0"' } });
    });
    const mutation = cy.spy().as('dashboardMutation');
    cy.intercept(
      { method: '+(POST|PUT|PATCH|DELETE)', url: /\/opal-maintenance-service\/draft-casefiles(?:[/?]|$)/ },
      (request) => {
        mutation(request);
        request.reply({ statusCode: 405, body: {} });
      },
    );
    cy.intercept('GET', COLLECTION, (request) => {
      this.requests.push({ ...request.query });
      if (request.query['not_submitted_by'] !== undefined) {
        expect(request.query).to.deep.equal({
          business_unit_id: '44',
          casefile_status: 'REJECTED',
          not_submitted_by: 'BUU-SYNTHETIC',
        });
        const summaries = allRejectedRows();
        request.reply({ body: { count: summaries.length, summaries } });
        return;
      }
      const tab = (Object.keys(CASES_DRAFT_TABS) as CasesDraftInputterTab[]).find(
        (key) => CASES_DRAFT_TABS[key].statuses === request.query['casefile_status'],
      );
      expect(tab, 'supported exact comma-separated status filter').not.to.equal(undefined);
      const countOnly = request.query['restrict'] === 'counts';
      const summaries = this.collections[tab!] ?? [];
      const failure = countOnly ? this.badgeFailures-- > 0 : this.listFailures-- > 0;
      request.reply(
        failure
          ? { statusCode: 503, body: { operation_id: 'SYNTHETIC-RETRY' } }
          : {
              delay: countOnly ? 0 : this.listDelay,
              body: countOnly
                ? { count: summaries.length }
                : { count: summaries.length, summaries: structuredClone(summaries) },
            },
      );
    }).as('inputterCollection');
  }

  /** Sets independent list/count data for one status filter.
   * @param tab Lifecycle collection to replace.
   * @param summaries Synthetic wire summaries for that collection. */
  public stubCollection(tab: CasesDraftInputterTab, summaries: IOpalMaintenanceDraftCasefileSummary[]): void {
    this.collections[tab] = structuredClone(summaries);
  }

  /** Supplies authorised synthetic inputter collections for every lifecycle tab. */
  public available(): void {
    this.prepare();
    for (const tab of Object.keys(CASES_DRAFT_TABS) as CasesDraftInputterTab[])
      this.stubCollection(tab, inputterRows(tab));
  }

  /** Opens a canonical dashboard fragment.
   * @param tab Lifecycle selection to open. */
  public open(tab: CasesDraftInputterTab = 'in-review'): void {
    cy.visit(DASHBOARD + '#' + tab);
  }

  /** Traverses the released Cases landing entry and captures its changed presentation. */
  public enterFromCases(): void {
    cy.visit('/dashboard/cases');
    cy.viewport(1440, 1000);
    cy.get(RELEASE.createCaseLink).should('have.attr', 'id', 'casesCreateCasefileLink');
    cy.screenshot('po10605-after-landing');
    cy.get(RELEASE.createCaseLink).click();
  }

  /** Starts fresh creation through the dashboard button. */
  public chooseCreate(): void {
    cy.get(S.create).click();
  }

  /** Checks the routed lifecycle selection and current navigation link.
   * @param tab Expected lifecycle tab. */
  public expectDashboard(tab: CasesDraftInputterTab): void {
    cy.location('pathname').should('eq', DASHBOARD);
    cy.location('hash').should('eq', '#' + tab);
    cy.location('search').should('eq', '');
    cy.get(S.heading).should('have.text', 'Create cases');
    cy.get(S.tab(tab)).should('have.attr', 'aria-current', 'page');
  }

  /** Checks permanent tabs, scoped status filters and the counts-only privacy boundary. */
  public expectTabs(): void {
    this.expectDashboard('in-review');
    for (const tab of Object.keys(CASES_DRAFT_TABS) as CasesDraftInputterTab[])
      cy.get(S.tab(tab)).should('be.visible').and('contain.text', CASES_DRAFT_TABS[tab].label);
    cy.get(S.table).should('be.visible');
    cy.then(() => {
      expect(this.requests).to.have.length(2);
      expect(this.requests).to.deep.include({
        business_unit_id: '44',
        submitted_by: 'BUU-SYNTHETIC',
        casefile_status: 'SUBMITTED,RESUBMITTED',
      });
      expect(this.requests).to.deep.include({
        business_unit_id: '44',
        submitted_by: 'BUU-SYNTHETIC',
        casefile_status: 'REJECTED',
        restrict: 'counts',
      });
    });
    this.assertNoPersistence();
  }

  /** Checks fresh entry clears all case and applicant selections. */
  public expectEmptyCaseType(): void {
    cy.location('pathname').should('eq', '/' + CREATE_PATHS.root + '/' + CREATE_PATHS.children.caseType);
    cy.get(CREATE.caseTypeHeading).should('be.focused');
    cy.get(CREATE.caseTypeRadios).filter(':checked').should('not.exist');
    cy.get(CREATE.applicantTypeSelectedOption).should('have.text', 'Select');
  }

  /** Supplies an explicit empty or populated rejected collection.
   * @param state Collection result state. */
  public rejected(state = 'populated'): void {
    this.available();
    this.stubCollection('rejected', state === 'empty' ? [] : inputterRows('rejected'));
    this.open('rejected');
    cy.get(state === 'empty' ? S.empty : S.table).should('be.visible');
  }

  /** Uses native Enter for applicant sorting and second-page navigation without HTTP pagination. */
  public selectRejectedPage(): void {
    cy.get(S.heading).should('be.focused');
    cy.get(S.sort('applicant')).focus().should('be.focused');
    pressDashboardEnter();
    cy.get('th[columnKey="applicant"]').should('have.attr', 'aria-sort', 'ascending');
    cy.get(S.sort('applicant')).focus().should('be.focused');
    pressDashboardEnter();
    cy.get('th[columnKey="applicant"]').should('have.attr', 'aria-sort', 'descending');
    cy.get(S.pagination).contains('a', '2').focus();
    pressDashboardEnter();
    cy.get(S.pageStatus).should('contain.text', 'Create cases, page 2 of 2');
    cy.get(S.row(1)).should('be.visible');
    cy.get('@inputterCollection.all').should('have.length', 1);
  }

  /** Opens persisted details with native Enter and changes the next collection response.
   * @param id Synthetic draft identifier displayed in the current page. */
  public openDetails(id: number): void {
    stubPersistedCasefileReferences();
    cy.get(S.row(id)).find('a').should('not.have.attr', 'target');
    cy.get(S.row(id)).find('a').focus().should('be.focused');
    pressDashboardEnter();
    this.expectSavedSummary();
    cy.get('@dashboardDetails').should('have.been.calledOnce');
    this.assertNoMutation();
    // Return must load fresh rows while retaining only navigation metadata.
    this.stubCollection(
      'rejected',
      inputterRows('rejected').map((row) => ({
        ...row,
        casefile_snapshot: {
          ...row.casefile_snapshot,
          respondent_account: { respondent_name: 'Refreshed synthetic respondent ' + row.draft_casefile_id },
        },
      })),
    );
  }

  /** Returns with native keyboard activation of Back. */
  public returnFromPlaceholder(): void {
    cy.get(CREATE.review.back).focus();
    pressDashboardEnter();
  }

  /** Checks retained page/sort and freshly fetched respondent content.
   * @param fresh Whether persisted navigation refreshed the synthetic content. */
  public expectRestored(fresh = true): void {
    this.expectDashboard('rejected');
    cy.location('search').should('eq', '');
    cy.get(S.pageStatus).should('contain.text', 'Page 2 of 2');
    cy.get('th[columnKey="applicant"]').should('have.attr', 'aria-sort', 'descending');
    cy.get(S.row(1)).should('contain.text', fresh ? 'Refreshed synthetic respondent 1' : 'Synthetic respondent 01');
    this.assertNoMutation();
    if (!fresh) cy.get('@dashboardDetails').should('not.have.been.called');
  }

  /** Opens the all-rejected destination in the same tab using native Enter. */
  public viewAllRejected(): void {
    cy.get(S.heading).should('be.focused');
    cy.get(S.allRejected).should('not.have.attr', 'target');
    cy.get(S.allRejected).focus().should('be.focused');
    pressDashboardEnter();
  }

  /** Checks canonical all-rejected route, heading focus and absence of persistence traffic. */
  public expectAllRejectedPlaceholder(): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.rejections);
    cy.get(S.allRejectedHeading).should('have.text', 'All rejected cases').and('be.focused');
    cy.get(S.allRejectedBack).should('have.text', 'Back to your cases');
    cy.then(() =>
      expect(this.requests).to.deep.include({
        business_unit_id: '44',
        not_submitted_by: 'BUU-SYNTHETIC',
        casefile_status: 'REJECTED',
      }),
    );
    this.assertNoPersistence();
  }

  /** Supplies published multi-account rows plus a defensive unexpected pending result. */
  public approved(): void {
    this.available();
    this.stubCollection('approved', PUBLISHED_ROWS);
    this.open();
  }
  /** Selects Approved through native keyboard activation. */
  public selectApproved(): void {
    cy.get(S.tab('approved')).focus();
    pressDashboardEnter();
    cy.get(S.table).should('be.visible');
  }
  /** Checks read-only account sequence, missing-value fallback and pending exclusion. */
  public expectPublished(): void {
    this.expectDashboard('approved');
    cy.get(S.row(1)).should('contain.text', '000123A').and('contain.text', 'A010');
    cy.get(S.row(1))
      .find(S.column('minorCreditorAccounts'))
      .find('li')
      .then((items) => expect([...items].map((item) => item.textContent?.trim())).to.deep.equal(['M10', 'M2']));
    cy.get(S.row(200)).find(S.column('respondentAccount')).should('contain.text', '—');
    cy.get(S.row(200)).find(S.column('applicantAccount')).should('contain.text', '—');
    cy.get(S.row(200)).find(S.column('minorCreditorAccounts')).should('contain.text', '—');
    cy.get(S.row(201)).should('not.exist');
    cy.get(S.table).find('td a, td button').should('not.exist');
    this.assertNoPersistence();
  }
  /** Checks exact BU/user/status parameters and the seven-day status-date boundary. */
  public expectDateBoundary(): void {
    cy.then(() => {
      const approved = this.requests.find((request) => request['casefile_status'] === 'PUBLISHED');
      expect(approved).to.have.all.keys(
        'business_unit_id',
        'submitted_by',
        'casefile_status',
        'casefile_status_from_date',
        'casefile_status_to_date',
      );
      expect(approved).to.include({
        business_unit_id: '44',
        submitted_by: 'BUU-SYNTHETIC',
        casefile_status: 'PUBLISHED',
      });
      const now = new Date();
      const date = (days: number) =>
        new Date(now.getFullYear(), now.getMonth(), now.getDate() - days).toLocaleDateString('en-CA');
      expect(approved?.['casefile_status_from_date']).to.equal(date(7));
      expect(approved?.['casefile_status_to_date']).to.equal(date(0));
      expect(approved).not.to.have.property('validated_date');
    });
  }

  /** Starts fresh creation from remembered rejected page/sort metadata. */
  public startFromRejected(): void {
    this.rejected();
    this.selectRejectedPage();
    this.chooseCreate();
    this.expectEmptyCaseType();
  }
  /** Chooses the application dirty-departure confirmation response.
   * @param decision Whether to accept or dismiss departure. */
  public cancelCaseType(decision: string): void {
    cy.get(CREATE.caseTypeRadio('REMO In')).check();
    cy.get(CREATE.applicantType).select('Individual');
    cy.once('window:confirm', (message) => {
      expect(message).to.equal(
        'WARNING: Are you sure you want to leave this page? Any information you entered will be lost.',
      );
      return decision === 'accept';
    });
    cy.get(CREATE.cancelLink).focus();
    pressDashboardEnter();
  }
  /** Checks preserved input or discarded input and retained dashboard metadata.
   * @param outcome Expected retained or restored state. */
  public expectCaseTypeCancellation(outcome: string): void {
    if (outcome === 'restored') {
      this.expectRestored(false);
      cy.viewport(1440, 1000);
      cy.screenshot('po10605-after-case-type-cancel-return');
      this.chooseCreate();
      this.expectEmptyCaseType();
    } else {
      cy.get(CREATE.caseTypeRadio('REMO In')).should('be.checked');
      cy.get(CREATE.applicantTypeSelectedOption).should('have.text', 'Individual');
    }
  }

  /** Fails the next initial list resolver while retaining the current Cases route. */
  public initialListFailure(): void {
    this.available();
    this.listFailures = 1;
    cy.visit('/dashboard/cases');
  }
  /** Fails the next rejected count resolver independently of the successful list. */
  public initialCountFailure(): void {
    this.available();
    this.badgeFailures = 1;
    cy.visit('/dashboard/cases');
  }
  /** Opens the dashboard from the already loaded Cases page. */
  public openFromCases(): void {
    cy.get(RELEASE.createCaseLink).focus();
    pressDashboardEnter();
  }
  /** Checks a rejected resolver leaves the current route and reports through the app banner. */
  public expectResolverFailure(): void {
    cy.location('pathname').should('eq', '/dashboard/cases');
    cy.get(CREATE.globalErrorBanner).should('be.visible');
    cy.get(S.heading).should('not.exist');
    cy.get(S.table).should('not.exist');
    cy.get(S.obsoleteLocalControls).should('not.exist');
  }
  /** Checks independent count failure leaves the successful list and every lifecycle tab available. */
  public expectCountFailure(): void {
    this.expectDashboard('in-review');
    cy.get(S.table).should('be.visible');
    cy.get(CREATE.globalErrorBanner).should('be.visible');
    cy.get(S.tabs).find('a').should('have.length', 4);
    cy.get(S.tab('rejected')).should((element) => expect(element.text().trim()).to.equal('Rejected'));
    cy.get(S.rejectedCount).should('not.exist');
    cy.get(S.obsoleteLocalControls).should('not.exist');
  }
  /** Checks a later accepted resolver navigation renders the real dashboard with all permanent tabs. */
  public expectResolverRecovery(): void {
    this.expectDashboard('in-review');
    cy.get(S.table).should('be.visible');
    for (const tab of Object.keys(CASES_DRAFT_TABS) as CasesDraftInputterTab[])
      cy.get(S.tab(tab)).should('be.visible').and('contain.text', CASES_DRAFT_TABS[tab].label);
    cy.get(S.rejectedCount).should('contain.text', '26');
    cy.get(S.obsoleteLocalControls).should('not.exist');
  }
  /** Rejects one subsequent fragment consultation after successful resolver entry. */
  public failNextTab(): void {
    this.listFailures = 1;
  }
  /** Selects a lifecycle tab using native keyboard events.
   * @param tab Lifecycle fragment to activate. */
  public selectTab(tab: CasesDraftInputterTab): void {
    cy.get(S.tab(tab)).focus();
    pressDashboardEnter();
  }
  /** Checks failed tab data cannot expose the prior table or a fabricated empty result. */
  public expectFailedTab(): void {
    this.expectDashboard('approved');
    cy.get(CREATE.globalErrorBanner).should('be.visible');
    cy.get(S.table).should('not.exist');
    cy.get(S.empty).should('not.exist');
    cy.get(S.tabs).find('a').should('have.length', 4);
    cy.get(S.obsoleteLocalControls).should('not.exist');
  }
  /** Checks another tab recovers after an inner request error without reloading the dashboard. */
  public expectRecoveredTab(): void {
    this.expectDashboard('deleted');
    cy.get(S.table).should('be.visible');
    cy.get(S.row(1)).should('exist');
    cy.get(S.obsoleteLocalControls).should('not.exist');
    cy.get('@inputterCollection.all').should('have.length', 4);
  }

  /** Opens a canonical persisted destination without a local creation draft.
   * @param kind Details or amendment destination.
   * @param id Valid or malformed route identifier. */
  public openPersisted(kind: string, id: string): void {
    const child = kind === 'details' ? CREATE_PATHS.children.checkCaseDetails : CREATE_PATHS.children.taskList;
    const path = '/' + CREATE_PATHS.root + '/' + child + '/' + id;
    if (kind === 'details') stubPersistedCasefileReferences();
    if (kind === 'details' && id === '0') {
      cy.visit('/dashboard/cases');
      cy.get(RELEASE.createCaseLink).should('be.visible');
      cy.window().then((window) => {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new window.PopStateEvent('popstate'));
      });
    } else cy.visit(path);
  }

  /** Checks safe placeholder copy and the closed persistence boundary.
   * @param kind Expected destination type.
   * @param message Expected safe recovery or future-work copy. */
  public expectShell(kind: string, message: string): void {
    if (kind === 'details') {
      if (message === 'Saved case details') {
        this.expectSavedSummary();
        cy.get(CREATE.review.decisionContinue).should('not.exist');
        cy.get('@dashboardDetails').should('have.been.calledOnce');
        this.assertNoMutation();
      } else {
        cy.get(RELEASE.createCaseLink).should('be.visible');
        cy.get(CREATE.globalErrorBanner).should('be.visible');
        cy.get(CREATE.review.heading).should('not.exist');
        this.assertNoPersistence();
      }
      return;
    }
    cy.get('#cases-draft-placeholder-heading').should('have.text', 'Amend case').and('be.focused');
    cy.contains('p', message).should('be.visible');
    cy.get('.govuk-grid-column-two-thirds').should('be.visible');
    cy.get(CREATE.caseTypeGroup).should('not.exist');
    cy.get('@inputterCollection.all').should('have.length', 0);
    this.assertNoPersistence();
  }
  /** Checks saved parties and order terms after the actual selected GET has resolved. */
  public expectSavedSummary(): void {
    cy.get(CREATE.review.heading).should('have.text', 'Synthetic Respondent').and('be.focused');
    cy.get(CREATE.review.section('respondent')).should('contain.text', 'Synthetic').and('contain.text', 'Respondent');
    cy.get(CREATE.review.section('orderTerms'))
      .should('contain.text', 'Test order term')
      .and('contain.text', '£100.00');
    cy.get(CREATE.review.submit).should('not.exist');
  }

  /** Allows the expected selected read while retaining the closed write boundary. */
  private assertNoMutation(): void {
    cy.get('@dashboardMutation').should('not.have.been.called');
  }
  /** Supplies permission 21 exclusively in another business unit. */
  public crossBusinessUnit(): void {
    this.prepare();
    const user = structuredClone(INPUTTER_USER);
    user.domains['maintenance']!.business_unit_users[0].business_unit_id = 45;
    cy.intercept('GET', '**/api/user-state', { body: user });
  }
  /** Opens an inputter route for denied-entry evidence.
   * @param path Named protected destination. */
  public openProtected(path: string): void {
    if (path === 'dashboard') this.open();
    else if (path === 'all rejected') cy.visit('/' + PATHS.root + '/' + PATHS.children.rejections);
    else this.openPersisted(path, '123');
  }
  /** Checks access denial before any collection or persisted request. */
  public expectDenied(): void {
    cy.location('pathname').should('eq', '/access-denied');
    cy.contains('h1', 'Access Denied').should('be.visible');
    cy.get('@inputterCollection.all').should('have.length', 0);
    this.assertNoPersistence();
  }
  /** Checks placeholders and read-only dashboard paths never fetch or mutate persisted cases. */
  public assertNoPersistence(): void {
    cy.get('@dashboardDetails').should('not.have.been.called');
    cy.get('@dashboardMutation').should('not.have.been.called');
  }
  /** Captures confirmation and follows the In review return through native Enter. */
  public returnFromConfirmation(): void {
    cy.viewport(1440, 1000);
    cy.screenshot('po10605-after-confirmation');
    cy.get(CREATE.review.inReview).focus();
    pressDashboardEnter();
  }
  /** Checks confirmation resets In review to first page and Created ascending. */
  public expectDefaultReview(): void {
    this.expectDashboard('in-review');
    cy.location('search').should('eq', '');
    cy.get('th[columnKey="created"]').should('have.attr', 'aria-sort', 'ascending');
    cy.get(S.pageStatus).should('contain.text', 'Page 1 of 2');
  }

  /** Captures the fresh Case Type presentation corresponding to the release-base evidence. */
  public captureCaseType(): void {
    cy.viewport(1440, 1000);
    cy.get(CREATE.caseTypeHeading).should('be.focused');
    cy.screenshot('po10605-after-case-type');
  }

  /** Supplies a representative dashboard accessibility state.
   * @param state Loading, empty, populated, global error or published data. */
  public state(state: string): void {
    this.available();
    if (state === 'empty') this.stubCollection('in-review', []);
    if (state === 'published') this.stubCollection('approved', PUBLISHED_ROWS);
    this.open(state === 'published' ? 'approved' : 'in-review');
    if (state === 'error') {
      cy.get(S.table).should('be.visible');
      cy.then(() => {
        this.listFailures = 1;
      });
      this.selectTab('approved');
      cy.get(CREATE.globalErrorBanner).should('be.visible');
      cy.get(S.table).should('not.exist');
    } else if (state === 'loading') {
      cy.get(S.table).should('be.visible');
      cy.then(() => {
        this.listDelay = 2000;
      });
      this.selectTab('rejected');
      cy.get(S.loading).should('contain.text', 'Loading Rejected cases.').and('have.attr', 'aria-live', 'polite');
    } else cy.get(state === 'empty' ? S.empty : S.table).should('be.visible');
  }
  /** Captures every populated lifecycle table using native tab activation. */
  public screenshotTables(): void {
    cy.viewport(1440, 1000);
    cy.get(S.heading).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.create).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.tab('in-review')).should('be.focused');
    for (const tab of Object.keys(CASES_DRAFT_TABS) as CasesDraftInputterTab[]) {
      cy.get(S.tab(tab)).focus();
      pressDashboardEnter();
      cy.get(S.table).should('be.visible');
      accessibilityActions.checkAccessibilityOnly();
      cy.screenshot('po10605-after-' + tab);
    }
  }
  /** Checks document width at 320 CSS pixels and captures partial reflow evidence. */
  public reflow(): void {
    cy.viewport(320, 900);
    cy.document().then((document) => expect(document.documentElement.scrollWidth).to.be.at.most(320));
    cy.get(S.create).should('be.visible');
    cy.screenshot('po10605-after-reflow-320');
  }
  /** Captures a focused representative persisted shell.
   * @param kind Evidence name distinguishing valid and malformed destinations. */
  public screenshotShell(kind: string): void {
    cy.viewport(1440, 1000);
    if (kind === 'malformed-details') cy.get(CREATE.globalErrorBanner).should('be.visible');
    else if (kind === 'details') cy.get(CREATE.review.heading).should('be.focused');
    else cy.get(kind === 'all-rejected' ? S.allRejectedHeading : S.placeholderHeading).should('be.focused');
    cy.screenshot('po10605-after-' + kind + '-shell');
  }
}
