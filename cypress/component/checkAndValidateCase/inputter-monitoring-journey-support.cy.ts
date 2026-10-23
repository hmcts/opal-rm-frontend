import { InputterCasefileMonitoringFlow } from '../../e2e/functional/opal/flows/checkAndValidateCase/inputter-casefile-monitoring.flow';
import { InputterMonitoringFixtureActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/inputter-monitoring-fixture.actions';
import { createOwnedSubmittedDraft } from '../../e2e/functional/opal/actions/checkAndValidateCase/draft-casefile-fixture.actions';
import {
  INPUTTER_USER,
  inputterRows,
} from '../../e2e/functional/opal/mocks/createDraftCasefile/inputter-dashboard.mock';
import { CasesDraftSelectors as S } from '../../shared/selectors/cases-draft.selectors';
import { CASES_DRAFT_ROUTING_PATHS as PATHS } from '../../../src/app/flows/cases/cases-draft/routing/constants/cases-draft-routing-paths.constant';
import { InputterCasefileMonitoringActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/inputter-casefile-monitoring.actions';
import { accessibilityActions } from '../../e2e/functional/opal/actions/accessibility/accessibility.actions';
import { monitoringCalendar } from '../../e2e/functional/opal/actions/checkAndValidateCase/inputter-monitoring-date';
import { assertMonitoringAccounts } from '../../e2e/functional/opal/actions/checkAndValidateCase/inputter-monitoring-publication';
import { createPersistedCasefileDetail } from '../../../src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import type { IDraftCasefileSnapshot } from '../../e2e/functional/opal/actions/checkAndValidateCase/interfaces/draft-casefile-snapshot.interface';

const buildTags = (): string[] => ['@JIRA-STORY:PO-10628', '@JIRA-EPIC:PO-10817'];

describe('PO-10628 monitoring journey assertions (controlled support only)', { retries: 0 }, () => {
  let expectedFailure = false;
  let observedFailure = false;
  let originalEnvironment: Record<string, unknown>;
  const environmentKeys = ['PO10626_INPUTTER_EMAIL', 'PO10626_CHECKER_EMAIL', 'PO10628_SECOND_INPUTTER_EMAIL'];

  beforeEach(() => {
    originalEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, Cypress.env(key)]));
    expectedFailure = false;
    observedFailure = false;
    cy.then(() =>
      Cypress.automation('remote:debugger:protocol', {
        command: 'Emulation.setTimezoneOverride',
        params: { timezoneId: 'Europe/London' },
      }),
    );
  });

  afterEach(() => {
    Cypress.env(originalEnvironment);
    if (expectedFailure) expect(observedFailure, 'required assertion failure observed').to.equal(true);
    cy.then(() =>
      Cypress.automation('remote:debugger:protocol', {
        command: 'Emulation.setTimezoneOverride',
        params: { timezoneId: '' },
      }),
    );
  });

  // These literal calendar expectations are independent examples, not calls to the production date mapper.
  for (const sample of [
    {
      label: 'spring DST',
      timestamp: '2026-03-22T12:00:00Z',
      from: '2026-03-22',
      to: '2026-03-29',
      now: '2026-03-29T11:00:00.000Z',
    },
    {
      label: 'autumn DST',
      timestamp: '2026-10-18T11:00:00Z',
      from: '2026-10-18',
      to: '2026-10-25',
      now: '2026-10-25T12:00:00.000Z',
    },
    {
      label: 'month end',
      timestamp: '2026-01-25T12:00:00Z',
      from: '2026-01-25',
      to: '2026-02-01',
      now: '2026-02-01T12:00:00.000Z',
    },
    {
      label: 'year end',
      timestamp: '2026-12-25T12:00:00Z',
      from: '2026-12-25',
      to: '2027-01-01',
      now: '2027-01-01T12:00:00.000Z',
    },
    {
      label: 'leap day',
      timestamp: '2028-02-22T12:00:00Z',
      from: '2028-02-22',
      to: '2028-02-29',
      now: '2028-02-29T12:00:00.000Z',
    },
  ]) {
    it(`AC1. should preserve calendar days across ${sample.label}`, { tags: buildTags() }, () => {
      const calendar = monitoringCalendar(sample.timestamp, 7);
      expect(calendar.from).to.equal(sample.from);
      expect(calendar.to).to.equal(sample.to);
      expect(new Date(calendar.now).toISOString()).to.equal(sample.now);
    });
  }

  it('AC1. should use the local lifecycle date and compute the D+8 exclusion range', { tags: buildTags() }, () => {
    const calendar = monitoringCalendar('2026-03-21T23:30:00-02:00', 8);
    expect(calendar.from).to.equal('2026-03-23');
    expect(calendar.to).to.equal('2026-03-30');
    expect(new Date(calendar.now).toISOString()).to.equal('2026-03-30T11:00:00.000Z');
    expect(() => monitoringCalendar('missing-date', 7)).to.throw('actual valid lifecycle timestamp');
  });

  function snapshot(pending = false): IDraftCasefileSnapshot {
    const draft = createPersistedCasefileDetail();
    draft.casefile_status = pending ? 'PUBLISHING_PENDING' : 'PUBLISHED';
    draft.casefile_snapshot.respondent_account.account_id = pending ? null : 101;
    draft.casefile_snapshot.respondent_account.account_number = pending ? null : 'RESP-101';
    draft.casefile_snapshot.applicant_account.account_id = pending ? null : 201;
    draft.casefile_snapshot.applicant_account.account_number = pending ? null : 'APP-201';
    // Wire order is deliberately reversed: rendered creditor order must follow persisted sequences.
    draft.casefile_snapshot.minor_creditor_accounts = [2, 1].map((creditor_sequence) => ({
      creditor_sequence,
      account_id: pending ? null : 300 + creditor_sequence,
      account_number: pending ? null : `MINOR-${creditor_sequence}`,
      name: 'Synthetic Minor',
    }));
    return { draft, etag: '"1"' };
  }

  function render(
    respondent = 'RESP-101',
    applicant = 'APP-201',
    minors = '<ul><li>MINOR-1</li><li>MINOR-2</li></ul>',
  ): void {
    cy.document().then((document) => {
      document.body.innerHTML = `<table><tbody><tr data-draft-id="17"><td data-column="respondentAccount">${respondent}</td><td data-column="applicantAccount">${applicant}</td><td data-column="minorCreditorAccounts">${minors}</td></tr></tbody></table>`;
    });
  }

  function expectDomFailure(message: string): void {
    expectedFailure = true;
    cy.once('fail', (error) => {
      if (!error.message.includes(message)) throw error;
      observedFailure = true;
      return false;
    });
  }

  it(
    'AC4. should accept every exact published number in creditor sequence as read-only text',
    { tags: buildTags() },
    () => {
      render();
      cy.then(() => assertMonitoringAccounts(snapshot(), false));
    },
  );

  it('AC4. should accept a visible pending row only when every ID and number is null', { tags: buildTags() }, () => {
    render('—', '—', '—');
    cy.then(() => assertMonitoringAccounts(snapshot(true), true));
  });

  it(
    'AC4. should reject pending as completed publication and incomplete generated accounts',
    { tags: buildTags() },
    () => {
      expect(() => assertMonitoringAccounts(snapshot(true), false)).to.throw();
      const incomplete = snapshot();
      incomplete.draft.casefile_snapshot['respondent_account'] = {
        account_id: 101,
        account_number: null,
        respondent_name: 'Synthetic',
      };
      expect(() => assertMonitoringAccounts(incomplete, false)).to.throw();
      const pendingNumber = snapshot(true);
      pendingNumber.draft.casefile_snapshot['applicant_account'] = {
        account_id: null,
        account_number: 'UNEXPECTED',
        applicant_name: 'Synthetic',
      };
      expect(() => assertMonitoringAccounts(pendingNumber, true)).to.throw();
    },
  );

  for (const invalid of [
    {
      label: 'a missing respondent number',
      respondent: '—',
      minors: '<ul><li>MINOR-1</li><li>MINOR-2</li></ul>',
      message: 'RESP-101',
    },
    {
      label: 'an extra creditor number',
      respondent: 'RESP-101',
      minors: '<ul><li>MINOR-1</li><li>MINOR-2</li><li>EXTRA</li></ul>',
      message: 'all saved creditors in sequence',
    },
    {
      label: 'reversed creditor numbers',
      respondent: 'RESP-101',
      minors: '<ul><li>MINOR-2</li><li>MINOR-1</li></ul>',
      message: 'all saved creditors in sequence',
    },
    {
      label: 'interactive account links',
      respondent: '<a href="#account">RESP-101</a>',
      minors: '<ul><li>MINOR-1</li><li>MINOR-2</li></ul>',
      message: 'not to exist',
    },
  ]) {
    it(`AC4. should reject ${invalid.label}`, { tags: buildTags(), defaultCommandTimeout: 100 }, () => {
      render(invalid.respondent, 'APP-201', invalid.minors);
      expectDomFailure(invalid.message);
      cy.then(() => assertMonitoringAccounts(snapshot(), false));
    });
  }

  it(
    'AC4. should reject any number exposed in the pending DOM',
    { tags: buildTags(), defaultCommandTimeout: 100 },
    () => {
      render('RESP-101', '—', '—');
      expectDomFailure('—');
      cy.then(() => assertMonitoringAccounts(snapshot(true), true));
    },
  );

  // Controlled command boundaries: the real action validates observed queries/counts and synthetic DOM.
  // No HTTP request, authentication callback or live dashboard is executed by this harness.
  function controlledDashboard(
    countBody: unknown,
    badge: string | null,
    focus: { entry?: 'heading' | 'tab'; consultation?: 'tab' | 'heading' } = {},
  ): void {
    const dashboardPath = '/' + PATHS.root + '/' + PATHS.children.tabs;
    let selectedTab = 'in-review';
    type ObservedRequest = {
      query: Record<string, string>;
      continue: (callback: (response: { statusCode: number; body: unknown }) => void) => void;
    };
    let observe: (request: ObservedRequest) => void;
    cy.stub(cy, 'intercept').callsFake((...args: unknown[]) => {
      if (args[0] === 'GET') observe = args[2] as typeof observe;
      return cy.wrap(null, { log: false });
    });
    cy.stub(cy, 'visit').callsFake((url: string) => {
      expect(url).to.equal(dashboardPath + '#in-review');
      return cy.document().then((document) => {
        document.body.innerHTML = `<h1 id="cases-draft-heading" tabindex="-1">Create cases</h1><a href="#in-review" id="cases-draft-in-review-tab" aria-current="page">In review</a><a href="#rejected" id="cases-draft-rejected-tab">Rejected</a><p id="cases-draft-empty">No cases</p>${badge === null ? '' : `<span id="cases-draft-rejected-count">${badge}</span>`}`;
        const initialFocus = focus.entry === 'tab' ? S.tab('in-review') : S.heading;
        document.querySelector<HTMLElement>(initialFocus)!.focus();
        document.querySelector(S.tab('rejected'))!.addEventListener('click', (event) => {
          event.preventDefault();
          selectedTab = 'rejected';
          document.querySelector(S.tab('in-review'))!.removeAttribute('aria-current');
          document.querySelector(S.tab('rejected'))!.setAttribute('aria-current', 'page');
          if (focus.consultation === 'heading') document.querySelector<HTMLElement>(S.heading)!.focus();
        });
      });
    });
    cy.stub(cy, 'location').callsFake((property: string) =>
      cy.then(() => {
        const location: Record<string, string> = { pathname: dashboardPath, hash: '#' + selectedTab, search: '' };
        expect(location).to.have.property(property);
        return location[property];
      }),
    );
    cy.stub(cy, 'wait').callsFake((alias: string) =>
      cy.then(() => {
        expect(alias).to.be.oneOf(['@monitoringList', '@monitoringCount']);
        const count = alias === '@monitoringCount';
        const body = count ? countBody : { count: 0, summaries: [] };
        observe({
          query: {
            business_unit_id: '44',
            submitted_by: 'synthetic-selected-id',
            casefile_status: count || selectedTab === 'rejected' ? 'REJECTED' : 'SUBMITTED,RESUBMITTED',
            ...(count ? { restrict: 'counts' } : {}),
          },
          continue: (callback) => callback({ statusCode: 200, body }),
        });
        return { response: { body } };
      }),
    );
  }

  it('AC1, AC6. should require heading focus after initial routed monitoring entry', { tags: buildTags() }, () => {
    controlledDashboard({ count: 0 }, null);
    const actions = new InputterCasefileMonitoringActions();
    actions.observe('synthetic-selected-id');
    actions.open('in-review');
    cy.get(S.heading).should('be.focused');
    cy.get(S.tab('in-review')).should('not.be.focused');
  });

  it(
    'AC1, AC6. should reject tab focus instead of heading focus on initial entry',
    { tags: buildTags(), defaultCommandTimeout: 100 },
    () => {
      controlledDashboard({ count: 0 }, null, { entry: 'tab' });
      expectDomFailure('focused');
      const actions = new InputterCasefileMonitoringActions();
      actions.observe('synthetic-selected-id');
      actions.open('in-review');
    },
  );

  it('AC1, AC6. should retain selected tab focus after native keyboard consultation', { tags: buildTags() }, () => {
    controlledDashboard({ count: 0 }, null);
    const actions = new InputterCasefileMonitoringActions();
    actions.observe('synthetic-selected-id');
    actions.open('in-review');
    actions.consult('rejected');
    cy.get(S.tab('rejected')).should('be.focused').and('have.attr', 'aria-current', 'page');
    cy.get(S.heading).should('not.be.focused');
  });

  it(
    'AC1, AC6. should reject heading focus stolen from the consulted keyboard tab',
    { tags: buildTags(), defaultCommandTimeout: 100 },
    () => {
      controlledDashboard({ count: 0 }, null, { consultation: 'heading' });
      expectDomFailure('focused');
      const actions = new InputterCasefileMonitoringActions();
      actions.observe('synthetic-selected-id');
      actions.open('in-review');
      actions.consult('rejected');
    },
  );

  for (const sample of [
    { count: 0, badge: null, wrong: '0', failure: 'not to exist' },
    { count: 1, badge: '1', wrong: '99+', failure: "to equal '1'" },
    { count: 99, badge: '99', wrong: '100', failure: "to equal '99'" },
    { count: 100, badge: '99+', wrong: '100', failure: "to equal '99+'" },
  ]) {
    it(`AC1. should accept the rejected badge presentation for count ${sample.count}`, { tags: buildTags() }, () => {
      controlledDashboard({ count: sample.count }, sample.badge);
      const actions = new InputterCasefileMonitoringActions();
      actions.observe('synthetic-selected-id');
      actions.open('in-review');
    });

    it(
      `AC1. should reject incorrect badge text for count ${sample.count}`,
      { tags: buildTags(), defaultCommandTimeout: 100 },
      () => {
        controlledDashboard({ count: sample.count }, sample.wrong);
        expectDomFailure(sample.failure);
        const actions = new InputterCasefileMonitoringActions();
        actions.observe('synthetic-selected-id');
        actions.open('in-review');
      },
    );
  }

  for (const sample of [
    { label: 'an invalid API count', body: { count: -1 }, failure: 'Invalid draft casefile count response' },
    { label: 'rows in a counts-only response', body: { count: 100, summaries: [] }, failure: 'counts-only privacy' },
  ]) {
    it(`AC1. should still reject ${sample.label} before accepting a capped badge`, { tags: buildTags() }, () => {
      controlledDashboard(sample.body, '99+');
      expectDomFailure(sample.failure);
      const actions = new InputterCasefileMonitoringActions();
      actions.observe('synthetic-selected-id');
      actions.open('in-review');
    });
  }

  const defaultPrimary = 'opal-test@dev.platform.hmcts.net';
  const overridePrimary = 'synthetic-override';

  function controlledPersonalBaseline(populatedActor?: string): { events: string[]; calls: Cypress.RequestOptions[] } {
    const events: string[] = [];
    const calls: Cypress.RequestOptions[] = [];
    let actor = defaultPrimary; // The feature Background's session must not decide the primary identity.
    Cypress.env('PO10626_CHECKER_EMAIL', 'synthetic-checker');
    Cypress.env('PO10628_SECOND_INPUTTER_EMAIL', 'synthetic-second');
    cy.document().then((document) => {
      document.body.innerHTML =
        '<nav aria-label="Account navigation"><a class="moj-header__navigation-link">Sign out</a></nav>';
    });
    cy.stub(cy, 'session').callsFake((identity: string) =>
      cy.then(() => {
        actor = identity;
        events.push(`authenticate:${identity}`);
      }),
    );
    cy.stub(cy, 'visit').callsFake(() => cy.wrap(null, { log: false }));
    cy.stub(cy, 'request').callsFake((request: Cypress.RequestOptions) =>
      cy.then(() => {
        calls.push(request);
        if (request.url === '/api/user-state') {
          events.push(`membership:${actor}`);
          const user = structuredClone(INPUTTER_USER);
          const membership = user.domains['maintenance']!.business_unit_users[0];
          membership.business_unit_user_id = `${actor}-BU44`;
          membership.permissions[0].permission_id = actor === 'synthetic-checker' ? 22 : 21;
          return { status: 200, body: user, headers: {} };
        }
        expect(request.method ?? 'GET', 'no baseline mutation').to.equal('GET');
        if (request.url === '/opal-maintenance-service/countries')
          throw new Error('Controlled fixture reference boundary');
        expect(request.url).to.equal('/opal-maintenance-service/draft-casefiles');
        expect(request.qs).to.have.property('business_unit_id', 44);
        expect(request.qs).to.have.property('submitted_by', `${actor}-BU44`);
        const query = request.qs as Record<string, unknown>;
        events.push(`list:${actor}:${query['casefile_status']}`);
        const summaries = actor === populatedActor ? inputterRows('rejected', 1) : [];
        return { status: 200, body: { count: summaries.length, summaries }, headers: {} };
      }),
    );
    return { events, calls };
  }

  const baselinePaths = [
    {
      label: 'empty personal rejection',
      prepare: (flow: InputterCasefileMonitoringFlow) => flow.prepareRejections('empty'),
    },
    {
      label: 'populated personal rejection',
      prepare: (flow: InputterCasefileMonitoringFlow) => flow.prepareRejections('populated'),
    },
    { label: 'pagination', prepare: (flow: InputterCasefileMonitoringFlow) => flow.preparePagination() },
  ];

  for (const configuredPrimary of [undefined, overridePrimary]) {
    for (const path of baselinePaths) {
      it(
        `AC2, AC3. should authenticate the ${configuredPrimary ? 'overridden' : 'default'} primary before ${path.label} baseline and creation`,
        { tags: buildTags() },
        () => {
          Cypress.env('PO10626_INPUTTER_EMAIL', configuredPrimary);
          const selected = configuredPrimary ?? defaultPrimary;
          const { events, calls } = controlledPersonalBaseline(configuredPrimary ? defaultPrimary : undefined);
          // End at the first creation dispatch, after the real baseline. Do not fabricate a successful fixture.
          cy.stub(InputterMonitoringFixtureActions.prototype, 'create').callsFake(() =>
            cy.then(() => {
              events.push('create');
              throw new Error('Controlled first creation boundary');
            }),
          );
          expectedFailure = true;
          cy.once('fail', (error) => {
            if (!error.message.includes('Controlled first creation boundary')) throw error;
            observedFailure = true;
            expect(events).to.deep.equal([
              `authenticate:${selected}`,
              `membership:${selected}`,
              `list:${selected}:REJECTED`,
              'create',
            ]);
            expect(calls).to.have.length(2);
            expect(calls[1].qs).to.deep.equal({
              business_unit_id: 44,
              submitted_by: `${selected}-BU44`,
              casefile_status: 'REJECTED',
            });
            return false;
          });
          path.prepare(new InputterCasefileMonitoringFlow());
        },
      );
    }
  }

  for (const path of [
    ...baselinePaths,
    { label: 'empty dashboard', prepare: (flow: InputterCasefileMonitoringFlow) => flow.prepareEmpty() },
  ]) {
    it(
      `AC2, AC3, AC6. should stop ${path.label} before POST or PATCH when only the overridden primary has existing work`,
      { tags: buildTags() },
      () => {
        Cypress.env('PO10626_INPUTTER_EMAIL', overridePrimary);
        const { events, calls } = controlledPersonalBaseline(overridePrimary);
        expectedFailure = true;
        cy.once('fail', (error) => {
          const message =
            path.label === 'empty dashboard'
              ? 'genuinely empty personal baseline'
              : 'personal rejected collection must be genuinely empty';
          if (!error.message.includes(message)) throw error;
          observedFailure = true;
          expect(events.slice(0, 2)).to.deep.equal([
            `authenticate:${overridePrimary}`,
            `membership:${overridePrimary}`,
          ]);
          expect(events).to.have.length(3);
          expect(calls).to.have.length(2);
          expect(calls[1].qs).to.have.property('submitted_by', `${overridePrimary}-BU44`);
          expect(calls.filter(({ method }) => method === 'POST' || method === 'PATCH')).to.have.length(0);
          return false;
        });
        // Retain the real fixture create path: a failed preflight must prevent its queued mutations.
        path.prepare(new InputterCasefileMonitoringFlow());
      },
    );
  }

  for (const configuredPrimary of [undefined, overridePrimary]) {
    it(
      `AC6. should inspect all empty dashboard baselines as the ${configuredPrimary ? 'overridden' : 'default'} primary without creating work`,
      { tags: buildTags() },
      () => {
        Cypress.env('PO10626_INPUTTER_EMAIL', configuredPrimary);
        const selected = configuredPrimary ?? defaultPrimary;
        const { events, calls } = controlledPersonalBaseline(configuredPrimary ? defaultPrimary : undefined);
        const observed = cy.stub(InputterCasefileMonitoringActions.prototype, 'observe');
        const opened = cy.stub(InputterCasefileMonitoringActions.prototype, 'open');
        const create = cy.spy(InputterMonitoringFixtureActions.prototype, 'create');
        new InputterCasefileMonitoringFlow().prepareEmpty();
        cy.then(() => {
          expect(events).to.deep.equal([
            `authenticate:${selected}`,
            `membership:${selected}`,
            ...['SUBMITTED,RESUBMITTED', 'REJECTED', 'PUBLISHING_PENDING,PUBLISHED', 'DELETED'].map(
              (status) => `list:${selected}:${status}`,
            ),
          ]);
          expect(calls).to.have.length(5);
          expect(create).not.to.have.been.called;
          expect(observed).to.have.been.calledOnceWithExactly(`${selected}-BU44`);
          expect(opened).to.have.been.calledOnceWithExactly('in-review');
        });
      },
    );

    it(
      `AC1. should preserve the shared fixture consumer's ${configuredPrimary ? 'overridden' : 'default'} primary selection`,
      { tags: buildTags() },
      () => {
        Cypress.env('PO10626_INPUTTER_EMAIL', configuredPrimary);
        const selected = configuredPrimary ?? defaultPrimary;
        const { events, calls } = controlledPersonalBaseline();
        // Reach the maintained fixture's authenticated reference read; stop before any POST/receipt.
        expectedFailure = true;
        cy.once('fail', (error) => {
          if (!error.message.includes('Controlled fixture reference boundary')) throw error;
          observedFailure = true;
          expect(events).to.deep.equal([
            'authenticate:synthetic-checker',
            'membership:synthetic-checker',
            `authenticate:${selected}`,
            `membership:${selected}`,
          ]);
          expect(calls[2].url).to.equal('/opal-maintenance-service/countries');
          expect(calls.every(({ method }) => !method || method === 'GET')).to.equal(true);
          return false;
        });
        createOwnedSubmittedDraft();
      },
    );
  }

  // Dispatch tests only: synthetic DOM exposes real native pagination/sort events; scanner calls are observed.
  // They prove every visited state reaches the maintained strict scanner, not live UI accessibility acceptance.
  function controlledRejectedTable(): { page: number; sort: string } {
    const state = { page: 1, sort: 'none' };
    cy.document().then((document) => {
      const renderTable = () => {
        const links = [1, 2, 3]
          .map(
            (page) =>
              `<a href="#page-${page}" aria-label="Page ${page}" ${page === state.page ? 'aria-current="page"' : ''}>${page}</a>`,
          )
          .join('');
        const previous = state.page > 1 ? '<a href="#previous" rel="prev">Previous</a>' : '';
        const next = state.page < 3 ? '<a href="#next" rel="next">Next</a>' : '';
        document.body.innerHTML = `<app-cases-draft-table><table><thead><tr><th columnKey="applicant" aria-sort="${state.sort}"><button>Applicant</button></th></tr></thead><tbody><tr data-draft-id="${100 + state.page}"><td>Owned synthetic row</td></tr></tbody></table></app-cases-draft-table><nav id="cases-draft-pagination">${previous}${links}${next}</nav>`;
        document.querySelector('button')!.addEventListener('click', () => {
          state.sort = state.sort === 'ascending' ? 'descending' : 'ascending';
          state.page = 1;
          renderTable();
          (document.querySelector('button') as HTMLButtonElement).focus();
        });
        document.querySelector('[rel="next"]')?.addEventListener('click', (event) => {
          event.preventDefault();
          state.page++;
          renderTable();
        });
        document.querySelector('[rel="prev"]')?.addEventListener('click', (event) => {
          event.preventDefault();
          state.page--;
          renderTable();
        });
      };
      renderTable();
    });
    return state;
  }

  it(
    'AC6. should scan the initial and every intermediate All rejected page before leaving it',
    { tags: buildTags() },
    () => {
      const state = controlledRejectedTable();
      const scans: string[] = [];
      cy.stub(accessibilityActions, 'checkAccessibilityOnly').callsFake(() => {
        cy.then(() => {
          scans.push(`${state.sort}:${state.page}`);
        });
      });
      new InputterCasefileMonitoringActions().expectRows([], [], true);
      cy.then(() => {
        expect(scans).to.deep.equal(['none:1', 'none:2', 'none:3']);
        expect(state.page).to.equal(3);
      });
    },
  );

  it('AC6. should scan both sort states and every search page before amendment entry', { tags: buildTags() }, () => {
    const state = controlledRejectedTable();
    const scans: string[] = [];
    cy.stub(accessibilityActions, 'checkAccessibilityOnly').callsFake(() => {
      cy.then(() => {
        scans.push(`${state.sort}:${state.page}`);
      });
    });
    new InputterCasefileMonitoringActions().locateRejected(103, true);
    cy.then(() => expect(scans).to.deep.equal(['ascending:1', 'descending:1', 'descending:2', 'descending:3']));
    cy.get('[data-draft-id="103"]').should('be.visible');
  });

  it('AC6. should keep functional-only traversal independent of accessibility scanning', { tags: buildTags() }, () => {
    controlledRejectedTable();
    const scanner = cy.stub(accessibilityActions, 'checkAccessibilityOnly');
    const actions = new InputterCasefileMonitoringActions();
    actions.expectRows([]);
    actions.locateRejected(103);
    cy.get('[data-draft-id="103"]').should('be.visible');
    cy.then(() => expect(scanner).not.to.have.been.called);
  });

  it('AC6. should stop traversal immediately when the maintained scanner fails', { tags: buildTags() }, () => {
    const state = controlledRejectedTable();
    expectedFailure = true;
    cy.once('fail', (error) => {
      if (!error.message.includes('Controlled strict scanner failure')) throw error;
      observedFailure = true;
      expect(state.page, 'no page transition after failed scan').to.equal(1);
      return false;
    });
    cy.stub(accessibilityActions, 'checkAccessibilityOnly').callsFake(() => {
      cy.then(() => {
        throw new Error('Controlled strict scanner failure');
      });
    });
    new InputterCasefileMonitoringActions().expectRows([], [], true);
  });
});
