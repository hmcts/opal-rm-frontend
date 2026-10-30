import { Subject, of, throwError } from 'rxjs';
import { setupInputterDashboard, setupResolvedInputterDashboard } from './setup/dashboard.setup';
import { dashboardFixtures, populatedReflowFixtures } from './mocks/dashboard.mock';
import { CasesDraftSelectors as S } from '../../../shared/selectors/cases-draft.selectors';
import { createCasesDraftSummary } from 'src/app/flows/cases/cases-draft/mocks/cases-draft-summary.mock';
import { CASES_DRAFT_ROUTING_PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-routing-paths.constant';
import { type CasesDraftInputterTab } from 'src/app/flows/cases/cases-draft/types/cases-draft-tab.type';
import { pressDashboardEnter } from '../../../support/utils/press-dashboard-enter';

const buildTags = (): string[] => [
  '@JIRA-STORY:PO-10605',
  '@JIRA-EPIC:PO-10817',
  '@JIRA-LABEL:create-draft-casefile',
  '@JIRA-LABEL:release-1c-rm-create-case-files',
];

describe('Inputter casefile dashboard', () => {
  const messages: Record<CasesDraftInputterTab, string> = {
    'in-review': 'You have no cases in review.',
    rejected: 'You have no rejected cases.',
    approved: 'No cases have been approved in the past 7 days.',
    deleted: 'No cases have been deleted in the past 7 days.',
  };
  (Object.keys(messages) as CasesDraftInputterTab[]).forEach((tab) =>
    it('AC2. should show the exact ' + tab + ' empty message', { tags: buildTags() }, () => {
      setupInputterDashboard({ tab, rows: dashboardFixtures.empty });
      cy.get(S.empty).should('have.text', messages[tab]);
      cy.get(S.tabs).find('a').should('have.length', 4);
      if (tab === 'rejected') cy.get(S.allRejected).should('be.visible');
      else cy.get(S.allRejected).should('not.exist');
      cy.get(S.table).should('not.exist');
      cy.get(S.tab(tab)).focus().should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.tab(tab)).should('not.be.focused');
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
    }),
  );
  it('AC1. should render header button and permanent tabs in order', { tags: buildTags() }, () => {
    setupInputterDashboard({ rejectedCount: null });
    cy.get(S.heading).should('have.text', 'Create cases');
    cy.get(S.create).should((element) => expect(element.text().trim()).to.equal('Create a case'));
    cy.get(S.tabs)
      .find('a')
      .should((elements) =>
        expect([...elements].map((el) => el.textContent?.trim())).to.deep.equal([
          'In review',
          'Rejected',
          'Approved',
          'Deleted',
        ]),
      );
    cy.get(S.tab('in-review')).should('have.attr', 'aria-current', 'page');
  });
  it('AC6. should preserve published creditor accounts as text', { tags: buildTags() }, () => {
    setupInputterDashboard({ tab: 'approved', rows: dashboardFixtures.published });
    cy.get(S.column('minorCreditorAccounts'))
      .find('li')
      .should((items) => expect([...items].map((el) => el.textContent?.trim())).to.deep.equal(['M10', 'M2']));
    cy.get(S.column('respondentAccount')).should((element) => expect(element.text().trim()).to.equal('000123A'));
    cy.get(S.row(123)).find('a, button').should('not.exist');
  });
  it('AC3. should sort and paginate without another consultation', { tags: buildTags() }, () => {
    setupResolvedInputterDashboard();
    cy.get('@listRequest').should('have.been.calledOnce');
    cy.get(S.sort('created')).closest('th').should('have.attr', 'aria-sort', 'ascending');
    cy.get(S.sort('respondent')).closest('th').should('have.attr', 'aria-sort', 'none');
    cy.get(S.sort('respondent')).click();
    cy.get(S.sort('respondent')).closest('th').should('have.attr', 'aria-sort', 'ascending');
    cy.get(S.sort('created')).closest('th').should('have.attr', 'aria-sort', 'none');
    cy.get(S.sort('respondent')).click();
    cy.get(S.sort('respondent')).closest('th').should('have.attr', 'aria-sort', 'descending');
    cy.get(S.table).find('tbody tr').first().should('have.attr', 'data-draft-id', '26');
    cy.get(S.sort('respondent')).click();
    cy.get(S.sort('respondent')).closest('th').should('have.attr', 'aria-sort', 'ascending');
    cy.get(S.pagination).contains('a', 'Next').click();
    cy.get(S.row(26)).should('be.visible');
    cy.get(S.pageStatus).should('contain.text', 'Create cases, page 2 of 2');
    cy.get('@listRequest').should('have.been.calledOnce');
  });
  it(
    'AC2. should exclude queued publishing rows even with supplied snapshot account numbers',
    { tags: buildTags() },
    () => {
      setupInputterDashboard({
        tab: 'approved',
        rows: [
          ...dashboardFixtures.published,
          createCasesDraftSummary({
            draft_casefile_id: 124,
            casefile_status: 'PUBLISHING_PENDING',
            casefile_snapshot: {
              respondent_account: { account_number: 'UNPUBLISHED' },
              applicant_account: { account_number: 'UNPUBLISHED' },
              minor_creditor_accounts: [{ account_number: 'UNPUBLISHED' }],
            },
          }),
          createCasesDraftSummary({
            draft_casefile_id: 125,
            casefile_status: 'PUBLISHING_PENDING',
            casefile_snapshot: {
              respondent_account: { account_number: null },
              applicant_account: { account_number: null },
              minor_creditor_accounts: [{ account_number: null }],
            },
          }),
        ],
      });
      cy.get(S.row(123)).should('exist');
      cy.get(S.row(124)).should('not.exist');
      cy.get(S.row(125)).should('not.exist');
      cy.get(S.tableRows).should('have.length', dashboardFixtures.published.length);
      cy.get(S.table).should('not.contain.text', 'UNPUBLISHED');
    },
  );
  it('AC4. should expose all rejected cases with populated results', { tags: buildTags() }, () => {
    setupInputterDashboard({ tab: 'rejected', rows: [createCasesDraftSummary({ casefile_status: 'REJECTED' })] });
    const expected = '/' + CASES_DRAFT_ROUTING_PATHS.root + '/' + CASES_DRAFT_ROUTING_PATHS.children.rejections;
    cy.get(S.allRejected).should('have.attr', 'href', expected).click();
    cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').should((navigate) => {
      expect(navigate).to.have.been.calledOnce;
      expect(navigate.firstCall.args[0].toString()).to.equal(expected);
    });
    cy.get('@countRequest').should('not.have.been.called');
  });
  it(
    'AC2. should render initially resolved Approved data without a duplicate consultation',
    { tags: buildTags() },
    () => {
      setupResolvedInputterDashboard({ tab: 'approved', rows: dashboardFixtures.published });
      cy.get(S.row(123)).should('be.visible');
      cy.get(S.tab('approved')).should('have.attr', 'aria-current', 'page');
      cy.get('@listRequest').should('have.been.calledOnce');
      cy.get('@countRequest').should('have.been.calledOnce');
    },
  );
  it('AC4. should obtain the initial Rejected badge from its resolved list', { tags: buildTags() }, () => {
    setupResolvedInputterDashboard({ tab: 'rejected' });
    cy.get(S.table).should('be.visible');
    cy.get(S.tab('rejected')).should('contain.text', '26');
    cy.get('@listRequest').should('have.been.calledOnce');
    cy.get('@countRequest').should('not.have.been.called');
  });
  it(
    'AC7. should render resolved cases and retain Rejected after an independent count failure',
    { tags: buildTags() },
    () => {
      setupResolvedInputterDashboard({ countError: true });
      cy.get(S.table).should('be.visible');
      cy.get(S.tabs).find('a').should('have.length', 4);
      cy.get(S.tab('rejected')).should((element) => expect(element.text().trim()).to.equal('Rejected'));
      cy.get(S.rejectedCount).should('not.exist');
      cy.get('@globalBannerError').should('have.been.calledOnce');
      cy.get(S.obsoleteLocalControls).should('not.exist');
      cy.get('@listRequest').should('have.been.calledOnce');
      cy.get('@countRequest').should('have.been.calledOnce');
    },
  );
  it(
    'AC7. should clear a failed tab and recover through another tab using the global error boundary',
    { tags: buildTags() },
    () => {
      setupInputterDashboard();
      cy.get(S.table).should('be.visible');
      cy.get<Cypress.Agent<sinon.SinonStub>>('@listRequest').then((request) =>
        request.returns(throwError(() => new Error('Synthetic decoding failure'))),
      );
      cy.get(S.tab('approved')).click();
      cy.get('@globalBannerError').should('have.been.calledOnce');
      cy.get(S.table).should('not.exist');
      cy.get(S.empty).should('not.exist');
      cy.get(S.tabs).find('a').should('have.length', 4);
      cy.get(S.obsoleteLocalControls).should('not.exist');
      cy.get<Cypress.Agent<sinon.SinonStub>>('@listRequest').then((request) =>
        request.returns(of({ count: 0, summaries: [] })),
      );
      cy.get(S.tab('deleted')).click();
      cy.get(S.empty).should('have.text', messages.deleted);
      cy.get('@listRequest').should('have.been.calledTwice');
    },
  );
  it('AC7. should hide stale rows and empty messages during a pending tab consultation', { tags: buildTags() }, () => {
    setupInputterDashboard();
    cy.get(S.table).should('be.visible');
    const pending = new Subject();
    cy.get<Cypress.Agent<sinon.SinonStub>>('@listRequest').then((request) => request.returns(pending));
    cy.get(S.tab('approved')).click();
    cy.get(S.loading).should('contain.text', 'Loading Approved cases.');
    cy.get(S.empty).should('not.exist');
    cy.get(S.table).should('not.exist');
  });
  it('AC7. should cancel a superseded request and ignore its late rows', { tags: buildTags() }, () => {
    setupInputterDashboard();
    const pending = new Subject<{ count: number; summaries: typeof dashboardFixtures.published }>();
    cy.get<Cypress.Agent<sinon.SinonStub>>('@listRequest').then((request) => request.onFirstCall().returns(pending));
    cy.get(S.tab('approved')).click();
    cy.get(S.loading).should('be.visible');
    cy.get(S.tab('rejected')).click();
    cy.get(S.table).should('be.visible');
    cy.then(() => {
      expect(pending.observed, 'superseded tab consultation unsubscribed').to.equal(false);
      pending.next({ count: 1, summaries: dashboardFixtures.published });
      pending.complete();
    });
    cy.get(S.tab('rejected')).should('have.attr', 'aria-current', 'page');
    cy.get(S.row(123)).should('not.exist');
    cy.get(S.row(1)).should('exist');
  });
  it('AC1. should retain Rejected without an empty badge when its known count is zero', { tags: buildTags() }, () => {
    setupInputterDashboard({ rejectedCount: 0 });
    cy.get(S.tab('rejected')).should((element) => expect(element.text().trim()).to.equal('Rejected'));
    cy.get(S.tab('rejected')).find('opal-lib-moj-notification-badge').should('not.exist');
  });
});

describe('Inputter dashboard accessibility', () => {
  [
    { name: 'ready', options: {} },
    { name: 'empty', options: { rows: dashboardFixtures.empty } },
    { name: 'missing rejected count', options: { rejectedCount: null } },
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
    cy.get('@listRequest').should('have.been.calledOnce');
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
      cy.get('@routerNavigate').should('not.have.been.called');
      cy.get(S.sort('respondent')).closest('th').should('have.attr', 'aria-sort', 'ascending');
      cy.get('opal-lib-moj-sortable-table-status').should('contain.text', 'Respondent');
      cy.get(S.sort('respondent')).should('be.focused');
      cy.get(S.pagination).contains('a', 'Next').focus();
      pressDashboardEnter();
      cy.get(S.row(26)).find('a').should('be.focused');
      cy.get(S.pageStatus).should('contain.text', 'Create cases, page 2 of 2');
      cy.get('@listRequest').should('not.have.been.called');
    },
  );
  it('AC8. should keep native tab access after a globally reported tab failure', { tags: buildTags() }, () => {
    setupInputterDashboard();
    cy.get<Cypress.Agent<sinon.SinonStub>>('@listRequest').then((request) =>
      request.returns(throwError(() => new Error('Synthetic decoding failure'))),
    );
    cy.get(S.tab('approved')).focus();
    pressDashboardEnter();
    cy.get(S.tab('approved')).should('be.focused').and('have.attr', 'aria-current', 'page');
    cy.get('@globalBannerError').should('have.been.calledOnce');
    cy.get(S.table).should('not.exist');
    cy.get(S.empty).should('not.exist');
    cy.get(S.obsoleteLocalControls).should('not.exist');
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
    cy.get<Cypress.Agent<sinon.SinonStub>>('@listRequest').then((request) =>
      request.returns(of({ count: 0, summaries: [] })),
    );
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.tab('deleted')).should('be.focused');
    pressDashboardEnter();
    cy.get(S.empty).should('contain.text', 'No cases have been deleted in the past 7 days.');
  });
  it('AC8. should keep selection and native focus when navigation is cancelled', { tags: buildTags() }, () => {
    setupInputterDashboard();
    cy.get<Cypress.Agent<sinon.SinonStub>>('@routerNavigate').then((navigate) => navigate.resolves(false));
    cy.get(S.tab('approved')).focus();
    pressDashboardEnter();
    cy.get(S.tab('approved')).should('be.focused');
    cy.get(S.tab('in-review')).should('have.attr', 'aria-current', 'page');
    cy.get(S.obsoleteLocalControls).should('not.exist');
    cy.get('@globalBannerError').should('not.have.been.called');
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
  it('AC8. should keep chosen focus while a tab request completes', { tags: buildTags() }, () => {
    setupInputterDashboard();
    const pending = new Subject<{ count: number; summaries: never[] }>();
    cy.get<Cypress.Agent<sinon.SinonStub>>('@listRequest').then((request) => request.returns(pending));
    cy.get(S.tab('approved')).focus();
    pressDashboardEnter();
    cy.get(S.loading)
      .should('be.visible')
      .and('have.prop', 'tagName', 'OUTPUT')
      .and('have.attr', 'aria-live', 'polite');
    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.tab('deleted')).should('be.focused');
    cy.then(() => {
      pending.next({ count: 0, summaries: [] });
      pending.complete();
    });
    cy.get(S.empty).should('be.visible');
    cy.get(S.tab('deleted')).should('be.focused');
  });
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
      cy.get(S.scrollRegion).should('have.prop', 'tagName', 'SECTION');
      cy.get(S.scrollRegion).should('not.have.attr', 'role');
      cy.get(S.scrollRegion).should('not.have.attr', 'tabindex');
      cy.get(S.scrollRegion).should('have.attr', 'aria-label').and('include', 'cases');
      const firstColumn = tab === 'approved' ? 'respondentAccount' : 'respondent';
      cy.get(S.sort(firstColumn)).focus().should('be.focused');
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
      for (const column of columns.slice(1)) {
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
