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
import { versionValue } from '../../e2e/functional/opal/actions/checkAndValidateCase/draft-casefile-evidence.actions';

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
    'AC1. should preserve native promises for observed and unrelated pass-through calls',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const original = Cypress.sinon.stub();
      const promise = Promise.resolve(new Response('{}', { status: 409 }));
      original.returns(promise);
      const host = { fetch: original, location: window.location };
      const control = createMutationControl('none');
      const restore = installDraftCasefileFetchMonitor(host, 101, 'PATCH', 'none', control.monitor);
      expect(host.fetch('/opal-maintenance-service/draft-casefiles/101', { method: 'PATCH' })).to.equal(promise);
      expect(control.monitor.applicationAttempts).to.equal(1);
      expect(host.fetch('/opal-maintenance-service/draft-casefiles/102', { method: 'PATCH' })).to.equal(promise);
      expect(host.fetch('/opal-maintenance-service/draft-casefiles/101', { method: 'PUT' })).to.equal(promise);
      expect(control.monitor.applicationAttempts).to.equal(1);
      restore();
      expect(host.fetch).to.equal(original);
    },
  );
  it(
    'AC1. should preserve an unrelated native promise while response loss is armed',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const promise = Promise.resolve(new Response('{}', { status: 200 }));
      const original = Cypress.sinon.stub().returns(promise);
      const host = { fetch: original, location: window.location };
      const control = createMutationControl('lost-response');
      const restore = installDraftCasefileFetchMonitor(host, 101, 'PATCH', 'lost-response', control.monitor);
      expect(host.fetch('/opal-maintenance-service/draft-casefiles/102', { method: 'PATCH' })).to.equal(promise);
      expect(control.monitor.applicationAttempts).to.equal(0);
      expect(control.monitor.droppedResponses).to.equal(0);
      restore();
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
});
