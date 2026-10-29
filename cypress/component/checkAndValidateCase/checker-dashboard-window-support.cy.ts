import { InputterMonitoringFixtureActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/inputter-monitoring-fixture.actions';
import { accessibilityActions } from '../../e2e/functional/opal/actions/accessibility/accessibility.actions';
import { createPersistedCasefileDetail } from '../../../src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import { checkerRows, checkerUser } from '../../e2e/functional/opal/mocks/createDraftCasefile/checker-dashboard.mock';
import { CasesDraftSelectors as S } from '../../shared/selectors/cases-draft.selectors';
import type { CasesDraftCheckerTab } from '../../../src/app/flows/cases/cases-draft/types/cases-draft-tab.type';
import {
  CheckerDashboardWindowActions,
  assertCheckerWindowQuery,
  assertCheckerWindowResults,
  assertCheckerEmptyCollection,
} from '../../e2e/functional/opal/actions/checkAndValidateCase/checker-dashboard-window.actions';
import { monitoringCalendar } from '../../e2e/functional/opal/actions/checkAndValidateCase/inputter-monitoring-date';

const buildTags = (): string[] => [
  '@R1CRmCreateCaseFiles',
  '@JIRA-STORY:PO-10625',
  '@JIRA-EPIC:PO-10817',
  '@JIRA-LABEL:create-draft-casefile',
  '@retries(0)',
];

const calendar = monitoringCalendar('2026-10-20T11:34:00+01:00', 7);
const scope = { business_unit_id: '44', not_submitted_by: 'checker-id' };

describe('PO-10625 checker calendar and empty evidence support', () => {
  it('AC6. should require exact checker exclusion and Deleted inclusive dates', { tags: buildTags() }, () => {
    const query = {
      ...scope,
      casefile_status: 'DELETED',
      casefile_status_from_date: calendar.from,
      casefile_status_to_date: calendar.to,
    };
    assertCheckerWindowQuery(query, 'checker-id', calendar);
    for (const wrong of [
      { ...query, not_submitted_by: 'wrong' },
      { ...query, submitted_by: 'inputter-id' },
      { ...query, casefile_status_from_date: '2026-10-21' },
      { ...query, casefile_status_to_date: '2026-10-28' },
      { ...query, casefile_status: 'PUBLISHED' },
      { ...query, restrict: 'counts' },
    ])
      expect(() => assertCheckerWindowQuery(wrong, 'checker-id', calendar)).to.throw();
  });

  it('AC6. should forbid every date restriction on Rejected', { tags: buildTags() }, () => {
    const query = { ...scope, casefile_status: 'REJECTED' };
    assertCheckerWindowQuery(query, 'checker-id', calendar);
    expect(() =>
      assertCheckerWindowQuery({ ...query, casefile_status_from_date: calendar.from }, 'checker-id', calendar),
    ).to.throw();
    expect(() =>
      assertCheckerWindowQuery({ ...query, casefile_status_to_date: calendar.to }, 'checker-id', calendar),
    ).to.throw();
  });

  for (const rule of ['unbounded', 'seven-day'] as const) {
    it(
      `AC6. should require real response and DOM inclusion at all four ${rule} boundaries`,
      { tags: buildTags() },
      () => {
        const results = [0, 3, 7, 8].map((days) => ({
          days,
          response: rule === 'unbounded' || days < 8,
          dom: rule === 'unbounded' || days < 8,
        }));
        assertCheckerWindowResults(results, rule);
        for (const index of [0, 1, 2, 3]) {
          const hidden = structuredClone(results);
          hidden[index].dom = !hidden[index].dom;
          expect(() => assertCheckerWindowResults(hidden, rule)).to.throw();
          const wrongResponse = structuredClone(results);
          wrongResponse[index].response = !wrongResponse[index].response;
          expect(() => assertCheckerWindowResults(wrongResponse, rule)).to.throw();
        }
        expect(() => assertCheckerWindowResults(results.slice(1), rule)).to.throw();
        expect(() => assertCheckerWindowResults([...results.slice(0, 3), results[2]], rule)).to.throw();
      },
    );
  }

  it('AC6. should require genuinely empty provider rows and count independently', { tags: buildTags() }, () => {
    assertCheckerEmptyCollection({ count: 0, summaries: [] });
    for (const body of [
      { count: 1, summaries: [] },
      { count: -1, summaries: [] },
      { count: '0', summaries: [] },
      { count: 0 },
      { count: 0, summaries: [{}] },
    ]) {
      expect(() => assertCheckerEmptyCollection(body)).to.throw();
    }
  });
});

const owned = {
  id: 101,
  marker: 'E2E-0123456789abcdef',
  inputter: 'synthetic-inputter',
  checker: 'synthetic-checker',
  inputterId: 'BUU-OTHER',
  checkerId: 'BUU-CHECKER',
  inputterName: 'Synthetic submitter',
  checkerName: 'Synthetic checker',
};
const savedDate = '2026-10-20T11:34:00+01:00';
const tabs: CasesDraftCheckerTab[] = ['to-review', 'rejected', 'deleted', 'failed'];
const statuses = ['SUBMITTED,RESUBMITTED', 'REJECTED', 'DELETED', 'PUBLISHING_FAILED'];
const empties = [
  'There are no cases to review.',
  'There are no rejected cases.',
  'No cases have been deleted in the past 7 days.',
  'There are no failed cases.',
];

describe('PO-10625 real caller boundary dispatch support', () => {
  let expectedFailure = false;
  let observedFailure = false;
  beforeEach(() => {
    expectedFailure = false;
    observedFailure = false;
  });
  afterEach(() => {
    if (expectedFailure) expect(observedFailure, 'required failure observed').to.equal(true);
  });

  function mustFail(message: string, verify?: () => void): void {
    expectedFailure = true;
    cy.once('fail', (error) => {
      if (!error.message.includes(message)) throw error;
      observedFailure = true;
      verify?.();
      return false;
    });
  }

  type Observed = {
    query: Record<string, string>;
    alias?: string;
    continue: (callback: (response: { statusCode: number; body: unknown }) => void) => void;
  };

  // Controlled network/session boundaries only. No application page, real API or fixture write is reached.
  function controlled(
    status: 'REJECTED' | 'DELETED',
    options: {
      hidden?: boolean;
      wrongScope?: boolean;
      badDate?: boolean;
      emptyCount?: number;
      emptyRows?: boolean;
      scanFailure?: boolean;
      empty?: boolean;
      entryTabFocus?: boolean;
      consultedHeadingFocus?: boolean;
      nonzeroBrowserCount?: boolean;
    } = {},
  ) {
    const state = {
      tab: 'to-review' as CasesDraftCheckerTab,
      page: 1,
      days: 0,
      path: '/cases/draft/check-and-validate/tabs',
      events: [] as string[],
      scans: [] as string[],
      requests: [] as Cypress.RequestOptions[],
      originalDate: undefined as DateConstructor | undefined,
      pendingLists: 0,
      pendingCounts: [] as string[],
    };
    let observe: (request: Observed) => void;
    const selectedRows = () => {
      const matching =
        state.tab === (status === 'REJECTED' ? 'rejected' : 'deleted') && (status === 'REJECTED' || state.days <= 7);
      if (!matching || options.empty) return [];
      const rows = checkerRows(state.tab, 2);
      rows[1].draft_casefile_id = owned.id;
      rows[1].casefile_status_date = savedDate;
      return rows;
    };
    const render = (document: Document) => {
      const rows = selectedRows();
      const selected = rows[state.page - 1];
      const navigation = tabs
        .map(
          (tab) =>
            `<a href="#${tab}" id="cases-draft-${tab}-tab" ${tab === state.tab ? 'aria-current="page"' : ''}>${tab}</a>`,
        )
        .join('');
      const table = selected
        ? `<app-cases-draft-table><table><tbody><tr data-draft-id="${selected.draft_casefile_id}" ${options.hidden && selected.draft_casefile_id === owned.id ? 'style="display:none"' : ''}><td>Controlled row</td></tr></tbody></table></app-cases-draft-table><nav id="cases-draft-pagination"><a aria-label="Page ${state.page}" aria-current="page" href="#current">${state.page}</a>${state.page === 1 ? '<a rel="next" href="#next">Next</a>' : ''}</nav>`
        : `<p id="cases-draft-empty">${empties[tabs.indexOf(state.tab)]}</p>`;
      document.body.innerHTML = `<nav aria-label="Account navigation"><a class="moj-header__navigation-link">Sign out</a></nav><h1 tabindex="-1" id="cases-draft-heading">Review cases</h1>${navigation}${table}`;
      for (const tab of tabs)
        document.querySelector(S.tab(tab))!.addEventListener('click', (event) => {
          event.preventDefault();
          if (state.tab === tab) {
            if (options.consultedHeadingFocus) document.querySelector<HTMLElement>(S.heading)!.focus();
            return;
          }
          state.tab = tab;
          state.pendingLists++;
          state.pendingCounts.push(
            ...(tab === 'rejected'
              ? ['PUBLISHING_FAILED']
              : tab === 'failed'
                ? ['REJECTED']
                : ['REJECTED', 'PUBLISHING_FAILED']),
          );
          state.page = 1;
          const browserNow = document.defaultView!.Date.now();
          state.days = [0, 3, 7, 8].find((day) => monitoringCalendar(savedDate, day).now === browserNow) ?? 0;
          render(document);
          document.querySelector<HTMLElement>(options.consultedHeadingFocus ? S.heading : S.tab(tab))!.focus();
        });
      document.querySelector('[rel="next"]')?.addEventListener('click', (event) => {
        event.preventDefault();
        state.page++;
        render(document);
      });
    };
    cy.document().then((document) => {
      state.originalDate = document.defaultView!.Date;
      render(document);
    });
    cy.stub(cy, 'session').callsFake(() => cy.wrap(null, { log: false }));
    cy.stub(cy, 'visit').callsFake((url: string) =>
      cy.document().then((document) => {
        if (url !== '/dashboard') return;
        state.path = '/dashboard';
        document.body.innerHTML =
          '<div id="primaryNavigation"><nav aria-label="Primary navigation"><a class="moj-primary-navigation__link" href="/dashboard/cases">Cases</a></nav></div>';
        document.querySelector('a')!.addEventListener('click', (event) => {
          event.preventDefault();
          state.path = '/dashboard/cases';
          document.body.innerHTML = '<a id="casesReviewCasefilesLink" href="/checker">Review cases</a>';
          document.querySelector('a')!.addEventListener('click', (entryEvent) => {
            entryEvent.preventDefault();
            state.path = '/cases/draft/check-and-validate/tabs';
            state.pendingLists++;
            state.pendingCounts.push('REJECTED', 'PUBLISHING_FAILED');
            render(document);
            document.querySelector<HTMLElement>(options.entryTabFocus ? S.tab('to-review') : S.heading)!.focus();
          });
        });
      }),
    );
    cy.stub(InputterMonitoringFixtureActions.prototype, 'create').callsFake((selected: string) => {
      expect(selected).to.equal(status);
      state.events.push('create');
      return cy.wrap(owned, { log: false });
    });
    cy.stub(cy, 'request').callsFake((request: Cypress.RequestOptions) =>
      cy.then(() => {
        state.requests.push(request);
        expect(request.method ?? 'GET').to.equal('GET');
        if (request.url === '/api/user-state') return { status: 200, body: checkerUser('checker') };
        if (request.url === '/opal-maintenance-service/draft-casefiles/101') {
          const draft = createPersistedCasefileDetail();
          draft.draft_casefile_id = owned.id;
          draft.casefile_status = status;
          draft.submitted_by = owned.inputterId;
          draft.casefile_status_date = savedDate;
          draft.casefile.respondent_account.remo_reference = owned.marker;
          return { status: 200, body: draft, headers: { etag: '"2"' } };
        }
        expect(request.url).to.equal('/opal-maintenance-service/draft-casefiles');
        const qs = request.qs as Record<string, unknown>;
        expect(qs['not_submitted_by']).to.equal(owned.checkerId);
        expect(qs).not.to.have.property('submitted_by');
        if (qs['restrict']) return { status: 200, body: { count: options.emptyCount ?? 0 } };
        return {
          status: 200,
          body: { count: options.emptyCount ?? 0, summaries: options.emptyRows ? checkerRows('rejected', 1) : [] },
        };
      }),
    );
    cy.stub(cy, 'intercept').callsFake((...args: unknown[]) => {
      if (args[0] === 'GET') observe = args[2] as typeof observe;
      return cy.wrap(null, { log: false });
    });
    cy.stub(cy, 'location').callsFake((property: string) =>
      cy.then(() => ({ pathname: state.path, hash: '#' + state.tab, search: '' })[property as 'pathname']),
    );
    cy.stub(cy, 'wait').callsFake((alias: string) =>
      cy.then(() => {
        expect(alias).to.be.oneOf(['@checkerWindowList', '@checkerWindowCount']);
        const cal = options.empty
          ? monitoringCalendar(new Date().toISOString(), 0)
          : monitoringCalendar(savedDate, state.days);
        const count = alias === '@checkerWindowCount';
        let countStatus = '';
        if (count) {
          expect(state.pendingCounts.length, 'native event issued a real count consultation').to.be.greaterThan(0);
          countStatus = state.pendingCounts.shift()!;
        } else {
          expect(state.pendingLists, 'native event issued a fresh list consultation').to.be.greaterThan(0);
          state.pendingLists--;
        }
        const query = {
          business_unit_id: '44',
          not_submitted_by: options.wrongScope ? 'wrong' : owned.checkerId,
          casefile_status: count ? countStatus : statuses[tabs.indexOf(state.tab)],
          ...(count ? { restrict: 'counts' } : {}),
          ...(!count && state.tab === 'deleted'
            ? { casefile_status_from_date: options.badDate ? '1900-01-01' : cal.from, casefile_status_to_date: cal.to }
            : {}),
        };
        const body = count
          ? { count: options.nonzeroBrowserCount ? 1 : 0 }
          : { count: selectedRows().length, summaries: selectedRows() };
        observe({ query, continue: (callback) => callback({ statusCode: 200, body }) });
        return { response: { statusCode: 200, body } };
      }),
    );
    cy.spy(cy, 'clock').log(false); // The real clock remains active; its Date-only arguments are asserted below.
    cy.stub(accessibilityActions, 'checkAccessibilityOnly').callsFake(() => {
      cy.then(() => {
        state.scans.push(`${state.days}:${state.tab}:${state.page}`);
        if (options.scanFailure) throw new Error('Controlled strict checker scanner failure');
      });
    });
    return state;
  }

  for (const status of ['REJECTED', 'DELETED'] as const) {
    it(
      `AC6, AC7. should observe all four ${status} days through real native tabs and pagination`,
      { tags: buildTags() },
      () => {
        const state = controlled(status);
        const actions = new CheckerDashboardWindowActions();
        actions.enableAccessibility();
        actions.prepare(status);
        for (const days of [0, 3, 7, 8]) actions.consultDay(days);
        actions.assertWindow(status === 'REJECTED' ? 'unbounded' : 'seven-day');
        cy.then(() => {
          expect(state.events).to.deep.equal(['create']);
          for (const days of [0, 3, 7, 8]) {
            expect(state.scans).to.include(`${days}:to-review:1`);
            expect(state.scans).to.include(`${days}:${status.toLowerCase()}:1`);
            if (status === 'REJECTED' || days <= 7) expect(state.scans).to.include(`${days}:${status.toLowerCase()}:2`);
          }
          const calls = (cy.clock as unknown as sinon.SinonSpy).getCalls().filter((call) => call.args.length);
          expect(calls.map((call) => call.args[1])).to.deep.equal([['Date'], ['Date'], ['Date'], ['Date']]);
          cy.window().then((window) => expect(window.Date, 'original AUT Date restored').to.equal(state.originalDate));
        });
      },
    );
  }

  for (const fault of ['hidden', 'wrongScope', 'badDate', 'scanFailure'] as const) {
    it(
      `AC6, AC7. should fail actual caller observation for ${fault}`,
      { tags: buildTags(), defaultCommandTimeout: 100 },
      () => {
        const state = controlled('DELETED', { [fault]: true });
        mustFail(
          {
            hidden: 'visible',
            wrongScope: 'exact checker query',
            badDate: 'exact checker query',
            scanFailure: 'Controlled strict checker scanner failure',
          }[fault],
          () => {
            if (fault === 'scanFailure') expect(state.page, 'no page transition after failed strict scan').to.equal(1);
          },
        );
        const actions = new CheckerDashboardWindowActions();
        actions.enableAccessibility();
        actions.prepare('DELETED');
        actions.consultDay(0);
      },
    );
  }

  it(
    'AC6. should read all four real empty baselines and two counts without any creation',
    { tags: buildTags() },
    () => {
      const state = controlled('REJECTED');
      const actions = new CheckerDashboardWindowActions();
      actions.prepareEmpty();
      cy.then(() => {
        expect(state.events, 'no fixture creation needed').to.deep.equal([]);
        const collections = state.requests.filter(
          (request) => request.url === '/opal-maintenance-service/draft-casefiles',
        );
        expect(collections).to.have.length(6);
        expect(
          collections
            .filter((request) => !(request.qs as Record<string, unknown>)['restrict'])
            .map((request) => (request.qs as Record<string, unknown>)['casefile_status']),
        ).to.deep.equal(statuses);
        expect(
          collections
            .filter((request) => (request.qs as Record<string, unknown>)['restrict'])
            .map((request) => (request.qs as Record<string, unknown>)['casefile_status']),
        ).to.deep.equal(['REJECTED', 'PUBLISHING_FAILED']);
      });
    },
  );

  for (const fault of ['emptyCount', 'emptyRows'] as const) {
    it(`AC6. should stop genuine-empty preflight for contradictory ${fault}`, { tags: buildTags() }, () => {
      controlled('REJECTED', fault === 'emptyCount' ? { emptyCount: 1 } : { emptyRows: true });
      mustFail(fault === 'emptyCount' ? 'genuinely empty checker count' : 'genuinely empty checker collection');
      new CheckerDashboardWindowActions().prepareEmpty();
    });
  }
  it(
    'AC6, AC7. should scan native routed entry and every genuinely empty tab with heading then tab focus',
    { tags: buildTags() },
    () => {
      const state = controlled('REJECTED', { empty: true });
      const actions = new CheckerDashboardWindowActions();
      actions.enableAccessibility();
      actions.prepareEmpty();
      actions.open();
      cy.get(S.heading).should('be.focused');
      actions.consultEmpty();
      actions.assertEmpty();
      cy.then(() => {
        for (const tab of tabs) expect(state.scans).to.include(`0:${tab}:1`);
        expect(state.events).to.deep.equal([]);
      });
      cy.get(S.tab('failed')).should('be.focused');
    },
  );

  for (const fault of ['entryTabFocus', 'consultedHeadingFocus', 'nonzeroBrowserCount'] as const) {
    it(`AC6, AC7. should reject empty dashboard ${fault}`, { tags: buildTags(), defaultCommandTimeout: 100 }, () => {
      controlled('REJECTED', { empty: true, [fault]: true });
      mustFail(fault === 'nonzeroBrowserCount' ? 'actual zero rejected count' : 'focused');
      const actions = new CheckerDashboardWindowActions();
      actions.enableAccessibility();
      actions.prepareEmpty();
      actions.open();
      actions.consultEmpty();
      actions.assertEmpty();
    });
  }
});
