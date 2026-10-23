import { setupAllRejected } from './setup/all-rejected.setup';
import {
  allRejectedFixtures as F,
  allRejectedExpected as E,
  allRejectedTies,
  allRejectedEscapedSuccess,
} from './mocks/all-rejected.mock';
import { CasesDraftSelectors as S } from '../../../shared/selectors/cases-draft.selectors';
import { Subject, of } from 'rxjs';
import { type IOpalMaintenanceDraftCasefileListResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-list-response.interface';
import { type Router } from '@angular/router';
import { CASES_DRAFT_ROUTING_PATHS } from 'src/app/flows/cases/cases-draft/routing/constants/cases-draft-routing-paths.constant';
import { CreateCasefileSelectors } from '../../../shared/selectors/create-casefile.selectors';
import { pressDashboardEnter } from '../../../support/utils/press-dashboard-enter';

const listUrl = '/' + CASES_DRAFT_ROUTING_PATHS.root + '/' + CASES_DRAFT_ROUTING_PATHS.children.rejections;

const buildTags = (): string[] => [
  '@JIRA-STORY:PO-10607',
  '@JIRA-EPIC:PO-10817',
  '@JIRA-LABEL:create-draft-casefile',
  '@JIRA-LABEL:release-1c-rm-create-case-files',
];

function assertIds(expected: number[]) {
  cy.get(S.tableRows).should((rows) =>
    expect([...rows].map((row) => Number(row.getAttribute('data-draft-id')))).to.deep.equal(expected),
  );
}

function assertUnchangedConsultation() {
  cy.get('@listRequest').should('have.been.calledOnce');
  cy.get<Router>('@allRejectedRouter').its('url').should('equal', listUrl);
  cy.get('@routerNavigate').should('have.been.calledOnce');
}

describe('All rejected cases collection', () => {
  it(
    'AC1. should request all business-unit rejections and expose six columns with shared MOJ pagination',
    { tags: buildTags() },
    () => {
      setupAllRejected({
        rows: F.rows().map((row, index) => (index === 0 ? { ...row, submitted_by: F.identity.submittedBy } : row)),
      });
      cy.get(S.allRejectedHeading).should('have.text', 'All rejected cases');
      cy.get('@listRequest').should('have.been.calledOnceWithExactly', {
        business_unit_id: 44,
        casefile_status: 'REJECTED',
      });
      cy.get(S.table)
        .find('th')
        .should((cells) =>
          expect([...cells].map((cell) => cell.textContent?.trim())).to.deep.equal([
            'Respondent',
            'Applicant',
            'Case type',
            'Submitted by',
            'Created',
            'Rejected',
          ]),
        );
      cy.get(S.tabs).should('not.exist');
      cy.get(S.create).should('not.exist');
      cy.get('opal-lib-moj-notification-badge,opal-lib-govuk-pagination').should('not.exist');
      cy.get('opal-lib-moj-pagination .moj-pagination__results').should(
        'have.text',
        'Showing 1 to 25 of 26 total results',
      );
      cy.get(S.allRejectedPageStatus).should('have.text', 'All rejected cases, page 1 of 2');
      cy.get(S.row(26)).should('be.visible');
      cy.get(S.row(25)).should('be.visible');
    },
  );
  for (const count of [0, 1, 25, 26])
    it('AC1, AC2. should render ' + count + ' returned rows at the page boundary', { tags: buildTags() }, () => {
      setupAllRejected({ rows: F.rows(count) });
      if (count === 0) {
        cy.get(S.allRejectedEmpty).should('have.text', 'There are no rejected cases.');
        cy.get(S.table).should('not.exist');
      } else cy.get(S.tableRows).should('have.length', Math.min(count, 25));
      cy.get(S.pagination).should(count > 25 ? 'exist' : 'not.exist');
      cy.get('@listRequest').should('have.been.calledOnce');
    });
  const orders = {
    respondent: [E.forwards, E.backwards],
    applicant: [E.backwards, E.forwards],
    caseType: [E.forwards, E.caseDescending],
    submittedByName: [E.forwards, E.backwards],
    created: [E.forwards, E.backwards],
    statusDate: [E.backwards, E.forwards],
  };
  for (const key of ['respondent', 'applicant', 'caseType', 'submittedByName', 'created', 'statusDate'] as const)
    for (const direction of ['ascending', 'descending'] as const)
      it(
        'AC2. should sort the full collection by ' + key + ' ' + direction + ' before both page slices',
        { tags: buildTags() },
        () => {
          setupAllRejected({ page: 2, sort: key, direction: direction === 'ascending' ? 'descending' : 'ascending' });
          cy.get(S.sort(key)).click();
          const expected = orders[key][direction === 'ascending' ? 0 : 1];
          cy.get(S.sort(key)).closest('th').should('have.attr', 'aria-sort', direction);
          assertIds(expected.slice(0, 25));
          cy.get(S.allRejectedPage(1)).should('have.attr', 'aria-current', 'page');
          cy.get(S.allRejectedNext).click();
          assertIds(expected.slice(25));
          cy.get(S.allRejectedPageStatus).should('have.text', 'All rejected cases, page 2 of 2');
          assertUnchangedConsultation();
        },
      );
  for (const key of ['submittedByName', 'created', 'statusDate'] as const)
    for (const direction of ['ascending', 'descending'] as const)
      it(
        'AC2. should preserve missing names last and ascending identifier ties for ' + key + ' ' + direction,
        { tags: buildTags() },
        () => {
          setupAllRejected({ rows: allRejectedTies(), sort: key, direction });
          assertIds([1, 2, 3]);
          cy.get(S.row(1)).find(S.column('submittedByName')).should('have.text', ' Synthetic branch ');
          cy.get(S.row(3)).find(S.column('submittedByName')).should('contain.text', '—');
          assertUnchangedConsultation();
        },
      );
  it('AC2. should render two noninteractive ellipses in an eleven-page collection', { tags: buildTags() }, () => {
    setupAllRejected({ rows: F.rows(251), page: 6 });
    cy.get(S.allRejectedEllipses).should('have.length', 2).find('a,button').should('not.exist');
    cy.get(S.allRejectedPage(6)).should('have.attr', 'aria-current', 'page');
    cy.get(S.allRejectedPageStatus).should('have.text', 'All rejected cases, page 6 of 11');
    assertUnchangedConsultation();
  });
  it('AC1. should wait for the resolver before activating the page', { tags: buildTags() }, () => {
    setupAllRejected({ pending: true });
    cy.get(S.allRejectedHeading).should('not.exist');
    cy.get(S.table).should('not.exist');
    cy.get(S.allRejectedEmpty).should('not.exist');
    cy.get('@listRequest').should('have.been.calledOnce');
    cy.get<Subject<IOpalMaintenanceDraftCasefileListResponse>>('@allRejectedPending').then((pending) => {
      pending.next({ count: 0, summaries: [] });
      pending.complete();
    });
    cy.get(S.allRejectedEmpty).should('be.visible');
    cy.get(S.allRejectedHeading).should('be.focused');
    assertUnchangedConsultation();
  });
  it('AC1. should report resolver failure without activating an empty list', { tags: buildTags() }, () => {
    setupAllRejected({ failure: true });
    cy.get('@globalBannerError').should('have.been.calledOnce');
    cy.get(S.allRejectedHeading).should('not.exist');
    cy.get(S.allRejectedEmpty).should('not.exist');
    cy.get(S.table).should('not.exist');
    cy.get('@listRequest').should('have.been.calledOnce');
  });
  it(
    'AC4. should escape success names and dismiss without changing rows, selection or requests',
    { tags: buildTags() },
    () => {
      setupAllRejected({ success: allRejectedEscapedSuccess, page: 2, sort: 'created', direction: 'descending' });
      cy.get(S.allRejectedSuccess)
        .should('contain.text', "You have submitted <img src=x> <script>Synthetic</script>'s case for review.")
        .find('img,script')
        .should('not.exist');
      assertIds([1]);
      cy.get(S.allRejectedDismiss).click();
      cy.get(S.allRejectedSuccess).should('not.exist');
      assertIds([1]);
      cy.get(S.allRejectedHeading).should('be.focused');
      cy.get(S.allRejectedPage(2)).should('have.attr', 'aria-current', 'page');
      assertUnchangedConsultation();
    },
  );
  it('AC4. should retain trusted success alongside an empty result', { tags: buildTags() }, () => {
    setupAllRejected({ rows: [], success: true });
    cy.get(S.allRejectedSuccess).should('contain.text', "You have submitted Synthetic Respondent's case for review.");
    cy.get(S.allRejectedEmpty).should('be.visible');
    cy.get(S.allRejectedDismiss).click();
    cy.get(S.allRejectedSuccess).should('not.exist');
    assertUnchangedConsultation();
  });
  it(
    'AC4. should display surname-only success without an extra space',
    { tags: [...buildTags(), '@JIRA-STORY:PO-10610'] },
    () => {
      cy.viewport(1280, 900);
      setupAllRejected({ rows: [], success: { ...F.success, respondentForename: '' } });
      cy.get(S.allRejectedSuccess)
        .find('opal-lib-moj-alert-content-text')
        .should('have.text', "You have submitted Respondent's case for review.");
      cy.get(S.allRejectedEmpty).should('be.visible');
      assertUnchangedConsultation();
      cy.screenshot('po-10610-surname-only-resubmission-notice');
    },
  );
});

const R = CreateCasefileSelectors.review;

function axe() {
  cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
  cy.checkA11y();
}

describe('All rejected cases native keyboard and accessibility', () => {
  const states = [
    { name: 'populated', options: {} },
    { name: 'empty', options: { rows: [] } },
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
  it('AC2. should traverse all six headers and respondent with native Tab and Enter', { tags: buildTags() }, () => {
    setupAllRejected();
    cy.get(S.allRejectedHeading).should('be.focused');
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
    cy.get(CreateCasefileSelectors.caseDetails.heading).should('have.text', 'Synthetic Respondent').and('be.focused');
    cy.get('@allRejectedDetailRequest').should('have.been.calledOnceWithExactly', 26);
    cy.get(R.decisionHost).should('not.exist');
    cy.get(CreateCasefileSelectors.caseDetails.respondentStatus).should('contain.text', 'Provided');
    cy.get('@listRequest').should('have.been.calledOnce');
    cy.get(CreateCasefileSelectors.caseDetails.backLink).focus();
    pressDashboardEnter();
    cy.get(S.allRejectedHeading).should('be.focused');
    cy.get('@listRequest').should('have.been.calledTwice');
  });
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
  it(
    'AC4. should traverse Dismiss with native Tab and return to heading after native Enter',
    { tags: buildTags() },
    () => {
      setupAllRejected({ success: true, page: 2 });
      cy.get(S.allRejectedHeading).should('be.focused');
      cy.then(async () => {
        for (const type of ['keyDown', 'keyUp'])
          await Cypress.automation('remote:debugger:protocol', {
            command: 'Input.dispatchKeyEvent',
            params: { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: 8 },
          });
      });
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
    cy.get(CreateCasefileSelectors.caseDetails.heading).should('be.focused');
    cy.get('@allRejectedDetailRequest').should('have.been.calledOnceWithExactly', 1);
    cy.get(R.decisionHost).should('not.exist');
    cy.get<Cypress.Agent<sinon.SinonStub>>('@listRequest').then((request) =>
      request.returns(of({ count: 0, summaries: [] })),
    );
    cy.get(CreateCasefileSelectors.caseDetails.backLink).focus();
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
      for (const key of ['respondent', 'applicant', 'caseType', 'submittedByName', 'created', 'statusDate']) {
        cy.press(Cypress.Keyboard.Keys.TAB);
        cy.get(S.sort(key)).should('be.focused');
      }
      cy.get(S.scrollRegion).should((region) => expect(region[0].scrollLeft).to.be.greaterThan(0));
      cy.document().should((document) => expect(document.documentElement.scrollWidth).to.be.at.most(320));
      cy.get(S.scrollRegion).scrollTo('right');
      cy.get(S.sort('statusDate')).should('be.visible');
      axe();
    },
  );
});
