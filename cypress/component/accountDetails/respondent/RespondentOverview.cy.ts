import { PAGES_ROUTING_PATHS } from '@hmcts/opal-frontend-common/pages/routing/constants';
import type { StaticResponse } from 'cypress/types/net-stubbing';
import { pressDashboardEnter as pressNativeEnter } from '../../../support/utils/press-dashboard-enter';
import { RespondentAccountDetailsSelectors as S } from '../../../shared/selectors/respondent-account-details.selectors';
import {
  RESPONDENT_ACCOUNT_AT_A_GLANCE_MOCK as summary,
  RESPONDENT_ACCOUNT_ETAG as initialVersion,
  RESPONDENT_ACCOUNT_HEADER_MOCK as header,
} from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-respondent-account.mock';
import {
  accountPath,
  detailsPath,
  approvedPath,
  accountReadPath,
  interceptApprovedDashboard,
  interceptAccountRead,
  setupRespondentOverview,
} from './setup/respondent-overview.setup';
import {
  deniedProblemResponse,
  publishedRespondent,
  retryableProblemResponse,
  serviceProblemResponse,
  sparseSummary,
} from './mocks/respondent-overview.mock';

import { CasesDraftSelectors as DraftSelectors } from '../../../shared/selectors/cases-draft.selectors';
import { PrimaryNavigationLocators as Nav } from '../../../shared/selectors/primary-navigation.locators';

const buildTags = (): string[] => [
  '@JIRA-STORY:PO-11748',
  '@JIRA-EPIC:PO-6507',
  '@JIRA-LABEL:release-1c-rm-account-details',
];
const mismatchedVersion = '"respondent-11748-v2"';
const refreshedVersion = '"respondent-11748-v3"';
const staleMessage = 'Some information on this page may be out of date.';
const refreshedMessage = 'Information is up to date';
const loadingMessage = 'Loading account details';
const permissionDeniedHeading = 'You do not have permission for this';
const ok = (body: typeof header | typeof summary, etag?: string): StaticResponse => ({
  statusCode: 200,
  headers: etag ? { ETag: etag } : {},
  body,
});
const hasText = (expected: string) => ($element: JQuery<HTMLElement>) => {
  expect($element.text().trim()).to.equal(expected);
};

const expectKeyboardFocus = (selector: string) =>
  cy
    .get(selector)
    .should('be.visible')
    .and('be.focused')
    .and(($element) => {
      expect($element[0].matches(':focus-visible'), 'native keyboard focus').to.equal(true);
    });

const expectRoute = (path: string) => cy.get('@respondentRouter').its('url').should('equal', path);

const accountHeading = 'Ms Alex TEST';
const authorityPath = detailsPath + '#authority';
const permissionDeniedPath = '/error/permission-denied';
const accessDeniedPath = '/' + PAGES_ROUTING_PATHS.children.accessDenied;
const internalServerPath = '/error/internal-server';

const injectAxe = () => cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
const waitForAccountPair = () => cy.wait(['@accountHeader', '@accountSummary']);

const interceptMatchingPair = () => {
  interceptAccountRead('header-summary', ok(header, initialVersion));
  interceptAccountRead('at-a-glance', ok(summary, initialVersion));
};

const expectReadCounts = (headerCount: number, summaryCount: number) => {
  cy.get('@accountHeader.all').should('have.length', headerCount);
  cy.get('@accountSummary.all').should('have.length', summaryCount);
};

const expectNoData = () => {
  cy.get('[aria-hidden="true"]').should('be.visible').and(hasText('—'));
  cy.get('.govuk-visually-hidden').should(hasText('No data'));
};

const expectReflow = () => {
  cy.document().should((document) => {
    expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
  });
};

describe('Respondent account details', () => {
  it(
    'AC1. should open the published Respondent from Approved and read that same account',
    { tags: buildTags() },
    () => {
      interceptApprovedDashboard();
      interceptAccountRead('header-summary', ok(header, initialVersion));
      interceptAccountRead('at-a-glance', ok(summary, initialVersion));
      setupRespondentOverview(approvedPath);

      cy.wait(['@approvedCasefiles', '@rejectedCasefileCount']);
      cy.get(DraftSelectors.tab('approved')).should('have.attr', 'aria-current', 'page');
      cy.get(Nav.container).should('be.visible');
      cy.get(DraftSelectors.row(publishedRespondent.draft_casefile_id))
        .find(DraftSelectors.column('respondentAccount'))
        .find('a')
        .should('have.attr', 'href', detailsPath)
        .and(hasText(header.accountNumber))
        .click();

      expectRoute(detailsPath);
      const publishedAccountId = header.respondentAccountId;
      cy.wait('@accountHeader')
        .its('request.url')
        .should((url: string) => {
          expect(new URL(url).pathname).to.equal(accountReadPath(publishedAccountId, 'header-summary'));
        });
      cy.wait('@accountSummary')
        .its('request.url')
        .should((url: string) => {
          expect(new URL(url).pathname).to.equal(accountReadPath(publishedAccountId, 'at-a-glance'));
        });

      cy.get(S.accountNumber).should(
        'contain.text',
        publishedRespondent.casefile_snapshot.respondent_account?.account_number,
      );
      cy.get(S.tab('at-a-glance')).should('have.attr', 'aria-current', 'page');
      cy.get(S.heading).closest('.govuk-grid-column-full').should('exist');
      cy.get(Nav.container).should('not.exist');
    },
  );

  describe('Refresh', () => {
    it(
      'AC5, AC8, AC9, AC10. should confirm freshness after two fresh reads and preserve the selected tab',
      { tags: buildTags() },
      () => {
        let headerRequests = 0;
        let summaryRequests = 0;
        let releaseSummary!: () => void;
        const heldSummary = new Promise<void>((resolve) => {
          releaseSummary = resolve;
        });
        const refreshSummaryStarted = cy.spy().as('refreshSummaryStarted');

        interceptAccountRead('header-summary', (request) =>
          request.reply(
            ++headerRequests === 1 ? ok(header, initialVersion) : ok({ ...header, arrears: 126.5 }, refreshedVersion),
          ),
        );
        interceptAccountRead('at-a-glance', (request) => {
          if (++summaryRequests === 1) {
            request.reply(ok(summary, mismatchedVersion));
            return;
          }
          refreshSummaryStarted();
          return heldSummary.then(() => request.reply(ok(summary, refreshedVersion)));
        });

        setupRespondentOverview();
        waitForAccountPair();
        injectAxe();
        cy.get(S.warning).find('[role="alert"]').should('contain.text', staleMessage);
        cy.checkA11y();
        cy.get(S.tab('at-a-glance')).focus();
        cy.press(Cypress.Keyboard.Keys.TAB);
        expectKeyboardFocus(S.tab('respondent'));
        cy.press(Cypress.Keyboard.Keys.TAB);
        expectKeyboardFocus(S.tab('authority'));
        cy.press(Cypress.Keyboard.Keys.ENTER);
        expectRoute(authorityPath);
        cy.get(S.tab('authority')).should('have.attr', 'aria-current', 'page');
        cy.get(S.panel('authority')).should('exist').and('not.have.attr', 'hidden');
        cy.get(S.panel('authority')).should(($panel) => expect($panel.text().trim()).to.equal(''));
        cy.get(S.heading).should(hasText(accountHeading));
        cy.get(S.warning).should('contain.text', staleMessage);
        cy.get(S.loading).should('not.contain.text', loadingMessage);
        cy.get('@accountHeader.all').should('have.length', 1);
        cy.get('@accountSummary.all').should('have.length', 1);

        cy.get(S.refresh).focus().should('be.focused');
        pressNativeEnter();
        cy.wait('@accountHeader').its('response.statusCode').should('equal', 200);
        cy.get('@refreshSummaryStarted').should('have.been.calledOnce');
        cy.get(S.header).should('contain.text', '£126.50');
        cy.get(S.loading).should('contain.text', loadingMessage);
        cy.get(S.warning).should('contain.text', staleMessage);
        cy.get(S.refresh).should('have.attr', 'aria-disabled', 'true');
        cy.get(S.confirmation).should('not.exist');
        cy.then(() => releaseSummary());
        cy.wait('@accountSummary').its('response.statusCode').should('equal', 200);
        cy.get(S.loading).should('not.contain.text', loadingMessage);
        expectRoute(authorityPath);
        cy.get(S.panel('authority')).should('exist').and('not.have.attr', 'hidden');
        cy.get(S.warning).should('not.exist');
        cy.get(S.confirmation).find('[role="status"]').should('contain.text', refreshedMessage);
        cy.focused().should('have.attr', 'id', 'respondent-account-freshness-confirmation');
        cy.checkA11y();
        cy.get(S.dismissFreshness).focus().should('be.focused');
        pressNativeEnter();
        cy.get(S.confirmation).should('not.exist');
        cy.focused().should('have.attr', 'id', 'respondent-account-heading');
        expectRoute(authorityPath);
        cy.get('@accountHeader.all').should('have.length', 2);
        cy.get('@accountSummary.all').should('have.length', 2);
      },
    );
    it(
      'AC4, AC10. should route a denied Refresh while the other read is still in flight',
      { tags: buildTags() },
      () => {
        let headerReads = 0;
        let summaryReads = 0;
        let releaseHeader!: () => void;
        let releaseDenial!: () => void;
        const holdHeader = new Promise<void>((resolve) => {
          releaseHeader = resolve;
        });
        const holdDenial = new Promise<void>((resolve) => {
          releaseDenial = resolve;
        });
        const refreshedHeaderStarted = cy.spy().as('deniedRefreshHeaderStarted');

        interceptAccountRead('header-summary', (request) => {
          if (++headerReads === 1) {
            request.reply(ok(header, initialVersion));
            return;
          }
          refreshedHeaderStarted();
          return holdHeader.then(() => request.reply(ok(header, refreshedVersion)));
        });
        interceptAccountRead('at-a-glance', (request) => {
          if (++summaryReads === 1) {
            request.reply(ok(summary, mismatchedVersion));
            return;
          }
          return holdDenial.then(() => request.reply(deniedProblemResponse));
        });

        setupRespondentOverview(authorityPath);
        cy.wait(['@accountHeader', '@accountSummary']);
        cy.get(S.warning).should('be.visible');
        cy.get(S.refresh).click();
        cy.get('@deniedRefreshHeaderStarted').should('have.been.calledOnce');
        cy.get(S.confirmation).should('not.exist');
        cy.then(() => {
          releaseDenial();
        });
        cy.wait('@accountSummary').its('response.statusCode').should('equal', 403);
        expectRoute(permissionDeniedPath);
        cy.get('main h1').should(hasText(permissionDeniedHeading));
        cy.get(S.header).should('not.exist');
        cy.get(S.confirmation).should('not.exist');
        cy.get('@accountSummary.all').should('have.length', 2);
        cy.then(() => {
          releaseHeader();
        });
      },
    );

    const incompleteRefreshes = [
      { name: 'a retryable Summary failure', response: retryableProblemResponse, attempts: 2 },
      { name: 'a missing Summary version', response: ok(summary), attempts: 1 },
      { name: 'another version mismatch', response: ok(summary, mismatchedVersion), attempts: 1 },
    ];

    incompleteRefreshes.forEach(({ name, response, attempts }) => {
      it('AC8, AC9, AC10. should retain the warning after ' + name, { tags: buildTags() }, () => {
        let headerReads = 0;
        let summaryReads = 0;
        interceptAccountRead('header-summary', (request) =>
          request.reply(
            ++headerReads === 1 ? ok(header, initialVersion) : ok({ ...header, arrears: 126.5 }, refreshedVersion),
          ),
        );
        interceptAccountRead('at-a-glance', (request) =>
          request.reply(++summaryReads === 1 ? ok(summary, mismatchedVersion) : response),
        );

        setupRespondentOverview();
        waitForAccountPair();
        cy.get(S.warning).should('contain.text', staleMessage);
        cy.get(S.tab('authority')).click();
        expectRoute(authorityPath);
        cy.get(S.panel('authority')).should('exist');
        cy.get(S.refresh).click();
        cy.wait('@accountHeader').its('response.statusCode').should('equal', 200);
        for (let attempt = 0; attempt < attempts; attempt++) {
          cy.wait('@accountSummary').its('response.statusCode').should('equal', response.statusCode);
        }
        if (attempts === 2) {
          cy.get(S.error('summary')).should('contain.text', retryableProblemResponse.body.title);
          cy.get(S.retry('summary')).should('be.visible');
        }

        expectRoute(authorityPath);
        cy.get(S.tab('authority')).should('have.attr', 'aria-current', 'page');
        cy.get(S.header).should('contain.text', '£126.50');
        cy.get(S.refresh).should('not.have.attr', 'aria-disabled');
        cy.get(S.warning).should('contain.text', staleMessage);
        cy.get(S.confirmation).should('not.exist');
        expectReadCounts(2, 1 + attempts);
      });
    });
  });

  describe('Account summary', () => {
    it(
      'AC1, AC2, AC4, AC5, AC6. should render the account and keep its header when switching tabs',
      { tags: buildTags() },
      () => {
        cy.viewport(1280, 900);
        interceptMatchingPair();
        setupRespondentOverview();
        waitForAccountPair();
        expectRoute(detailsPath);
        cy.get(S.accountNumber).should('be.visible').and(hasText(header.accountNumber));
        cy.get('opal-lib-custom-summary-metric-bar-item').should(($metrics) => {
          expect($metrics).to.have.length(4);
          const tiles = $metrics.toArray().map((tile) => tile.getBoundingClientRect());
          expect(tiles[0].top).to.equal(tiles[3].top);
          expect(tiles[0].right).to.be.at.most(tiles[1].left);
        });
        cy.get(S.header).should(($header) => {
          const heading = $header.find(S.heading)[0].getBoundingClientRect();
          const addNote = $header.find(S.addNote)[0].getBoundingClientRect();
          expect(addNote.left).to.be.at.least(heading.right);
          expect(addNote.top).to.be.below(heading.bottom);
        });
        cy.get(S.panel('at-a-glance'))
          .find('section')
          .should(($sections) => {
            expect($sections).to.have.length(3);
            const [respondent, applicant, comments] = $sections
              .toArray()
              .map((section) => section.getBoundingClientRect());
            expect(respondent.top).to.equal(comments.top);
            expect(respondent.right).to.be.at.most(applicant.left);
            expect(applicant.right).to.be.at.most(comments.left);
            for (const heading of $sections.find('h2').toArray()) {
              expect(getComputedStyle(heading).borderBottomWidth).to.equal('4px');
            }
          });
        cy.get('main h1').should('have.length', 1).and(hasText(accountHeading));
        for (const [label, value] of [
          ['Arrears', '£125.50'],
          ['Balance', '£30.25'],
          ['Date arrears updated', '12 October 2026'],
          ['Case type', 'REMO In'],
        ]) {
          cy.contains('[opal-lib-custom-summary-metric-bar-item-label]', label).next('p').should(hasText(value));
        }
        cy.get(S.tab('at-a-glance')).should('have.attr', 'aria-current', 'page');
        cy.get(S.panel('at-a-glance')).within(() => {
          cy.contains('dt', 'Date of birth').next('dd').should(hasText('28 February 1990'));
          cy.contains('dt', /^Age$/).next('dd').should(hasText('36'));
          cy.contains('dt', /^Address$/)
            .next('dd')
            .should('contain.text', '1 Example Road')
            .and('contain.text', 'Example Town')
            .and('contain.text', 'AB1 2CD')
            .and('contain.text', 'United Kingdom');
          cy.contains('dt', 'Main email address').next('dd').should(hasText('respondent@example.test'));
          cy.contains('dd', 'Mr Sam EXAMPLE').find('a').should('not.exist');
          cy.contains('dt', 'Applicant account').next('dd').should(hasText('RA0011748')).find('a').should('not.exist');
          cy.get(S.respondentRestriction).should(hasText('Restricted'));
          cy.get(S.applicantRestriction).should(hasText('Restricted'));
          cy.contains(summary.comment!).should('be.visible');
        });
        cy.get(S.warning).should('not.exist');
        injectAxe();
        cy.checkA11y();

        for (const tab of ['respondent', 'authority'] as const) {
          cy.get(S.tab(tab)).click();
          expectRoute(detailsPath + '#' + tab);
          cy.get(S.tab(tab)).should('have.attr', 'aria-current', 'page');
          cy.get(S.panel(tab)).should(($panel) => {
            const panel = $panel[0];
            expect(panel.hasAttribute('hidden'), 'hidden attribute').to.equal(false);
            // Check the layout box because an empty panel can have zero height.
            expect(panel.checkVisibility({ visibilityProperty: true }), 'rendered panel').to.equal(true);
            expect($panel.text().trim()).to.equal('');
          });
          cy.get(S.panel('at-a-glance')).should('not.exist');
          cy.get(S.heading).should(hasText(accountHeading));
          cy.get(S.accountNumber).should(hasText(header.accountNumber));
          cy.checkA11y();
        }
        expectReadCounts(1, 1);
      },
    );

    for (const respondentRestricted of [true, false]) {
      const restrictedParty = respondentRestricted ? 'Respondent' : 'Applicant';

      it('AC6. should show restricted information only for the ' + restrictedParty, { tags: buildTags() }, () => {
        const applicant = summary.applicant;
        if (applicant?.kind !== 'individual') {
          throw new Error('The restriction scenario requires an individual Applicant fixture.');
        }
        interceptAccountRead('header-summary', ok(header, initialVersion));
        interceptAccountRead(
          'at-a-glance',
          ok(
            {
              ...summary,
              respondent: { ...summary.respondent, restricted: respondentRestricted },
              applicant: { ...applicant, restricted: !respondentRestricted },
            },
            initialVersion,
          ),
        );

        setupRespondentOverview();
        waitForAccountPair();

        const restrictedTag = respondentRestricted ? S.respondentRestriction : S.applicantRestriction;
        const unrestrictedTag = respondentRestricted ? S.applicantRestriction : S.respondentRestriction;
        cy.get(S.panel('at-a-glance')).within(() => {
          cy.get(restrictedTag).should('be.visible').and(hasText('Restricted'));
          cy.get(unrestrictedTag).should('not.exist');
        });
      });
    }

    it(
      'AC2, AC4, AC5, AC6, AC7. should announce loading and show optional omissions when the summary arrives',
      { tags: buildTags() },
      () => {
        let releaseSummary!: () => void;
        const heldSummary = new Promise<void>((resolve) => {
          releaseSummary = resolve;
        });
        interceptAccountRead('header-summary', ok({ ...header, caseType: null }, initialVersion));
        interceptAccountRead('at-a-glance', (request) =>
          heldSummary.then(() => request.reply(ok(sparseSummary, initialVersion))),
        );

        setupRespondentOverview();
        cy.wait('@accountHeader');
        cy.get(S.heading).should(hasText(accountHeading));
        cy.get(S.loading).should('contain.text', loadingMessage);
        cy.get(S.header).should('contain.text', 'Unknown');
        injectAxe();
        cy.checkA11y();

        cy.then(() => releaseSummary());
        cy.wait('@accountSummary');
        cy.get(S.loading).should('not.contain.text', loadingMessage);
        cy.get(S.panel('at-a-glance')).within(() => {
          for (const label of [
            'Date of birth',
            'Age',
            'Address',
            'Main email address',
            'Applicant account',
            'Applicant name',
          ]) {
            cy.contains('dl dt', label).next('dd').within(expectNoData);
          }
          cy.contains('h2', 'Comments').next('p').within(expectNoData);
          cy.get(S.respondentRestriction).should('not.exist');
          cy.get(S.applicantRestriction).should('not.exist');
        });
        cy.get(S.changeComment).should(hasText('Add comment'));
        cy.checkA11y();
        cy.get(S.changeComment).click();
        expectRoute(accountPath + '/comment/change');
        cy.get('main h1').should(hasText('Add comment'));
        cy.checkA11y();
        cy.get(S.cancel).click();
        expectRoute(detailsPath);
        cy.get(S.tab('at-a-glance')).should('have.attr', 'aria-current', 'page');
      },
    );
  });

  describe('Read recovery and denial', () => {
    const recoverableProblems = [
      {
        name: 'the automatic retry is exhausted',
        response: retryableProblemResponse,
        failures: 2,
        title: retryableProblemResponse.body.title,
        detail: retryableProblemResponse.body.detail,
      },
      {
        name: 'the response has no body',
        response: { statusCode: 204 },
        failures: 1,
        title: 'There was a problem',
        detail: 'You can try again. If the problem persists, contact the service desk.',
      },
    ];

    recoverableProblems.forEach(({ name, response, failures, title, detail }) => {
      it('AC4, AC5. should recover At a glance independently after ' + name, { tags: buildTags() }, () => {
        let attempts = 0;
        interceptAccountRead('header-summary', ok(header, initialVersion));
        interceptAccountRead('at-a-glance', (request) =>
          request.reply(++attempts <= failures ? response : ok(summary, initialVersion)),
        );

        setupRespondentOverview();
        cy.wait('@accountHeader');
        for (let attempt = 0; attempt < failures; attempt++) {
          cy.wait('@accountSummary').its('response.statusCode').should('equal', response.statusCode);
        }
        cy.get(S.error('summary')).find('[role="alert"]').should('contain.text', title);
        cy.get(S.error('summary')).should('contain.text', detail);
        cy.get(S.heading).should(hasText(accountHeading));
        expectReadCounts(1, failures);
        injectAxe();
        cy.checkA11y();

        cy.get(S.retry('summary')).should('have.attr', 'aria-label', 'Retry at a glance').focus().should('be.focused');
        pressNativeEnter();
        cy.wait('@accountSummary').its('response.statusCode').should('equal', 200);
        cy.get(S.panel('at-a-glance')).should('contain.text', summary.comment);
        cy.get(S.error('summary')).should('not.exist');
        cy.focused().should('match', S.heading);
        expectReadCounts(1, failures + 1);
      });
    });

    it('AC1, AC4, AC5. should show Permission Denied for a denied account read', { tags: buildTags() }, () => {
      interceptAccountRead('header-summary', ok(header, initialVersion));
      interceptAccountRead('at-a-glance', deniedProblemResponse);
      setupRespondentOverview();

      cy.wait('@accountSummary').its('response.statusCode').should('equal', 403);
      expectRoute(permissionDeniedPath);
      cy.get('main h1').should(hasText(permissionDeniedHeading));
      cy.get(S.header).should('not.exist');
      cy.get('@accountSummary.all').should('have.length', 1);
      injectAxe();
      cy.checkA11y();
    });

    it(
      'AC4, AC5. should show the service error and its reference after a terminal failure',
      { tags: buildTags() },
      () => {
        interceptAccountRead('header-summary', ok(header, initialVersion));
        interceptAccountRead('at-a-glance', serviceProblemResponse);
        setupRespondentOverview();

        cy.wait('@accountSummary').its('response.statusCode').should('equal', 500);
        expectRoute(internalServerPath);
        cy.get('main h1').should(hasText('Sorry, there is a problem with the service'));
        cy.get('main').should('contain.text', serviceProblemResponse.body.operation_id);
        cy.get(S.header).should('not.exist');
        cy.get('@accountSummary.all').should('have.length', 1);
      },
    );

    const guardedRoutes = [
      { name: 'account details', path: detailsPath },
      { name: 'Add account note', path: accountPath + '/note/add' },
    ];

    for (const release of [false, 'unresolved'] as const) {
      for (const { name, path } of guardedRoutes) {
        it('AC1. should deny ' + name + ' with the release flag ' + release, { tags: buildTags() }, () => {
          interceptMatchingPair();
          setupRespondentOverview(path, release);

          expectRoute(accessDeniedPath);
          cy.get('main h1').should(hasText('Access Denied'));
          cy.get(S.header).should('not.exist');
          cy.get(S.cancel).should('not.exist');
          expectReadCounts(0, 0);
        });
      }
    }
  });

  describe('Account actions', () => {
    it(
      'AC4, AC5, AC7. should open Add account note and return keyboard focus to the Authority account heading',
      { tags: buildTags() },
      () => {
        interceptMatchingPair();
        setupRespondentOverview(authorityPath);
        waitForAccountPair();

        cy.get(S.addNote).click();
        expectRoute(accountPath + '/note/add');
        cy.focused().should('match', 'h1').and(hasText('Add account note'));
        cy.get('main h1').closest('.govuk-grid-column-two-thirds').should('exist');
        injectAxe();
        cy.checkA11y();
        cy.press(Cypress.Keyboard.Keys.TAB);
        expectKeyboardFocus(S.cancel);
        cy.press(Cypress.Keyboard.Keys.ENTER);
        expectRoute(authorityPath);
        cy.get(S.panel('authority')).should('exist');
        cy.focused().should('match', S.heading);
        waitForAccountPair();
        cy.get(S.heading).should(hasText(accountHeading)).and('be.focused');
      },
    );

    it(
      'AC4, AC5, AC7. should open Change case type using the keyboard and cancel to Authority',
      { tags: buildTags() },
      () => {
        interceptMatchingPair();
        setupRespondentOverview(authorityPath);
        waitForAccountPair();

        cy.get(S.moreActions).focus().should('be.focused').and('have.attr', 'aria-expanded', 'false');
        pressNativeEnter();
        cy.get(S.moreActions).should('have.attr', 'aria-expanded', 'true');
        cy.get(S.moreActionOptions).find('a').should('have.length', 1).and(hasText('Change case type'));
        cy.press(Cypress.Keyboard.Keys.TAB);
        expectKeyboardFocus(S.changeCaseType);
        cy.press(Cypress.Keyboard.Keys.ENTER);
        expectRoute(accountPath + '/case-type/change');
        cy.get('main h1').should(hasText('Change case type'));
        injectAxe();
        cy.checkA11y();
        cy.get(S.cancel).click();
        expectRoute(authorityPath);
        cy.get(S.tab('authority')).should('have.attr', 'aria-current', 'page');
        cy.get(S.heading).should(hasText(accountHeading));
      },
    );

    it('AC4, AC7. should open Change comment from a populated summary', { tags: buildTags() }, () => {
      interceptMatchingPair();
      setupRespondentOverview();
      waitForAccountPair();

      cy.get(S.changeComment).should(hasText('Change comment')).click();
      expectRoute(accountPath + '/comment/change');
      cy.get('main h1').should(hasText('Change comment'));
    });

    it(
      'AC4, AC5, AC7. should cancel a directly opened comment page to the default summary',
      { tags: buildTags() },
      () => {
        interceptMatchingPair();
        setupRespondentOverview(accountPath + '/comment/change');
        cy.get('main h1').should(hasText('Add or change comment')).and('be.focused');
        cy.press(Cypress.Keyboard.Keys.TAB);
        expectKeyboardFocus(S.cancel);
        cy.press(Cypress.Keyboard.Keys.ENTER);

        expectRoute(detailsPath);
        waitForAccountPair();
        cy.get(S.tab('at-a-glance')).should('have.attr', 'aria-current', 'page');
        cy.get(S.heading).should(hasText(accountHeading)).and('be.focused');
      },
    );
  });

  it(
    'AC5. should reflow the populated account, warning and note page at desktop and mobile widths',
    { tags: buildTags() },
    () => {
      const defaultWidth = Cypress.config('viewportWidth');
      const defaultHeight = Cypress.config('viewportHeight');
      const longSurname = 'LongSurname'.repeat(8);
      cy.viewport(1280, 800);
      interceptAccountRead(
        'header-summary',
        ok({ ...header, name: { ...header.name, surname: longSurname } }, initialVersion),
      );
      interceptAccountRead('at-a-glance', ok(summary, mismatchedVersion));
      setupRespondentOverview();
      waitForAccountPair();

      cy.get(S.heading).should(hasText(`Ms Alex ${longSurname.toUpperCase()}`));
      cy.get(S.warning).should('be.visible');
      cy.get(S.panel('at-a-glance')).should('contain.text', summary.comment);
      expectReflow();
      cy.viewport(800, 800);
      cy.get('opal-lib-custom-summary-metric-bar-item p').each(($item) => {
        expect($item[0].scrollWidth).to.be.at.most($item[0].clientWidth);
      });
      expectReflow();
      cy.viewport(320, 800);
      cy.get(S.addNote).should('be.visible');
      cy.get(S.refresh).should('be.visible');
      cy.get(S.panel('at-a-glance'))
        .find('section')
        .should(($sections) => {
          const [respondent, applicant, comments] = $sections
            .toArray()
            .map((section) => section.getBoundingClientRect());
          expect(applicant.top).to.be.at.least(respondent.bottom);
          expect(comments.top).to.be.at.least(applicant.bottom);
        });
      expectReflow();

      cy.get(S.addNote).click();
      expectRoute(accountPath + '/note/add');
      cy.get('main h1').should(hasText('Add account note'));
      cy.get(S.cancel).should('be.visible');
      expectReflow();
      cy.viewport(1280, 800);
      expectReflow();
      cy.viewport(defaultWidth, defaultHeight);
    },
  );
});
