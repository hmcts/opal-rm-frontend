import { Subject, of, throwError } from 'rxjs';
import { setupInputterDashboard, setupResolvedInputterDashboard } from './setup/dashboard.setup';
import { dashboardFixtures } from './mocks/dashboard.mock';
import { CasesDraftSelectors as S } from '../../../shared/selectors/cases-draft.selectors';
import { createCasesDraftSummary } from 'src/app/flows/cases/cases-draft/mocks/cases-draft-summary.mock';
import { CASES_DRAFT_ROUTING_PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-routing-paths.constant';
import type { CasesDraftInputterTab } from 'src/app/flows/cases/cases-draft/types/cases-draft-tab.type';
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
  it('AC2. should exclude queued publishing rows', { tags: buildTags() }, () => {
    setupInputterDashboard({
      tab: 'approved',
      rows: [
        ...dashboardFixtures.published,
        createCasesDraftSummary({ draft_casefile_id: 124, casefile_status: 'PUBLISHING_PENDING' }),
      ],
    });
    cy.get(S.row(123)).should('exist');
    cy.get(S.row(124)).should('not.exist');
  });
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
