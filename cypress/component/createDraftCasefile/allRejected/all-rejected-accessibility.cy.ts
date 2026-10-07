import { setupAllRejected } from './setup/all-rejected.setup';
import { allRejectedFixtures as F } from './mocks/all-rejected.mock';
import { CasesDraftSelectors as S } from '../../../shared/selectors/cases-draft.selectors';
import { of, Subject } from 'rxjs';
import type { IOpalMaintenanceDraftCasefileListResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-list-response.interface';
import type { Router } from '@angular/router';
import { CASES_DRAFT_ROUTING_PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-routing-paths.constant';
const listUrl = '/' + CASES_DRAFT_ROUTING_PATHS.root + '/' + CASES_DRAFT_ROUTING_PATHS.children.rejections;
const buildTags = (): string[] => [
  '@JIRA-STORY:PO-10607',
  '@JIRA-EPIC:PO-10817',
  '@JIRA-LABEL:create-draft-casefile',
  '@JIRA-LABEL:release-1c-rm-create-case-files',
];
import { pressDashboardEnter } from '../../../support/utils/press-dashboard-enter';
function axe() {
  cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
  cy.checkA11y();
}
describe('All rejected cases native keyboard and accessibility', () => {
  const states = [
    { name: 'populated', options: {} },
    { name: 'empty', options: { rows: [] } },
    { name: 'loading', options: { pending: true } },
    { name: 'failure', options: { failure: true } },
    { name: 'success', options: { success: true } },
  ];
  for (const state of states)
    it('AC1, AC2, AC4. should have no detected Axe violations for ' + state.name, { tags: buildTags() }, () => {
      cy.viewport(1440, 1000);
      setupAllRejected(state.options);
      cy.get(S.allRejectedHeading).should('be.focused');
      axe();
      cy.screenshot('po-10607-all-rejected-' + state.name + '-desktop');
      cy.viewport(320, 900);
      cy.document().should((document) =>
        expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth),
      );
      axe();
      cy.screenshot('po-10607-all-rejected-' + state.name + '-320px');
    });
  it(
    'AC2. should traverse the scroll region, all six headers and respondent with native Tab and Enter',
    { tags: buildTags() },
    () => {
      setupAllRejected();
      cy.get(S.allRejectedHeading).should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.scrollRegion).should('be.focused');
      for (const key of ['respondent', 'applicant', 'caseType', 'submittedByName', 'created', 'statusDate']) {
        cy.press(Cypress.Keyboard.Keys.TAB);
        cy.get(S.sort(key)).should('be.focused');
        pressDashboardEnter();
        cy.get(S.sort(key)).should('be.focused');
        cy.get(S.sort(key)).closest('th').should('have.attr', 'aria-sort', 'ascending');
        const firstId = key === 'applicant' || key === 'statusDate' ? '26' : '1';
        cy.get(S.tableRows).first().should('have.attr', 'data-draft-id', firstId);
      }
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.row(26)).find('a').should('be.focused');
      pressDashboardEnter();
      cy.get(S.placeholderHeading).should('have.text', 'Check case details').and('be.focused');
      cy.get('@listRequest').should('have.been.calledOnce');
      cy.get(S.placeholderBack).focus();
      pressDashboardEnter();
      cy.get(S.allRejectedHeading).should('be.focused');
      cy.get('@listRequest').should('have.been.calledTwice');
    },
  );
  it(
    'AC2. should traverse number and next controls and focus the first new row on native Enter',
    { tags: buildTags() },
    () => {
      setupAllRejected({ rows: F.rows(51) });
      cy.get(S.row(51)).find('a').focus();
      for (let index = 0; index < 25; index++) cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.allRejectedPage(1)).should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.allRejectedPage(2)).should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.allRejectedPage(3)).should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.allRejectedNext).should('be.focused');
      pressDashboardEnter();
      cy.get(S.row(26)).find('a').should('be.focused');
      cy.get(S.allRejectedPageStatus).should('have.text', 'All rejected cases, page 2 of 3');
      for (let index = 0; index < 25; index++) cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.allRejectedPrevious).should('be.focused');
      pressDashboardEnter();
      cy.get(S.row(51)).find('a').should('be.focused');
      for (let index = 0; index < 25; index++) cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.allRejectedPage(1)).should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.allRejectedPage(2)).should('be.focused');
      pressDashboardEnter();
      cy.get(S.row(26)).find('a').should('be.focused');
      cy.get('@listRequest').should('have.been.calledOnce');
      cy.get<Router>('@allRejectedRouter').its('url').should('equal', listUrl);
    },
  );
  it('AC2. should activate the focused Back link with native Enter', { tags: buildTags() }, () => {
    setupAllRejected();
    cy.get(S.allRejectedHeading).should('be.focused');
    cy.then(async () => {
      for (const type of ['keyDown', 'keyUp'])
        await Cypress.automation('remote:debugger:protocol', {
          command: 'Input.dispatchKeyEvent',
          params: { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: 8 },
        });
    });
    cy.get(S.allRejectedBack).should('be.focused');
    pressDashboardEnter();
    cy.get(S.heading).should('be.focused');
    cy.get('@listRequest').should('have.been.calledTwice');
  });
  for (const completion of ['populated', 'empty', 'failure'] as const)
    it(
      'AC1, AC2. should preserve native Retry heading focus through ' + completion + ' completion',
      { tags: buildTags() },
      () => {
        setupAllRejected({ failure: true });
        const pending = new Subject<IOpalMaintenanceDraftCasefileListResponse>();
        cy.get<Cypress.Agent<sinon.SinonStub>>('@listRequest').then((request) =>
          request.onSecondCall().returns(pending),
        );
        cy.get(S.allRejectedHeading).should('be.focused');
        cy.press(Cypress.Keyboard.Keys.TAB);
        cy.get(S.allRejectedRetry).should('be.focused');
        pressDashboardEnter();
        cy.get(S.allRejectedLoading).should('be.visible');
        cy.get(S.allRejectedRetry).should('not.exist');
        cy.get(S.allRejectedHeading).should('be.focused');
        pressDashboardEnter();
        cy.get('@listRequest').should('have.been.calledTwice');
        cy.then(() => {
          if (completion === 'failure') pending.error(new Error('Synthetic decoding failure'));
          else {
            const rows = completion === 'empty' ? [] : F.rows(1);
            pending.next({ count: rows.length, summaries: rows });
            pending.complete();
          }
        });
        cy.get({ failure: S.allRejectedFailure, empty: S.allRejectedEmpty, populated: S.table }[completion]).should(
          'be.visible',
        );
        cy.get(S.allRejectedHeading).should('be.focused');
        cy.get('@listRequest').should('have.been.calledTwice');
      },
    );
  it(
    'AC4. should traverse Dismiss with native Tab and return to heading after native Enter',
    { tags: buildTags() },
    () => {
      setupAllRejected({ success: true, page: 2 });
      cy.get(S.allRejectedHeading).should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.allRejectedDismiss).should('be.focused');
      pressDashboardEnter();
      cy.get(S.allRejectedSuccess).should('not.exist');
      cy.get(S.allRejectedHeading).should('be.focused');
      cy.get(S.row(1)).should('be.visible');
      cy.get('@listRequest').should('have.been.calledOnce');
    },
  );
  it('AC2. should focus the heading when a fresh return shrinks the list to empty', { tags: buildTags() }, () => {
    setupAllRejected({ page: 2 });
    cy.get(S.row(1)).find('a').focus();
    pressDashboardEnter();
    cy.get(S.placeholderHeading).should('be.focused');
    cy.get<Cypress.Agent<sinon.SinonStub>>('@listRequest').then((request) =>
      request.returns(of({ count: 0, summaries: [] })),
    );
    cy.get(S.placeholderBack).focus();
    pressDashboardEnter();
    cy.get(S.allRejectedEmpty).should('be.visible');
    cy.get(S.allRejectedHeading).should('be.focused');
  });
  it(
    'AC1, AC2. should contain horizontal scrolling at 320 CSS pixels and retain keyboard access',
    { tags: buildTags() },
    () => {
      cy.viewport(320, 900);
      setupAllRejected();
      cy.get(S.allRejectedHeading).should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.scrollRegion).should('be.focused');
      cy.then(async () => {
        for (const type of ['keyDown', 'keyUp'])
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
      });
      cy.get(S.scrollRegion).should((region) => expect(region[0].scrollLeft).to.be.greaterThan(0));
      for (const key of ['respondent', 'applicant', 'caseType', 'submittedByName', 'created', 'statusDate']) {
        cy.press(Cypress.Keyboard.Keys.TAB);
        cy.get(S.sort(key)).should('be.focused');
      }
      cy.document().should((document) => expect(document.documentElement.scrollWidth).to.be.at.most(320));
      cy.get(S.scrollRegion).scrollTo('right');
      cy.get(S.sort('statusDate')).should('be.visible');
      axe();
    },
  );
});
