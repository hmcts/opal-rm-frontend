import { CasesDraftSelectors as D } from '../../shared/selectors/cases-draft.selectors';
import type { CyHttpMessages } from 'cypress/types/net-stubbing';
import {
  createMutationControl,
  installDraftCasefileFetchMonitor,
} from '../../e2e/functional/opal/actions/checkAndValidateCase/draft-casefile-transport.actions';
import {
  assertRecoveredReviewSections,
  assertRetainedCheckerDecision,
  assertRetryDestination,
  savedStatusLabel,
} from '../../e2e/functional/opal/actions/checkAndValidateCase/draft-casefile-recovery.actions';
import {
  versionValue,
  decodePublicationEvidence,
  assertPublicationDelta,
  registerPublicationEvidence,
  readPublicationEvidence,
} from '../../e2e/functional/opal/actions/checkAndValidateCase/draft-casefile-evidence.actions';
import { recordCreatedId, configureDraftCasefileCleanup } from '../../support/draftCasefiles';

describe('PO-10624 owned deletion destination support', () => {
  const buildTags = (): string[] => [
    '@R1CRmCreateCaseFiles',
    '@JIRA-STORY:PO-10624',
    '@JIRA-EPIC:PO-10817',
    '@JIRA-LABEL:create-draft-casefile',
    '@retries(0)',
  ];
  it(
    'AC1. should require the exact owned Deleted notice on the real checker destination',
    { tags: buildTags() },
    () => {
      const destination = '/cases/draft/check-and-validate/tabs';
      assertRetryDestination(destination, 'You have deleted Synthetic’s case.', 'delete', 'Synthetic');
      assertRetryDestination(destination, 'You have rejected Synthetic’s case.', 'reject', 'Synthetic');
      for (const notice of [
        'You have rejected Synthetic’s case.',
        'You have deleted Other’s case.',
        'You have deleted Synthetic’s case. Extra text',
      ]) {
        expect(() => assertRetryDestination(destination, notice, 'delete', 'Synthetic')).to.throw(
          'owned checker decision notice',
        );
      }
      expect(() =>
        assertRetryDestination(
          '/cases/draft/check-and-validate/review/101',
          'You have deleted Synthetic’s case.',
          'delete',
          'Synthetic',
        ),
      ).to.throw('checker decision destination');
    },
  );
});

describe('PO-10626 concurrency test support', () => {
  it(
    'requires the owned success notice on the actual retry destination',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      assertRetryDestination(
        '/cases/draft/check-and-validate/tabs',
        'You have approved Owned Respondent’s case.',
        'approve',
        'Owned Respondent',
      );
      assertRetryDestination(
        '/cases/draft/create-and-manage/tabs',
        "You have submitted Owned Respondent's case for review.",
        'resubmit',
        'Owned Respondent',
      );
      expect(() =>
        assertRetryDestination(
          '/cases/draft/check-and-validate/review/101',
          'You have approved Owned Respondent’s case.',
          'approve',
          'Owned Respondent',
        ),
      ).to.throw('checker decision destination');
      expect(() =>
        assertRetryDestination(
          '/cases/draft/check-and-validate/tabs',
          'You have approved Other Respondent’s case.',
          'approve',
          'Owned Respondent',
        ),
      ).to.throw('owned checker decision notice');
    },
  );
  it(
    'reads only the message inside a dismissible rendered MOJ success alert',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      cy.document().then((doc) => {
        const alert = doc.createElement('opal-lib-moj-alert');
        alert.id = 'cases-draft-success';
        alert.innerHTML =
          '<opal-lib-moj-alert-content-text>You have rejected Owned Respondent’s case.</opal-lib-moj-alert-content-text><button type="button">Dismiss</button><span aria-live="polite">Success announcement</span>';
        doc.body.appendChild(alert);
      });
      cy.get(D.success)
        .invoke('text')
        .then((hostText) => {
          expect(() =>
            assertRetryDestination('/cases/draft/check-and-validate/tabs', hostText, 'reject', 'Owned Respondent'),
          ).to.throw('owned checker decision notice');
        });
      cy.get(D.successText)
        .invoke('text')
        .then((message) => {
          assertRetryDestination('/cases/draft/check-and-validate/tabs', message, 'reject', 'Owned Respondent');
        });
    },
  );
  it(
    'rejects a cleared approval after failure and before a locked resubmission',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const approval = document.createElement('input');
      approval.type = 'radio';
      approval.checked = true;
      assertRetainedCheckerDecision(approval, 'approve');
      approval.checked = false;
      expect(() => assertRetainedCheckerDecision(approval, 'approve')).to.throw('approve decision remains selected');
    },
  );

  it(
    'rejects stale status and missing or stale applicant, order, terms and payment sections',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const saved = [
        'Respondent Corrected Name',
        'Applicant Saved Name',
        'Order saved date',
        'Terms saved amount',
        'Payment saved',
      ];
      assertRecoveredReviewSections([...saved], saved);
      expect(savedStatusLabel('REJECTED')).to.equal('Rejected');
      expect(savedStatusLabel('RESUBMITTED')).to.equal('To review');
      expect(savedStatusLabel('RESUBMITTED', true)).to.equal('In review');
      expect(savedStatusLabel('PUBLISHING_FAILED')).to.equal('Failed');
      expect(savedStatusLabel('SUBMITTED')).not.to.equal(savedStatusLabel('REJECTED'));
      for (const index of [1, 2, 3, 4]) {
        expect(() =>
          assertRecoveredReviewSections(
            saved.filter((_, position) => position !== index),
            saved,
          ),
        ).to.throw('all recovered review sections');
        expect(() =>
          assertRecoveredReviewSections(
            saved.map((section, position) => (position === index ? `${section} stale` : section)),
            saved,
          ),
        ).to.throw('all recovered review sections');
      }
    },
  );
  it(
    'AC1. should lose only the first scoped real successful fetch response and restore the wrapper',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const control = createMutationControl('lost-response');
      control.monitor.upstreamSuccesses = 1;
      control.monitor.upstreamEtag = '"5"';
      const success = new Response('{}', { status: 200, headers: { etag: '"5"' } });
      const original = Cypress.sinon.stub().resolves(success);
      const host = { fetch: original, location: window.location };
      const restore = installDraftCasefileFetchMonitor(host, 101, 'PATCH', 'lost-response', control.monitor);
      return host.fetch('/opal-maintenance-service/draft-casefiles/101', { method: 'PATCH' }).then(
        () => {
          throw new Error('Committed response was delivered to the caller');
        },
        async (error: unknown) => {
          expect(error).to.be.instanceOf(TypeError);
          expect(control.monitor.droppedResponses).to.equal(1);
          expect(await host.fetch('/opal-maintenance-service/draft-casefiles/101', { method: 'PATCH' })).to.equal(
            success,
          );
          expect(control.monitor.applicationAttempts).to.equal(2);
          expect(original).to.have.been.calledTwice;
          restore();
          expect(host.fetch).to.equal(original);
        },
      );
    },
  );
  it(
    'AC1. should preserve unrelated requests, rejected responses and original fetch errors',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    async () => {
      const control = createMutationControl('lost-response');
      const rejected = new Response('{}', { status: 409 });
      const failure = new TypeError('Original transport error');
      const original = Cypress.sinon.stub().resolves(rejected);
      const host = { fetch: original, location: window.location };
      const restore = installDraftCasefileFetchMonitor(host, 101, 'PATCH', 'lost-response', control.monitor);
      expect(await host.fetch('/opal-maintenance-service/draft-casefiles/102', { method: 'PATCH' })).to.equal(rejected);
      expect(await host.fetch('/opal-maintenance-service/draft-casefiles/101', { method: 'PUT' })).to.equal(rejected);
      expect(await host.fetch('/opal-maintenance-service/draft-casefiles/101', { method: 'PATCH' })).to.equal(rejected);
      original.rejects(failure);
      await host
        .fetch('/opal-maintenance-service/draft-casefiles/101', { method: 'PATCH' })
        .catch((error: unknown) => expect(error).to.equal(failure));
      expect(control.monitor.applicationAttempts).to.equal(2);
      expect(control.monitor.droppedResponses).to.equal(0);
      restore();
      expect(host.fetch).to.equal(original);
    },
  );
  it(
    'AC1. should refuse a fabricated successful response without independent wire proof',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    async () => {
      const control = createMutationControl('lost-response');
      const original = Cypress.sinon.stub().resolves(new Response('{}', { status: 200 }));
      const host = { fetch: original, location: window.location };
      const restore = installDraftCasefileFetchMonitor(host, 101, 'PATCH', 'lost-response', control.monitor);
      let error: unknown;
      try {
        await host.fetch('/opal-maintenance-service/draft-casefiles/101', { method: 'PATCH' });
      } catch (caught: unknown) {
        error = caught;
      }
      expect(String(error)).to.contain('independently observed upstream HTTP 200 and ETag');
      expect(control.monitor.droppedResponses).to.equal(0);
      restore();
    },
  );
  it(
    'AC1. should preserve a newer fetch owner when restoring an older monitor',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const control = createMutationControl('none');
      const original = Cypress.sinon.stub();
      const host = { fetch: original, location: window.location };
      const restore = installDraftCasefileFetchMonitor(host, 101, 'PATCH', 'none', control.monitor);
      const replacement = Cypress.sinon.stub();
      host.fetch = replacement;
      restore();
      expect(host.fetch).to.equal(replacement);
    },
  );
  it(
    'forwards and records real success without destroying the connection, then counts later attempts',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const control = createMutationControl('lost-response');
      const sent: unknown[] = [];
      const response = {
        statusCode: 200,
        headers: { etag: '"5"' },
        send: (value: unknown) => sent.push(value),
      } as unknown as CyHttpMessages.IncomingHttpResponse;
      let forwarded = 0;
      const request = {
        headers: { 'if-match': '"4"' },
        continue: (callback: (value: CyHttpMessages.IncomingHttpResponse) => void) => {
          forwarded++;
          expect(sent).to.have.length(0);
          callback(response);
        },
      } as unknown as CyHttpMessages.IncomingHttpRequest;
      control.handleRequest(request);
      expect(forwarded).to.equal(1);
      expect(sent).to.have.length(0);
      expect(control.monitor.upstreamSuccesses).to.equal(1);
      expect(control.monitor.upstreamEtag).to.equal('"5"');
      control.handleRequest({
        ...request,
        continue: (callback: (value: CyHttpMessages.IncomingHttpResponse) => void) => callback(response),
      } as unknown as CyHttpMessages.IncomingHttpRequest);
      expect(control.monitor.attempts).to.equal(2);
      expect(control.monitor.droppedResponses).to.equal(0);
      expect(sent).to.have.length(0);
      expect(control.monitor.requestVersions).to.deep.equal(['"4"', '"4"']);
    },
  );

  it(
    'never labels an upstream rejection as a committed lost response',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const control = createMutationControl('lost-response');
      const send = cy.stub();
      const request = {
        headers: {},
        continue: (callback: (value: unknown) => void) => callback({ statusCode: 409, headers: {}, send }),
      } as unknown as CyHttpMessages.IncomingHttpRequest;
      control.handleRequest(request);
      expect(control.monitor.lastStatus).to.equal(409);
      expect(send).not.to.have.been.called;
      expect(control.monitor.droppedResponses).to.equal(0);
    },
  );

  it(
    'keeps a definite pre-dispatch failure separate from the explicit live retry',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const control = createMutationControl('definite-failure');
      const reply = cy.stub();
      const continued = cy.stub();
      const request = {
        headers: { 'if-match': '"2"' },
        reply,
        continue: continued,
      } as unknown as CyHttpMessages.IncomingHttpRequest;
      control.handleRequest(request);
      expect(reply).to.have.been.calledOnce;
      expect(reply.firstCall.args[0].statusCode).to.equal(400);
      expect(continued).not.to.have.been.called;
      control.handleRequest(request);
      expect(continued).to.have.been.calledOnce;
      expect(control.monitor.attempts).to.equal(2);
      expect(control.monitor.interceptedFailures).to.equal(1);
    },
  );

  it(
    'reads strong versions without losing signed-64-bit precision',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      expect(versionValue('"0"')).to.equal(0n);
      expect(versionValue('"9223372036854775807"')).to.equal(9223372036854775807n);
      for (const value of ['4', 'W/"4"', '"-1"', '"1","2"', '"9223372036854775808"']) {
        expect(() => versionValue(value), value).to.throw('Invalid authoritative ETag');
      }
    },
  );

  it(
    'AC1. should reject incomplete evidence and extra sends despite one acknowledgment',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const baseline = decodePublicationEvidence({
        observation_id: '11111111-1111-4111-8111-111111111111',
        registered_at: '2026-10-23T10:00:00Z',
        send_attempt_count: 0,
        acknowledged_send_count: 0,
        uncertain_send_count: 0,
        unfinished_send_count: 0,
        evidence_complete: true,
      });
      const success = { ...baseline, send_attempt_count: 1, acknowledged_send_count: 1 };
      assertPublicationDelta(baseline, success, 1);
      assertPublicationDelta(baseline, baseline, 0);
      expect(() =>
        assertPublicationDelta(
          baseline,
          { ...success, send_attempt_count: 2, uncertain_send_count: 1, evidence_complete: false },
          1,
        ),
      ).to.throw();
      expect(() =>
        assertPublicationDelta(baseline, { ...success, observation_id: '22222222-2222-4222-8222-222222222222' }, 1),
      ).to.throw();
      expect(() =>
        assertPublicationDelta(baseline, { ...success, registered_at: '2026-10-23T10:01:00Z' }, 1),
      ).to.throw();
      for (const count of [-1, 0.5, '1', Number.MAX_SAFE_INTEGER + 1]) {
        expect(() => decodePublicationEvidence({ ...baseline, send_attempt_count: count })).to.throw();
      }
      expect(() => decodePublicationEvidence({ ...success, send_attempt_count: 0 })).to.throw();
      expect(() => decodePublicationEvidence({ ...baseline, evidence_complete: 'true' })).to.throw();
      expect(() => decodePublicationEvidence({ ...baseline, observation_id: 'invalid' })).to.throw();
      expect(() => decodePublicationEvidence({ ...baseline, registered_at: 'invalid' })).to.throw();
    },
  );
});

// Controlled synthetic journal values; these tests never dispatch to a live service.
function publicationBaseline() {
  return {
    observation_id: '11111111-1111-4111-8111-111111111111',
    registered_at: '2026-10-23T10:00:00Z',
    send_attempt_count: 0,
    acknowledged_send_count: 0,
    uncertain_send_count: 0,
    unfinished_send_count: 0,
    evidence_complete: true,
  };
}

describe('PO-10626 publication journal validation', () => {
  it(
    'AC1, AC2, AC4. should retain exactly seven fields and unchanged non-approval counts',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const baseline = publicationBaseline();
      const evidence = decodePublicationEvidence({ ...baseline, ignored_extra_field: 'not-allowed' });
      expect(evidence).to.deep.equal(baseline);
      expect(Object.keys(evidence).sort()).to.deep.equal([
        'acknowledged_send_count',
        'evidence_complete',
        'observation_id',
        'registered_at',
        'send_attempt_count',
        'uncertain_send_count',
        'unfinished_send_count',
      ]);
      assertPublicationDelta(baseline, evidence, 0);
      const oneSend = decodePublicationEvidence({ ...baseline, send_attempt_count: 1, acknowledged_send_count: 1 });
      expect(() => assertPublicationDelta(baseline, oneSend, 0)).to.throw('publisher attempt delta');
      expect(() => assertPublicationDelta(baseline, baseline, 1)).to.throw('publisher attempt delta');
      expect(() =>
        assertPublicationDelta(baseline, { ...oneSend, send_attempt_count: 2, acknowledged_send_count: 2 }, 1),
      ).to.throw('publisher attempt delta');
      expect(() => assertPublicationDelta(baseline, { ...oneSend, acknowledged_send_count: 0 }, 1)).to.throw(
        'acknowledged send delta',
      );
    },
  );

  it(
    'AC1. should retain unfinished and uncertain observations but reject them as acceptance evidence',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const baseline = publicationBaseline();
      for (const key of ['uncertain_send_count', 'unfinished_send_count']) {
        const incomplete = decodePublicationEvidence({
          ...baseline,
          send_attempt_count: 1,
          [key]: 1,
          evidence_complete: false,
        });
        expect(incomplete.send_attempt_count).to.equal(1);
        expect(incomplete.evidence_complete).to.equal(false);
        expect(() => assertPublicationDelta(baseline, incomplete, 0)).to.throw('complete publication result');
        expect(() => assertPublicationDelta(incomplete, baseline, 0)).to.throw('complete publication baseline');
        expect(() => assertPublicationDelta(baseline, { ...incomplete, evidence_complete: true }, 1)).to.throw(
          key === 'uncertain_send_count' ? 'uncertain sends' : 'unfinished sends',
        );
      }
    },
  );

  it(
    'AC1. should reject mismatched completeness flags and inconsistent attempt totals',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const baseline = publicationBaseline();
      for (const changed of [
        { evidence_complete: false },
        { send_attempt_count: 1 },
        { acknowledged_send_count: 1 },
        { send_attempt_count: 1, uncertain_send_count: 1 },
        { send_attempt_count: 1, unfinished_send_count: 1 },
        { send_attempt_count: 1, uncertain_send_count: 1, unfinished_send_count: 1, evidence_complete: false },
      ]) {
        expect(() => decodePublicationEvidence({ ...baseline, ...changed })).to.throw(
          'Inconsistent publication evidence',
        );
      }
    },
  );

  it(
    'AC1. should reject every missing journal field',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const baseline = publicationBaseline();
      for (const key of Object.keys(baseline)) {
        const missing: Record<string, unknown> = { ...baseline };
        delete missing[key];
        expect(() => decodePublicationEvidence(missing), key).to.throw();
      }
    },
  );

  it(
    'AC1. should reject unsafe counts without coercion',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const baseline = publicationBaseline();
      for (const key of [
        'send_attempt_count',
        'acknowledged_send_count',
        'uncertain_send_count',
        'unfinished_send_count',
      ]) {
        for (const count of [-1, 0.5, '1', Number.MAX_SAFE_INTEGER + 1, Number.NaN, Number.POSITIVE_INFINITY, null]) {
          expect(() => decodePublicationEvidence({ ...baseline, [key]: count }), key).to.throw(
            'nonnegative safe integer',
          );
        }
      }
      expect(
        decodePublicationEvidence({
          ...baseline,
          send_attempt_count: Number.MAX_SAFE_INTEGER,
          acknowledged_send_count: Number.MAX_SAFE_INTEGER,
        }).send_attempt_count,
      ).to.equal(Number.MAX_SAFE_INTEGER);
    },
  );

  it(
    'AC1. should reject the obsolete response shape and non-object evidence',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      for (const body of [
        null,
        [],
        0,
        {
          draft_casefile_id: 101,
          test_run_reference: 'E2E-0123456789abcdef',
          accepted_publication_requests: 0,
          recording_started_before_approval: true,
          complete: true,
        },
      ]) {
        expect(() => decodePublicationEvidence(body)).to.throw('Malformed publication observation identity');
      }
    },
  );

  it(
    'AC1. should require an observation UUID and a parseable timestamp with explicit timezone',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const baseline = publicationBaseline();
      for (const registered_at of ['2026-10-23', '2026-10-23T10:00:00', 'invalidT00:00:00Z', 0]) {
        expect(() => decodePublicationEvidence({ ...baseline, registered_at })).to.throw(
          'Malformed publication observation identity',
        );
      }
      for (const observation_id of ['', 'invalid', 101]) {
        expect(() => decodePublicationEvidence({ ...baseline, observation_id })).to.throw(
          'Malformed publication observation identity',
        );
      }
      expect(
        decodePublicationEvidence({ ...baseline, registered_at: '2026-10-23T11:00:00+01:00' }).registered_at,
      ).to.equal('2026-10-23T11:00:00+01:00');
    },
  );
});

describe('PO-10626 scoped publication requests', () => {
  const owned = { id: 101, marker: 'E2E-0123456789abcdef' };
  let previousReceipts: unknown;
  let previousPath: unknown;
  let expectedFailure: boolean;
  let observedFailure: boolean;

  beforeEach(() => {
    previousReceipts = Cypress.env('draftCasefileCleanupReceipts');
    previousPath = Cypress.env('PO10626_PUBLICATION_EVIDENCE_PATH');
    Cypress.env('draftCasefileCleanupReceipts', []);
    recordCreatedId(owned.id, owned.marker);
    configureDraftCasefileCleanup(owned.id, owned.marker, { actor: 'synthetic-inputter', policy: 'required' });
    expectedFailure = false;
    observedFailure = false;
  });

  afterEach(() => {
    try {
      if (expectedFailure) expect(observedFailure, 'expected publication failure observed').to.equal(true);
    } finally {
      Cypress.env('draftCasefileCleanupReceipts', previousReceipts);
      Cypress.env('PO10626_PUBLICATION_EVIDENCE_PATH', previousPath);
    }
  });

  function assertScopedOptions(options: Cypress.RequestOptions): void {
    expect(options.url).to.equal('/opal-maintenance-service/testing-support/draft-casefiles/101/publication-evidence');
    expect(options.headers).to.deep.equal({ 'Test-Run-Reference': 'E2E-0123456789abcdef' });
    expect(options).not.to.have.property('body');
    expect(options.failOnStatusCode).to.equal(false);
    expect(options.followRedirect).to.equal(false);
    expect(options.retryOnNetworkFailure).to.equal(false);
    expect(options.retryOnStatusCodeFailure).to.equal(false);
    expect(options.log).to.equal(false);
  }

  function expectFailure(message: string): void {
    expectedFailure = true;
    cy.once('fail', (error) => {
      if (!error.message.includes(message)) throw error;
      observedFailure = true;
      expect(Cypress.env('draftCasefileCleanupReceipts')).to.deep.equal([
        { id: 101, testRunReference: owned.marker, cleanupActor: 'synthetic-inputter', cleanupPolicy: 'required' },
      ]);
      return false;
    });
  }

  for (const status of [201, 200]) {
    it(
      `AC1. should register with HTTP ${status} before reading the same fixed scoped observation`,
      { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
      () => {
        const methods: string[] = [];
        Cypress.env('PO10626_PUBLICATION_EVIDENCE_PATH', '/opal-maintenance-service/testing-support/arbitrary/{id}');
        cy.stub(cy, 'request').callsFake((options: Cypress.RequestOptions) => {
          assertScopedOptions(options);
          const expectedMethod = methods.length === 0 ? 'POST' : 'GET';
          expect(options.method).to.equal(expectedMethod);
          methods.push(expectedMethod);
          return cy.wrap(
            { status: expectedMethod === 'POST' ? status : 200, body: publicationBaseline() },
            { log: false },
          );
        });
        registerPublicationEvidence(owned).then((baseline) => {
          expect(baseline).to.deep.equal(publicationBaseline());
          return readPublicationEvidence(owned).then((evidence) => {
            assertPublicationDelta(baseline, evidence, 0);
            expect(methods).to.deep.equal(['POST', 'GET']);
          });
        });
      },
    );
  }

  for (const method of ['POST', 'GET']) {
    for (const status of [401, 403, 404, 409]) {
      it(
        `AC1. should reject ${method} HTTP ${status} and retain the required fixture receipt`,
        { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
        () => {
          let calls = 0;
          cy.stub(cy, 'request').callsFake((options: Cypress.RequestOptions) => {
            calls++;
            expect(calls, 'no request replay').to.equal(1);
            expect(options.method).to.equal(method);
            assertScopedOptions(options);
            return cy.wrap({ status, body: {} }, { log: false });
          });
          expectFailure(method === 'POST' ? 'publication registration' : 'publication evidence read');
          if (method === 'POST') registerPublicationEvidence(owned);
          else readPublicationEvidence(owned);
        },
      );
    }
  }

  for (const method of ['POST', 'GET']) {
    it(
      `AC1. should reject a malformed ${method} response and retain the required fixture receipt`,
      { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
      () => {
        cy.stub(cy, 'request').callsFake((options: Cypress.RequestOptions) => {
          expect(options.method).to.equal(method);
          assertScopedOptions(options);
          return cy.wrap({ status: method === 'POST' ? 201 : 200, body: {} }, { log: false });
        });
        expectFailure('Malformed publication observation identity');
        if (method === 'POST') registerPublicationEvidence(owned);
        else readPublicationEvidence(owned);
      },
    );
  }

  for (const incomplete of [false, true]) {
    it(
      `AC1. should reject registration ${incomplete ? 'with incomplete sends' : 'after an acknowledged send'}`,
      { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
      () => {
        cy.stub(cy, 'request').callsFake((options: Cypress.RequestOptions) => {
          assertScopedOptions(options);
          expect(options.method).to.equal('POST');
          return cy.wrap(
            {
              status: 200,
              body: {
                ...publicationBaseline(),
                send_attempt_count: 1,
                acknowledged_send_count: incomplete ? 0 : 1,
                unfinished_send_count: incomplete ? 1 : 0,
                evidence_complete: !incomplete,
              },
            },
            { log: false },
          );
        });
        expectFailure(incomplete ? 'complete registration baseline' : 'registration before any publication');
        registerPublicationEvidence(owned);
      },
    );
  }

  it(
    'AC1. should preserve a consistent unfinished GET for an explicit failing acceptance assertion',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const incomplete = {
        ...publicationBaseline(),
        send_attempt_count: 1,
        unfinished_send_count: 1,
        evidence_complete: false,
      };
      cy.stub(cy, 'request').callsFake((options: Cypress.RequestOptions) => {
        assertScopedOptions(options);
        expect(options.method).to.equal('GET');
        return cy.wrap({ status: 200, body: incomplete }, { log: false });
      });
      readPublicationEvidence(owned).then((evidence) => {
        expect(evidence).to.deep.equal(incomplete);
        expect(() => assertPublicationDelta(publicationBaseline(), evidence, 0)).to.throw(
          'complete publication result',
        );
      });
    },
  );

  it(
    'AC1. should reject malformed owned scope before dispatching a request',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const request = cy.stub(cy, 'request');
      for (const action of [registerPublicationEvidence, readPublicationEvidence]) {
        for (const marker of ['', 'E2E-0123456789ABCDEF', '../other']) {
          expect(() => action({ ...owned, marker })).to.throw('exact run marker');
        }
        for (const id of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
          expect(() => action({ ...owned, id })).to.throw('positive safe-integer');
        }
      }
      expect(request).not.to.have.been.called;
    },
  );
});
