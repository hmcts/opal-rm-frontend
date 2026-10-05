import { Subject, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { setupInputterDashboard, pressDashboardEnter } from './setup/dashboard.setup';
import { dashboardFixtures } from './mocks/dashboard.mock';
import { CasesDraftSelectors as S } from '../../../shared/selectors/cases-draft.selectors';
const buildTags = (): string[] => [
  '@JIRA-STORY:PO-10605',
  '@JIRA-LABEL:create-draft-casefile',
  '@JIRA-LABEL:release-1c-rm-create-case-files',
];
describe('Inputter dashboard accessibility', () => {
  [
    { name: 'ready', options: {} },
    { name: 'empty', options: { rows: dashboardFixtures.empty } },
    { name: 'list error', options: { listError: true } },
    { name: 'badge error', options: { badgeError: true } },
    { name: 'published', options: { tab: 'approved' as const, rows: dashboardFixtures.published } },
  ].forEach(({ name, options }) =>
    it('AC8. should have no detected Axe violations for ' + name, { tags: buildTags() }, () => {
      setupInputterDashboard(options);
      cy.get(S.heading).should('be.focused');
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
      cy.screenshot('po-10605-dashboard-' + name.replaceAll(' ', '-'));
    }),
  );
  it('AC8. should use native Tab and Enter for creation and tabs', { tags: buildTags() }, () => {
    setupInputterDashboard();
    cy.get(S.heading).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.create).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.tab('in-review')).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.tab('rejected')).should('be.focused');
    pressDashboardEnter();
    cy.get(S.tab('rejected')).should('have.attr', 'aria-current', 'page');
    cy.get('@listRequest').should('have.been.calledTwice');
    cy.get('@routerNavigate').should('have.been.calledOnce');
  });
  it(
    'AC8. should focus the first row only after intentional paging and announce sorting',
    { tags: buildTags() },
    () => {
      setupInputterDashboard();
      cy.get(S.heading).should('be.focused');
      cy.get(S.sort('respondent')).focus().should('be.focused');
      pressDashboardEnter();
      cy.get('@routerNavigate').should('have.been.calledOnce');
      cy.get(S.sort('respondent')).closest('th').should('have.attr', 'aria-sort', 'ascending');
      cy.get('opal-lib-moj-sortable-table-status').should('contain.text', 'Respondent');
      cy.get(S.sort('respondent')).should('be.focused');
      cy.get(S.pagination).contains('a', 'Next').focus();
      pressDashboardEnter();
      cy.get(S.row(26)).find('a').should('be.focused');
      cy.get(S.pageStatus).should('contain.text', 'Page 2 of 2');
      cy.get('@listRequest').should('have.been.calledOnce');
    },
  );
  it('AC8. should restore useful focus when Retry removes and reinserts controls', { tags: buildTags() }, () => {
    setupInputterDashboard({ listError: true });
    cy.get(S.listError).should('be.visible');
    const pending = new Subject();
    cy.get('@listRequest').then((request) => (request as unknown as sinon.SinonStub).returns(pending));
    cy.get(S.listRetry).focus().should('be.focused');
    pressDashboardEnter();
    cy.get(S.loading).should('contain.text', 'Loading In review cases.').and('be.focused');
    cy.then(() => pending.error(new HttpErrorResponse({ status: 500 })));
    cy.get(S.listError).should('be.focused');
    cy.get(S.listRetry).should('exist');
    cy.get('@listRequest').then((request) =>
      (request as unknown as sinon.SinonStub).returns(of({ count: 0, summaries: [] })),
    );
    cy.get(S.listRetry).focus().should('be.focused');
    pressDashboardEnter();
    cy.get(S.selectedHeading).should('be.focused');
  });
  it('AC8. should retain selection and focus an error when navigation fails', { tags: buildTags() }, () => {
    setupInputterDashboard();
    cy.get('@routerNavigate').then((navigate) => (navigate as unknown as sinon.SinonStub).resolves(false));
    cy.get(S.tab('approved')).focus();
    pressDashboardEnter();
    cy.get(S.navigationError).should('be.focused').and('contain.text', 'The page could not be opened. Try again.');
    cy.get(S.tab('in-review')).should('have.attr', 'aria-current', 'page');
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });
  it('AC8. should reflow the empty dashboard at 320 CSS pixels', { tags: buildTags() }, () => {
    cy.viewport(320, 900);
    setupInputterDashboard({ rows: dashboardFixtures.empty });
    cy.get(S.empty).should('be.visible');
    cy.document().should((document) =>
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth),
    );
    cy.screenshot('po-10605-dashboard-empty-320px');
  });
  it('AC1. should activate Create a case using native keyboard input', { tags: buildTags() }, () => {
    setupInputterDashboard();
    cy.get(S.heading).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.create).should('be.focused');
    pressDashboardEnter();
    cy.get('@routerNavigate').should('have.been.calledOnceWith', '/cases/create-casefile/case-type', {
      state: { startNewCase: true, focusCaseTypeHeading: true },
    });
  });
  it('AC8. should focus a read-only account cell after approved paging', { tags: buildTags() }, () => {
    setupInputterDashboard({
      tab: 'approved',
      rows: Array.from({ length: 26 }, (_, index) => ({
        ...structuredClone(dashboardFixtures.published[0]),
        draft_casefile_id: index + 1,
      })),
    });
    cy.get(S.heading).should('be.focused');
    cy.get(S.pagination).contains('a', 'Next').focus().should('be.focused');
    pressDashboardEnter();
    cy.get(S.row(26)).find(S.column('respondentAccount')).should('be.focused');
    cy.get(S.row(26)).find('a,button').should('not.exist');
  });
});
