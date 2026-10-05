import { Subject, of } from 'rxjs';
import { setupInputterDashboard } from './setup/dashboard.setup';
import { dashboardFixtures } from './mocks/dashboard.mock';
import { CasesDraftSelectors as S } from '../../../shared/selectors/cases-draft.selectors';
import { createCasesDraftSummary } from 'src/app/flows/cases/cases-draft/mocks/cases-draft-summary.mock';
import type { CasesDraftTab } from 'src/app/flows/cases/cases-draft/types/cases-draft-tab.type';
const buildTags = (): string[] => [
  '@JIRA-STORY:PO-10605',
  '@JIRA-LABEL:create-draft-casefile',
  '@JIRA-LABEL:release-1c-rm-create-case-files',
];
describe('Inputter casefile dashboard', () => {
  const messages: Record<CasesDraftTab, string> = {
    'in-review': 'You have no cases in review.',
    rejected: 'You have no rejected cases.',
    approved: 'No cases have been approved in the past 7 days.',
    deleted: 'No cases have been deleted in the past 7 days.',
  };
  (Object.keys(messages) as CasesDraftTab[]).forEach((tab) =>
    it('AC2. should show the exact ' + tab + ' empty message', { tags: buildTags() }, () => {
      setupInputterDashboard({ tab, rows: dashboardFixtures.empty });
      cy.get(S.empty).should('have.text', messages[tab]);
      cy.get(S.tabs).find('a').should('have.length', 4);
      if (tab === 'rejected') cy.get(S.allRejected).should('be.visible');
      else cy.get(S.allRejected).should('not.exist');
    }),
  );
  it('AC1. should render header button and permanent tabs in order', { tags: buildTags() }, () => {
    setupInputterDashboard({ badgeError: true });
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
    setupInputterDashboard();
    cy.get('@listRequest').should('have.been.calledOnce');
    cy.get(S.sort('respondent')).click();
    cy.get(S.sort('respondent')).closest('th').should('have.attr', 'aria-sort', 'ascending');
    cy.get(S.pagination).contains('a', 'Next').click();
    cy.get(S.row(26)).should('be.visible');
    cy.get(S.pageStatus).should('contain.text', 'Page 2 of 2, showing cases 26 to 26 of 26');
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
    cy.get(S.allRejected).click();
    cy.get('@routerNavigate').should('have.been.calledOnce');
    cy.get('@countRequest').should('not.have.been.called');
  });
  it('AC7. should retry list and badge independently and retain tabs', { tags: buildTags() }, () => {
    setupInputterDashboard({ listError: true, badgeError: true });
    cy.get(S.listError).should('contain.text', 'SYNTHETIC-REFERENCE');
    cy.get('@listRequest').then((request) =>
      (request as unknown as sinon.SinonStub).returns(of({ count: 0, summaries: [] })),
    );
    cy.get(S.listRetry).click();
    cy.get(S.empty).should('be.visible');
    cy.get('@countRequest').should('have.been.calledOnce');
    cy.get(S.badgeRetry).click();
    cy.get('@countRequest').should('have.been.calledTwice');
    cy.get('@listRequest').should('have.been.calledTwice');
  });
  it('AC7. should hide stale rows and empty messages during consultation', { tags: buildTags() }, () => {
    setupInputterDashboard({ listError: true });
    cy.get(S.listError).should('be.visible');
    const pending = new Subject();
    cy.get('@listRequest').then((request) => (request as unknown as sinon.SinonStub).returns(pending));
    cy.get(S.listRetry).click();
    cy.get(S.loading).should('contain.text', 'Loading In review cases.');
    cy.get(S.empty).should('not.exist');
    cy.get(S.table).should('not.exist');
  });
  it('AC1. should retain Rejected without an empty badge when its known count is zero', { tags: buildTags() }, () => {
    setupInputterDashboard({ rejectedCount: 0 });
    cy.get(S.tab('rejected')).should((element) => expect(element.text().trim()).to.equal('Rejected'));
    cy.get(S.tab('rejected')).find('opal-lib-moj-notification-badge').should('not.exist');
  });
});
