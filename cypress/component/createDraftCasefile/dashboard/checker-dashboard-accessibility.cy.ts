import {
  GENERIC_HTTP_ERROR_TITLE,
  GENERIC_HTTP_ERROR_MESSAGE,
} from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { CreateCasefileSelectors } from '../../../shared/selectors/create-casefile.selectors';
import { DASHBOARD_ROUTING_PATHS } from 'src/app/pages/dashboard/constants/dashboard-routing-paths.constant';
import { Subject } from 'rxjs';
import type { Router } from '@angular/router';
import type { IOpalMaintenanceDraftCasefileListResponse as List } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-list-response.interface';
import { setupCheckerDashboard } from './setup/checker-dashboard.setup';
import { checkerFixtures } from './mocks/checker-dashboard.mock';
import { CasesDraftSelectors as S } from '../../../shared/selectors/cases-draft.selectors';
import { pressDashboardEnter } from '../../../support/utils/press-dashboard-enter';
import { CASES_DRAFT_CHECKER_TABS as TABS } from 'src/app/flows/cases/cases-draft/constants/cases-draft-checker-tabs.constant';
import { CASES_DRAFT_CHECKER_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-checker-routing-paths.constant';
const R = CreateCasefileSelectors.review;
const buildTags = () => ['@JIRA-STORY:PO-10606', '@JIRA-EPIC:PO-10817'];
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
      cy.get(R.heading).should('have.text', 'Check case details').and('be.focused');
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
    cy.get(R.heading).should('have.text', 'Check case details').and('be.focused');
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
      cy.get(R.heading).should('have.text', 'Check case details').and('be.focused');
      cy.get('@checkerDetailRequest').should('have.been.calledOnceWithExactly', 1);
      cy.get(R.decisionHost).should('be.visible');
      cy.get(S.primaryNavigation).should('not.exist');
      cy.screenshot('po10606-shell-review-' + role);
      cy.get(R.back).click();
      cy.get(S.heading).should('be.focused');
      cy.get(S.primaryNavigation).should('be.visible');
    });
});
