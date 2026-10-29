import { buildSyntheticDraftRequest } from '../../e2e/functional/opal/actions/checkAndValidateCase/draft-casefile-payload';
import { DRAFT_CASEFILE_RECOVERY_REQUEST } from '../../e2e/functional/opal/actions/checkAndValidateCase/mocks/draft-casefile-request.mock';

import { InputterMonitoringFixtureActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/inputter-monitoring-fixture.actions';
import { createPersistedCasefileDetail } from '../../../src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import type { IOpalMaintenanceDraftCasefileRequest } from '../../../src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';
import type { IOwnedDraftCasefile } from '../../e2e/functional/opal/actions/checkAndValidateCase/interfaces/draft-casefile-owned.interface';

const buildTags = (): string[] => ['@JIRA-STORY:PO-10628', '@JIRA-EPIC:PO-10817'];

describe('PO-10628 owned monitoring fixture support', () => {
  const marker = 'E2E-0123456789abcdef';
  let expectedFailure = false;
  let observedFailure = false;
  let originalEnvironment: Record<string, unknown>;
  const environmentKeys = [
    'PO10626_INPUTTER_EMAIL',
    'PO10626_CHECKER_EMAIL',
    'PO10628_SECOND_INPUTTER_EMAIL',
    'draftCasefileCleanupReceipts',
  ];

  beforeEach(() => {
    originalEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, Cypress.env(key)]));
    Cypress.env('PO10626_INPUTTER_EMAIL', 'synthetic-inputter');
    Cypress.env('PO10626_CHECKER_EMAIL', 'synthetic-checker');
    Cypress.env('draftCasefileCleanupReceipts', []);
    expectedFailure = false;
    observedFailure = false;
  });

  afterEach(() => {
    try {
      if (expectedFailure) expect(observedFailure, 'expected support failure observed').to.equal(true);
    } finally {
      Cypress.env(originalEnvironment);
    }
  });

  function expectFailure(message: string, verify: () => void): void {
    expectedFailure = true;
    cy.once('fail', (error) => {
      if (!error.message.includes(message)) throw error;
      observedFailure = true;
      verify();
      return false;
    });
  }

  // Controlled support boundaries only; these responses never count as live journey evidence.
  function controlledRuntime(
    options: {
      patchStatus?: number;
      published?: boolean;
      publicationFailure?: boolean;
      incompleteAccounts?: boolean;
      pendingReads?: number;
      rejectedCount?: number;
      duplicateInputter?: boolean;
      accountStatus?: string;
      permission?: number;
    } = {},
    events: string[] = [],
  ): Cypress.RequestOptions[] {
    const calls: Cypress.RequestOptions[] = [];
    let actor = 'synthetic-inputter';
    let version = 1;
    let pendingReads = options.pendingReads ?? 0;
    const detail = createPersistedCasefileDetail();
    detail.draft_casefile_id = 101;
    detail.submitted_by = 'synthetic-inputter-id';
    cy.document().then((document) => {
      document.body.innerHTML =
        '<nav aria-label="Account navigation"><a class="moj-header__navigation-link">Sign out</a></nav>';
    });
    cy.stub(cy, 'session').callsFake((identity: string) =>
      cy.then(() => {
        actor = identity;
        events.push(`session:${identity}`);
      }),
    );
    cy.stub(cy, 'visit').callsFake(() => cy.wrap(null, { log: false }));
    cy.stub(cy, 'writeFile').callsFake(() => cy.wrap(null, { log: false }));
    cy.stub(cy, 'request').callsFake((request: Cypress.RequestOptions) =>
      cy.then(() => {
        calls.push(request);
        if (request.url === '/api/user-state') {
          const checker = actor === 'synthetic-checker';
          return {
            status: 200,
            body: {
              status: options.accountStatus ?? 'ACTIVE',
              name: 'Synthetic User',
              domains: {
                maintenance: {
                  business_unit_users: [
                    {
                      business_unit_id: 44,
                      business_unit_user_id:
                        options.duplicateInputter && !checker ? 'synthetic-inputter-id' : `${actor}-id`,
                      permissions: [{ permission_id: options.permission ?? (checker ? 22 : 21) }],
                    },
                  ],
                },
              },
            },
            headers: {},
          };
        }
        if (request.method === 'POST') {
          events.push(`POST:${actor}`);
          expect(request.url).to.equal('/opal-maintenance-service/draft-casefiles');
          const payload = request.body as IOpalMaintenanceDraftCasefileRequest;
          detail.casefile = structuredClone(payload.casefile);
          detail.submitted_by = `${actor}-id`;
          detail.casefile_snapshot.minor_creditor_accounts = (payload.casefile.minor_creditors ?? []).map(
            ({ creditor_sequence }) => ({
              creditor_sequence,
              account_id: null,
              account_number: null,
              name: 'Synthetic Minor',
            }),
          );
          return {
            status: 201,
            body: { draft_casefile_id: 101, casefile_status: 'SUBMITTED' },
            headers: { etag: '"1"' },
          };
        }
        if (request.method === 'PATCH') {
          events.push(`PATCH:${actor}:${(request.headers as Record<string, unknown> | undefined)?.['If-Match']}`);
          expect(request.url).to.equal('/opal-maintenance-service/draft-casefiles/101');
          expect(request.headers).to.have.property('If-Match', `"${version}"`);
          if (options.patchStatus) return { status: options.patchStatus, body: {}, headers: {} };
          const body = request.body as { casefile_status: typeof detail.casefile_status; status_message?: string };
          expect(actor, 'independent checker for every lifecycle decision').to.equal('synthetic-checker');
          detail.casefile_status = options.publicationFailure
            ? 'PUBLISHING_FAILED'
            : options.published
              ? 'PUBLISHED'
              : body.casefile_status;
          version++;
          if (options.published) {
            const accounts = [
              detail.casefile_snapshot.respondent_account,
              detail.casefile_snapshot.applicant_account,
              ...detail.casefile_snapshot.minor_creditor_accounts,
            ];
            accounts.forEach((account, index) => {
              account.account_id = 1000 + index;
              account.account_number = options.incompleteAccounts ? null : `SYNTHETIC-${index}`;
            });
          }
          return { status: 200, body: {}, headers: { etag: `"${version}"` } };
        }
        expect(request.method ?? 'GET').to.equal('GET');
        if (request.url === '/opal-maintenance-service/draft-casefiles/101') {
          events.push(`GET:${actor}:"${version}"`);
          if (version > 1) expect(actor, 'restored fixture inputter').to.equal('synthetic-inputter');
          if (version > 1 && pendingReads-- > 0) {
            const pending = structuredClone(detail);
            pending.casefile_status = 'PUBLISHING_PENDING';
            return { status: 200, body: pending, headers: { etag: `"${version}"` } };
          }
          return { status: 200, body: structuredClone(detail), headers: { etag: `"${version}"` } };
        }
        if (request.url === '/opal-maintenance-service/draft-casefiles')
          return { status: 200, body: { count: options.rejectedCount ?? 0, summaries: [] }, headers: {} };
        const replies: Record<string, unknown> = {
          '/opal-maintenance-service/countries': {
            refData: [{ country_name: 'United Kingdom', cjs_code: 101, active: true }],
          },
          '/opal-maintenance-service/maintenance-applications': {
            refData: [{ application_code: 'LIVE01', application_group: 'Create Casefile', active: true }],
          },
          '/opal-maintenance-service/results': { refData: [{ result_id: 'MAT' }] },
          '/opal-maintenance-service/results/MAT': {
            result_id: 'MAT',
            result_parameters: JSON.stringify(
              DRAFT_CASEFILE_RECOVERY_REQUEST.casefile.respondent_account.order_details.order_terms[0].result_responses.map(
                ({ parameter_name }) => ({ name: parameter_name, mandatory: true }),
              ),
            ),
          },
        };
        expect(replies).to.have.property(request.url);
        return { status: 200, body: replies[request.url], headers: {} };
      }),
    );
    return calls;
  }

  it(
    'AC1, AC4. should preserve defaults and isolate all optional creditor and name data',
    { tags: buildTags() },
    () => {
      const baseline = buildSyntheticDraftRequest(marker, 'LIVE01', 101);
      const expected = structuredClone(DRAFT_CASEFILE_RECOVERY_REQUEST);
      expected.casefile.respondent_account.application_code = 'LIVE01';
      expected.casefile.respondent_account.remo_reference = marker;
      expected.casefile.respondent_account.respondent.party_details.address.cjs_code = 101;
      expected.casefile.applicant.party_details.address.cjs_code = 101;
      expect(baseline).to.deep.equal(expected);
      const payload = buildSyntheticDraftRequest(marker, 'LIVE01', 101, {
        uniqueNames: true,
        minorCreditorCount: 2,
      });
      const other = buildSyntheticDraftRequest('E2E-fedcba9876543210', 'LIVE02', 102, {
        uniqueNames: true,
        minorCreditorCount: 2,
      });
      expect(payload.casefile.minor_creditors?.map((creditor) => creditor.creditor_sequence)).to.deep.equal([1, 2]);
      expect(
        payload.casefile.respondent_account.order_details.order_terms.map((term) => [
          term.creditor_type,
          term.minor_creditor_sequence,
        ]),
      ).to.deep.equal([
        ['Applicant', undefined],
        ['Minor Creditor', 1],
        ['Minor Creditor', 2],
      ]);
      for (const creditor of payload.casefile.minor_creditors!) {
        expect(creditor.party_details.address.cjs_code).to.equal(101);
        expect(creditor.bank_account_details).to.deep.equal({ bank_account_type: 'None or not applicable' });
      }
      for (const term of payload.casefile.respondent_account.order_details.order_terms) {
        expect(term.result_responses).to.deep.equal(
          baseline.casefile.respondent_account.order_details.order_terms[0].result_responses,
        );
      }
      expect(payload.casefile.respondent_account.respondent.party_details.individual_details!.surname).to.include(
        marker.slice(4),
      );
      expect(payload.casefile.applicant.party_details.individual_details!.surname).to.include(marker.slice(4));
      expect(payload.casefile.applicant.party_details.individual_details!.surname).not.to.equal(
        other.casefile.applicant.party_details.individual_details!.surname,
      );
      payload.casefile.minor_creditors![0].party_details.address.address_line_1 = 'Changed';
      payload.casefile.respondent_account.order_details.order_terms[1].result_responses[0].response = 'Changed';
      expect(payload.casefile.minor_creditors![1].party_details.address.address_line_1).to.equal('2 Test Street');
      expect(other.casefile.minor_creditors![0].party_details.address.cjs_code).to.equal(102);
      expect(payload.casefile.respondent_account.order_details.order_terms[2].result_responses[0].response).to.equal(
        '10.00',
      );
      expect(buildSyntheticDraftRequest(marker, 'LIVE01', 101)).to.deep.equal(baseline);
      const wire = JSON.stringify(other);
      for (const field of [
        'draft_casefile_id',
        'casefile_status',
        'account_id',
        'account_number',
        'submitted_by',
        'created_date',
        'timeline_data',
      ]) {
        expect(wire).not.to.include(`"${field}"`);
      }
    },
  );

  it(
    'AC2, AC3. should require an explicitly provisioned second inputter and isolate scenario state',
    { tags: buildTags() },
    () => {
      const first = new InputterMonitoringFixtureActions();
      const second = new InputterMonitoringFixtureActions();
      for (const value of [undefined, '', ' ', true]) {
        Cypress.env({ PO10628_SECOND_INPUTTER_EMAIL: value });
        expect(() => first.secondInputter()).to.throw('PO10628_SECOND_INPUTTER_EMAIL');
      }
      Cypress.env('PO10628_SECOND_INPUTTER_EMAIL', ' synthetic-second-inputter ');
      expect(first.secondInputter()).to.equal('synthetic-second-inputter');
      const owned: IOwnedDraftCasefile = {
        id: 101,
        marker,
        inputter: 'synthetic-inputter',
        checker: 'synthetic-checker',
        inputterId: 'i',
        checkerId: 'c',
        inputterName: 'Synthetic',
        checkerName: 'Synthetic',
      };
      first.state.ownedByKey.set('other-rejected', owned);
      first.state.ownedById.set(owned.id, owned);
      expect(second.state.ownedByKey.size).to.equal(0);
      expect(second.state.ownedById.size).to.equal(0);
      expect(first.state.ownedByKey.get('other-rejected')).to.equal(first.state.ownedById.get(101));
    },
  );

  for (const status of ['SUBMITTED', 'REJECTED', 'DELETED', 'PUBLISHING_PENDING', 'PUBLISHED'] as const) {
    it(`AC1, AC4. should set up ${status} with owned receipts and fresh versions`, { tags: buildTags() }, () => {
      const calls = controlledRuntime({ published: status === 'PUBLISHED' });
      const fixtures = new InputterMonitoringFixtureActions();
      fixtures.create(status, { uniqueNames: true }).then((owned) => {
        expect(fixtures.state.ownedById.get(101)).to.equal(owned);
        const posts = calls.filter(({ method }) => method === 'POST');
        expect(posts).to.have.length(1);
        const patches = calls.filter(({ method }) => method === 'PATCH');
        expect(patches).to.have.length(status === 'SUBMITTED' ? 0 : 1);
        if (patches.length) {
          const approval = status === 'PUBLISHED' || status === 'PUBLISHING_PENDING';
          expect(patches[0].body).to.deep.equal({
            business_unit_id: 44,
            casefile_status: approval ? 'PUBLISHING_PENDING' : status,
            ...(approval
              ? {}
              : {
                  status_message:
                    status === 'DELETED' ? 'Synthetic monitoring deletion' : 'Synthetic correction requested',
                }),
          });
        }
        expect(Cypress.env('draftCasefileCleanupReceipts')).to.deep.equal([
          { id: 101, testRunReference: owned.marker, cleanupActor: 'synthetic-inputter', cleanupPolicy: 'required' },
        ]);
      });
    });
  }

  it(
    'AC1. should authenticate the independent checker before the deletion read/decision and restore the inputter',
    { tags: buildTags() },
    () => {
      const events: string[] = [];
      controlledRuntime({}, events);
      new InputterMonitoringFixtureActions().create('DELETED').then((owned) => {
        expect(owned.inputterId).not.to.equal(owned.checkerId);
        expect(events).to.deep.equal([
          'session:synthetic-checker',
          'session:synthetic-inputter',
          'POST:synthetic-inputter',
          'GET:synthetic-inputter:"1"',
          'session:synthetic-checker',
          'GET:synthetic-checker:"1"',
          'PATCH:synthetic-checker:"1"',
          'session:synthetic-inputter',
          'GET:synthetic-inputter:"2"',
        ]);
        expect(Cypress.env('draftCasefileCleanupReceipts')).to.deep.equal([
          { id: owned.id, testRunReference: owned.marker, cleanupActor: owned.inputter, cleanupPolicy: 'required' },
        ]);
      });
    },
  );

  it(
    'AC1. should retain exact marker and owner receipts when a lifecycle setup mutation fails',
    { tags: buildTags() },
    () => {
      const calls = controlledRuntime({ patchStatus: 409 });
      const fixtures = new InputterMonitoringFixtureActions();
      expectFailure('real PATCH setup/competing mutation', () => {
        const owned = fixtures.state.ownedById.get(101)!;
        expect(owned.marker).to.match(/^E2E-[0-9a-f]{16}$/);
        expect(Cypress.env('draftCasefileCleanupReceipts')).to.deep.equal([
          { id: 101, testRunReference: owned.marker, cleanupActor: 'synthetic-inputter', cleanupPolicy: 'required' },
        ]);
        expect(calls.filter(({ method }) => method === 'PATCH')).to.have.length(1);
      });
      fixtures.create('DELETED');
    },
  );

  it('AC4. should fail stable pending if a fast consumer has already published', { tags: buildTags() }, () => {
    const calls = controlledRuntime({ published: true });
    expectFailure('real PUBLISHING_PENDING fixture lifecycle', () => {
      expect(calls.filter(({ method }) => method === 'POST')).to.have.length(1);
      expect(Cypress.env('draftCasefileCleanupReceipts')).to.have.length(1);
    });
    new InputterMonitoringFixtureActions().create('PUBLISHING_PENDING');
  });

  it('AC2. should query an actual empty personal rejection scope without a date filter', { tags: buildTags() }, () => {
    const calls = controlledRuntime();
    new InputterMonitoringFixtureActions().requireEmptyRejected();
    cy.then(() => {
      const list = calls.find(({ url }) => url === '/opal-maintenance-service/draft-casefiles');
      expect(list?.qs).to.deep.equal({
        business_unit_id: 44,
        submitted_by: 'synthetic-inputter-id',
        casefile_status: 'REJECTED',
      });
      expect(calls.some(({ method }) => ['POST', 'PATCH', 'DELETE'].includes(method))).to.equal(false);
    });
  });

  it('AC2. should fail on unrelated personal rejections without deleting anything', { tags: buildTags() }, () => {
    const calls = controlledRuntime({ rejectedCount: 1 });
    expectFailure('personal rejected collection must be genuinely empty', () => {
      expect(calls.some(({ method }) => ['POST', 'PATCH', 'DELETE'].includes(method))).to.equal(false);
    });
    new InputterMonitoringFixtureActions().requireEmptyRejected();
  });

  it('AC3. should reject shared BU identities before creating another-inputter data', { tags: buildTags() }, () => {
    const calls = controlledRuntime({ duplicateInputter: true });
    expectFailure('both inputters have independent BU identities', () => {
      expect(calls.some(({ method }) => method === 'POST')).to.equal(false);
    });
    new InputterMonitoringFixtureActions().create('SUBMITTED', { inputter: 'synthetic-second-inputter' });
  });

  for (const invalid of [{ accountStatus: 'INACTIVE' }, { permission: 0 }]) {
    it(
      `AC3. should fail provisioned membership preflight for ${JSON.stringify(invalid)}`,
      { tags: buildTags() },
      () => {
        const calls = controlledRuntime(invalid);
        expectFailure(
          invalid.permission === 0 ? 'Provisioned account needs Maintenance permission 22' : 'live test account status',
          () => {
            expect(calls.some(({ method }) => method === 'POST')).to.equal(false);
          },
        );
        new InputterMonitoringFixtureActions().create('SUBMITTED');
      },
    );
  }

  for (const invalid of [{ publicationFailure: true }, { published: true, incompleteAccounts: true }]) {
    it(
      `AC4. should retain approval ownership when publication validation fails for ${JSON.stringify(invalid)}`,
      { tags: buildTags() },
      () => {
        const calls = controlledRuntime(invalid);
        expectFailure(invalid.publicationFailure ? 'PUBLISHING_FAILED' : 'generated account number', () => {
          expect(Cypress.env('draftCasefileCleanupReceipts')).to.have.length(1);
          expect(calls.filter(({ method }) => method === 'PATCH')).to.have.length(1);
        });
        new InputterMonitoringFixtureActions().create('PUBLISHED');
      },
    );
  }

  it('AC4. should poll pending real-read boundaries to a complete publication', { tags: buildTags() }, () => {
    const calls = controlledRuntime({ published: true, pendingReads: 2 });
    const wait = cy.stub(cy, 'wait').callsFake((milliseconds: number) => {
      expect(milliseconds).to.equal(1000);
      return cy.wrap(null, { log: false });
    });
    new InputterMonitoringFixtureActions().create('PUBLISHED').then(() => {
      expect(wait).to.have.been.calledTwice;
      expect(
        calls.filter(({ url, method }) => url === '/opal-maintenance-service/draft-casefiles/101' && method === 'GET'),
      ).to.have.length(5);
    });
  });

  it('AC4. should exhaust bounded publication polling without fabricating completion', { tags: buildTags() }, () => {
    const calls = controlledRuntime();
    const wait = cy.stub(cy, 'wait').callsFake(() => cy.wrap(null, { log: false }));
    expectFailure('real PUBLISHED fixture lifecycle', () => {
      expect(wait).to.have.callCount(29);
      expect(
        calls.filter(({ url, method }) => url === '/opal-maintenance-service/draft-casefiles/101' && method === 'GET'),
      ).to.have.length(32);
      expect(Cypress.env('draftCasefileCleanupReceipts')).to.have.length(1);
    });
    new InputterMonitoringFixtureActions().create('PUBLISHED');
  });
});
