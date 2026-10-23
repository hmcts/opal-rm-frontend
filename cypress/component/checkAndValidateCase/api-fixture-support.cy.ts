import { buildSyntheticDraftRequest } from '../../e2e/functional/opal/actions/checkAndValidateCase/draft-casefile-payload';
import {
  captureCreatedDraft,
  postSyntheticDraft,
} from '../../e2e/functional/opal/actions/checkAndValidateCase/draft-casefile-api.actions';
import { DRAFT_CASEFILE_RECOVERY_REQUEST } from '../../e2e/functional/opal/actions/checkAndValidateCase/mocks/draft-casefile-request.mock';

describe('PO-10626 owned API fixture support', () => {
  const marker = 'E2E-0123456789abcdef';
  let expectedFailure: boolean;
  let observedFailure: boolean;

  beforeEach(() => {
    Cypress.env('draftCasefileCleanupReceipts', []);
    expectedFailure = false;
    observedFailure = false;
  });

  afterEach(() => {
    try {
      if (expectedFailure) expect(observedFailure, 'expected support failure observed').to.equal(true);
    } finally {
      Cypress.env('draftCasefileCleanupReceipts', []);
    }
  });

  it(
    'AC2. should build only client-owned fields and use supplied live references',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const originalFixture = structuredClone(DRAFT_CASEFILE_RECOVERY_REQUEST);
      const payload = buildSyntheticDraftRequest(marker, 'LIVE01', 101);
      expect(Object.keys(payload).sort()).to.deep.equal(['business_unit_id', 'casefile', 'casefile_type']);
      expect(payload.casefile.respondent_account.remo_reference).to.equal(marker);
      expect(payload.casefile.respondent_account.application_code).to.equal('LIVE01');
      expect(payload.casefile.respondent_account.respondent.party_details.address.cjs_code).to.equal(101);
      expect(payload.casefile.applicant.party_details.address.cjs_code).to.equal(101);
      expect(payload.casefile.respondent_account.order_details.order_terms[0].creditor_type).to.equal('Applicant');
      const second = buildSyntheticDraftRequest('E2E-fedcba9876543210', 'LIVE02', 102);
      second.casefile.respondent_account.respondent.party_details.individual_details!.forenames = 'Changed';
      expect(payload.casefile.respondent_account.respondent.party_details.individual_details!.forenames).to.equal(
        'Synthetic',
      );
      payload.casefile.applicant.party_details.address.address_line_1 = 'Changed';
      expect(second.casefile.applicant.party_details.address.address_line_1).to.equal('2 Test Street');
      expect(Object.keys(second).sort()).to.deep.equal(['business_unit_id', 'casefile', 'casefile_type']);
      expect(DRAFT_CASEFILE_RECOVERY_REQUEST).to.deep.equal(originalFixture);
      expect(DRAFT_CASEFILE_RECOVERY_REQUEST.casefile.respondent_account).not.to.have.property('remo_reference');
      expect(DRAFT_CASEFILE_RECOVERY_REQUEST.casefile.respondent_account.application_code).to.equal('TEST01');
      expect(
        DRAFT_CASEFILE_RECOVERY_REQUEST.casefile.respondent_account.respondent.party_details.address.cjs_code,
      ).to.equal(1);
      expect(DRAFT_CASEFILE_RECOVERY_REQUEST.casefile.applicant.party_details.address.cjs_code).to.equal(1);
      expect(() => buildSyntheticDraftRequest('bad-marker', 'LIVE01', 101)).to.throw('run marker');
    },
  );

  it(
    'AC1, AC2. should retain cleanup ownership before a malformed creation ETag fails',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const writes: { path: string; body: { outstanding: { id: number }[] } }[] = [];
      cy.stub(cy, 'writeFile').callsFake((path, body) =>
        cy.then(() => {
          writes.push({ path, body });
          return null;
        }),
      );
      expectedFailure = true;
      cy.once('fail', (error) => {
        if (!error.message.includes('Creation response has no ETag')) throw error;
        observedFailure = true;
        expect(error.message).to.contain('Creation response has no ETag');
        expect(Cypress.env('draftCasefileCleanupReceipts')).to.deep.equal([
          {
            id: 101,
            testRunReference: marker,
            cleanupActor: 'synthetic-inputter',
            cleanupPolicy: 'required',
          },
        ]);
        expect(writes).to.have.length(1);
        expect(writes[0].body.outstanding[0].id).to.equal(101);
        return false;
      });
      captureCreatedDraft(
        { status: 201, body: { draft_casefile_id: 101 }, headers: {} } as Cypress.Response<unknown>,
        marker,
        'synthetic-inputter',
      );
    },
  );

  function expectFailure(message: string, verify: () => void): void {
    expectedFailure = true;
    cy.once('fail', (error) => {
      if (!error.message.includes(message)) throw error;
      observedFailure = true;
      verify();
      return false;
    });
  }

  function stubLedger(): { path: string; body: unknown }[] {
    const writes: { path: string; body: unknown }[] = [];
    cy.stub(cy, 'writeFile').callsFake((path, body) =>
      cy.then(() => {
        writes.push({ path, body });
        return null;
      }),
    );
    return writes;
  }

  const parameters = [
    { name: 'Amount', mandatory: true },
    { name: 'Frequency', mandatory: true, options: ['Monthly', 'Weekly'] },
    { name: 'Creditor', mandatory: true },
    { name: 'Respondent', mandatory: true },
    { name: 'Payment', mandatory: true, options: ['Payable through the Court'] },
    { name: 'Commencement', mandatory: true },
  ];
  const countriesPath = '/opal-maintenance-service/countries';
  const applicationsPath = '/opal-maintenance-service/maintenance-applications';
  const resultsPath = '/opal-maintenance-service/results';
  const detailPath = '/opal-maintenance-service/results/MAT';
  const draftsPath = '/opal-maintenance-service/draft-casefiles';

  function referenceReplies(): Record<string, unknown> {
    return {
      [countriesPath]: {
        count: 1,
        refData: [
          {
            country_id: 901,
            country_name: 'United Kingdom',
            cjs_code: 101,
            active: true,
            date_used_from: '2026-01-01',
          },
        ],
      },
      [applicationsPath]: {
        count: 1,
        refData: [
          {
            application_id: 902,
            application_code: 'LIVE01',
            application_title: 'Synthetic',
            application_group: 'Create Casefile',
            active: true,
          },
        ],
      },
      [resultsPath]: { count: 1, refData: [{ result_id: 'MAT', result_title: 'Maintenance' }] },
      [detailPath]: { result_id: 'MAT', result_title: 'Maintenance', result_parameters: JSON.stringify(parameters) },
    };
  }

  function stubRequests(
    replies: Record<string, unknown>,
    calls: Cypress.RequestOptions[],
    creationStatus: number | 'transport-loss' = 201,
  ): void {
    cy.stub(cy, 'request').callsFake((options: Cypress.RequestOptions) =>
      cy.then(() => {
        calls.push(options);
        if (options.method === 'POST') {
          if (creationStatus === 'transport-loss') throw new Error('Controlled fixture transport loss');
          return {
            status: creationStatus,
            body: creationStatus === 201 ? { draft_casefile_id: 101, casefile_status: 'SUBMITTED' } : {},
            headers: { etag: '"1"' },
          };
        }
        expect(options.method).to.equal('GET');
        expect(replies).to.have.property(options.url);
        return { status: 200, body: replies[options.url], headers: {} };
      }),
    );
  }

  it(
    'AC2. should refuse unusable live reference values before building a payload',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      for (const code of ['', '  ', 'TOOLONG01']) {
        expect(() => buildSyntheticDraftRequest(marker, code, 101)).to.throw('live application code');
      }
      for (const code of [0, -1, 1.5, 32768, Number.NaN, Number.POSITIVE_INFINITY]) {
        expect(() => buildSyntheticDraftRequest(marker, 'LIVE01', code)).to.throw('live country CJS code');
      }
    },
  );

  it(
    'AC1, AC2. should persist the exact owned receipt before returning a valid creation',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const writes = stubLedger();
      captureCreatedDraft(
        {
          status: 201,
          body: { draft_casefile_id: 101, casefile_status: 'SUBMITTED' },
          headers: { etag: '"2"' },
          allRequestResponses: [],
          duration: 0,
          isOkStatusCode: true,
          requestHeaders: {},
          statusText: 'Created',
        },
        marker,
        'synthetic-inputter',
      ).then((created) => {
        expect(created).to.deep.equal({ id: 101, etag: '"2"' });
        expect(writes).to.deep.equal([
          {
            path: `functional-output/draft-casefile-cleanup/${marker}-101.json`,
            body: { baseUrl: Cypress.config('baseUrl'), outstanding: Cypress.env('draftCasefileCleanupReceipts') },
          },
        ]);
      });
    },
  );

  it(
    'AC1, AC2. should accept the original uppercase ETag header',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      stubLedger();
      captureCreatedDraft(
        {
          status: 201,
          body: { draft_casefile_id: 101, casefile_status: 'SUBMITTED' },
          headers: { ETag: '"9223372036854775807"' },
          allRequestResponses: [],
          duration: 0,
          isOkStatusCode: true,
          requestHeaders: {},
          statusText: 'Created',
        },
        marker,
        'synthetic-inputter',
      ).should('deep.equal', { id: 101, etag: '"9223372036854775807"' });
    },
  );

  it(
    'AC1, AC2. should never fabricate cleanup ownership from an invalid creation ID',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const writes = stubLedger();
      for (const id of [undefined, '101', 0, -1, 1.1, Number.MAX_SAFE_INTEGER + 1]) {
        expect(() =>
          captureCreatedDraft(
            {
              status: 201,
              body: { draft_casefile_id: id },
              headers: { etag: '"1"' },
              allRequestResponses: [],
              duration: 0,
              isOkStatusCode: true,
              requestHeaders: {},
              statusText: 'Created',
            },
            marker,
            'synthetic-inputter',
          ),
        ).to.throw(
          `Fixture POST returned HTTP 201 without a usable draft ID; run ${marker}. No cleanup ID can be inferred`,
        );
      }
      expect(Cypress.env('draftCasefileCleanupReceipts')).to.deep.equal([]);
      expect(writes).to.deep.equal([]);
    },
  );

  it(
    'AC1, AC2. should retain the in-memory receipt when its ledger write fails',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      cy.stub(cy, 'writeFile').callsFake(() =>
        cy.then(() => {
          throw new Error('Controlled ledger write failure');
        }),
      );
      expectFailure('Controlled ledger write failure', () => {
        expect(Cypress.env('draftCasefileCleanupReceipts')).to.deep.equal([
          { id: 101, testRunReference: marker, cleanupActor: 'synthetic-inputter', cleanupPolicy: 'required' },
        ]);
      });
      captureCreatedDraft(
        {
          status: 201,
          body: { draft_casefile_id: 101, casefile_status: 'SUBMITTED' },
          headers: { etag: '"1"' },
          allRequestResponses: [],
          duration: 0,
          isOkStatusCode: true,
          requestHeaders: {},
          statusText: 'Created',
        },
        marker,
        'synthetic-inputter',
      );
    },
  );

  it(
    'AC1, AC2. should post once through the authenticated proxy with live references and no backend-owned fields',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const calls: Cypress.RequestOptions[] = [];
      const writes = stubLedger();
      stubRequests(referenceReplies(), calls);
      postSyntheticDraft('synthetic-inputter').then((created) => {
        expect(created.id).to.equal(101);
        expect(created.etag).to.equal('"1"');
        expect(created.marker).to.match(/^E2E-[0-9a-f]{16}$/);
        expect(calls.map(({ url }) => url)).to.deep.equal([
          countriesPath,
          applicationsPath,
          resultsPath,
          detailPath,
          draftsPath,
        ]);
        expect(calls[0].qs).to.deep.equal({ active: true });
        expect(calls[1].qs).to.deep.equal({ active: true, application_group: 'Create Casefile' });
        expect(calls[2].qs).to.deep.equal({ order_term: true, active: true });
        const posts = calls.filter(({ method }) => method === 'POST');
        expect(posts).to.have.length(1);
        expect(posts[0].url).to.equal(draftsPath);
        const payload = posts[0].body as ReturnType<typeof buildSyntheticDraftRequest>;
        expect(Object.keys(payload).sort()).to.deep.equal(['business_unit_id', 'casefile', 'casefile_type']);
        expect(payload.business_unit_id).to.equal(44);
        expect(payload.casefile.respondent_account.business_unit_id).to.equal(payload.business_unit_id);
        expect(payload.casefile_type).to.equal('REMO In');
        expect(payload.casefile.respondent_account.casefile_type).to.equal(payload.casefile_type);
        expect(payload.casefile.respondent_account.remo_reference).to.equal(created.marker);
        expect(payload.casefile.respondent_account.application_code).to.equal('LIVE01');
        expect(payload.casefile.respondent_account.respondent.party_details.address.cjs_code).to.equal(101);
        expect(payload.casefile.applicant.party_details.address.cjs_code).to.equal(101);
        for (const call of calls) {
          expect(call.failOnStatusCode).to.equal(false);
          expect(call.followRedirect).to.equal(false);
          expect(call.retryOnNetworkFailure).to.equal(false);
          expect(call.retryOnStatusCodeFailure).to.equal(false);
          expect(call.log).to.equal(false);
        }
        expect(writes).to.have.length(1);
        expect(Cypress.env('draftCasefileCleanupReceipts')).to.deep.equal([
          { id: 101, testRunReference: created.marker, cleanupActor: 'synthetic-inputter', cleanupPolicy: 'required' },
        ]);
      });
    },
  );

  it(
    'AC1, AC2. should retain the known run marker and fail once when creation loses transport before returning an ID',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const calls: Cypress.RequestOptions[] = [];
      const log = cy.spy(cy, 'log');
      stubRequests(referenceReplies(), calls, 'transport-loss');
      expectFailure('Controlled fixture transport loss', () => {
        const posts = calls.filter(({ method }) => method === 'POST');
        expect(posts).to.have.length(1);
        expect(posts[0].retryOnNetworkFailure).to.equal(false);
        expect(posts[0].retryOnStatusCodeFailure).to.equal(false);
        const payload = posts[0].body as ReturnType<typeof buildSyntheticDraftRequest>;
        const runMarker = payload.casefile.respondent_account.remo_reference;
        expect(runMarker).to.match(/^E2E-[0-9a-f]{16}$/);
        expect(log).to.have.been.calledWith(`Synthetic draft fixture run: ${runMarker}`);
        expect(Cypress.env('draftCasefileCleanupReceipts')).to.deep.equal([]);
      });
      postSyntheticDraft('synthetic-inputter');
    },
  );

  const prerequisites: { name: string; path: string; body: unknown; error: string }[] = [
    {
      name: 'missing country dataset',
      path: countriesPath,
      body: {},
      error: 'countries prerequisite requires a refData array',
    },
    {
      name: 'missing active United Kingdom',
      path: countriesPath,
      body: { refData: [] },
      error: 'Provision one active United Kingdom',
    },
    {
      name: 'duplicate United Kingdom CJS code',
      path: countriesPath,
      body: {
        refData: [
          { country_name: 'United Kingdom', cjs_code: 101, active: true },
          { country_name: 'Other', cjs_code: 101, active: false },
        ],
      },
      error: 'unique CJS code',
    },
    {
      name: 'missing application dataset',
      path: applicationsPath,
      body: {},
      error: 'application prerequisite requires a refData array',
    },
    {
      name: 'inactive Create Casefile application',
      path: applicationsPath,
      body: { refData: [{ application_code: 'LIVE01', application_group: 'Create Casefile', active: false }] },
      error: 'Provision an active Create Casefile application',
    },
    {
      name: 'missing order-term dataset',
      path: resultsPath,
      body: {},
      error: 'order-term prerequisite requires a refData array',
    },
    {
      name: 'MAT absent from active order-term results',
      path: resultsPath,
      body: { refData: [] },
      error: 'Provision an active MAT Order Term Result',
    },
    {
      name: 'missing MAT parameter JSON',
      path: detailPath,
      body: { result_id: 'MAT', result_parameters: null },
      error: 'MAT detail requires its parameter JSON',
    },
    { name: 'malformed MAT JSON', path: detailPath, body: { result_id: 'MAT', result_parameters: '{' }, error: 'JSON' },
    {
      name: 'non-array MAT parameters',
      path: detailPath,
      body: { result_id: 'MAT', result_parameters: '{}' },
      error: 'MAT parameters require an array',
    },
    {
      name: 'invalid MAT parameter metadata',
      path: detailPath,
      body: { result_id: 'MAT', result_parameters: '[null]' },
      error: 'MAT parameter metadata is invalid',
    },
    {
      name: 'invalid MAT mandatory metadata',
      path: detailPath,
      body: { result_id: 'MAT', result_parameters: JSON.stringify([{ name: 'Amount', mandatory: 'true' }]) },
      error: 'MAT parameter metadata is invalid',
    },
    {
      name: 'unknown mandatory MAT parameter',
      path: detailPath,
      body: {
        result_id: 'MAT',
        result_parameters: JSON.stringify([...parameters, { name: 'Unknown', mandatory: true }]),
      },
      error: 'Unsupported required MAT parameter: Unknown',
    },
    {
      name: 'duplicate MAT parameter name',
      path: detailPath,
      body: {
        result_id: 'MAT',
        result_parameters: JSON.stringify([...parameters, { name: 'amount', mandatory: true }]),
      },
      error: 'MAT metadata has duplicate parameter names',
    },
    {
      name: 'incompatible MAT menu value',
      path: detailPath,
      body: {
        result_id: 'MAT',
        result_parameters: JSON.stringify(
          parameters.map((field) => (field.name === 'Frequency' ? { ...field, options: ['Yearly'] } : field)),
        ),
      },
      error: 'Synthetic MAT value is outside the live options: Frequency',
    },
    {
      name: 'non-string MAT menu metadata',
      path: detailPath,
      body: {
        result_id: 'MAT',
        result_parameters: JSON.stringify(
          parameters.map((field) => (field.name === 'Frequency' ? { ...field, options: [1] } : field)),
        ),
      },
      error: 'MAT options require strings: Frequency',
    },
    {
      name: 'missing documented MAT response parameter',
      path: detailPath,
      body: {
        result_id: 'MAT',
        result_parameters: JSON.stringify(parameters.filter((field) => field.name !== 'Amount')),
      },
      error: 'Provision the six documented MAT fixture parameters',
    },
  ];

  for (const prerequisite of prerequisites) {
    it(
      `AC1, AC2. should prevent fixture POST for ${prerequisite.name}`,
      { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
      () => {
        const calls: Cypress.RequestOptions[] = [];
        const replies = referenceReplies();
        replies[prerequisite.path] = prerequisite.body;
        stubRequests(replies, calls);
        expectFailure(prerequisite.error, () => {
          expect(calls.filter(({ method }) => method === 'POST')).to.have.length(0);
          expect(Cypress.env('draftCasefileCleanupReceipts')).to.deep.equal([]);
        });
        postSyntheticDraft('synthetic-inputter');
      },
    );
  }

  for (const status of [401, 403]) {
    it(
      `AC1, AC2. should fail setup on fixture POST HTTP ${status} without retrying or inventing ownership`,
      { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
      () => {
        const calls: Cypress.RequestOptions[] = [];
        stubRequests(referenceReplies(), calls, status);
        expectFailure(`Fixture POST returned HTTP ${status} without a usable draft ID`, () => {
          expect(calls.filter(({ method }) => method === 'POST')).to.have.length(1);
          expect(Cypress.env('draftCasefileCleanupReceipts')).to.deep.equal([]);
        });
        postSyntheticDraft('synthetic-inputter');
      },
    );
  }
});
