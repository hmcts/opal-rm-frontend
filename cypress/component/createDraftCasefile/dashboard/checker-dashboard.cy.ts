import { Subject, of, throwError } from 'rxjs';
import type { IOpalMaintenanceDraftCasefileListResponse as List } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-list-response.interface';
import { CASES_DRAFT_CHECKER_TABS as TABS } from 'src/app/flows/cases/cases-draft/constants/cases-draft-checker-tabs.constant';
import { setupCheckerDashboard } from './setup/checker-dashboard.setup';
import { checkerFixtures, checkerListFailure, checkerEmptyMessages } from './mocks/checker-dashboard.mock';
import { CasesDraftSelectors as S } from '../../../shared/selectors/cases-draft.selectors';
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
      setupCheckerDashboard({ tab, rows: checkerFixtures.empty });
      cy.get(S.empty).should((element) => expect(element.text().trim()).to.equal(checkerEmptyMessages[tab]));
      cy.get(S.table).should('not.exist');
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
    cy.get(S.row(1))
      .find('a')
      .should('have.attr', 'href')
      .and('include', '/review/1?tab=to-review&page=1&sort=created&direction=ascending');
    cy.get(S.row(1)).find('a').trigger('click', { ctrlKey: true });
    cy.get(S.heading).should('be.visible');
    cy.get('@checkerListRequest').should('have.been.calledOnce');
  });
  it('AC4. should recover first-entry failure explicitly', { tags: buildTags() }, () => {
    setupCheckerDashboard({ listError: true });
    cy.get(S.failure).should('contain.text', 'We could not load these cases. Try again.');
    cy.get(S.empty).should('not.exist');
    cy.get(S.retryList).click();
    cy.get(S.loading).should('be.visible');
    cy.get<{ latest: Subject<List> }>('@checkerListResponse').then((r) =>
      r.latest.next({ count: 26, summaries: checkerFixtures.review26 }),
    );
    cy.get(S.table).should('be.visible');
    cy.get('@checkerListRequest').should('have.been.calledTwice');
  });
  it('AC4. should retry a count independently using the latest retry response', { tags: buildTags() }, () => {
    setupCheckerDashboard({ countError: 'failed' });
    cy.get(S.table).should('be.visible');
    cy.get(S.countFailure('failed')).should('contain.text', 'We could not load the Failed count. Try again.');
    cy.get(S.failedCount).should('not.exist');
    cy.get<Record<'failed', Subject<{ count: number }>>>('@checkerCountResponses').then((r) =>
      cy.wrap(r.failed, { log: false }).as('initialFailedCount'),
    );
    cy.get(S.countRetry('failed')).click();
    cy.get<Record<'failed', Subject<{ count: number }>>>('@checkerCountResponses').then((r) => {
      cy.get('@initialFailedCount').then((initial) => expect(r.failed).not.to.equal(initial));
      r.failed.next({ count: 4 });
    });
    cy.get(S.failedCount).should('have.text', '4');
    cy.get(S.table).should('be.visible');
    cy.get('@checkerListRequest').should('have.been.calledOnce');
  });
  it('AC4. should retain a failed outcome after leaving its list', { tags: buildTags() }, () => {
    setupCheckerDashboard({ tab: 'failed', listError: true });
    cy.get(S.failure).should('be.visible');
    cy.get(S.tab('to-review')).click();
    cy.get(S.table).should('be.visible');
    cy.get(S.countFailure('failed')).should('be.visible');
    cy.get(S.countRetry('failed')).click();
    cy.get(S.failedCount).should('have.text', '2');
  });
  it('AC4. should obtain a count after abandoning a pending outcome list', { tags: buildTags() }, () => {
    setupCheckerDashboard({ tab: 'failed', listPending: true });
    cy.get(S.loading).should('be.visible');
    cy.get(S.tab('to-review')).click();
    cy.get(S.failedCount).should('have.text', '2');
    cy.get<Cypress.Agent<sinon.SinonStub>>('@checkerCountRequest').should((request) =>
      expect(request.lastCall.args[0].casefile_status).to.equal('PUBLISHING_FAILED'),
    );
  });
  it(
    'AC4. should keep newer selected list precedence over older count success and error',
    { tags: buildTags() },
    () => {
      setupCheckerDashboard({ countError: 'failed' });
      cy.get(S.countFailure('failed')).should('be.visible');
      cy.get(S.countRetry('failed')).click();
      cy.get<Record<'failed', Subject<{ count: number }>>>('@checkerCountResponses').then((r) =>
        cy.wrap(r.failed, { log: false }).as('olderCount'),
      );
      cy.get(S.tab('failed')).click();
      cy.get(S.failedCount).should('have.text', '26');
      cy.get<Subject<{ count: number }>>('@olderCount').then((subject) => {
        subject.next({ count: 99 });
        subject.error(new Error('Obsolete failure'));
      });
      cy.get(S.failedCount).should('have.text', '26');
      cy.get(S.countFailure('failed')).should('not.exist');
    },
  );
  it('AC4. should hide stale rows and recover a later list failure', { tags: buildTags() }, () => {
    setupCheckerDashboard();
    cy.get(S.table).should('be.visible');
    const pending = new Subject<List>();
    cy.get<Cypress.Agent<sinon.SinonStub>>('@checkerListRequest').then((request) => request.returns(pending));
    cy.get(S.tab('deleted')).click();
    cy.get(S.loading).should('be.visible');
    cy.get(S.table).should('not.exist');
    cy.then(() => pending.error(new Error('Synthetic later failure')));
    cy.get(S.failure).should('be.visible');
    cy.get<Cypress.Agent<sinon.SinonStub>>('@checkerListRequest').then((request) =>
      request.returns(of({ count: 0, summaries: [] })),
    );
    cy.get(S.retryList).click();
    cy.get(S.empty).should('contain.text', TABS.deleted.empty);
  });
  it('AC3. should restore metadata and fetch fresh rows with page clamp on Back', { tags: buildTags() }, () => {
    setupCheckerDashboard({ tab: 'rejected', page: 2, sort: 'respondent', direction: 'descending' });
    cy.get(S.tableRows).first().find('a').click();
    cy.get(S.placeholderHeading).should('have.text', 'View case details').and('be.focused');
    cy.get(S.placeholderBack)
      .should('have.attr', 'href')
      .and('include', 'page=2&sort=respondent&direction=descending#rejected');
    cy.get<Cypress.Agent<sinon.SinonStub>>('@checkerListRequest').then((request) =>
      request.returns(of({ count: 1, summaries: checkerFixtures.queues.rejected.slice(0, 1) })),
    );
    cy.get(S.placeholderBack).click();
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
    cy.get(S.placeholderBack).click();
    cy.get(S.table).should('be.visible');
    cy.get('@localWrites').should('not.have.been.called');
    cy.get('@sessionWrites').should('not.have.been.called');
  });

  for (const stale of ['success', 'error'] as const)
    it('AC4. should ignore abandoned list ' + stale + ' in explicit response order', { tags: buildTags() }, () => {
      setupCheckerDashboard({ listPending: true });
      cy.get(S.loading).should('be.visible');
      cy.get<{ latest: Subject<List> }>('@checkerListResponse').then((r) =>
        cy.wrap(r.latest, { log: false }).as('abandonedList'),
      );
      cy.get(S.tab('rejected')).click();
      cy.get(S.loading).should('contain.text', 'Rejected');
      cy.get<Subject<List>>('@abandonedList').then((old) => {
        if (stale === 'success') old.next({ count: 26, summaries: checkerFixtures.review26 });
        else old.error(new Error('Obsolete list failure'));
      });
      cy.get(S.loading).should('be.visible');
      cy.get(S.table).should('not.exist');
      cy.get(S.failure).should('not.exist');
      cy.get<{ latest: Subject<List> }>('@checkerListResponse').then((r) =>
        r.latest.next({ count: 1, summaries: checkerFixtures.queues.rejected.slice(0, 1) }),
      );
      cy.get(S.tableRows).should('have.length', 1);
      cy.get(S.rejectedCount).should('have.text', '1');
      cy.get('@checkerListRequest').should('have.been.calledTwice');
    });
  it('AC4. should show only the safe correlation reference for a later provider failure', { tags: buildTags() }, () => {
    setupCheckerDashboard();
    cy.get(S.table).should('be.visible');
    cy.get<Cypress.Agent<sinon.SinonStub>>('@checkerListRequest').then((request) =>
      request.returns(throwError(() => checkerListFailure)),
    );
    cy.get(S.tab('failed')).click();
    cy.get(S.failure)
      .should('contain.text', 'Error code: SYNTHETIC-REF-123')
      .and('not.contain.text', 'Synthetic private detail')
      .and('not.contain.text', 'Synthetic backend title');
    cy.get(S.table).should('not.exist');
  });
});
