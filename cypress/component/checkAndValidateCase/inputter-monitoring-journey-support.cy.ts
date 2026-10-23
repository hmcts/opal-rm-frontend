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

  beforeEach(() => {
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
