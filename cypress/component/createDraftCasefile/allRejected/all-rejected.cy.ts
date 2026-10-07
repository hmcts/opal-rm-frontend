import { setupAllRejected } from './setup/all-rejected.setup';
import {
  allRejectedFixtures as F,
  allRejectedExpected as E,
  allRejectedTies,
  allRejectedEscapedSuccess,
} from './mocks/all-rejected.mock';
import { CasesDraftSelectors as S } from '../../../shared/selectors/cases-draft.selectors';
import { Subject } from 'rxjs';
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
    'AC1. should request only other-inputter rejections and expose six columns without counts',
    { tags: buildTags() },
    () => {
      setupAllRejected();
      cy.get(S.allRejectedHeading).should('have.text', 'All rejected cases');
      cy.get('@listRequest').should('have.been.calledOnceWithExactly', {
        business_unit_id: 44,
        casefile_status: 'REJECTED',
        not_submitted_by: F.identity.submittedBy,
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
      cy.get('opal-lib-moj-notification-badge,opal-lib-moj-pagination').should('not.exist');
      cy.get(S.pagination).should('not.contain.text', 'Showing').and('not.contain.text', 'total results');
      cy.get(S.allRejectedPageStatus).should('have.text', 'All rejected cases, page 1 of 2');
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
          cy.get(S.allRejectedPage(1)).closest('li').should('have.attr', 'aria-current', 'page');
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
    cy.get(S.allRejectedPage(6)).closest('li').should('have.attr', 'aria-current', 'page');
    cy.get(S.allRejectedPageStatus).should('have.text', 'All rejected cases, page 6 of 11');
    assertUnchangedConsultation();
  });
  it(
    'AC1. should keep pending Retry distinct from empty and coalesce repeated activation',
    { tags: buildTags() },
    () => {
      setupAllRejected({ pending: true });
      cy.get(S.allRejectedLoading).should((element) =>
        expect(element.text().trim()).to.equal('Loading rejected cases.'),
      );
      cy.get(S.allRejectedHeading).should('be.focused');
      cy.get(S.allRejectedRetry).should('not.exist');
      cy.get(S.table).should('not.exist');
      cy.get(S.allRejectedEmpty).should('not.exist');
      cy.get('@listRequest').should('have.been.calledTwice');
      cy.get<Subject<IOpalMaintenanceDraftCasefileListResponse>>('@allRejectedPending').then((pending) => {
        pending.next({ count: 0, summaries: [] });
        pending.complete();
      });
      cy.get(S.allRejectedEmpty).should('be.visible');
      cy.get(S.allRejectedHeading).should('be.focused');
      cy.get('@listRequest').should('have.been.calledTwice');
    },
  );
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
      cy.get(S.allRejectedPage(2)).closest('li').should('have.attr', 'aria-current', 'page');
      assertUnchangedConsultation();
    },
  );
  for (const failure of [false, true])
    it(
      'AC4. should retain trusted success alongside ' + (failure ? 'recoverable failure' : 'empty'),
      { tags: buildTags() },
      () => {
        setupAllRejected({ rows: [], success: true, failure });
        cy.get(S.allRejectedSuccess).should(
          'contain.text',
          "You have submitted Synthetic Respondent's case for review.",
        );
        cy.get(failure ? S.allRejectedFailure : S.allRejectedEmpty).should('be.visible');
        cy.get(S.allRejectedDismiss).click();
        cy.get(S.allRejectedSuccess).should('not.exist');
        assertUnchangedConsultation();
      },
    );
});
