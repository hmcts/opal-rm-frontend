import { createPersistedCasefileDetail } from '../../../src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import {
  assertDeletedAggregate,
  assertDeletionRetry,
} from '../../e2e/functional/opal/actions/checkAndValidateCase/checker-deletion-evidence.actions';
import type { IDraftCasefileSnapshot } from '../../e2e/functional/opal/actions/checkAndValidateCase/interfaces/draft-casefile-snapshot.interface';
import type { IDraftCasefileMonitor } from '../../e2e/functional/opal/actions/checkAndValidateCase/interfaces/draft-casefile-monitor.interface';
import { accessibilityActions } from '../../e2e/functional/opal/actions/accessibility/accessibility.actions';
import { CheckerDeletionActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/checker-deletion.actions';
import { CheckerDeletionFlow } from '../../e2e/functional/opal/flows/checkAndValidateCase/checker-deletion.flow';
import { CheckerReviewActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/checker-review-decisions.actions';
import type { ICheckerPreparedReview } from '../../e2e/functional/opal/actions/checkAndValidateCase/checker-review-decisions.actions';
import { CheckerReviewFixtureActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/checker-review-fixture.actions';
import { CheckerDashboardWindowActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/checker-dashboard-window.actions';
import { DraftCasefileRecoveryActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/draft-casefile-recovery.actions';
import { CreateCasefileSelectors as C } from '../../shared/selectors/create-casefile.selectors';
import type { CyHttpMessages } from 'cypress/types/net-stubbing';
const buildTags = () => [
  '@R1CRmCreateCaseFiles',
  '@JIRA-STORY:PO-10624',
  '@JIRA-EPIC:PO-10817',
  '@JIRA-LABEL:create-draft-casefile',
  '@retries(0)',
];
const owned = {
  id: 101,
  marker: 'E2E-0123456789abcdef',
  inputter: 'synthetic-inputter',
  checker: 'synthetic-checker',
  inputterId: 'inputter-id',
  checkerId: 'checker-id',
  inputterName: 'Inputter',
  checkerName: 'Checker',
};
const boundaryReason = 'D'.repeat(250);

function ownedSubmittedSnapshot(): IDraftCasefileSnapshot {
  const draft = createPersistedCasefileDetail();
  draft.draft_casefile_id = owned.id;
  draft.submitted_by = owned.inputterId;
  draft.submitted_by_name = owned.inputterName;
  draft.casefile.respondent_account.remo_reference = owned.marker;
  draft.timeline_data = [
    { username: owned.inputterName, status: 'Submitted', status_date: draft.casefile_status_date },
  ];
  return { draft, etag: '"1"' };
}

function deletedSnapshot(): IDraftCasefileSnapshot {
  const saved = Cypress._.cloneDeep(ownedSubmittedSnapshot());
  saved.etag = '"2"';
  saved.draft.casefile_status = 'DELETED';
  saved.draft.casefile_status_date = '2026-10-23T10:00:00Z';
  saved.draft.timeline_data.push({
    username: owned.checkerName,
    status: 'Deleted',
    status_date: saved.draft.casefile_status_date,
    reason_text: boundaryReason,
  });
  return saved;
}

function retryMonitor(): IDraftCasefileMonitor {
  return {
    applicationAttempts: 2,
    attempts: 2,
    upstreamSuccesses: 1,
    interceptedFailures: 1,
    droppedResponses: 0,
    requestVersions: ['"1"', '"1"'],
    lastStatus: 200,
  };
}

describe('PO-10624 retained deletion aggregate evidence', () => {
  it('AC1. should accept one exact deletion with every saved field retained', { tags: buildTags() }, () => {
    assertDeletedAggregate(ownedSubmittedSnapshot(), deletedSnapshot(), owned, boundaryReason);
  });
  const faults: Record<string, (saved: IDraftCasefileSnapshot) => void> = {
    'missing decision': (saved) => saved.draft.timeline_data.pop(),
    'duplicate decision': (saved) => saved.draft.timeline_data.push(Cypress._.cloneDeep(saved.draft.timeline_data[1])),
    'lost prior history': (saved) => {
      saved.draft.timeline_data[0].username = 'Lost history';
    },
    'duplicate prior history': (saved) => {
      saved.draft.timeline_data[1] = Cypress._.cloneDeep(saved.draft.timeline_data[0]);
    },
    'wrong checker': (saved) => {
      saved.draft.timeline_data[1].username = 'Other checker';
    },
    'wrong reason': (saved) => {
      saved.draft.timeline_data[1].reason_text = 'Other reason';
    },
    'wrong event status': (saved) => {
      saved.draft.timeline_data[1].status = 'Rejected';
    },
    'wrong lifecycle': (saved) => {
      saved.draft.casefile_status = 'REJECTED';
    },
    'changed identity': (saved) => {
      saved.draft.draft_casefile_id++;
    },
    'changed marker': (saved) => {
      saved.draft.casefile.respondent_account.remo_reference = 'Other';
    },
    'changed owner': (saved) => {
      saved.draft.submitted_by = 'Other';
    },
    'changed casefile': (saved) => {
      saved.draft.casefile.respondent_account.originator_name = 'Other';
    },
    'changed snapshot': (saved) => {
      saved.draft.casefile_snapshot['respondent_account'] = {};
    },
    'changed validation': (saved) => {
      (saved.draft as unknown as Record<string, unknown>)['validated_by'] = 'Other';
    },
    'unchanged version': (saved) => {
      saved.etag = '"1"';
    },
  };
  for (const [fault, change] of Object.entries(faults)) {
    it(`AC1. should reject a retained aggregate with ${fault}`, { tags: buildTags() }, () => {
      const saved = deletedSnapshot();
      change(saved);
      expect(() => assertDeletedAggregate(ownedSubmittedSnapshot(), saved, owned, boundaryReason)).to.throw();
    });
  }
});

describe('PO-10624 explicit deletion retry evidence', () => {
  it(
    'AC2. should accept two explicit attempts with the same original version and one real success',
    { tags: buildTags() },
    () => {
      assertDeletionRetry(retryMonitor(), '"1"');
    },
  );
  const faults: Record<string, (observed: IDraftCasefileMonitor) => void> = {
    'extra wire attempt': (observed) => {
      observed.attempts = 3;
    },
    'missing wire attempt': (observed) => {
      observed.attempts = 1;
    },
    'extra application attempt': (observed) => {
      observed.applicationAttempts = 3;
    },
    'missing application attempt': (observed) => {
      observed.applicationAttempts = 1;
    },
    'wrong retry version': (observed) => {
      observed.requestVersions[1] = '"2"';
    },
    'multiple provider successes': (observed) => {
      observed.upstreamSuccesses = 2;
    },
    'missing provider success': (observed) => {
      observed.upstreamSuccesses = 0;
    },
    'no injected failure': (observed) => {
      observed.interceptedFailures = 0;
    },
    'multiple injected failures': (observed) => {
      observed.interceptedFailures = 2;
    },
    'uncertain delivery': (observed) => {
      observed.droppedResponses = 1;
    },
    'failed final receipt': (observed) => {
      observed.lastStatus = 400;
    },
  };
  for (const [fault, change] of Object.entries(faults)) {
    it(`AC2. should reject deletion retry evidence with ${fault}`, { tags: buildTags() }, () => {
      const observed = retryMonitor();
      change(observed);
      expect(() => assertDeletionRetry(observed, '"1"')).to.throw();
    });
  }
});

// Controlled boundaries leave scenario dispatch, guards, no-write assertions and collection evidence real.

function noPatchMonitor(): IDraftCasefileMonitor {
  return {
    attempts: 0,
    applicationAttempts: 0,
    upstreamSuccesses: 0,
    interceptedFailures: 0,
    droppedResponses: 0,
    requestVersions: [],
  };
}

function controlledReview() {
  const session: ICheckerPreparedReview = {
    owned,
    before: ownedSubmittedSnapshot(),
    monitor: noPatchMonitor(),
    recovery: new DraftCasefileRecoveryActions(),
  };
  cy.document().then((document) => {
    document.body.innerHTML =
      '<div id="create_casefile_delete_identity">Synthetic Respondent</div><label for="create_casefile_delete_reason">Reason</label><textarea id="create_casefile_delete_reason"></textarea><button id="create_casefile_delete_submit" class="govuk-button--warning">Delete</button>';
  });
  const prepare = cy.stub(CheckerReviewActions.prototype, 'prepareSubmittedReview').callsFake((_transition, ready) => {
    cy.then(() => ready(session));
  });
  cy.stub(session.recovery, 'choose');
  cy.stub(session.recovery, 'capture');
  cy.stub(session.recovery, 'expectedReason').returns('Synthetic concurrency decision');
  return { session, prepare };
}

function expectBoundaryFailure(message: string, verify: () => void = () => undefined): void {
  cy.once('fail', (error) => {
    if (!error.message.includes(message)) throw error;
    verify();
    observedBoundaryFailure = true;
    return false;
  });
}
let observedBoundaryFailure: boolean;

describe('PO-10624 deletion journey safety boundaries', () => {
  it('AC1. should reject an invalid kind before any prepared fixture', { tags: buildTags() }, () => {
    const prepare = cy.stub(CheckerReviewActions.prototype, 'prepareSubmittedReview');
    const create = cy.stub(CheckerReviewFixtureActions.prototype, 'create');
    expect(() => new CheckerDeletionActions().prepare('unknown')).to.throw('Unsupported deletion kind');
    expect(prepare).not.to.have.been.called;
    expect(create).not.to.have.been.called;
  });
  for (const kind of ['success', 'retry']) {
    it(`AC1. should require cleanup before creating a ${kind} fixture`, { tags: buildTags() }, () => {
      const create = cy.stub(CheckerReviewFixtureActions.prototype, 'create');
      cy.stub(CheckerReviewFixtureActions.prototype, 'requireLifecycleCleanup').throws(
        new Error('Controlled cleanup preflight'),
      );
      expect(() => new CheckerDeletionActions().prepare(kind)).to.throw('Controlled cleanup preflight');
      expect(create).not.to.have.been.called;
    });
  }
  for (const kind of ['success', 'cancel', 'blank', 'over-limit', 'retry']) {
    it(
      `AC2. should prepare ${kind} with the exact transition choice and actual typed reason`,
      { tags: buildTags() },
      () => {
        const { session, prepare } = controlledReview();
        const actions = new CheckerDeletionActions();
        actions.prepare(kind);
        cy.then(() => {
          expect(prepare.firstCall.args[0]).to.equal(kind === 'success' || kind === 'retry');
          const expected =
            kind === 'success'
              ? boundaryReason
              : kind === 'over-limit'
                ? 'D'.repeat(251)
                : kind === 'blank'
                  ? ''
                  : 'Synthetic concurrency decision';
          cy.get(C.deletion.reason).should('have.value', expected);
          expect(session.recovery.capture).to.have.been.calledOnceWithExactly('delete');
        });
      },
    );
  }
  it('AC2. should create a fresh action instance on every Given through the thin flow', { tags: buildTags() }, () => {
    const instances: CheckerDeletionActions[] = [];
    cy.stub(CheckerDeletionActions.prototype, 'prepare').callsFake(function (this: CheckerDeletionActions) {
      instances.push(this);
    });
    const cancel = cy.stub(CheckerDeletionActions.prototype, 'cancelToReview');
    const outcome = cy.stub(CheckerDeletionActions.prototype, 'assertOutcome');
    const flow = new CheckerDeletionFlow();
    flow.prepare('cancel');
    flow.cancel();
    flow.assertUnchanged();
    flow.prepare('blank');
    expect(instances).to.have.length(2);
    expect(instances[0]).not.to.equal(instances[1]);
    expect(cancel).to.have.been.calledOnce;
    expect(outcome).to.have.been.calledOnce;
  });
});

describe('PO-10624 deletion boundary rejection evidence', () => {
  beforeEach(() => {
    observedBoundaryFailure = false;
  });
  afterEach(() => expect(observedBoundaryFailure, 'required boundary failure observed').to.equal(true));

  it('AC1. should stop at the transition guard before submitting deletion', { tags: buildTags() }, () => {
    const { session } = controlledReview();
    const submit = cy.stub(session.recovery, 'submit');
    cy.stub(CheckerReviewFixtureActions.prototype, 'requireLifecycleCleanup').throws(
      new Error('Controlled dispatch guard'),
    );
    expectBoundaryFailure('Controlled dispatch guard', () => expect(submit).not.to.have.been.called);
    const actions = new CheckerDeletionActions();
    actions.prepare('success');
    actions.submitOnce();
  });

  for (const kind of ['cancel', 'blank', 'over-limit']) {
    for (const fault of ['missing monitor', 'wire PATCH', 'application PATCH']) {
      it(`AC2. should reject ${kind} evidence with ${fault}`, { tags: buildTags() }, () => {
        const { session } = controlledReview();
        // This test stops at the no-write boundary before any queue consultation.
        let reads = 0;
        cy.stub(cy, 'request').callsFake(() =>
          cy.then(() => {
            reads++;
            return { status: 200, body: session.before.draft, headers: { etag: session.before.etag } };
          }),
        );
        const actions = new CheckerDeletionActions();
        actions.prepare(kind);
        cy.then(() => {
          if (fault === 'missing monitor') session.monitor = undefined as unknown as IDraftCasefileMonitor;
          else if (fault === 'wire PATCH') session.monitor.attempts = 1;
          else session.monitor.applicationAttempts = 1;
        });
        // Validation rendering/focus is independently covered below and by the real form specs.
        cy.stub(actions as unknown as { assertValidation(): void }, 'assertValidation');
        expectBoundaryFailure(
          fault === 'missing monitor'
            ? 'Deletion mutation monitor missing'
            : fault === 'wire PATCH'
              ? 'zero wire PATCH'
              : 'zero application PATCH',
          () => expect(reads, 'no independent read past a failed no-write boundary').to.equal(0),
        );
        actions.assertOutcome();
      });
    }
  }
});

interface CollectionRequest {
  query: Record<string, string>;
  on(event: string, callback: (response: { statusCode: number; body: unknown }) => void): void;
}

function controlledCollection(session: ICheckerPreparedReview, provider: boolean, dom: boolean) {
  let observer: (request: CollectionRequest) => void;
  const providerBody = {
    count: provider ? 1 : 0,
    summaries: provider
      ? [
          {
            draft_casefile_id: owned.id,
            submitted_by: owned.inputterId,
            business_unit_id: 44,
            created_date: '2026-10-23T09:00:00Z',
            casefile_snapshot: {},
            casefile_status: 'DELETED',
            casefile_status_date: '2026-10-23T10:00:00Z',
            submitted_by_name: owned.inputterName,
            respondent_name: 'Synthetic Respondent',
            applicant_name: 'Synthetic Applicant',
            casefile_type: 'REMO In',
          },
        ]
      : [],
  };
  // Only collection navigation is controlled; the production pass-through observer and dual assertions stay real.
  cy.stub(CheckerDashboardWindowActions.prototype, 'observe');
  cy.stub(cy, 'intercept').callsFake((...args: unknown[]) => {
    observer = args[2] as typeof observer;
    return cy.wrap({}, { log: false });
  });
  cy.stub(CheckerDashboardWindowActions.prototype, 'open').callsFake(() => {
    cy.then(() =>
      observer({
        query: { casefile_status: 'DELETED' },
        on: (event, callback) => {
          expect(event).to.equal('response');
          callback({ statusCode: 200, body: providerBody });
        },
      }),
    );
  });
  cy.stub(CheckerDashboardWindowActions.prototype, 'select');
  cy.stub(CheckerDashboardWindowActions.prototype, 'collectIds').callsFake(() =>
    cy.wrap(new Set(dom ? [session.owned.id] : []), { log: false }),
  );
}

describe('PO-10624 actual Deleted collection inclusion evidence', () => {
  let expectedFailure: boolean;
  beforeEach(() => {
    expectedFailure = false;
    observedBoundaryFailure = false;
  });
  afterEach(() => {
    if (expectedFailure) expect(observedBoundaryFailure, 'required collection failure observed').to.equal(true);
  });
  for (const [provider, dom] of [
    [true, true],
    [false, true],
    [true, false],
  ]) {
    it(
      `AC1. should require provider ${provider} and DOM ${dom} independently for Deleted`,
      { tags: buildTags() },
      () => {
        const { session } = controlledReview();
        const actions = new CheckerDeletionActions();
        const seam = actions as unknown as { saved: IDraftCasefileSnapshot; openDeletedRow(): void };
        const opened = cy.stub(seam, 'openDeletedRow');
        cy.stub(session.recovery, 'assertRetrySuccess');
        cy.stub(CheckerReviewActions.prototype, 'assertOwnedAbsentFromQueue');
        cy.stub(CheckerReviewActions.prototype, 'releaseQueueObservation');
        cy.stub(cy, 'location').returns(cy.wrap('#to-review', { log: false }));
        cy.stub(cy, 'request').callsFake(() =>
          cy.wrap({ status: 200, body: deletedSnapshot().draft, headers: { etag: '"2"' } }, { log: false }),
        );
        actions.prepare('success');
        cy.then(() => {
          seam.saved = deletedSnapshot();
          Object.assign(session.monitor, {
            applicationAttempts: 1,
            attempts: 1,
            upstreamSuccesses: 1,
            requestVersions: ['"1"'],
            lastStatus: 200,
          });
        });
        controlledCollection(session, provider, dom);
        if (!provider || !dom) {
          expectedFailure = true;
          expectBoundaryFailure(
            !provider ? 'owned case in actual provider collection' : 'owned case in actual DOM collection',
            () => expect(opened).not.to.have.been.called,
          );
        }
        actions.assertOutcome();
        cy.then(() => expect(opened).to.have.been.calledOnce);
      },
    );
  }
});

/** Drives the maintained transport control at a controlled Fetch/provider boundary; no live requests. */
function controlledRetry(session: ICheckerPreparedReview, events: string[]) {
  let handler: (request: CyHttpMessages.IncomingHttpRequest) => void;
  let response: { statusCode: number; body: unknown; headers: Record<string, string> };
  let attempts = 0;
  const saved = deletedSnapshot();
  saved.draft.timeline_data[1].reason_text = 'Synthetic concurrency decision';
  cy.stub(cy, 'intercept').callsFake((...args: unknown[]) => {
    handler = args[1] as typeof handler;
    return cy.wrap({}, { log: false });
  });
  cy.window().then((window) => {
    cy.stub(window, 'fetch').callsFake((input, options) => {
      expect(input, 'exact owned retry resource').to.equal(`/opal-maintenance-service/draft-casefiles/${owned.id}`);
      expect(options?.method).to.equal('PATCH');
      const headers = new Headers(options?.headers);
      expect(headers.get('if-match'), 'both explicit activations retain original version').to.equal(
        session.before.etag,
      );
      expect(
        JSON.parse(String(options?.body)),
        'both explicit activations retain exact decision and reason',
      ).to.deep.equal({
        business_unit_id: session.before.draft.business_unit_id,
        casefile_status: 'DELETED',
        status_message: 'Synthetic concurrency decision',
      });
      events.push(`activation ${++attempts}`);
      handler({
        headers: { 'if-match': headers.get('if-match')! },
        reply: (reply: { statusCode: number; body: unknown }) => {
          response = { ...reply, headers: {} };
        },
        continue: (received: (actual: typeof response) => void) => {
          response = { statusCode: 200, body: saved.draft, headers: { etag: saved.etag } };
          received(response);
        },
      } as unknown as CyHttpMessages.IncomingHttpRequest);
      return Promise.resolve(
        new Response(JSON.stringify(response.body), { status: response.statusCode, headers: response.headers }),
      );
    });
  });
  cy.stub(cy, 'wait').callsFake(() => cy.then(() => ({ response })));
  const submit = cy.stub(session.recovery, 'submit').callsFake(() => {
    cy.window().then((window) =>
      window.fetch(`/opal-maintenance-service/draft-casefiles/${owned.id}`, {
        method: 'PATCH',
        headers: { 'if-match': session.before.etag },
        body: JSON.stringify({
          business_unit_id: session.before.draft.business_unit_id,
          casefile_status: 'DELETED',
          status_message: String(Cypress.$(C.deletion.reason).val()),
        }),
      }),
    );
  });
  let firstMonitor: IDraftCasefileMonitor;
  cy.stub(session.recovery, 'assertFailure').callsFake(() => {
    cy.then(() => {
      events.push('failure');
      firstMonitor = session.monitor;
      expect(firstMonitor.attempts).to.equal(1);
      expect(firstMonitor.applicationAttempts).to.equal(1);
      expect(firstMonitor.interceptedFailures).to.equal(1);
      expect(firstMonitor.upstreamSuccesses).to.equal(0);
      cy.get(C.deletion.reason).should('have.value', 'Synthetic concurrency decision');
      cy.get(C.deletion.submit).should('be.enabled');
    });
  });
  cy.stub(cy, 'request').callsFake(() =>
    cy.then(() => {
      events.push('independent unchanged GET');
      expect(session.monitor).to.equal(firstMonitor);
      return { status: 200, body: session.before.draft, headers: { etag: session.before.etag } };
    }),
  );
  return { submit, saved, firstMonitor: () => firstMonitor };
}

describe('PO-10624 explicit retry journey orchestration', () => {
  it(
    'AC2. should retain one monitor from failed activation through explicit guarded retry',
    { tags: buildTags() },
    () => {
      const { session } = controlledReview();
      const events: string[] = [];
      const transport = controlledRetry(session, events);
      const guard = cy.stub(CheckerReviewFixtureActions.prototype, 'requireLifecycleCleanup').callsFake(() => {
        events.push('guard');
      });
      const initialMonitor = session.monitor;
      const flow = new CheckerDeletionFlow();
      flow.prepare('retry');
      flow.retry();
      cy.then(() => {
        expect(session.monitor).not.to.equal(initialMonitor);
        expect(session.monitor).to.equal(transport.firstMonitor());
        expect(guard).to.have.been.calledTwice;
        expect(transport.submit).to.have.been.calledTwice;
        assertDeletionRetry(session.monitor, '"1"');
        const receipt = (flow as unknown as { actions: { saved: IDraftCasefileSnapshot } }).actions.saved;
        assertDeletedAggregate(session.before, receipt, owned, 'Synthetic concurrency decision');
        expect(receipt.draft.timeline_data).to.have.length(session.before.draft.timeline_data.length + 1);
        expect(events).to.deep.equal([
          'guard',
          'activation 1',
          'failure',
          'independent unchanged GET',
          'guard',
          'activation 2',
        ]);
      });
    },
  );
});

describe('PO-10624 guarded explicit retry rejection', () => {
  beforeEach(() => {
    observedBoundaryFailure = false;
  });
  afterEach(() => expect(observedBoundaryFailure, 'required retry guard failure observed').to.equal(true));
  it('AC2. should check cleanup again immediately before the second activation', { tags: buildTags() }, () => {
    const { session } = controlledReview();
    const events: string[] = [];
    const transport = controlledRetry(session, events);
    const guard = cy.stub(CheckerReviewFixtureActions.prototype, 'requireLifecycleCleanup');
    guard.onSecondCall().throws(new Error('Controlled retry dispatch guard'));
    expectBoundaryFailure('Controlled retry dispatch guard', () => {
      expect(transport.submit).to.have.been.calledOnce;
      expect(session.monitor).to.equal(transport.firstMonitor());
      expect(session.monitor.attempts).to.equal(1);
      expect(session.monitor.upstreamSuccesses).to.equal(0);
    });
    const flow = new CheckerDeletionFlow();
    flow.prepare('retry');
    flow.retry();
  });
});

function validationDocument(message: string, reason: string, counter: string) {
  cy.document().then((document) => {
    document.body.innerHTML = `<div id="create_casefile_delete_page"><div class="govuk-error-summary" tabindex="-1"><a href="#create_casefile_delete_reason">${message}</a></div><div id="create_casefile_delete_reason-error-message"><span>Error:</span> ${message}</div><div id="create_casefile_delete_reason_field"><span class="govuk-character-count__status">${counter}</span></div><label for="create_casefile_delete_reason">Reason</label><textarea id="create_casefile_delete_reason" aria-describedby="create_casefile_delete_reason-error-message">${reason}</textarea></div>`;
    document.querySelector('a')!.addEventListener('click', (event) => {
      event.preventDefault();
      (document.querySelector(C.deletion.reason) as HTMLTextAreaElement).focus();
    });
    (document.querySelector(C.deletion.summary) as HTMLElement).focus();
  });
}

describe('PO-10624 validation-only Flow activation', () => {
  for (const kind of ['blank', 'over-limit']) {
    it(
      `AC3. should activate the ${kind} warning without waiting for or dispatching PATCH`,
      { tags: buildTags() },
      () => {
        const { session } = controlledReview();
        const wait = cy.spy(cy, 'wait');
        const guard = cy.stub(CheckerReviewFixtureActions.prototype, 'requireLifecycleCleanup');
        const activated = cy.stub();
        cy.document().then((document) =>
          document.querySelector(C.deletion.submit)!.addEventListener('click', () => activated()),
        );
        const flow = new CheckerDeletionFlow();
        flow.prepare(kind);
        flow.submitValidation();
        cy.then(() => {
          expect(activated, 'actual warning control activation').to.have.been.calledOnce;
          expect(wait, 'validation must not await a PATCH receipt').not.to.have.been.called;
          expect(guard, 'validation cannot begin a provider transition').not.to.have.been.called;
          expect(session.monitor.applicationAttempts).to.equal(0);
          expect(session.monitor.attempts).to.equal(0);
          cy.get(C.deletion.reason).should('have.value', kind === 'blank' ? '' : 'D'.repeat(251));
        });
      },
    );
  }
});

describe('PO-10624 linked validation evidence', () => {
  for (const kind of ['blank', 'over-limit']) {
    it(
      `AC3. should require exact ${kind} copy and native linked focus on the retained field`,
      { tags: buildTags() },
      () => {
        controlledReview();
        const actions = new CheckerDeletionActions();
        actions.prepare(kind);
        const message = kind === 'blank' ? 'Enter reason' : 'Reason must be 250 characters or fewer';
        validationDocument(
          message,
          kind === 'blank' ? '' : 'D'.repeat(251),
          kind === 'blank' ? 'You have 250 characters remaining' : 'You have 1 character too many',
        );
        // Call the real validation boundary without navigating away in the later outcome checks.
        actions.assertValidation(message);
        cy.get(C.deletion.reason).should('be.focused');
      },
    );
  }
});

describe('PO-10624 independent accessibility composition', () => {
  it('AC4. should reject an unsupported accessibility kind before fixture setup', { tags: buildTags() }, () => {
    const prepare = cy.stub(CheckerDeletionActions.prototype, 'prepare');
    expect(() => new CheckerDeletionFlow().accessible('blank')).to.throw('Unsupported deletion accessibility kind');
    expect(prepare).not.to.have.been.called;
  });

  it('AC4. should replace mutable actions for every broad accessibility journey', { tags: buildTags() }, () => {
    const instances: CheckerDeletionActions[] = [];
    cy.stub(CheckerDeletionActions.prototype, 'prepare').callsFake(function (this: CheckerDeletionActions) {
      instances.push(this);
    });
    const flow = new CheckerDeletionFlow();
    for (const kind of ['success', 'validation', 'cancel', 'retry']) flow.prepareAccessible(kind);
    expect(new Set(instances).size).to.equal(4);
  });

  for (const kind of ['success', 'validation', 'cancel', 'retry']) {
    it(`AC4. should prepare a fresh native ${kind} warning without a provider mutation`, { tags: buildTags() }, () => {
      const { session, prepare } = nativeWarning();
      cy.stub(accessibilityActions, 'checkAccessibilityOnly');
      new CheckerDeletionFlow().prepareAccessible(kind);
      cy.then(() => {
        expect(prepare.firstCall.args[0]).to.equal(kind === 'success' || kind === 'retry');
        expect(session.monitor.applicationAttempts).to.equal(0);
        expect(session.monitor.attempts).to.equal(0);
        cy.get(C.deletion.reason).should(
          'have.value',
          kind === 'success' ? boundaryReason : kind === 'validation' ? '' : 'Synthetic concurrency decision',
        );
        cy.get(C.deletion.submit).should('be.enabled');
      });
    });
  }
});

function nativeWarning() {
  const context = controlledReview();
  cy.document().then((document) => {
    document.body.innerHTML = `<h1 id="review-heading" tabindex="-1">Check case details</h1><a id="create_casefile_review_delete" href="#warning">Delete case</a><div id="create_casefile_delete_page" hidden><h1 id="create_casefile_delete_heading" tabindex="-1">Are you sure you want to delete this case?</h1><div id="create_casefile_delete_identity">Synthetic Respondent</div><label for="create_casefile_delete_reason">Reason</label><textarea id="create_casefile_delete_reason"></textarea><button id="create_casefile_delete_submit" class="govuk-button--warning">Yes - delete</button><opal-lib-govuk-cancel-link><a class="govuk-link" href="#cancel">No - cancel</a></opal-lib-govuk-cancel-link></div>`;
    (document.querySelector(C.review.heading) as HTMLElement).focus();
    document.querySelector(C.review.delete)!.addEventListener('click', (event) => {
      event.preventDefault();
      (document.querySelector(C.deletion.host) as HTMLElement).hidden = false;
      (document.querySelector(C.deletion.heading) as HTMLElement).focus();
    });
  });
  return context;
}

describe('PO-10624 strict warning scans and native accessibility controls', () => {
  beforeEach(() => {
    observedBoundaryFailure = false;
  });
  afterEach(() => expect(observedBoundaryFailure, 'required scan failure observed').to.equal(true));

  for (const filled of [false, true]) {
    it(
      `AC4. should stop at a strict ${filled ? 'filled' : 'empty'} warning scan before dispatch`,
      { tags: buildTags() },
      () => {
        const { session } = nativeWarning();
        const submit = cy.stub(session.recovery, 'submit');
        const guard = cy.stub(CheckerReviewFixtureActions.prototype, 'requireLifecycleCleanup');
        const scans: string[] = [];
        cy.stub(accessibilityActions, 'checkAccessibilityOnly').callsFake(() => {
          cy.get(C.deletion.reason)
            .invoke('val')
            .then((value) => {
              scans.push(String(value));
              if (Boolean(value) === filled) throw new Error('Controlled strict warning violation');
            });
        });
        expectBoundaryFailure('Controlled strict warning violation', () => {
          expect(submit).not.to.have.been.called;
          expect(guard).not.to.have.been.called;
          expect(scans).to.deep.equal(filled ? ['', boundaryReason] : ['']);
          expect(session.monitor.attempts).to.equal(0);
        });
        new CheckerDeletionFlow().accessible('success');
      },
    );
  }
});

describe('PO-10624 native accessible warning activation', () => {
  for (const kind of ['success', 'retry']) {
    it(`AC4. should guard before creating an accessible ${kind} fixture`, { tags: buildTags() }, () => {
      const create = cy.stub(CheckerReviewFixtureActions.prototype, 'create');
      cy.stub(CheckerReviewFixtureActions.prototype, 'requireLifecycleCleanup').throws(
        new Error('Accessible pre-create guard'),
      );
      expect(() => new CheckerDeletionFlow().accessible(kind)).to.throw('Accessible pre-create guard');
      expect(create).not.to.have.been.called;
    });
  }

  it(
    'AC4. should reach the warning and submit using native Enter and Tab with strict scans',
    { tags: buildTags() },
    () => {
      const { session } = nativeWarning();
      const scans: string[] = [];
      const submit = cy.stub(session.recovery, 'submit');
      cy.stub(accessibilityActions, 'checkAccessibilityOnly').callsFake(() => {
        cy.get(C.deletion.reason)
          .invoke('val')
          .then((value) => {
            scans.push(String(value));
          });
      });
      const guard = cy.stub(CheckerReviewFixtureActions.prototype, 'requireLifecycleCleanup');
      const activated = cy.stub();
      cy.document().then((document) => {
        document.querySelector(C.deletion.submit)!.addEventListener('click', () => {
          expect(document.activeElement).to.equal(document.querySelector(C.deletion.submit));
          expect(guard).to.have.been.calledOnce;
          activated();
        });
      });
      // Keep the native control path real; the persisted receipt is outside this controlled document.
      cy.stub(cy, 'wait').returns(
        cy.wrap(
          { response: { statusCode: 200, body: deletedSnapshot().draft, headers: { etag: '"2"' } } },
          { log: false },
        ),
      );
      cy.stub(CheckerDeletionActions.prototype, 'assertOutcome');
      new CheckerDeletionFlow().accessible('success');
      cy.then(() => {
        expect(scans).to.deep.equal(['', boundaryReason]);
        expect(activated).to.have.been.calledOnce;
        expect(submit, 'no pointer-oriented recovery submit').not.to.have.been.called;
      });
    },
  );

  it('AC4. should scan blank and visible 251 errors then corrected 250 with zero PATCH', { tags: buildTags() }, () => {
    const { session } = nativeWarning();
    const scans: string[] = [];
    const submit = cy.stub(session.recovery, 'submit');
    const guard = cy.stub(CheckerReviewFixtureActions.prototype, 'requireLifecycleCleanup');
    const cancelled = cy.stub(
      CheckerDeletionActions.prototype as unknown as { cancelToReview(): void },
      'cancelToReview',
    );
    cy.stub(CheckerDeletionActions.prototype, 'assertOutcome');
    cy.stub(accessibilityActions, 'checkAccessibilityOnly').callsFake(() => {
      cy.get(C.deletion.reason)
        .invoke('val')
        .then((value) => {
          const error = Cypress.$(C.deletion.reasonError).text().replace('Error:', '').trim();
          scans.push(`${String(value).length}:${error}`);
        });
    });
    cy.document().then((document) => {
      const field = document.querySelector(C.deletion.reason) as HTMLTextAreaElement;
      const host = document.querySelector(C.deletion.host)!;
      const counter = document.createElement('div');
      counter.id = 'create_casefile_delete_reason_field';
      counter.innerHTML = '<span class="govuk-character-count__status">You have 250 characters remaining</span>';
      host.append(counter);
      field.addEventListener('input', () => {
        document.querySelector(C.deletion.counter)!.textContent =
          field.value.length > 250
            ? `You have ${field.value.length - 250} character too many`
            : `You have ${250 - field.value.length} characters remaining`;
      });
      document.querySelector(C.deletion.submit)!.addEventListener('click', () => {
        const message = field.value.length ? 'Reason must be 250 characters or fewer' : 'Enter reason';
        document.querySelector(C.deletion.summary)?.remove();
        document.querySelector(C.deletion.reasonError)?.remove();
        const summary = document.createElement('div');
        summary.className = 'govuk-error-summary';
        summary.tabIndex = -1;
        summary.innerHTML = `<a href="#create_casefile_delete_reason">${message}</a>`;
        summary.querySelector('a')!.addEventListener('click', (event) => {
          event.preventDefault();
          field.focus();
        });
        host.prepend(summary);
        const error = document.createElement('div');
        error.id = 'create_casefile_delete_reason-error-message';
        error.textContent = `Error: ${message}`;
        host.append(error);
        field.setAttribute('aria-describedby', error.id);
        summary.focus();
      });
    });
    new CheckerDeletionFlow().accessible('validation');
    cy.then(() => {
      expect(scans).to.deep.equal([
        '0:',
        '0:',
        '0:Enter reason',
        '251:Reason must be 250 characters or fewer',
        '250:Reason must be 250 characters or fewer',
      ]);
      expect(session.monitor.applicationAttempts).to.equal(0);
      expect(session.monitor.attempts).to.equal(0);
      expect(submit).not.to.have.been.called;
      expect(guard).not.to.have.been.called;
      expect(cancelled).to.have.been.calledOnce;
    });
  });
});

/** Keeps native warning cancellation real while supplying the authoritative returned-review boundary. */
function nativeCancellation() {
  const { session } = nativeWarning();
  const activated = cy.stub();
  cy.stub(CheckerDeletionActions.prototype, 'assertOutcome');
  cy.stub(session.recovery, 'assertSavedPresentation');
  cy.stub(cy, 'intercept').returns(cy.wrap({}, { log: false }));
  cy.stub(cy, 'wait').returns(
    cy.wrap(
      { response: { statusCode: 200, body: session.before.draft, headers: { etag: session.before.etag } } },
      { log: false },
    ),
  );
  cy.stub(cy, 'location').returns(cy.wrap(`/cases/draft/check-and-validate/review/${owned.id}`, { log: false }));
  cy.document().then((document) => {
    const controls = document.createElement('div');
    controls.innerHTML =
      '<input id="create_casefile_review_decision-approve" class="govuk-radios__input" type="radio" style="opacity:0"><label for="create_casefile_review_decision-approve" class="govuk-radios__label">Approve</label><input id="create_casefile_review_decision-reject" class="govuk-radios__input" type="radio" style="opacity:0"><label for="create_casefile_review_decision-reject" class="govuk-radios__label">Reject</label><button id="create_casefile_review_continue">Continue</button>';
    document.body.prepend(controls);
    document.querySelector(C.deletion.cancel)!.addEventListener('click', (event) => {
      event.preventDefault();
      expect(document.activeElement).to.equal(event.currentTarget);
      activated();
      (document.querySelector(C.deletion.host) as HTMLElement).hidden = true;
      (document.querySelector(C.review.heading) as HTMLElement).focus();
    });
  });
  return { session, activated };
}

// These documents isolate native activation while retained-receipt decoding and mutation accounting stay real.
describe('PO-10624 native accessible cancellation and retry', () => {
  it(
    'AC4. should Tab through the warning controls and cancel to focused unchanged review',
    { tags: buildTags() },
    () => {
      const { session, activated } = nativeCancellation();
      const scans: string[] = [];
      const guard = cy.stub(CheckerReviewFixtureActions.prototype, 'requireLifecycleCleanup');
      cy.stub(accessibilityActions, 'checkAccessibilityOnly').callsFake(() => {
        cy.document().then((document) => {
          const warning = document.querySelector(C.deletion.host) as HTMLElement;
          scans.push(
            warning.hidden
              ? 'returned review'
              : (document.querySelector(C.deletion.reason) as HTMLTextAreaElement).value,
          );
        });
      });
      new CheckerDeletionFlow().accessible('cancel');
      cy.then(() => {
        expect(activated).to.have.been.calledOnce;
        expect(scans).to.deep.equal(['', 'Synthetic concurrency decision', 'returned review']);
        expect(guard).not.to.have.been.called;
        expect(session.monitor.applicationAttempts).to.equal(0);
        expect(session.monitor.attempts).to.equal(0);
      });
    },
  );

  it(
    'AC4. should scan the retained definite error then explicitly retry through native controls',
    { tags: buildTags() },
    () => {
      const { session } = nativeWarning();
      const events: string[] = [];
      const transport = controlledRetry(session, events);
      const guard = cy.stub(CheckerReviewFixtureActions.prototype, 'requireLifecycleCleanup').callsFake(() => {
        events.push('guard');
      });
      const scans: string[] = [];
      cy.stub(accessibilityActions, 'checkAccessibilityOnly').callsFake(() => {
        cy.get(C.deletion.reason).then((field) => {
          expect(field.val()).to.equal(scans.length ? 'Synthetic concurrency decision' : '');
          scans.push(Cypress.$(C.globalErrorBanner).length ? 'retained error' : 'warning');
        });
      });
      cy.stub(CheckerDeletionActions.prototype, 'assertOutcome');
      const seam = CheckerDeletionActions.prototype as unknown as { assertFailure(): void };
      const retainedFailure = seam.assertFailure;
      cy.stub(seam, 'assertFailure').callsFake(function (this: CheckerDeletionActions) {
        retainedFailure.call(this);
        // Observe monitor identity after the real native retention and strict scan assertions.
        session.recovery.assertFailure('delete');
      });
      cy.document().then((document) => {
        document.querySelector(C.deletion.submit)!.addEventListener('click', () => {
          expect(document.activeElement).to.equal(document.querySelector(C.deletion.submit));
          void document
            .defaultView!.fetch(`/opal-maintenance-service/draft-casefiles/${owned.id}`, {
              method: 'PATCH',
              headers: { 'if-match': session.before.etag },
              body: JSON.stringify({
                business_unit_id: session.before.draft.business_unit_id,
                casefile_status: 'DELETED',
                status_message: (document.querySelector(C.deletion.reason) as HTMLTextAreaElement).value,
              }),
            })
            .then((response) => {
              if (response.status === 400) {
                const banner = document.createElement('div');
                banner.className = 'moj-alert--error';
                banner.textContent = 'The deletion was rejected. Try again.';
                document.body.prepend(banner);
              }
            });
        });
      });
      new CheckerDeletionFlow().accessible('retry');
      cy.then(() => {
        expect(scans).to.deep.equal(['warning', 'warning', 'retained error']);
        expect(guard).to.have.been.calledTwice;
        expect(transport.submit, 'no pointer-oriented recovery submission').not.to.have.been.called;
        expect(session.monitor).to.equal(transport.firstMonitor());
        assertDeletionRetry(session.monitor, '"1"');
        expect(events).to.deep.equal([
          'guard',
          'activation 1',
          'failure',
          'independent unchanged GET',
          'guard',
          'activation 2',
        ]);
      });
    },
  );
});

describe('PO-10624 returned review decision availability', () => {
  beforeEach(() => {
    observedBoundaryFailure = false;
  });
  afterEach(() => expect(observedBoundaryFailure, 'required unavailable decision failure observed').to.equal(true));
  for (const choice of ['approve', 'reject'] as const) {
    for (const fault of ['missing label', 'hidden label', 'disabled input'] as const) {
      it(
        `AC2. should reject returned ${choice} with ${fault}`,
        { tags: buildTags(), defaultCommandTimeout: 100 },
        () => {
          const { session, activated } = nativeCancellation();
          cy.stub(accessibilityActions, 'checkAccessibilityOnly');
          const selector = choice === 'approve' ? C.review.decisionApprove : C.review.decisionReject;
          const id = selector.slice(1);
          cy.document().then((document) => {
            const input = document.querySelector(selector) as HTMLInputElement;
            const label = document.querySelector(`label[for="${id}"]`) as HTMLLabelElement;
            expect(input.style.opacity, 'representative GOV.UK native control').to.equal('0');
            if (fault === 'missing label') label.remove();
            else if (fault === 'hidden label') label.hidden = true;
            else input.disabled = true;
          });
          cy.once('fail', (error) => {
            const expected =
              fault === 'disabled input' ? 'enabled' : fault === 'hidden label' ? 'visible' : 'label[for=';
            const target = fault === 'hidden label' ? '<label.govuk-radios__label>' : id;
            if (!error.message.includes(target) || !error.message.includes(expected)) throw error;
            if (fault === 'hidden label')
              expect(Cypress.$(`label[for="${id}"]`).prop('hidden'), 'the actual associated label is hidden').to.equal(
                true,
              );
            if (fault === 'disabled input')
              expect(Cypress.$(selector).prop('disabled'), 'the actual native control is disabled').to.equal(true);
            expect(activated, 'native cancellation reached actual returned review').to.have.been.calledOnce;
            expect(session.recovery.assertSavedPresentation).to.have.been.calledOnceWithExactly(session.before);
            expect(session.monitor.applicationAttempts).to.equal(0);
            expect(session.monitor.attempts).to.equal(0);
            observedBoundaryFailure = true;
            return false;
          });
          new CheckerDeletionFlow().accessible('cancel');
        },
      );
    }
  }
});
