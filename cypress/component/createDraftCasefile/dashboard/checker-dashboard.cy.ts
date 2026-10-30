import { CreateCasefileSelectors } from '../../../shared/selectors/create-casefile.selectors';
import { Subject, of } from 'rxjs';
import { type IOpalMaintenanceDraftCasefileListResponse as List } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-list-response.interface';
import { CASES_DRAFT_CHECKER_TABS as TABS } from 'src/app/flows/cases/cases-draft/constants/cases-draft-checker-tabs.constant';
import { setupCheckerDashboard } from './setup/checker-dashboard.setup';
import { checkerFixtures, checkerEmptyMessages, checkerDecisionNotice } from './mocks/checker-dashboard.mock';
import { CasesDraftSelectors as S } from '../../../shared/selectors/cases-draft.selectors';
import {
  GENERIC_HTTP_ERROR_TITLE,
  GENERIC_HTTP_ERROR_MESSAGE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { DASHBOARD_ROUTING_PATHS } from 'src/app/pages/dashboard/constants/dashboard-routing-paths.constant';
import { type Router } from '@angular/router';
import { pressDashboardEnter } from '../../../support/utils/press-dashboard-enter';
import { CASES_DRAFT_CHECKER_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-checker-routing-paths.constant';

const R = CreateCasefileSelectors.review;

const buildDecisionTags = (): string[] => [
  '@JIRA-STORY:PO-10611',
  '@JIRA-EPIC:PO-10817',
  '@JIRA-LABEL:create-draft-casefile',
];

const buildTags = () => ['@JIRA-STORY:PO-10606', '@JIRA-EPIC:PO-10817'];

describe('Checker routed dashboard', () => {
  it('AC1, AC2. should show permanent queues and exclude own and out of scope work', { tags: buildTags() }, () => {
    setupCheckerDashboard({ rows: checkerFixtures.mixedScope });
    cy.get(S.heading).should('contain.text', 'Review cases').and('be.focused');
    for (const tab of ['to-review', 'rejected', 'deleted', 'failed'] as const) cy.get(S.tab(tab)).should('be.visible');
    cy.get(S.create).should('not.exist');
    cy.get(S.row(101)).should('be.visible');
    for (const id of [102, 103, 104]) cy.get(S.row(id)).should('not.exist');
    cy.get('@checkerListRequest').should('have.been.calledOnce');
  });

  for (const tab of ['to-review', 'rejected', 'deleted', 'failed'] as const) {
    it('AC2. should render ' + tab + ' columns and scoped request', { tags: buildTags() }, () => {
      setupCheckerDashboard({ tab });
      for (const col of TABS[tab].columns) cy.get(S.sort(col)).should('be.visible');
      cy.get(S.column('submittedByName')).first().should('contain.text', 'Synthetic submitter');
      cy.get<Cypress.Agent<sinon.SinonStub>>('@checkerListRequest').should((request) => {
        const args = request.firstCall.args[0];
        expect(args).to.include({
          business_unit_id: 44,
          not_submitted_by: 'BUU-CHECKER',
          casefile_status: TABS[tab].statuses,
        });
        expect(args).not.to.have.property('submitted_by');
        if (tab === 'deleted') {
          expect(args).to.have.property('casefile_status_from_date');
          expect(args).to.have.property('casefile_status_to_date');
        } else {
          expect(args).not.to.have.property('casefile_status_from_date');
          expect(args).not.to.have.property('casefile_status_to_date');
        }
      });
      cy.get<Cypress.Agent<sinon.SinonStub>>('@checkerCountRequest').should((request) => {
        expect(request.callCount).to.equal(tab === 'rejected' || tab === 'failed' ? 1 : 2);
        for (const call of request.getCalls()) {
          expect(call.args[0]).to.include({ business_unit_id: 44, not_submitted_by: 'BUU-CHECKER' });
          expect(call.args[0]).not.to.have.property('casefile_status_from_date');
        }
      });
    });
    it('AC1. should show exact ' + tab + ' empty message', { tags: buildTags() }, () => {
      setupCheckerDashboard({ tab, rows: checkerFixtures.empty, rejectedCount: 0, failedCount: 0 });
      cy.get(S.empty).should((element) => expect(element.text().trim()).to.equal(checkerEmptyMessages[tab]));
      cy.get(S.table).should('not.exist');
      cy.get(S.rejectedCount).should('not.exist');
      cy.get(S.failedCount).should('not.exist');
      cy.get(S.tab(tab)).focus().should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.tab(tab)).should('not.be.focused');
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
    });
  }
  for (const count of [0, 1, 99, 100])
    it('AC1. should render known badge ' + count, { tags: buildTags() }, () => {
      setupCheckerDashboard({ rejectedCount: count, failedCount: count });
      for (const badge of [S.rejectedCount, S.failedCount]) {
        if (count === 0) cy.get(badge).should('not.exist');
        else cy.get(badge).should('have.text', count > 99 ? '99+' : String(count));
      }
    });
  it('AC2. should use original oldest creation for dual role', { tags: buildTags() }, () => {
    setupCheckerDashboard({ role: 'dual', rows: checkerFixtures.oldest });
    cy.get(S.tableRows).first().should('have.attr', 'data-draft-id', '101');
    cy.get(S.sort('created')).closest('th').should('have.attr', 'aria-sort', 'ascending');
    cy.get(S.pageStatus)
      .invoke('text')
      .should('match', /page 1 of 1/i);
    cy.get(S.row(102)).should('be.visible');
    cy.get('@checkerListRequest').should('have.been.calledOnce');
  });
  it('AC2. should exclude own work for a dual permission user', { tags: buildTags() }, () => {
    setupCheckerDashboard({ role: 'dual', rows: checkerFixtures.mixedScope });
    cy.get(S.row(101)).should('be.visible');
    for (const id of [102, 103, 104]) cy.get(S.row(id)).should('not.exist');
    cy.get<Cypress.Agent<sinon.SinonStub>>('@checkerListRequest').should((request) =>
      expect(request.firstCall.args[0]).to.include({ not_submitted_by: 'BUU-CHECKER' }),
    );
  });
  it('AC2. should show em dash for missing supplied name', { tags: buildTags() }, () => {
    setupCheckerDashboard({ rows: checkerFixtures.missingName });
    cy.get(S.column('submittedByName')).should('contain.text', '—');
  });
  it('AC3. should sort and paginate locally', { tags: buildTags() }, () => {
    setupCheckerDashboard();
    cy.get(S.tableRows).should('have.length', 25);
    cy.get(S.row(26)).should('not.exist');
    cy.get(S.pagination).contains('a', 'Next').click();
    cy.get(S.row(26)).should('be.visible');
    cy.get(S.pageStatus).should('contain.text', 'page 2 of 2');
    cy.get(S.sort('respondent')).click();
    cy.get(S.tableRows).should('have.length', 25);
    cy.get(S.pageStatus)
      .invoke('text')
      .should('match', /page 1 of 2/i);
    cy.get('@checkerListRequest').should('have.been.calledOnce');
  });
  it('AC3. should provide a native modified-click review href', { tags: buildTags() }, () => {
    setupCheckerDashboard();
    cy.get(S.row(1)).find('a').should('have.attr', 'href').and('include', '/review/1#to-review');
    cy.get(S.row(1)).find('a').trigger('click', { ctrlKey: true });
    cy.get(S.heading).should('be.visible');
    cy.get('@checkerListRequest').should('have.been.calledOnce');
  });
  it('AC4. should omit an unavailable independent count while preserving rows', { tags: buildTags() }, () => {
    setupCheckerDashboard({ countError: 'failed' });
    cy.get(S.table).should('be.visible');
    cy.get(S.failedCount).should('not.exist');
    cy.get(S.rejectedCount).should('have.text', '3');
    cy.get(S.countRetry('failed')).should('not.exist');
    cy.get('@checkerListRequest').should('have.been.calledOnce');
  });
  it('AC4. should clear a later failed list and load the next queue', { tags: buildTags() }, () => {
    setupCheckerDashboard();
    const pending = new Subject<List>();
    cy.get<Cypress.Agent<sinon.SinonStub>>('@checkerListRequest').then((request) => request.returns(pending));
    cy.get(S.tab('deleted')).click();
    cy.get(S.loading).should('be.visible');
    cy.get(S.table).should('not.exist');
    cy.then(() => pending.error(new Error('Synthetic later failure')));
    cy.get(S.loading).should('not.exist');
    cy.get(S.retryList).should('not.exist');
    cy.get<Cypress.Agent<sinon.SinonStub>>('@checkerListRequest').then((request) =>
      request.returns(of({ count: 0, summaries: [] })),
    );
    cy.get(S.tab('rejected')).click();
    cy.get(S.empty).should('contain.text', TABS.rejected.empty);
  });
  it('AC3. should restore metadata and fetch fresh rows with page clamp on Back', { tags: buildTags() }, () => {
    setupCheckerDashboard({ tab: 'rejected', page: 2, sort: 'respondent', direction: 'descending' });
    cy.get(S.tableRows).first().find('a').click();
    cy.get(R.heading).should('have.text', 'Synthetic Respondent').and('be.focused');
    cy.get(R.back).should('have.attr', 'href', '#');
    cy.get(R.decisionHost).should('not.exist');
    cy.get('@checkerDetailRequest').should('have.been.calledOnceWithExactly', 1);
    cy.get(R.rowValue('respondent', 'FirstNames')).should('contain.text', 'Synthetic');
    cy.get<Cypress.Agent<sinon.SinonStub>>('@checkerListRequest').then((request) =>
      request.returns(of({ count: 1, summaries: checkerFixtures.queues.rejected.slice(0, 1) })),
    );
    cy.get(R.back).click();
    cy.get(S.tab('rejected')).should('have.attr', 'aria-current', 'page');
    cy.get(S.tableRows).should('have.length', 1);
    cy.get(S.pageStatus)
      .invoke('text')
      .should('match', /page 1 of 1/i);
    cy.get(S.sort('respondent')).closest('th').should('have.attr', 'aria-sort', 'descending');
    cy.get('@checkerListRequest').should('have.been.calledTwice');
  });
  it('AC2, AC3. should not persist summaries during navigation', { tags: buildTags() }, () => {
    setupCheckerDashboard();
    cy.window().then((win) => {
      cy.spy(win.localStorage, 'setItem').as('localWrites');
      cy.spy(win.sessionStorage, 'setItem').as('sessionWrites');
    });
    cy.get(S.sort('respondent')).click();
    cy.get(S.tab('rejected')).click();
    cy.get(S.row(1)).find('a').click();
    cy.get(R.heading).should('have.text', 'Synthetic Respondent');
    cy.get('@checkerDetailRequest').should('have.been.calledOnceWithExactly', 1);
    cy.get(R.back).click();
    cy.get(S.table).should('be.visible');
    cy.get('@localWrites').should('not.have.been.called');
    cy.get('@sessionWrites').should('not.have.been.called');
  });

  for (const stale of ['success', 'error'] as const)
    it('AC4. should ignore abandoned list ' + stale + ' in explicit response order', { tags: buildTags() }, () => {
      setupCheckerDashboard();
      const pending = new Subject<List>();
      cy.get<Cypress.Agent<sinon.SinonStub>>('@checkerListRequest').then((request) => request.returns(pending));
      cy.get(S.tab('deleted')).click();
      cy.get(S.loading).should('be.visible');
      cy.wrap(pending, { log: false }).as('abandonedList');
      const latest = new Subject<List>();
      cy.get<Cypress.Agent<sinon.SinonStub>>('@checkerListRequest').then((request) => request.returns(latest));
      cy.get(S.tab('rejected')).click();
      cy.get(S.loading).should('contain.text', 'Rejected');
      cy.get<Subject<List>>('@abandonedList').then((old) => {
        if (stale === 'success') old.next({ count: 26, summaries: checkerFixtures.review26 });
        else old.error(new Error('Obsolete list failure'));
      });
      cy.get(S.loading).should('be.visible');
      cy.get(S.table).should('not.exist');
      cy.get(S.failure).should('not.exist');
      cy.then(() => latest.next({ count: 1, summaries: checkerFixtures.queues.rejected.slice(0, 1) }));
      cy.get(S.tableRows).should('have.length', 1);
      cy.get(S.rejectedCount).should('have.text', '1');
      cy.get('@checkerListRequest').should('have.been.calledThrice');
    });
});

describe('Checker decision notice presentation', () => {
  beforeEach(() => cy.viewport(1280, 900));
  for (const outcome of ['approved', 'rejected', 'deleted'] as const) {
    it(
      'AC1, AC2. should announce and dismiss ' + outcome + ' with heading focus',
      { tags: buildDecisionTags() },
      () => {
        setupCheckerDashboard({ decisionNotice: checkerDecisionNotice(outcome), rows: [] });
        const text = 'You have ' + outcome + ' Synthetic Respondent’s case.';
        cy.get(S.success).should('contain.text', text);
        cy.get(S.successAnnouncement)
          .should('have.length', 1)
          .and('have.attr', 'aria-atomic', 'true')
          .should(($output) => expect($output.text().trim()).to.equal('success: ' + text));
        cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
        cy.checkA11y();
        cy.screenshot('po-10611-dashboard-' + outcome + '-success-1280', { capture: 'viewport' });
        cy.get(S.successDismiss).focus();
        cy.press(Cypress.Keyboard.Keys.ENTER);
        cy.get(S.success).should('not.exist');
        cy.get(S.heading).should('be.focused');
        cy.checkA11y();
      },
    );
  }
  it('AC3. should show no success for direct dashboard entry without a notice', { tags: buildDecisionTags() }, () => {
    setupCheckerDashboard();
    cy.get(S.heading).should('be.visible');
    cy.get(S.success).should('not.exist');
  });
  it('AC1, AC3. should render the persisted name as ordinary escaped text', { tags: buildDecisionTags() }, () => {
    const notice = checkerDecisionNotice('approved');
    notice.respondentName = '<b>Synthetic</b> O’Example';
    setupCheckerDashboard({ decisionNotice: notice });
    cy.get(S.success).should('contain.text', 'You have approved <b>Synthetic</b> O’Example’s case.');
    cy.get(S.success).find('b').should('not.exist');
  });
});

describe('Checker dashboard keyboard and partial accessibility', () => {
  for (const tab of ['to-review', 'rejected', 'deleted', 'failed'] as const) {
    it('AC4. should have no detected Axe violations for populated ' + tab, { tags: buildTags() }, () => {
      setupCheckerDashboard({ tab });
      cy.get(S.table).should('be.visible');
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
      cy.screenshot('po10606-checker-' + tab + '-desktop');
    });
    it('AC4. should contain populated ' + tab + ' reflow at 320 CSS pixels', { tags: buildTags() }, () => {
      cy.viewport(320, 900);
      setupCheckerDashboard({ tab });
      cy.get(S.tableRows).should('have.length', 25);
      cy.document().should((doc) => expect(doc.documentElement.scrollWidth).to.be.at.most(320));
      cy.get(S.scrollRegion)
        .should('have.prop', 'tagName', 'SECTION')
        .and('have.attr', 'aria-label')
        .and('equal', TABS[tab].label + ' cases');
      cy.get(S.heading).should('be.focused');
      for (let i = 0; i < 4; i++) cy.press(Cypress.Keyboard.Keys.TAB);
      for (const col of TABS[tab].columns) {
        cy.press(Cypress.Keyboard.Keys.TAB);
        cy.get(S.sort(col)).should('be.focused');
      }
      cy.get(S.scrollRegion).should((region) => {
        expect(region[0].scrollWidth).to.be.greaterThan(region[0].clientWidth);
        expect(region[0].scrollLeft).to.be.greaterThan(0);
      });
      cy.get(S.scrollRegion).scrollTo('right');
      cy.get(S.sort(TABS[tab].columns.at(-1)!)).should('be.visible');
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
      cy.screenshot('po10606-checker-' + tab + '-320px');
    });
  }
  for (const state of ['empty', 'count-failure'] as const)
    it('AC4. should have no detected Axe violations for ' + state, { tags: buildTags() }, () => {
      setupCheckerDashboard({
        rows: state === 'empty' ? checkerFixtures.empty : undefined,
        countError: state === 'count-failure' ? 'failed' : undefined,
      });
      cy.get(state === 'empty' ? S.empty : S.table).should('be.visible');
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
      cy.screenshot('po10606-checker-' + state);
    });
  it('AC4. should announce an accessible pending queue after arrival', { tags: buildTags() }, () => {
    setupCheckerDashboard();
    cy.get<Cypress.Agent<sinon.SinonStub>>('@checkerListRequest').then((request) =>
      request.returns(new Subject<List>()),
    );
    cy.get(S.tab('deleted')).click();
    cy.get(S.loading)
      .should('be.visible')
      .and('have.prop', 'tagName', 'OUTPUT')
      .and('have.attr', 'aria-live', 'polite');
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
    cy.screenshot('po10606-checker-loading');
  });
  for (const kind of ['review', 'view'] as const) {
    it('AC3. should render the saved ' + kind + ' route accessibly', { tags: buildTags() }, () => {
      setupCheckerDashboard({ targetUrl: '/' + PATHS.root + '/' + PATHS.children[kind] + '/101' });
      cy.get(R.heading).should('have.text', 'Synthetic Respondent').and('be.focused');
      cy.get('@checkerDetailRequest').should('have.been.calledOnceWithExactly', 101);
      cy.get('@checkerCountriesRequest').should('have.been.calledOnceWithExactly', null);
      cy.get('@checkerApplicationsRequest').should('have.been.calledOnceWithExactly', null);
      cy.get('@checkerMajorCreditorsRequest').should('have.been.calledOnceWithExactly', { business_unit_id: 44 });
      cy.get('@checkerResultRequest').should('have.been.calledOnceWithExactly', 'TEST01');
      cy.get(R.rowValue('respondent', 'FirstNames'))
        .invoke('text')
        .should((value) => expect(value.trim()).to.equal('Synthetic'));
      cy.get(R.rowValue('respondent', 'LastName'))
        .invoke('text')
        .should((value) => expect(value.trim()).to.equal('Respondent'));
      cy.get(R.decisionHost).should(kind === 'review' ? 'be.visible' : 'not.exist');
      cy.get('@checkerListRequest').should('not.have.been.called');
      cy.get('@checkerCountRequest').should('not.have.been.called');
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
      cy.screenshot('po10606-' + kind + '-saved');
    });
    it(
      'AC3. should retain the dashboard and shared error for an invalid ' + kind + ' ID',
      { tags: buildTags() },
      () => {
        setupCheckerDashboard({ shell: true });
        cy.get(S.heading).should('be.focused');
        cy.get<Router>('@checkerRouter')
          .then((router) => router.navigateByUrl('/' + PATHS.root + '/' + PATHS.children[kind] + '/invalid'))
          .should('equal', false);
        cy.get(S.heading).should('contain.text', 'Review cases');
        cy.get(S.table).should('be.visible');
        cy.get(R.host).should('not.exist');
        cy.get('@checkerDetailRequest').should('not.have.been.called');
        cy.get('@checkerBannerError').should('have.been.calledOnce');
        cy.get(CreateCasefileSelectors.globalErrorBanner).should('be.visible');
        cy.get(CreateCasefileSelectors.globalErrorBannerHeading).should('contain.text', GENERIC_HTTP_ERROR_TITLE);
        cy.get(CreateCasefileSelectors.globalErrorBannerContent).should('contain.text', GENERIC_HTTP_ERROR_MESSAGE);
        cy.get('@checkerListRequest').should('have.been.calledOnce');
        cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
        cy.checkA11y();
        cy.screenshot('po10606-' + kind + '-invalid');
      },
    );
  }
  it('AC3. should activate queue links through native Tab and Enter', { tags: buildTags() }, () => {
    setupCheckerDashboard();
    cy.get(S.heading).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.tab('to-review')).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.tab('rejected')).should('be.focused');
    pressDashboardEnter();
    cy.get(S.tab('rejected')).should('have.attr', 'aria-current', 'page');
  });
  it('AC3. should reach sorting through native Tab and activate Enter', { tags: buildTags() }, () => {
    setupCheckerDashboard();
    cy.get(S.heading).should('be.focused');
    for (let i = 0; i < 5; i++) cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.sort('respondent')).should('be.focused');
    pressDashboardEnter();
    cy.get(S.sort('respondent')).closest('th').should('have.attr', 'aria-sort', 'ascending');
    cy.get(S.sortStatus).should('contain.text', 'Respondent');
    cy.get('@checkerListRequest').should('have.been.calledOnce');
  });
  it('AC3. should reach pagination through native Tab and activate Enter', { tags: buildTags() }, () => {
    setupCheckerDashboard({ page: 2 });
    cy.get(S.heading).should('be.focused');
    for (let i = 0; i < 11; i++) cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.pagination).contains('a', 'Previous').should('be.focused');
    pressDashboardEnter();
    cy.get(S.row(1)).find('a').should('be.focused');
    cy.get(S.pageStatus).should('contain.text', 'page 1 of 2');
    cy.get('@checkerListRequest').should('have.been.calledOnce');
  });
  it('AC3. should reach respondent and Back through native keyboard', { tags: buildTags() }, () => {
    setupCheckerDashboard();
    cy.get(S.heading).should('be.focused');
    for (let i = 0; i < 10; i++) cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.row(1)).find('a').should('be.focused');
    pressDashboardEnter();
    cy.get(R.heading).should('have.text', 'Synthetic Respondent').and('be.focused');
    cy.get('@checkerDetailRequest').should('have.been.calledOnceWithExactly', 1);
    cy.get(R.back).focus().should('be.focused');
    pressDashboardEnter();
    cy.get(S.heading).should('be.focused');
    cy.get('@checkerListRequest').should('have.been.calledTwice');
  });
  for (const role of ['checker', 'dual'] as const)
    it('AC1, AC3. should show real Cases landing and shell for ' + role, { tags: buildTags() }, () => {
      setupCheckerDashboard({
        role,
        shell: true,
        targetUrl: '/' + DASHBOARD_ROUTING_PATHS.root + '/' + DASHBOARD_ROUTING_PATHS.children.cases,
      });
      cy.get(S.checkerEntry).should('be.visible');
      cy.get(S.primaryNavigation).should('be.visible');
      if (role === 'checker') cy.get(S.inputterEntry).should('not.exist');
      else cy.get(S.inputterEntry).should('be.visible');
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
      cy.screenshot('po10606-cases-' + role + '-after');
      cy.get(S.checkerEntry).click();
      cy.get(S.heading).should('be.focused');
      cy.get(S.primaryNavigation).should('be.visible');
      cy.screenshot('po10606-shell-checker-' + role);
      cy.get(S.row(1)).find('a').click();
      cy.get(R.heading).should('have.text', 'Synthetic Respondent').and('be.focused');
      cy.get('@checkerDetailRequest').should('have.been.calledOnceWithExactly', 1);
      cy.get(R.decisionHost).should('be.visible');
      cy.get(S.primaryNavigation).should('not.exist');
      cy.screenshot('po10606-shell-review-' + role);
      cy.get(R.back).click();
      cy.get(S.heading).should('be.focused');
      cy.get(S.primaryNavigation).should('be.visible');
    });
});
