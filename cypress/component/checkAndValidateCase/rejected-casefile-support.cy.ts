import type { IOpalMaintenanceDraftCasefileDetail } from '../../../src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-detail.interface';
import { RejectedCasefileFixtureActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/rejected-casefile-fixture.actions';
import { recordCreatedId, configureDraftCasefileCleanup } from '../../support/draftCasefiles';
import { DRAFT_CASEFILE_RECOVERY_REQUEST } from '../../e2e/functional/opal/actions/checkAndValidateCase/mocks/draft-casefile-request.mock';
import type { IOpalMaintenanceDraftCasefileRequest } from '../../../src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';
import { createPersistedCasefileDetail } from '../../../src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import { buildSyntheticDraftRequest } from '../../e2e/functional/opal/actions/checkAndValidateCase/draft-casefile-payload';
import {
  assertRejectedRetry,
  assertResubmittedCasefile,
  correctedRejectedCasefile,
} from '../../e2e/functional/opal/actions/checkAndValidateCase/rejected-casefile-evidence.actions';
import type { IRejectedCasefileContext } from '../../e2e/functional/opal/actions/checkAndValidateCase/interfaces/rejected-casefile-context.interface';
import type { IDraftCasefileSnapshot } from '../../e2e/functional/opal/actions/checkAndValidateCase/interfaces/draft-casefile-snapshot.interface';
import type { IDraftCasefileMonitor } from '../../e2e/functional/opal/actions/checkAndValidateCase/interfaces/draft-casefile-monitor.interface';

const buildTags = (): string[] => ['@JIRA-STORY:PO-10623', '@JIRA-EPIC:PO-10817'];

function exampleResubmission(transfer = false): { context: IRejectedCasefileContext; saved: IDraftCasefileSnapshot } {
  const draft = createPersistedCasefileDetail();
  const marker = 'E2E-0123456789012345';
  draft.casefile = buildSyntheticDraftRequest(marker, 'TEST', 101, {
    minorCreditorCount: 2,
    uniqueNames: true,
  }).casefile;
  const individual = draft.casefile.respondent_account.respondent.party_details.individual_details!;
  const applicant = draft.casefile.applicant.party_details.individual_details!;
  draft.submitted_by = 'A-id';
  draft.submitted_by_name = 'Actor A';
  draft.casefile_status = 'REJECTED';
  draft.casefile_status_date = '2026-09-15T10:00:00Z';
  draft.casefile_snapshot = {
    respondent_account: {
      respondent_name: `${individual.forenames} ${individual.surname}`,
      account_id: null,
      account_number: null,
    },
    applicant_account: {
      applicant_name: `${applicant.forenames} ${applicant.surname}`,
      account_id: null,
      account_number: null,
    },
    minor_creditor_accounts: draft.casefile.minor_creditors!.map(({ creditor_sequence, party_details }) => ({
      creditor_sequence,
      name: `${party_details.individual_details!.forenames} ${party_details.individual_details!.surname}`,
      account_id: null,
      account_number: null,
    })),
  };
  draft.timeline_data = [
    { username: 'Actor A', status: 'Submitted', status_date: draft.created_date },
    {
      username: 'Actor B',
      status: 'Rejected',
      status_date: draft.casefile_status_date,
      reason_text: 'Synthetic correction requested',
    },
  ];
  const context: IRejectedCasefileContext = {
    owned: {
      id: draft.draft_casefile_id,
      marker,
      inputter: 'synthetic-A',
      checker: 'synthetic-B',
      inputterId: 'A-id',
      checkerId: 'B-id',
      inputterName: 'Actor A',
      checkerName: 'Actor B',
    },
    before: { draft, etag: '"9007199254740993"' },
    amender: transfer
      ? { email: 'synthetic-B', id: 'B-id', name: 'Actor B' }
      : { email: 'synthetic-A', id: 'A-id', name: 'Actor A' },
  };
  const saved = structuredClone(context.before);
  saved.draft.casefile = correctedRejectedCasefile(context.before, 'Corrected');
  (
    (saved.draft.casefile_snapshot as IOpalMaintenanceDraftCasefileDetail['casefile_snapshot']).respondent_account as {
      respondent_name: string;
    }
  ).respondent_name = `Corrected ${individual.surname}`;
  saved.draft.casefile_status = 'RESUBMITTED';
  saved.draft.casefile_status_date = '2026-09-15T11:00:00Z';
  saved.draft.submitted_by = context.amender.id;
  saved.draft.submitted_by_name = context.amender.name;
  saved.draft.timeline_data.push({
    username: context.amender.name,
    status: 'Resubmitted',
    status_date: saved.draft.casefile_status_date,
  });
  saved.etag = '"9007199254740994"';
  return { context, saved };
}

describe('PO-10623 rejected amendment evidence (controlled support only)', () => {
  for (const transfer of [false, true]) {
    it(`AC1, AC3. should retain the immutable creator with transfer ${transfer}`, { tags: buildTags() }, () => {
      const { context, saved } = exampleResubmission(transfer);
      const original = structuredClone(context);
      assertResubmittedCasefile(context, saved, 'Corrected');
      expect(context).to.deep.equal(original);
      const corrected = correctedRejectedCasefile(context.before, 'Corrected');
      expect(corrected).not.to.equal(context.before.draft.casefile);
    });
  }
  const faults: {
    label: string;
    mutate: (context: IRejectedCasefileContext, saved: IDraftCasefileSnapshot) => void;
  }[] = [
    { label: 'a lost creditor', mutate: (_, saved) => saved.draft.casefile.minor_creditors!.pop() },
    {
      label: 'duplicated creditors',
      mutate: (_, saved) =>
        (saved.draft.casefile.minor_creditors![1] = structuredClone(saved.draft.casefile.minor_creditors![0])),
    },
    {
      label: 'lost order data',
      mutate: (_, saved) => saved.draft.casefile.respondent_account.order_details.order_terms.pop(),
    },
    {
      label: 'changed applicant data',
      mutate: (_, saved) => (saved.draft.casefile.applicant.party_details.address.address_line_1 = 'Wrong'),
    },
    {
      label: 'an unchanged snapshot name',
      mutate: (context, saved) =>
        (saved.draft.casefile_snapshot = structuredClone(context.before.draft.casefile_snapshot)),
    },
    {
      label: 'a wrong snapshot name',
      mutate: (_, saved) =>
        ((
          saved.draft.casefile_snapshot as IOpalMaintenanceDraftCasefileDetail['casefile_snapshot']
        ).respondent_account.respondent_name = 'Wrong'),
    },
    {
      label: 'a wrong snapshot applicant',
      mutate: (_, saved) =>
        ((
          saved.draft.casefile_snapshot as IOpalMaintenanceDraftCasefileDetail['casefile_snapshot']
        ).applicant_account.applicant_name = 'Wrong'),
    },
    {
      label: 'a wrong snapshot creditor',
      mutate: (_, saved) =>
        ((
          saved.draft.casefile_snapshot as IOpalMaintenanceDraftCasefileDetail['casefile_snapshot']
        ).minor_creditor_accounts[0].name = 'Wrong'),
    },
    {
      label: 'a wrong snapshot sequence',
      mutate: (_, saved) =>
        ((
          saved.draft.casefile_snapshot as IOpalMaintenanceDraftCasefileDetail['casefile_snapshot']
        ).minor_creditor_accounts[0].creditor_sequence = 2),
    },
    {
      label: 'missing snapshot creditors',
      mutate: (_, saved) =>
        (
          saved.draft.casefile_snapshot as IOpalMaintenanceDraftCasefileDetail['casefile_snapshot']
        ).minor_creditor_accounts.pop(),
    },
    {
      label: 'a generated prepublication account',
      mutate: (_, saved) =>
        ((
          saved.draft.casefile_snapshot as IOpalMaintenanceDraftCasefileDetail['casefile_snapshot']
        ).respondent_account.account_id = 101),
    },
    { label: 'a wrong latest actor', mutate: (_, saved) => (saved.draft.submitted_by = 'unknown') },
    { label: 'a wrong actor label', mutate: (_, saved) => (saved.draft.submitted_by_name = 'Wrong') },
    { label: 'lost old history', mutate: (_, saved) => saved.draft.timeline_data.shift() },
    {
      label: 'duplicated old history',
      mutate: (_, saved) => saved.draft.timeline_data.unshift(structuredClone(saved.draft.timeline_data[0])),
    },
    { label: 'reordered old history', mutate: (_, saved) => saved.draft.timeline_data.reverse() },
    {
      label: 'a changed rejection reason',
      mutate: (_, saved) => (saved.draft.timeline_data[1].reason_text = 'Changed'),
    },
    {
      label: 'an extra event',
      mutate: (_, saved) => saved.draft.timeline_data.push(structuredClone(saved.draft.timeline_data[2])),
    },
    { label: 'the wrong event actor', mutate: (_, saved) => (saved.draft.timeline_data[2].username = 'Wrong') },
    {
      label: 'the wrong event timestamp',
      mutate: (_, saved) => (saved.draft.timeline_data[2].status_date = '2026-09-15T12:00:00Z'),
    },
    {
      label: 'a fabricated resubmission reason',
      mutate: (_, saved) => (saved.draft.timeline_data[2].reason_text = 'Fabricated'),
    },
    {
      label: 'an invalid UTC status time',
      mutate: (_, saved) => {
        saved.draft.casefile_status_date = 'not-a-date';
        saved.draft.timeline_data[2].status_date = 'not-a-date';
      },
    },
    {
      label: 'a backwards status time',
      mutate: (_, saved) => {
        saved.draft.casefile_status_date = '2026-09-15T08:00:00Z';
        saved.draft.timeline_data[2].status_date = saved.draft.casefile_status_date;
      },
    },
    { label: 'the same version', mutate: (context, saved) => (saved.etag = context.before.etag) },
    { label: 'a stale version', mutate: (_, saved) => (saved.etag = '"9007199254740992"') },
    { label: 'a wrong ID', mutate: (_, saved) => saved.draft.draft_casefile_id++ },
    {
      label: 'a wrong marker',
      mutate: (_, saved) => (saved.draft.casefile.respondent_account.remo_reference = 'E2E-9999999999999999'),
    },
    { label: 'a wrong BU', mutate: (_, saved) => saved.draft.business_unit_id++ },
    {
      label: 'a changed creation time',
      mutate: (_, saved) => (saved.draft.created_date = saved.draft.casefile_status_date),
    },
    { label: 'a changed casefile type', mutate: (_, saved) => (saved.draft.casefile_type = 'Wrong') },
    { label: 'a non-rejected baseline', mutate: (context) => (context.before.draft.casefile_status = 'SUBMITTED') },
    {
      label: 'an ambiguous baseline name',
      mutate: (context) =>
        ((
          context.before.draft.casefile_snapshot as IOpalMaintenanceDraftCasefileDetail['casefile_snapshot']
        ).respondent_account.respondent_name +=
          ` ${context.before.draft.casefile.respondent_account.respondent.party_details.individual_details!.forenames}`),
    },
    {
      label: 'a missing baseline name',
      mutate: (context) =>
        ((
          context.before.draft.casefile_snapshot as IOpalMaintenanceDraftCasefileDetail['casefile_snapshot']
        ).respondent_account.respondent_name = 'Wrong'),
    },
    {
      label: 'duplicate baseline creditors',
      mutate: (context) => (context.before.draft.casefile.minor_creditors![1].creditor_sequence = 1),
    },
  ];
  for (const fault of faults) {
    it(`AC1, AC2, AC3. should reject ${fault.label}`, { tags: buildTags() }, () => {
      const { context, saved } = exampleResubmission();
      fault.mutate(context, saved);
      expect(() => assertResubmittedCasefile(context, saved, 'Corrected')).to.throw();
    });
  }
  function retry(): IDraftCasefileMonitor {
    return {
      attempts: 2,
      applicationAttempts: 2,
      upstreamSuccesses: 1,
      droppedResponses: 0,
      interceptedFailures: 1,
      requestVersions: ['"2"', '"2"'],
      lastStatus: 200,
      upstreamEtag: '"3"',
    };
  }
  it('AC4. should accept precisely two explicit attempts on the original version', { tags: buildTags() }, () => {
    assertRejectedRetry(retry(), '"2"');
  });
  for (const field of [
    'attempts',
    'applicationAttempts',
    'upstreamSuccesses',
    'droppedResponses',
    'interceptedFailures',
    'lastStatus',
  ] as const) {
    it(`AC4. should reject incorrect retry ${field}`, { tags: buildTags() }, () => {
      const monitor = retry();
      monitor[field]++;
      expect(() => assertRejectedRetry(monitor, '"2"')).to.throw();
    });
  }
  it('AC4. should reject a changed retry version or missing response advancement', { tags: buildTags() }, () => {
    const monitor = retry();
    monitor.requestVersions[1] = '"3"';
    expect(() => assertRejectedRetry(monitor, '"2"')).to.throw();
    monitor.requestVersions[1] = '"2"';
    monitor.upstreamEtag = '"2"';
    expect(() => assertRejectedRetry(monitor, '"2"')).to.throw();
  });
});

describe('PO-10623 owned rejected fixture boundaries (controlled support only)', () => {
  const keys = ['RM_TEST_ACTORS', 'draftCasefileCleanupReceipts'];
  let original: Record<string, unknown>;
  let expectedFailure: boolean;
  let observedFailure: boolean;
  beforeEach(() => {
    original = Object.fromEntries(keys.map((key) => [key, Cypress.env(key)]));
    Cypress.env({
      RM_TEST_ACTORS: { inputter: 'synthetic-A', checker: 'synthetic-B', foreignBuInputter: 'synthetic-foreign' },
      draftCasefileCleanupReceipts: [],
    });
    expectedFailure = false;
    observedFailure = false;
  });
  afterEach(() => {
    try {
      if (expectedFailure) expect(observedFailure, 'expected controlled boundary failure observed').to.equal(true);
    } finally {
      Cypress.env(original);
    }
  });
  function fail(message: string, verify: () => void): void {
    expectedFailure = true;
    cy.once('fail', (error) => {
      if (!error.message.includes(message)) throw error;
      observedFailure = true;
      verify();
      return false;
    });
  }
  function controlledRuntime(
    options: {
      b21?: boolean;
      foreignStatus?: string;
      foreignOwning?: boolean;
      foreignOther?: boolean;
      rejectedHistory?: boolean;
    } = {},
  ) {
    const calls: Cypress.RequestOptions[] = [];
    const persisted: unknown[] = [];
    let actor = 'synthetic-A';
    let version = 1;
    const detail = createPersistedCasefileDetail();
    detail.submitted_by = 'A-id';
    detail.submitted_by_name = 'Actor A';
    detail.timeline_data[0].username = 'Actor A';
    cy.document().then((document) => {
      document.body.innerHTML =
        '<nav aria-label="Account navigation"><a class="moj-header__navigation-link">Sign out</a></nav>';
    });
    cy.stub(cy, 'session').callsFake((email: string) =>
      cy.then(() => {
        actor = email;
      }),
    );
    cy.stub(cy, 'visit').callsFake(() => cy.wrap(null, { log: false }));
    cy.stub(cy, 'writeFile').callsFake((_path: string, receipt: unknown) =>
      cy.then(() => {
        persisted.push(receipt);
      }),
    );
    cy.stub(cy, 'request').callsFake((request: Cypress.RequestOptions) =>
      cy.then(() => {
        calls.push(request);
        if (request.url === '/api/user-state') {
          const foreign = actor === 'synthetic-foreign';
          const permissions = actor === 'synthetic-B' ? (options.b21 === false ? [22] : [21, 22]) : [21];
          return {
            status: 200,
            headers: {},
            body: {
              status: foreign ? (options.foreignStatus ?? 'ACTIVE') : 'ACTIVE',
              name: actor === 'synthetic-B' ? 'Actor B' : 'Actor A',
              domains: {
                maintenance: {
                  business_unit_users: foreign
                    ? [
                        ...(options.foreignOwning
                          ? [
                              {
                                business_unit_id: 44,
                                business_unit_user_id: 'owning-id',
                                permissions: [{ permission_id: 21 }],
                              },
                            ]
                          : []),
                        ...(options.foreignOther === false
                          ? []
                          : [
                              {
                                business_unit_id: 45,
                                business_unit_user_id: 'foreign-id',
                                permissions: [{ permission_id: 21 }],
                              },
                            ]),
                      ]
                    : [
                        {
                          business_unit_id: 44,
                          business_unit_user_id: actor === 'synthetic-B' ? 'B-id' : 'A-id',
                          permissions: permissions.map((permission_id) => ({ permission_id })),
                        },
                      ],
                },
              },
            },
          };
        }
        if (request.method === 'POST') {
          detail.casefile = structuredClone((request.body as IOpalMaintenanceDraftCasefileRequest).casefile);
          return {
            status: 201,
            body: { draft_casefile_id: detail.draft_casefile_id, casefile_status: 'SUBMITTED' },
            headers: { etag: '"1"' },
          };
        }
        if (request.method === 'PATCH') {
          expect(actor, 'independent actual rejecting session').to.equal('synthetic-B');
          expect(request.headers).to.have.property('If-Match', '"1"');
          detail.casefile_status = 'REJECTED';
          detail.casefile_status_date = '2026-09-15T10:00:00Z';
          if (options.rejectedHistory !== false)
            detail.timeline_data.push({
              username: 'Actor B',
              status: 'Rejected',
              status_date: detail.casefile_status_date,
              reason_text: 'Synthetic correction requested',
            });
          version++;
          return { status: 200, body: {}, headers: { etag: '"2"' } };
        }
        if (request.url.endsWith('/draft-casefiles/17'))
          return { status: 200, body: structuredClone(detail), headers: { etag: `"${version}"` } };
        const references: Record<string, unknown> = {
          '/opal-maintenance-service/countries': {
            refData: [{ country_name: 'United Kingdom', cjs_code: 101, active: true }],
          },
          '/opal-maintenance-service/maintenance-applications': {
            refData: [{ application_code: 'TEST', application_group: 'Create Casefile', active: true }],
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
        expect(references).to.have.property(request.url);
        return { status: 200, body: references[request.url], headers: {} };
      }),
    );
    return { calls, persisted, actor: () => actor };
  }
  for (const transfer of [false, true]) {
    it(
      `AC1, AC3. should create rich owned rejection and retain A with actual amender transfer ${transfer}`,
      { tags: buildTags() },
      () => {
        const runtime = controlledRuntime();
        new RejectedCasefileFixtureActions().prepare(transfer).then((context) => {
          expect(runtime.actor()).to.equal(transfer ? 'synthetic-B' : 'synthetic-A');
          expect(context.owned.inputterId).to.equal('A-id');
          expect(context.amender.id).to.equal(transfer ? 'B-id' : 'A-id');
          expect(context.before.draft.submitted_by).to.equal('A-id');
          expect(context.before.draft.casefile.minor_creditors).to.have.length(2);
          const surname =
            context.before.draft.casefile.respondent_account.respondent.party_details.individual_details!.surname!;
          expect(surname).to.contain(context.owned.marker.slice(4));
          expect(runtime.calls.filter((call) => call.method === 'POST')).to.have.length(1);
          expect(runtime.calls.filter((call) => call.method === 'PATCH')).to.have.length(1);
          expect(Cypress.env('draftCasefileCleanupReceipts')).to.deep.equal([
            {
              id: context.owned.id,
              testRunReference: context.owned.marker,
              cleanupActor: 'synthetic-A',
              cleanupPolicy: 'required',
            },
          ]);
        });
      },
    );
  }
  it('AC3. should require B inputter permission before any POST', { tags: buildTags() }, () => {
    const runtime = controlledRuntime({ b21: false });
    fail('permission 21', () => expect(runtime.calls.filter((call) => call.method === 'POST')).to.have.length(0));
    new RejectedCasefileFixtureActions().prepare(true);
  });
  it('AC1. should reject an incomplete real rejected history', { tags: buildTags() }, () => {
    controlledRuntime({ rejectedHistory: false });
    fail('complete Submitted and Rejected history', () =>
      expect(Cypress.env('draftCasefileCleanupReceipts')).to.have.length(1),
    );
    new RejectedCasefileFixtureActions().prepare(false);
  });
  it('AC5. should require an explicitly configured foreign inputter', { tags: buildTags() }, () => {
    Cypress.env('RM_TEST_ACTORS', { ...Cypress.env('RM_TEST_ACTORS'), foreignBuInputter: '' });
    expect(() => new RejectedCasefileFixtureActions().foreignActor()).to.throw("RM test actor 'foreignBuInputter'");
  });
  it('AC5. should read an actual foreign Maintenance permission 21 identity', { tags: buildTags() }, () => {
    const runtime = controlledRuntime();
    new RejectedCasefileFixtureActions().foreignActor().then((actor) => {
      expect(actor.id).to.equal('foreign-id');
      expect(runtime.calls.filter((call) => call.method === 'POST' || call.method === 'PATCH')).to.have.length(0);
    });
  });
  for (const sample of [
    { label: 'inactive identity', options: { foreignStatus: 'INACTIVE' }, message: 'foreign actor ACTIVE' },
    { label: 'owning BU permission 21', options: { foreignOwning: true }, message: 'no owning BU permission 21' },
    { label: 'missing other BU permission 21', options: { foreignOther: false }, message: 'another Maintenance BU' },
  ]) {
    it(`AC5. should reject foreign ${sample.label}`, { tags: buildTags() }, () => {
      const runtime = controlledRuntime(sample.options);
      fail(sample.message, () => expect(runtime.calls.filter((call) => call.method === 'POST')).to.have.length(0));
      new RejectedCasefileFixtureActions().foreignActor();
    });
  }
  for (const transfer of [false, true]) {
    it(
      `AC3. should persist observed cleanup authority transfer ${transfer} without relabelling creator`,
      { tags: buildTags() },
      () => {
        const { context, saved } = exampleResubmission(transfer);
        const originalOwned = structuredClone(context.owned);
        recordCreatedId(context.owned.id, context.owned.marker);
        configureDraftCasefileCleanup(context.owned.id, context.owned.marker, {
          actor: context.owned.inputter,
          policy: 'required',
        });
        const writes: unknown[] = [];
        cy.stub(cy, 'writeFile').callsFake((_path: string, body: unknown) =>
          cy.then(() => {
            writes.push(body);
          }),
        );
        new RejectedCasefileFixtureActions().recordCleanupActor(context, saved).then(() => {
          expect(context.owned).to.deep.equal(originalOwned);
          expect(Cypress.env('draftCasefileCleanupReceipts')[0].cleanupActor).to.equal(context.amender.email);
          expect(writes).to.have.length(1);
        });
      },
    );
  }
  for (const fault of ['ID', 'BU', 'marker', 'actor', 'actor name', 'missing receipt', 'receipt marker'] as const) {
    it(`AC3. should preserve receipt on failed observed authority ${fault}`, { tags: buildTags() }, () => {
      const { context, saved } = exampleResubmission(true);
      if (fault !== 'missing receipt') {
        recordCreatedId(context.owned.id, fault === 'receipt marker' ? 'E2E-9999999999999999' : context.owned.marker);
        configureDraftCasefileCleanup(
          context.owned.id,
          fault === 'receipt marker' ? 'E2E-9999999999999999' : context.owned.marker,
          { actor: context.owned.inputter, policy: 'required' },
        );
      }
      const receipts = structuredClone(Cypress.env('draftCasefileCleanupReceipts'));
      if (fault === 'ID') saved.draft.draft_casefile_id++;
      if (fault === 'BU') saved.draft.business_unit_id++;
      if (fault === 'marker') saved.draft.casefile.respondent_account.remo_reference = 'E2E-9999999999999999';
      if (fault === 'actor') saved.draft.submitted_by = 'unknown';
      if (fault === 'actor name') saved.draft.submitted_by_name = 'unknown';
      expect(() => new RejectedCasefileFixtureActions().recordCleanupActor(context, saved)).to.throw();
      expect(Cypress.env('draftCasefileCleanupReceipts')).to.deep.equal(receipts);
    });
  }
});
