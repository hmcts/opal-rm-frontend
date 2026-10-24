import { createPersistedCasefileDetail } from '../../../src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import {
  assertDeletedAggregate,
  assertDeletionRetry,
} from '../../e2e/functional/opal/actions/checkAndValidateCase/checker-deletion-evidence.actions';
import type { IDraftCasefileSnapshot } from '../../e2e/functional/opal/actions/checkAndValidateCase/interfaces/draft-casefile-snapshot.interface';
import type { IDraftCasefileMonitor } from '../../e2e/functional/opal/actions/checkAndValidateCase/interfaces/draft-casefile-monitor.interface';
import { CheckerDeletionActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/checker-deletion.actions';
import { CheckerDeletionFlow } from '../../e2e/functional/opal/flows/checkAndValidateCase/checker-deletion.flow';
import { CheckerReviewActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/checker-review-decisions.actions';
import type { ICheckerPreparedReview } from '../../e2e/functional/opal/actions/checkAndValidateCase/checker-review-decisions.actions';
import { CheckerReviewFixtureActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/checker-review-fixture.actions';
import { CheckerDashboardWindowActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/checker-dashboard-window.actions';
import { DraftCasefileRecoveryActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/draft-casefile-recovery.actions';
import { CheckAndValidateCaseSelectors as S } from '../../shared/selectors/check-and-validate-case.selectors';
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
          cy.get(S.deleteReason).should('have.value', expected);
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
    const act = cy.stub(CheckerDeletionActions.prototype, 'act');
    const outcome = cy.stub(CheckerDeletionActions.prototype, 'assertOutcome');
    const flow = new CheckerDeletionFlow();
    flow.prepare('cancel');
    flow.act();
    flow.assertOutcome();
    flow.prepare('blank');
    expect(instances).to.have.length(2);
    expect(instances[0]).not.to.equal(instances[1]);
    expect(act).to.have.been.calledOnce;
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
    actions.act();
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
    cy.stub(window, 'fetch').callsFake(() => {
      events.push(`activation ${++attempts}`);
      handler({
        headers: { 'if-match': '"1"' },
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
      window.fetch(`/opal-maintenance-service/draft-casefiles/${owned.id}`, { method: 'PATCH' }),
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
      const actions = new CheckerDeletionActions();
      actions.prepare('retry');
      actions.act();
      cy.then(() => {
        expect(session.monitor).not.to.equal(initialMonitor);
        expect(session.monitor).to.equal(transport.firstMonitor());
        expect(guard).to.have.been.calledTwice;
        expect(transport.submit).to.have.been.calledTwice;
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
    const actions = new CheckerDeletionActions();
    actions.prepare('retry');
    actions.act();
  });
});

function validationDocument(message: string, reason: string, counter: string) {
  cy.document().then((document) => {
    document.body.innerHTML = `<div id="create_casefile_delete_page"><div class="govuk-error-summary" tabindex="-1"><a href="#create_casefile_delete_reason">${message}</a></div><div id="create_casefile_delete_reason-error-message"><span>Error:</span> ${message}</div><div id="create_casefile_delete_reason_field"><span class="govuk-character-count__status">${counter}</span></div><label for="create_casefile_delete_reason">Reason</label><textarea id="create_casefile_delete_reason" aria-describedby="create_casefile_delete_reason-error-message">${reason}</textarea></div>`;
    document.querySelector('a')!.addEventListener('click', (event) => {
      event.preventDefault();
      (document.querySelector(S.deleteReason) as HTMLTextAreaElement).focus();
    });
    (document.querySelector(C.deletion.summary) as HTMLElement).focus();
  });
}

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
        cy.then(() => (actions as unknown as { assertValidation(): void }).assertValidation());
        cy.get(S.deleteReason).should('be.focused');
      },
    );
  }
});
