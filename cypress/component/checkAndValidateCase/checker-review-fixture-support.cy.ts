import { CheckerReviewFixtureActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/checker-review-fixture.actions';
import { InputterMonitoringFixtureActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/inputter-monitoring-fixture.actions';
import { readDraftSnapshot } from '../../e2e/functional/opal/actions/checkAndValidateCase/draft-casefile-evidence.actions';
import { createPersistedCasefileDetail } from '../../../src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import { DRAFT_CASEFILE_RECOVERY_REQUEST } from '../../e2e/functional/opal/actions/checkAndValidateCase/mocks/draft-casefile-request.mock';
import type { IOpalMaintenanceDraftCasefileRequest } from '../../../src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';
import type { IOwnedDraftCasefile } from '../../e2e/functional/opal/actions/checkAndValidateCase/interfaces/draft-casefile-owned.interface';

const buildTags = (): string[] => [
  '@R1CRmCreateCaseFiles',
  '@JIRA-STORY:PO-10625',
  '@JIRA-EPIC:PO-10817',
  '@JIRA-LABEL:create-draft-casefile',
  '@retries(0)',
];

describe('PO-10625 owned checker fixture support', () => {
  const environmentKeys = [
    'PO10626_INPUTTER_EMAIL',
    'PO10626_CHECKER_EMAIL',
    'PO10625_LIFECYCLE_CLEANUP_VERIFIED',
    'PO10628_PUBLICATION_CLEANUP_VERIFIED',
    'draftCasefileCleanupReceipts',
  ];
  let originalEnvironment: Record<string, unknown>;
  let expectedFailure: boolean;
  let observedFailure: boolean;

  beforeEach(() => {
    originalEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, Cypress.env(key)]));
    // Safety switches exist only within this controlled support runtime and are restored after every case.
    Cypress.env({
      PO10626_INPUTTER_EMAIL: 'synthetic-inputter',
      PO10626_CHECKER_EMAIL: 'synthetic-checker',
      PO10625_LIFECYCLE_CLEANUP_VERIFIED: true,
      PO10628_PUBLICATION_CLEANUP_VERIFIED: true,
      draftCasefileCleanupReceipts: [],
    });
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

  function assertReceipt(owned: IOwnedDraftCasefile): void {
    expect(Cypress.env('draftCasefileCleanupReceipts')).to.deep.equal([
      { id: owned.id, testRunReference: owned.marker, cleanupActor: owned.inputter, cleanupPolicy: 'required' },
    ]);
  }

  // All requests and authentication are controlled; no live mutations or test-owned server fields are sent.
  function controlledRuntime(
    options: {
      dualRole?: boolean;
      permissions?: number[];
      inconsistentIdentity?: boolean;
      duplicateActors?: boolean;
      finalFault?: 'status' | 'version' | 'owner' | 'marker' | 'timeline';
      putStatus?: number;
    } = {},
  ) {
    const calls: Cypress.RequestOptions[] = [];
    const events: string[] = [];
    const writes: { path: string; body: unknown }[] = [];
    const detail = createPersistedCasefileDetail();
    detail.draft_casefile_id = 101;
    let actor = 'synthetic-inputter';
    let version = 1;
    let permissionReads = 0;
    let latestReadCasefile: typeof detail.casefile | undefined;
    cy.document().then((document) => {
      document.body.innerHTML =
        '<nav aria-label="Account navigation"><a class="moj-header__navigation-link">Sign out</a></nav>';
    });
    cy.stub(cy, 'session').callsFake((identity: string) =>
      cy.then(() => {
        actor = identity;
        events.push(`session:${actor}`);
      }),
    );
    cy.stub(cy, 'visit').callsFake(() => cy.wrap(null, { log: false }));
    cy.stub(cy, 'writeFile').callsFake((path, body) =>
      cy.then(() => {
        writes.push({ path, body });
        return null;
      }),
    );
    cy.stub(cy, 'request').callsFake((request: Cypress.RequestOptions) =>
      cy.then(() => {
        calls.push(request);
        if (request.url === '/api/user-state') {
          permissionReads++;
          const id = options.duplicateActors ? 'shared-id' : `${actor}-id`;
          const defaultPermission = actor === 'synthetic-checker' ? 22 : 21;
          const permissions = options.permissions ?? (options.dualRole ? [21, 22] : [defaultPermission]);
          return {
            status: 200,
            body: {
              status: 'ACTIVE',
              name: `${actor} name`,
              domains: {
                maintenance: {
                  business_unit_users: [
                    {
                      business_unit_id: 44,
                      business_unit_user_id: options.inconsistentIdentity && permissionReads > 1 ? 'different-id' : id,
                      permissions: permissions.map((permission_id) => ({ permission_id })),
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
          return {
            status: 201,
            body: { draft_casefile_id: 101, casefile_status: 'SUBMITTED' },
            headers: { etag: '"1"' },
          };
        }
        if (request.method === 'PATCH' || request.method === 'PUT') {
          events.push(`${request.method}:${actor}:"${version}"`);
          expect(request.url).to.equal('/opal-maintenance-service/draft-casefiles/101');
          expect(request.headers).to.have.property('If-Match', `"${version}"`);
          if (request.method === 'PATCH') {
            expect(actor).to.equal('synthetic-checker');
            expect(request.body).to.deep.equal({
              business_unit_id: 44,
              casefile_status: 'REJECTED',
              status_message: 'Synthetic correction requested',
            });
            detail.casefile_status = 'REJECTED';
            detail.casefile.respondent_account.originator_name = 'Server retained correction';
            detail.timeline_data.push({
              username: 'synthetic-checker name',
              status: 'Rejected',
              status_date: '2026-09-15T10:00:00Z',
            });
          } else {
            expect(actor).to.equal('synthetic-inputter');
            const body = request.body as Pick<IOpalMaintenanceDraftCasefileRequest, 'business_unit_id' | 'casefile'>;
            expect(Object.keys(body).sort()).to.deep.equal(['business_unit_id', 'casefile']);
            expect(request.body).to.deep.equal({ business_unit_id: 44, casefile: detail.casefile });
            expect(body.casefile, 'isolated fresh PUT casefile').not.to.equal(latestReadCasefile);
            if (options.putStatus) return { status: options.putStatus, body: {}, headers: {} };
            detail.casefile_status = 'RESUBMITTED';
            detail.timeline_data.push({
              username: 'synthetic-inputter name',
              status: 'Resubmitted',
              status_date: '2026-09-15T11:00:00Z',
            });
          }
          version++;
          return { status: 200, body: {}, headers: { etag: `"${version}"` } };
        }
        expect(request.method ?? 'GET').to.equal('GET');
        if (request.url === '/opal-maintenance-service/draft-casefiles/101') {
          events.push(`GET:${actor}:"${version}"`);
          const saved = structuredClone(detail);
          latestReadCasefile = saved.casefile;
          if (version === 3) {
            if (options.finalFault === 'status') saved.casefile_status = 'REJECTED';
            if (options.finalFault === 'owner') saved.submitted_by = 'unrelated-owner';
            if (options.finalFault === 'marker')
              saved.casefile.respondent_account.remo_reference = 'E2E-fedcba9876543210';
            if (options.finalFault === 'timeline') saved.timeline_data.pop();
          }
          const etag = version === 3 && options.finalFault === 'version' ? '"2"' : `"${version}"`;
          return { status: 200, body: saved, headers: { etag } };
        }
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
    return { calls, events, writes, detail };
  }

  for (const value of [undefined, false, 'true', 'false']) {
    it(
      `AC1. should reject RESUBMITTED cleanup ${typeof value} ${String(value)} before POST`,
      { tags: buildTags() },
      () => {
        const request = cy.stub(cy, 'request');
        Cypress.env({ PO10625_LIFECYCLE_CLEANUP_VERIFIED: value });
        const fixture = new CheckerReviewFixtureActions();
        expect(() => fixture.requireLifecycleCleanup()).to.throw('PO10625_LIFECYCLE_CLEANUP_VERIFIED');
        expect(() => fixture.create('RESUBMITTED')).to.throw('PO10625_LIFECYCLE_CLEANUP_VERIFIED');
        expect(request).not.to.have.been.called;
      },
    );
    for (const status of ['SUBMITTED', 'RESUBMITTED'] as const) {
      it(
        `AC1. should reject ${status} publication ${typeof value} ${String(value)} before POST`,
        { tags: buildTags() },
        () => {
          const request = cy.stub(cy, 'request');
          Cypress.env({ PO10628_PUBLICATION_CLEANUP_VERIFIED: value });
          expect(() => new CheckerReviewFixtureActions().create(status, true)).to.throw(
            'PO10628_PUBLICATION_CLEANUP_VERIFIED',
          );
          expect(request).not.to.have.been.called;
        },
      );
    }
  }

  for (const status of ['SUBMITTED', 'RESUBMITTED'] as const) {
    for (const publication of [false, true]) {
      it(
        `AC1. should create ${status} publication boolean ${publication} with independent actors and exact receipt`,
        { tags: buildTags() },
        () => {
          const runtime = controlledRuntime();
          new CheckerReviewFixtureActions().create(status, publication).then((owned) => {
            expect(owned.inputterId).to.equal('synthetic-inputter-id');
            expect(owned.checkerId).to.equal('synthetic-checker-id');
            assertReceipt(owned);
            expect(runtime.writes).to.have.length(1);
            const posts = runtime.calls.filter(({ method }) => method === 'POST');
            expect(posts).to.have.length(1);
            const payload = posts[0].body as IOpalMaintenanceDraftCasefileRequest;
            expect(payload.casefile.minor_creditors ?? []).to.have.length(publication ? 2 : 0);
            expect(runtime.calls.filter(({ method }) => method === 'PUT')).to.have.length(
              status === 'RESUBMITTED' ? 1 : 0,
            );
            if (status === 'RESUBMITTED')
              expect(runtime.events).to.deep.equal([
                'session:synthetic-checker',
                'session:synthetic-inputter',
                'POST:synthetic-inputter',
                'GET:synthetic-inputter:"1"',
                'session:synthetic-checker',
                'GET:synthetic-checker:"1"',
                'PATCH:synthetic-checker:"1"',
                'session:synthetic-inputter',
                'GET:synthetic-inputter:"2"',
                'PUT:synthetic-inputter:"2"',
                'GET:synthetic-inputter:"3"',
              ]);
            readDraftSnapshot(owned.id).then((saved) => {
              expect(saved.draft.casefile_status).to.equal(status);
              expect(saved.draft.submitted_by).to.equal(owned.inputterId);
              expect(saved.draft.timeline_data.map((event) => event.status).sort()).to.deep.equal(
                status === 'SUBMITTED' ? ['Submitted'] : ['Rejected', 'Resubmitted', 'Submitted'],
              );
              if (status === 'RESUBMITTED')
                expect(saved.draft.timeline_data.map((event) => event.status_date)).to.deep.equal([
                  '2026-09-15T09:00:00Z',
                  '2026-09-15T10:00:00Z',
                  '2026-09-15T11:00:00Z',
                ]);
            });
          });
        },
      );
    }
  }

  for (const fault of ['status', 'version', 'owner', 'marker', 'timeline'] as const) {
    it(`AC1. should reject RESUBMITTED wrong ${fault} and retain its receipt`, { tags: buildTags() }, () => {
      controlledRuntime({ finalFault: fault });
      const messages = {
        status: 'resubmitted fixture lifecycle',
        version: 'fresh resubmission version',
        owner: 'same owned inputter',
        marker: 'same owned marker',
        timeline: 'real resubmission lifecycle events',
      };
      expectFailure(messages[fault], () => expect(Cypress.env('draftCasefileCleanupReceipts')).to.have.length(1));
      new CheckerReviewFixtureActions().create('RESUBMITTED');
    });
  }

  it('AC1. should retain exact receipt after failed RESUBMITTED PUT', { tags: buildTags() }, () => {
    const runtime = controlledRuntime({ putStatus: 409 });
    expectFailure('real PUT setup/competing mutation', () => {
      const marker = runtime.detail.casefile.respondent_account.remo_reference;
      expect(Cypress.env('draftCasefileCleanupReceipts')).to.deep.equal([
        { id: 101, testRunReference: marker, cleanupActor: 'synthetic-inputter', cleanupPolicy: 'required' },
      ]);
    });
    new CheckerReviewFixtureActions().create('RESUBMITTED');
  });

  it('AC1. should keep positive SUBMITTED actors independent', { tags: buildTags() }, () => {
    const runtime = controlledRuntime({ duplicateActors: true });
    expectFailure('inputter and checker have independent BU identities', () => {
      expect(runtime.calls.filter(({ method }) => method === 'POST')).to.have.length(0);
    });
    new CheckerReviewFixtureActions().create('SUBMITTED');
  });

  it(
    'AC1. should create self-owned SUBMITTED with both permissions on the same BU identity and exact receipt',
    { tags: buildTags() },
    () => {
      const runtime = controlledRuntime({ dualRole: true });
      new CheckerReviewFixtureActions().createSelfOwned().then((owned) => {
        expect(owned.inputter).to.equal('synthetic-checker');
        expect(owned.checker).to.equal(owned.inputter);
        expect(owned.inputterId).to.equal('synthetic-checker-id');
        expect(owned.checkerId).to.equal(owned.inputterId);
        expect(owned.inputterName).to.equal(owned.checkerName);
        expect(runtime.events).to.deep.equal([
          'session:synthetic-checker',
          'POST:synthetic-checker',
          'GET:synthetic-checker:"1"',
        ]);
        expect(runtime.calls.filter(({ url }) => url === '/api/user-state')).to.have.length(2);
        assertReceipt(owned);
        expect(runtime.writes).to.have.length(1);
      });
    },
  );

  for (const permissions of [[21], [22]]) {
    it(
      `AC1. should reject self-owned SUBMITTED with only permission ${permissions[0]} before POST`,
      { tags: buildTags() },
      () => {
        const runtime = controlledRuntime({ permissions });
        expectFailure('Provisioned account needs Maintenance permission', () => {
          expect(runtime.calls.filter(({ method }) => method === 'POST')).to.have.length(0);
        });
        new CheckerReviewFixtureActions().createSelfOwned();
      },
    );
  }
  it('AC1. should reject self-owned SUBMITTED with differing BU identities before POST', { tags: buildTags() }, () => {
    const runtime = controlledRuntime({ dualRole: true, inconsistentIdentity: true });
    expectFailure('same dual-role BU identity', () => {
      expect(runtime.calls.filter(({ method }) => method === 'POST')).to.have.length(0);
    });
    new CheckerReviewFixtureActions().createSelfOwned();
  });

  const publicationOwned: IOwnedDraftCasefile = {
    id: 101,
    marker: 'E2E-0123456789abcdef',
    inputter: 'synthetic-inputter',
    checker: 'synthetic-checker',
    inputterId: 'synthetic-inputter-id',
    checkerId: 'synthetic-checker-id',
    inputterName: 'Inputter',
    checkerName: 'Checker',
  };
  function publicationRuntime(options: { pending?: number; fault?: string } = {}) {
    const detail = createPersistedCasefileDetail();
    detail.draft_casefile_id = 101;
    detail.submitted_by = publicationOwned.inputterId;
    detail.casefile.respondent_account.remo_reference = publicationOwned.marker;
    detail.casefile_status = 'PUBLISHED';
    detail.casefile_snapshot.minor_creditor_accounts = [1, 2].map((creditor_sequence) => ({
      creditor_sequence,
      name: 'Synthetic Minor',
      account_id: 100 + creditor_sequence,
      account_number: `MINOR-${creditor_sequence}`,
    }));
    detail.casefile_snapshot.respondent_account.account_id = 100;
    detail.casefile_snapshot.respondent_account.account_number = 'RESPONDENT-100';
    detail.casefile_snapshot.applicant_account.account_id = 101;
    detail.casefile_snapshot.applicant_account.account_number = 'APPLICANT-101';
    if (options.fault === 'id') detail.casefile_snapshot.minor_creditor_accounts[1].account_id = null;
    if (options.fault === 'number') detail.casefile_snapshot.minor_creditor_accounts[1].account_number = null;
    if (options.fault === 'marker') detail.casefile.respondent_account.remo_reference = 'E2E-fedcba9876543210';
    if (options.fault === 'owner') detail.submitted_by = 'unrelated-owner';
    if (options.fault === 'failed') detail.casefile_status = 'PUBLISHING_FAILED';
    const calls: Cypress.RequestOptions[] = [];
    let remaining = options.pending ?? 0;
    const waits: number[] = [];
    cy.stub(cy, 'wait').callsFake((duration: number) =>
      cy.then(() => {
        waits.push(duration);
        return null;
      }),
    );
    cy.stub(cy, 'request').callsFake((request: Cypress.RequestOptions) =>
      cy.then(() => {
        calls.push(request);
        expect(request.method).to.equal('GET');
        expect(request.url).to.equal('/opal-maintenance-service/draft-casefiles/101');
        const saved = structuredClone(detail);
        if (remaining-- > 0) saved.casefile_status = 'PUBLISHING_PENDING';
        return { status: 200, body: saved, headers: { etag: '"3"' } };
      }),
    );
    return { calls, waits };
  }

  for (const pending of [0, 2]) {
    it(
      `AC1. should read complete Published four accounts after ${pending} pending reads without mutation`,
      { tags: buildTags() },
      () => {
        const runtime = publicationRuntime({ pending });
        // Reading is safe even when the mutation guard is disabled.
        Cypress.env('PO10628_PUBLICATION_CLEANUP_VERIFIED', false);
        new InputterMonitoringFixtureActions().readPublished(publicationOwned).then((saved) => {
          expect(saved.draft.casefile_status).to.equal('PUBLISHED');
          expect(runtime.calls).to.have.length(pending + 1);
          expect(runtime.waits).to.deep.equal(Array(pending).fill(1000));
          expect(Cypress.env('draftCasefileCleanupReceipts')).to.deep.equal([]);
        });
      },
    );
  }
  for (const fault of ['failed', 'timeout', 'id', 'number', 'marker', 'owner']) {
    it(`AC1. should fail public Published read for ${fault}`, { tags: buildTags() }, () => {
      const runtime = publicationRuntime({ fault, pending: fault === 'timeout' ? 31 : 0 });
      const message: Record<string, string> = {
        failed: 'PUBLISHING_FAILED',
        timeout: 'real PUBLISHED fixture lifecycle',
        id: 'generated account ID',
        number: 'generated account number',
        marker: 'same owned marker',
        owner: 'same owned inputter',
      };
      expectFailure(message[fault], () => {
        expect(runtime.calls).to.have.length(fault === 'timeout' ? 30 : 1);
        expect(runtime.waits).to.have.length(fault === 'timeout' ? 29 : 0);
        expect(runtime.calls.every(({ method }) => method === 'GET')).to.equal(true);
      });
      new InputterMonitoringFixtureActions().readPublished(publicationOwned);
    });
  }
});
