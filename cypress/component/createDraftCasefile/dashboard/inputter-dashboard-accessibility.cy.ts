import { Subject, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { setupInputterDashboard } from './setup/dashboard.setup';
import { pressDashboardEnter } from '../../../support/utils/press-dashboard-enter';
import { dashboardFixtures, populatedReflowFixtures } from './mocks/dashboard.mock';
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
  (['success', 'failure'] as const).forEach((completion) => {
    it(
      'AC8. should retain native focus through a pending rejected count retry and ' + completion,
      { tags: buildTags() },
      () => {
        setupInputterDashboard({ badgeError: true });
        cy.get(S.heading).should('be.focused');
        cy.get(S.badgeRetry).should('be.visible');
        const pending = new Subject<{ count: number }>();
        cy.get('@countRequest').then((request) => (request as unknown as sinon.SinonStub).returns(pending));
        cy.get(S.tab('deleted')).focus();
        cy.press(Cypress.Keyboard.Keys.TAB);
        cy.get(S.badgeRetry).should('be.focused');
        pressDashboardEnter();
        cy.get(S.badgeLoading).should('contain.text', 'Loading rejected case count.').and('be.focused');
        cy.get(S.badgeRetry).should('not.exist');
        if (completion === 'success') {
          cy.then(() => {
            pending.next({ count: 7 });
            pending.complete();
          });
          cy.get(S.selectedHeading).should('be.focused');
          cy.get(S.tab('rejected')).should('contain.text', '7');
        } else {
          cy.then(() => pending.error(new HttpErrorResponse({ status: 500 })));
          cy.get(S.badgeRetry).should('be.focused');
          cy.get(S.badgeError).should('contain.text', 'The rejected case count could not be loaded. Try again.');
        }
        cy.get('@listRequest').should('have.been.calledOnce');
        cy.get('@countRequest').should('have.been.calledTwice');
        cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
        cy.checkA11y();
      },
    );
  });
  it(
    'AC8. should keep chosen focus when the user moves on before count retry completion',
    { tags: buildTags() },
    () => {
      setupInputterDashboard({ badgeError: true });
      cy.get(S.heading).should('be.focused');
      cy.get(S.badgeRetry).should('be.visible');
      const pending = new Subject<{ count: number }>();
      cy.get('@countRequest').then((request) => (request as unknown as sinon.SinonStub).returns(pending));
      cy.get(S.badgeRetry).focus();
      pressDashboardEnter();
      cy.get(S.badgeLoading).should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.scrollRegion).should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.sort('respondent')).should('be.focused');
      cy.then(() => {
        pending.next({ count: 7 });
        pending.complete();
      });
      cy.get(S.sort('respondent')).should('be.focused');
    },
  );
  for (const tab of ['in-review', 'rejected', 'approved', 'deleted'] as const) {
    it('AC8. should keep populated ' + tab + ' table scrolling inside the 320px page', { tags: buildTags() }, () => {
      const rows = populatedReflowFixtures[tab];
      const lastColumn = {
        'in-review': 'created',
        rejected: 'statusDate',
        approved: 'approved',
        deleted: 'statusDate',
      }[tab];
      cy.viewport(320, 900);
      setupInputterDashboard({ tab, rows });
      cy.get(S.heading).should('be.focused');
      cy.document().then((document) => expect(document.documentElement.scrollWidth).to.be.at.most(320));
      cy.get(S.scrollRegion).should('have.attr', 'role', 'region').and('have.attr', 'tabindex', '0');
      cy.get(S.scrollRegion).should('have.attr', 'aria-label').and('include', 'cases');
      cy.get(S.scrollRegion).focus().should('be.focused');
      cy.then(async () => {
        for (const type of ['keyDown', 'keyUp']) {
          await Cypress.automation('remote:debugger:protocol', {
            command: 'Input.dispatchKeyEvent',
            params: {
              type,
              key: 'ArrowRight',
              code: 'ArrowRight',
              windowsVirtualKeyCode: 39,
              nativeVirtualKeyCode: 39,
            },
          });
        }
      });
      cy.get(S.scrollRegion).should((region) => expect(region[0].scrollLeft).to.be.greaterThan(0));
      const columns = ['respondent', 'applicant', 'caseType', 'created'];
      if (tab === 'approved')
        columns.splice(
          0,
          columns.length,
          'respondentAccount',
          'applicantAccount',
          'minorCreditorAccounts',
          'caseType',
          'approved',
        );
      else if (tab !== 'in-review') columns.push('statusDate');
      for (const column of columns) {
        cy.press(Cypress.Keyboard.Keys.TAB);
        cy.get(S.sort(column)).should('be.focused');
      }
      cy.get(S.scrollRegion).should((region) => expect(region[0].scrollLeft).to.be.greaterThan(0));
      cy.get(S.table).find('tbody tr').should('have.length', Math.min(rows.length, 25));
      cy.get(S.scrollRegion).scrollTo('right');
      cy.get(S.sort(lastColumn)).should('be.visible');
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
      cy.screenshot('po10605-contained-' + tab + '-320');
      cy.viewport(1440, 1000);
      cy.document().then((document) => expect(document.documentElement.scrollWidth).to.be.at.most(1440));
    });
  }
});
