import type { CyHttpMessages } from 'cypress/types/net-stubbing';
import { CheckAndValidateCaseSelectors as S } from '../../shared/selectors/check-and-validate-case.selectors';
import { createMutationControl } from '../../e2e/functional/opal/actions/checkAndValidateCase/draft-casefile-transport.actions';
import {
  assertRecoveredReviewSections,
  assertRetainedCheckerDecision,
  assertRetryDestination,
  savedStatusLabel,
} from '../../e2e/functional/opal/actions/checkAndValidateCase/draft-casefile-recovery.actions';
import {
  versionValue,
  decodePublicationEvidence,
} from '../../e2e/functional/opal/actions/checkAndValidateCase/draft-casefile-evidence.actions';

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
      cy.get(S.dashboardSuccess)
        .invoke('text')
        .then((hostText) => {
          expect(() =>
            assertRetryDestination('/cases/draft/check-and-validate/tabs', hostText, 'reject', 'Owned Respondent'),
          ).to.throw('owned checker decision notice');
        });
      cy.get(S.dashboardSuccessText)
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
    'forwards a request before dropping its real successful response and counts later attempts',
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
      expect(sent).to.deep.equal([{ forceNetworkError: true }]);
      expect(control.monitor.upstreamSuccesses).to.equal(1);
      expect(control.monitor.upstreamEtag).to.equal('"5"');
      control.handleRequest({
        ...request,
        continue: (callback: (value: CyHttpMessages.IncomingHttpResponse) => void) => callback(response),
      } as unknown as CyHttpMessages.IncomingHttpRequest);
      expect(control.monitor.attempts).to.equal(2);
      expect(control.monitor.droppedResponses).to.equal(1);
      expect(sent).to.have.length(1);
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
      expect(() => control.handleRequest(request)).to.throw(
        'Expected a real upstream HTTP 200 before losing its response',
      );
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
    'requires complete, owned producer evidence rather than fabricating zero',
    { tags: ['@JIRA-EPIC:PO-10817', '@JIRA-STORY:PO-10626'] },
    () => {
      const owned = { id: 101, marker: 'E2E-0123456789abcdef' };
      const evidence = {
        draft_casefile_id: 101,
        test_run_reference: owned.marker,
        accepted_publication_requests: 0,
        recording_started_before_approval: true,
        complete: true,
      };
      expect(decodePublicationEvidence(owned, evidence).accepted_publication_requests).to.equal(0);
      for (const changed of [
        { draft_casefile_id: 102 },
        { test_run_reference: 'E2E-fedcba9876543210' },
        { accepted_publication_requests: undefined },
        { accepted_publication_requests: -1 },
        { accepted_publication_requests: 0.5 },
        { complete: false },
        { recording_started_before_approval: false },
      ]) {
        expect(() => decodePublicationEvidence(owned, { ...evidence, ...changed })).to.throw(
          'Incomplete or mismatched publication evidence',
        );
      }
    },
  );
});
