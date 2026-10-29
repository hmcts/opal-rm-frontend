import {
  setCasefileReason,
  activateCasefileControl,
} from '../../e2e/functional/opal/actions/createDraftCasefile/casefile-review-controls.actions';
import { CreateCasefileSelectors as C } from '../../shared/selectors/create-casefile.selectors';
import { DraftCasefileRecoveryActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/draft-casefile-recovery.actions';
import { InputterCasefileMonitoringActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/inputter-casefile-monitoring.actions';
import { accessibilityActions } from '../../e2e/functional/opal/actions/accessibility/accessibility.actions';
import {
  CheckerReviewActions,
  assertCheckerReceipt,
  assertCheckerAttempt,
  assertCheckerWinner,
  assertCheckerNoPatch,
  assertCheckerHistory,
} from '../../e2e/functional/opal/actions/checkAndValidateCase/checker-review-decisions.actions';
import { createPersistedCasefileDetail } from '../../../src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import { CheckerReviewFixtureActions } from '../../e2e/functional/opal/actions/checkAndValidateCase/checker-review-fixture.actions';
import { CasesDraftSelectors as D } from '../../shared/selectors/cases-draft.selectors';
import type { IDraftCasefileSnapshot } from '../../e2e/functional/opal/actions/checkAndValidateCase/interfaces/draft-casefile-snapshot.interface';
import type { IOwnedDraftCasefile } from '../../e2e/functional/opal/actions/checkAndValidateCase/interfaces/draft-casefile-owned.interface';
import type { IDraftCasefileMonitor } from '../../e2e/functional/opal/actions/checkAndValidateCase/interfaces/draft-casefile-monitor.interface';

const buildTags = (): string[] => [
  '@R1CRmCreateCaseFiles',
  '@JIRA-STORY:PO-10625',
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

function snapshot() {
  const draft = createPersistedCasefileDetail();
  draft.draft_casefile_id = owned.id;
  draft.submitted_by = owned.inputterId;
  draft.casefile.respondent_account.remo_reference = owned.marker;
  return { draft, etag: '"1"' };
}

function monitor(): IDraftCasefileMonitor {
  return {
    attempts: 1,
    applicationAttempts: 1,
    upstreamSuccesses: 1,
    droppedResponses: 0,
    interceptedFailures: 0,
    requestVersions: ['"1"'],
    lastStatus: 200,
  };
}

describe('PO-10625 checker decision observation support', () => {
  it(
    'AC1. should accept actual pending approval receipt without premature account numbers',
    { tags: buildTags() },
    () => {
      const saved = snapshot();
      saved.draft.casefile_status = 'PUBLISHING_PENDING';
      saved.etag = '"2"';
      expect(assertCheckerReceipt(200, saved.draft, saved.etag, owned, '"1"').etag).to.equal('"2"');
    },
  );
  for (const fault of ['status', 'identity', 'unit', 'owner', 'marker', 'etag', 'version']) {
    it(`AC1. should reject actual decision receipt with wrong ${fault}`, { tags: buildTags() }, () => {
      const saved = snapshot();
      saved.etag = '"2"';
      if (fault === 'identity') saved.draft.draft_casefile_id++;
      if (fault === 'unit') saved.draft.business_unit_id = 99;
      if (fault === 'owner') saved.draft.submitted_by = 'other';
      if (fault === 'marker') saved.draft.casefile.respondent_account.remo_reference = 'other';
      expect(() =>
        assertCheckerReceipt(
          fault === 'status' ? 202 : 200,
          saved.draft,
          fault === 'etag' ? undefined : fault === 'version' ? '"1"' : saved.etag,
          owned,
          '"1"',
        ),
      ).to.throw();
    });
  }
  it(
    'AC1. should require exactly one observed UI PATCH with its original opaque version',
    { tags: buildTags() },
    () => {
      assertCheckerAttempt(monitor(), '"1"', 200);
      for (const fault of ['attempts', 'applicationAttempts', 'lastStatus', 'requestVersions'] as const) {
        const observed = monitor();
        if (fault === 'requestVersions') observed.requestVersions = ['"2"'];
        else observed[fault] = 0;
        expect(() => assertCheckerAttempt(observed, '"1"', 200)).to.throw();
      }
      const duplicate = monitor();
      duplicate.attempts = 2;
      expect(() => assertCheckerAttempt(duplicate, '"1"', 200)).to.throw();
    },
  );
  it(
    'AC1. should require a fresh winner and preserve every persisted field after stale rejection',
    { tags: buildTags() },
    () => {
      const before = snapshot();
      const winner = structuredClone(before);
      winner.etag = '"2"';
      winner.draft.casefile_status = 'REJECTED';
      winner.draft.timeline_data.push({
        status: 'Rejected',
        username: owned.checkerName,
        status_date: '2026-10-23T10:00:00Z',
        reason_text: 'Synthetic winning concurrent decision',
      });
      assertCheckerWinner(before, winner, structuredClone(winner), owned);
      const changed = structuredClone(winner);
      changed.draft.timeline_data.pop();
      expect(() => assertCheckerWinner(before, winner, changed, owned)).to.throw();
      const wrong = structuredClone(winner);
      wrong.draft.timeline_data[1].username = 'other';
      expect(() => assertCheckerWinner(before, wrong, wrong, owned)).to.throw();
      expect(() => assertCheckerWinner(winner, winner, winner, owned)).to.throw();
    },
  );
});

describe('PO-10625 checker no-write evidence support', () => {
  it('AC1. should reject missing inactive or dirty no-PATCH observations', { tags: buildTags() }, () => {
    const empty = monitor();
    empty.attempts = 0;
    empty.applicationAttempts = 0;
    empty.requestVersions = [];
    empty.upstreamSuccesses = 0;
    empty.lastStatus = undefined;
    assertCheckerNoPatch(empty);
    const hiddenAttempt = { ...empty, requestVersions: ['"1"'] };
    expect(() => assertCheckerNoPatch(hiddenAttempt)).to.throw();
    expect(() => assertCheckerNoPatch(undefined)).to.throw('No-PATCH monitor missing');
    expect(() => assertCheckerNoPatch(monitor())).to.throw();
    empty.applicationAttempts = 1;
    expect(() => assertCheckerNoPatch(empty)).to.throw();
  });
});

// Controlled table and request boundaries exercise maintained account search, not application rendering.
function publishedSnapshot() {
  const saved = snapshot();
  saved.draft.casefile_status = 'PUBLISHED';
  const accounts = saved.draft.casefile_snapshot;
  accounts.respondent_account.account_id = 101;
  accounts.respondent_account.account_number = 'RESP-101';
  accounts.applicant_account.account_id = 201;
  accounts.applicant_account.account_number = 'APP-201';
  accounts.minor_creditor_accounts = [1, 2].map((creditor_sequence) => ({
    creditor_sequence,
    name: 'Synthetic Minor',
    account_id: 300 + creditor_sequence,
    account_number: `MINOR-${creditor_sequence}`,
  }));
  return saved;
}

function controlledAccountTable(
  options: { missingCreditor?: boolean; linkedNumber?: boolean; pending?: boolean } = {},
) {
  const state = { page: 3 };
  cy.document().then((document) => {
    const render = () => {
      const respondent = options.linkedNumber ? '<a href="#number">RESP-101</a>' : 'RESP-101';
      const minors = options.missingCreditor ? '<li>MINOR-1</li>' : '<li>MINOR-1</li><li>MINOR-2</li>';
      const row =
        state.page === 2 && !options.pending
          ? `<tr data-draft-id="101"><td data-column="respondentAccount">${respondent}</td><td data-column="applicantAccount">APP-201</td><td data-column="minorCreditorAccounts"><ul>${minors}</ul></td></tr>`
          : '<tr data-draft-id="999"><td>Unrelated row</td></tr>';
      const prev = state.page > 1 ? '<a href="#prev" rel="prev">Previous</a>' : '';
      const next = state.page < 3 ? '<a href="#next" rel="next">Next</a>' : '';
      const pages = [1, 2, 3]
        .map(
          (page) =>
            `<a href="#page-${page}" aria-label="Page ${page}" ${state.page === page ? 'aria-current="page"' : ''}>${page}</a>`,
        )
        .join('');
      document.body.innerHTML = `<app-cases-draft-table><table><tbody>${row}</tbody></table><output>Page ${state.page} of 3</output></app-cases-draft-table><nav id="cases-draft-pagination">${prev}${pages}${next}</nav>`;
      for (const direction of ['next', 'prev'])
        document.querySelector(`[rel="${direction}"]`)?.addEventListener('click', (event) => {
          event.preventDefault();
          state.page += direction === 'next' ? 1 : -1;
          render();
        });
    };
    render();
  });
  cy.stub(cy, 'request').callsFake((request: Cypress.RequestOptions) =>
    cy.then(() => {
      expect(request.method).to.equal('GET');
      expect(request.url).to.equal('/opal-maintenance-service/draft-casefiles/101');
      const saved = publishedSnapshot();
      if (options.pending) {
        saved.draft.casefile_status = 'PUBLISHING_PENDING';
        const accounts = saved.draft.casefile_snapshot;
        for (const account of [
          accounts.respondent_account,
          accounts.applicant_account,
          ...accounts.minor_creditor_accounts,
        ]) {
          account.account_id = null;
          account.account_number = null;
        }
      }
      return { status: 200, body: saved.draft, headers: { etag: '"2"' } };
    }),
  );
  return state;
}

describe('PO-10625 published account traversal support', () => {
  let expectedFailure = false;
  let observedFailure = false;
  beforeEach(() => {
    expectedFailure = false;
    observedFailure = false;
  });
  afterEach(() => {
    if (expectedFailure) expect(observedFailure, 'required failure observed').to.equal(true);
  });
  for (const scanning of [true, false]) {
    it(
      `AC1. should exclude pending work on every page with strict scanning boolean ${scanning}`,
      { tags: buildTags() },
      () => {
        const state = controlledAccountTable({ pending: true });
        const scans: number[] = [];
        cy.stub(accessibilityActions, 'checkAccessibilityOnly').callsFake(() => {
          cy.then(() => {
            scans.push(state.page);
          });
        });
        new InputterCasefileMonitoringActions().expectAccounts(owned, true, scanning);
        cy.then(() => {
          expect(scans).to.deep.equal(scanning ? [2, 1, 1, 2, 3] : []);
          expect(state.page).to.equal(3);
        });
      },
    );
    it(`AC1. should search every account page with strict scanning boolean ${scanning}`, { tags: buildTags() }, () => {
      const state = controlledAccountTable();
      const scans: number[] = [];
      cy.stub(accessibilityActions, 'checkAccessibilityOnly').callsFake(() => {
        cy.then(() => {
          scans.push(state.page);
        });
      });
      new InputterCasefileMonitoringActions().expectAccounts(owned, false, scanning);
      cy.then(() => {
        expect(scans).to.deep.equal(scanning ? [2, 1, 2] : []);
        expect(state.page).to.equal(2);
      });
    });
  }
  for (const fault of ['missingCreditor', 'linkedNumber'] as const) {
    it(`AC1. should reject publication dashboard ${fault}`, { tags: buildTags(), defaultCommandTimeout: 100 }, () => {
      controlledAccountTable({ [fault]: true });
      expectedFailure = true;
      cy.once('fail', (error) => {
        const message = fault === 'missingCreditor' ? 'all saved creditors in sequence' : 'not to exist';
        if (!error.message.includes(message)) throw error;
        observedFailure = true;
        return false;
      });
      new InputterCasefileMonitoringActions().expectAccounts(owned, false);
    });
  }
  it('AC1. should stop account traversal when a strict scan rejects a visited page', { tags: buildTags() }, () => {
    const state = controlledAccountTable();
    expectedFailure = true;
    cy.once('fail', (error) => {
      if (!error.message.includes('Controlled checker strict scan failed')) throw error;
      expect(state.page).to.equal(2);
      observedFailure = true;
      return false;
    });
    cy.stub(accessibilityActions, 'checkAccessibilityOnly').callsFake(() => {
      cy.then(() => {
        throw new Error('Controlled checker strict scan failed');
      });
    });
    new InputterCasefileMonitoringActions().expectAccounts(owned, false, true);
  });
});

describe('PO-10625 checker lifecycle and accessible validation dispatch support', () => {
  it(
    'AC1. should reject unsupported journey values and lifecycle transitions before requests',
    { tags: buildTags() },
    () => {
      const actions = new CheckerReviewActions();
      const request = cy.stub(cy, 'request');
      expect(() => actions.prepare('REJECTED', 'decision')).to.throw('Unsupported checker prerequisite');
      expect(() => actions.prepare('SUBMITTED', 'unknown')).to.throw('Unsupported checker fixture');
      expect(() => actions.prepareProtection('unknown')).to.throw('Unsupported checker protection');
      expect(() => actions.accessible('unknown')).to.throw('Unsupported checker accessibility journey');
      expect(() => actions.decide('delete')).to.throw('Unsupported checker decision');
      expect(() => actions.assertDecision('delete')).to.throw('Unsupported checker decision');
      expect(() => actions.compete('delete')).to.throw('Unsupported checker decision');
      expect(() => actions.decide('approve')).to.throw('Approval requires a publication fixture');
      const previous = Cypress.env('PO10625_LIFECYCLE_CLEANUP_VERIFIED');
      try {
        Cypress.env('PO10625_LIFECYCLE_CLEANUP_VERIFIED', false);
        for (const kind of ['decision', 'publication', 'stale'])
          expect(() => actions.prepare('SUBMITTED', kind)).to.throw('PO10625_LIFECYCLE_CLEANUP_VERIFIED');
      } finally {
        Cypress.env('PO10625_LIFECYCLE_CLEANUP_VERIFIED', previous);
      }
      expect(request).not.to.have.been.called;
    },
  );

  it(
    'AC1. should strictly scan the truly blank conditional reason before native validation submission',
    { tags: buildTags() },
    () => {
      const actions = new CheckerReviewActions();
      const events: string[] = [];
      // Forbid pointer selection only within this accessible action-under-test seam.
      const get = cy.get;
      cy.stub(cy, 'get').callsFake((...args: Parameters<typeof cy.get>) => {
        const chain = get.apply(cy, args);
        if (args[0] === C.review.decisionReject)
          cy.stub(chain, 'check').throws(new Error('Accessible decision must use native Space'));
        return chain;
      });
      const press = cy.spy(cy, 'press');
      cy.document().then((document) => {
        document.body.innerHTML =
          '<label for="create_casefile_review_decision-reject">Reject</label><input type="radio" id="create_casefile_review_decision-reject"><label for="create_casefile_review_rejection_reason">Reason</label><textarea id="create_casefile_review_rejection_reason">Stale reason</textarea>';
      });
      // Fixture creation and the final independent read are known boundaries; actual blanking/scan/submit dispatch stays real.
      cy.stub(actions, 'prepare');
      cy.stub(actions, 'assertValidation');
      cy.stub(accessibilityActions, 'checkAccessibilityOnly').callsFake(() => {
        cy.get(C.review.decisionReject).should('be.checked');
        cy.get(C.review.rejectionReason).should('have.value', '').and('be.focused');
        cy.then(() => {
          expect(press).to.have.been.calledWithExactly(Cypress.Keyboard.Keys.SPACE);
          expect(press).to.have.been.calledWithExactly(Cypress.Keyboard.Keys.TAB);
          events.push('strict scan');
        });
      });
      cy.stub(DraftCasefileRecoveryActions.prototype, 'submit').callsFake((decision, keyboard) => {
        expect(decision).to.equal('reject');
        expect(keyboard).to.equal(true);
        cy.then(() => {
          events.push('native validation submit');
        });
      });
      actions.accessible('validation');
      cy.then(() => expect(events).to.deep.equal(['strict scan', 'native validation submit']));
    },
  );
});

describe('PO-10625 checker selection input dispatch support', () => {
  for (const keyboard of [false, true]) {
    for (const action of ['decide', 'compete'] as const) {
      it(
        `AC1. should forward keyboard boolean ${keyboard} from ${action} to decision selection`,
        { tags: buildTags() },
        () => {
          const actions = new CheckerReviewActions();
          if (keyboard) actions.enableAccessibility();
          // Stop at the selection seam before receipt or competing-provider operations.
          const choose = cy
            .stub(DraftCasefileRecoveryActions.prototype, 'choose')
            .throws(new Error('Controlled selection boundary'));
          expect(() => actions[action]('reject')).to.throw('Controlled selection boundary');
          expect(choose).to.have.been.calledOnceWithExactly('reject', keyboard);
        },
      );
    }
  }

  for (const decision of ['approve', 'reject'] as const) {
    for (const keyboard of [undefined, false, true]) {
      it(
        `AC1. should choose ${decision} through the recovery caller with keyboard ${keyboard ?? 'default'}`,
        { tags: buildTags() },
        () => {
          const press = cy.spy(cy, 'press');
          cy.document().then((document) => {
            document.body.innerHTML =
              '<label for="create_casefile_review_decision-approve">Approve</label><input type="radio" name="decision" id="create_casefile_review_decision-approve">' +
              '<label for="create_casefile_review_decision-reject">Reject</label><input type="radio" name="decision" id="create_casefile_review_decision-reject">' +
              '<label for="create_casefile_review_rejection_reason">Reason</label><textarea id="create_casefile_review_rejection_reason">Stale reason</textarea>';
          });
          const recovery = new DraftCasefileRecoveryActions();
          if (keyboard === undefined) recovery.choose(decision);
          else recovery.choose(decision, keyboard);
          cy.get(decision === 'approve' ? C.review.decisionApprove : C.review.decisionReject).should('be.checked');
          if (decision === 'reject')
            cy.get(C.review.rejectionReason).should('have.value', 'Synthetic concurrency decision');
          cy.then(() => {
            if (keyboard) {
              expect(press).to.have.been.calledWithExactly(Cypress.Keyboard.Keys.SPACE);
              expect(press.callCount).to.equal(decision === 'reject' ? 2 : 1);
              if (decision === 'reject') expect(press).to.have.been.calledWithExactly(Cypress.Keyboard.Keys.TAB);
            } else {
              expect(press).not.to.have.been.called;
            }
            expect(recovery.expectedReason()).to.equal('Synthetic concurrency decision');
          });
        },
      );
    }
  }
});

describe('PO-10625 exact decision history support', () => {
  for (const status of ['SUBMITTED', 'RESUBMITTED'] as const) {
    for (const decision of ['approve', 'reject'] as const) {
      it(`AC1. should reject duplicated prior ${status} history after ${decision}`, { tags: buildTags() }, () => {
        const before = snapshot();
        before.draft.casefile_status = status;
        if (status === 'RESUBMITTED')
          before.draft.timeline_data.push(
            {
              status: 'Rejected',
              username: 'Earlier checker',
              status_date: '2026-10-23T10:00:00Z',
              reason_text: 'Earlier correction',
            },
            { status: 'Resubmitted', username: owned.inputterName, status_date: '2026-10-23T11:00:00Z' },
          );
        const saved = structuredClone(before);
        saved.draft.timeline_data.push({
          status: decision === 'approve' ? 'Approved' : 'Rejected',
          username: owned.checkerName,
          status_date: '2026-10-23T12:00:00Z',
          reason_text: decision === 'reject' ? 'Exact rejection reason' : undefined,
        });
        assertCheckerHistory(before, saved, owned, decision, 'Exact rejection reason');
        const wrongActor = structuredClone(saved);
        wrongActor.draft.timeline_data[wrongActor.draft.timeline_data.length - 1].username = 'Unrelated checker';
        expect(() => assertCheckerHistory(before, wrongActor, owned, decision, 'Exact rejection reason')).to.throw();
        if (decision === 'reject') {
          const wrongReason = structuredClone(saved);
          wrongReason.draft.timeline_data[wrongReason.draft.timeline_data.length - 1].reason_text = 'Other reason';
          expect(() => assertCheckerHistory(before, wrongReason, owned, decision, 'Exact rejection reason')).to.throw();
        }
        const duplicated = structuredClone(saved);
        duplicated.draft.timeline_data.unshift(structuredClone(before.draft.timeline_data[0]));
        expect(() => assertCheckerHistory(before, duplicated, owned, decision, 'Exact rejection reason')).to.throw();
      });
    }
  }
});

describe('PO-10625 real recovery form activation support', () => {
  for (const [journey, selector] of [
    ['approve', C.review.decisionContinue],
    ['reject', C.review.decisionContinue],
    ['resubmit', C.review.submit],
    ['delete', C.deletion.submit],
  ] as const) {
    for (const keyboard of [true, false]) {
      it(
        `AC1. should submit the real ${journey} form exactly once with keyboard boolean ${keyboard}`,
        { tags: buildTags(), defaultCommandTimeout: 500 },
        () => {
          let submissions = 0;
          cy.document().then((document) => {
            const conditionalReason =
              journey === 'reject'
                ? '<label for="create_casefile_review_rejection_reason">Reason</label><textarea id="create_casefile_review_rejection_reason">Synthetic reason</textarea>'
                : '';
            document.body.innerHTML = `<form>${conditionalReason}<button type="submit" id="${selector.slice(1)}">Continue</button></form>`;
            document.querySelector('form')!.addEventListener('submit', (event) => {
              event.preventDefault();
              submissions++;
            });
          });
          // The maintained delegate and native events are real; only the form's business handler is controlled.
          new DraftCasefileRecoveryActions().submit(journey, keyboard);
          cy.then(() => expect(submissions, 'exactly one actual form submission').to.equal(1));
          cy.get(selector).should('be.focused');
        },
      );
    }
  }
});

// Narrow fixture/navigation seams leave the maintained session and queue traversal under test.
interface CheckerReviewSeam {
  owned?: IOwnedDraftCasefile;
  before?: IDraftCasefileSnapshot;
  monitor?: IDraftCasefileMonitor;
  recovery: DraftCasefileRecoveryActions;
  rows: { draft_casefile_id: number }[];
  checkerObservation: boolean;
  openQueue(): void;
  openOwned(): void;
  observeQueue(owned: IOwnedDraftCasefile): void;
  changeQueuePage(direction: 'next' | 'previous'): void;
}

const deletionTags = (): string[] => [
  '@R1CRmCreateCaseFiles',
  '@JIRA-STORY:PO-10624',
  '@JIRA-EPIC:PO-10817',
  '@JIRA-LABEL:create-draft-casefile',
  '@retries(0)',
];

function setupPreparedReview(
  actions: CheckerReviewActions,
  events: string[],
  missing?: 'owned' | 'before' | 'monitor',
) {
  const seam = actions as unknown as CheckerReviewSeam;
  const expectedMonitor = monitor();
  const saved = snapshot();
  const guard = cy.stub(CheckerReviewFixtureActions.prototype, 'requireLifecycleCleanup').callsFake(() => {
    events.push('guard');
  });
  const create = cy.stub(CheckerReviewFixtureActions.prototype, 'create').callsFake(() => {
    events.push('create');
    return cy.wrap(owned, { log: false });
  });
  cy.stub(cy, 'request').callsFake(() =>
    cy.wrap({ status: 200, body: saved.draft, headers: { etag: saved.etag } }, { log: false }),
  );
  // Authentication and queue/detail navigation are outside this controlled composition test.
  cy.stub(cy, 'session');
  cy.stub(cy, 'visit');
  cy.document().then((document) => {
    document.body.innerHTML =
      '<nav aria-label="Account navigation"><a class="moj-header__navigation-link" href="#signout">Sign out</a></nav>';
  });
  cy.stub(seam, 'observeQueue');
  cy.stub(seam, 'openQueue');
  cy.stub(seam, 'openOwned').callsFake(() => {
    cy.then(() => {
      seam.monitor = expectedMonitor;
      events.push('monitor installed');
      if (missing) seam[missing] = undefined;
    });
  });
  return { seam, saved, expectedMonitor, guard, create };
}

describe('PO-10624 prepared checker review support', () => {
  for (const transition of [true, false]) {
    it(
      `AC1. should prepare an identical complete session after setup with transition ${transition}`,
      { tags: deletionTags() },
      () => {
        const actions = new CheckerReviewActions();
        const events: string[] = [];
        const { seam, saved, expectedMonitor, guard, create } = setupPreparedReview(actions, events);
        actions.prepareSubmittedReview(transition, (session) => {
          events.push('ready');
          expect(session.owned).to.equal(owned);
          expect(session.before).to.equal(seam.before);
          expect(session.before).to.deep.equal(saved);
          expect(session.recovery).to.equal(seam.recovery);
          expect(session.monitor).to.equal(expectedMonitor);
        });
        cy.then(() => {
          expect(guard.callCount).to.equal(transition ? 1 : 0);
          expect(create).to.have.been.calledOnceWithExactly('SUBMITTED', false);
          expect(events).to.deep.equal([...(transition ? ['guard'] : []), 'create', 'monitor installed', 'ready']);
        });
      },
    );
  }

  it('AC1. should stop before fixture creation when lifecycle cleanup is unavailable', { tags: deletionTags() }, () => {
    const create = cy.stub(CheckerReviewFixtureActions.prototype, 'create');
    cy.stub(CheckerReviewFixtureActions.prototype, 'requireLifecycleCleanup').throws(
      new Error('Controlled cleanup guard'),
    );
    expect(() =>
      new CheckerReviewActions().prepareSubmittedReview(true, () => {
        throw new Error('ready must not run');
      }),
    ).to.throw('Controlled cleanup guard');
    expect(create).not.to.have.been.called;
  });

  it(
    'AC1. should return through maintained queue navigation and release its old observation',
    { tags: deletionTags() },
    () => {
      const actions = new CheckerReviewActions();
      const seam = actions as unknown as CheckerReviewSeam;
      const open = cy.stub(seam, 'openQueue');
      actions.returnToQueue();
      expect(open).to.have.been.calledOnce;
      expect(seam.checkerObservation).to.equal(true);
      actions.releaseQueueObservation();
      expect(seam.checkerObservation).to.equal(false);
    },
  );
});

describe('PO-10624 incomplete prepared checker session support', () => {
  let observedFailure: boolean;
  beforeEach(() => {
    observedFailure = false;
  });
  afterEach(() => expect(observedFailure, 'required incomplete session failure observed').to.equal(true));

  for (const missing of ['owned', 'before', 'monitor'] as const) {
    it(
      `AC1. should reject a prepared review with missing ${missing} before calling ready`,
      { tags: deletionTags() },
      () => {
        const actions = new CheckerReviewActions();
        setupPreparedReview(actions, [], missing);
        const errors = {
          owned: 'Checker fixture missing',
          before: 'Checker baseline missing',
          monitor: 'Prepared checker monitor missing',
        };
        let ready = false;
        cy.once('fail', (error) => {
          if (!error.message.includes(errors[missing])) throw error;
          expect(ready, 'incomplete session must not reach its consumer').to.equal(false);
          observedFailure = true;
          return false;
        });
        actions.prepareSubmittedReview(false, () => {
          ready = true;
        });
      },
    );
  }
});

describe('PO-10624 complete checker queue absence support', () => {
  let expectedFailure: string;
  let observedFailure: boolean;
  beforeEach(() => {
    expectedFailure = '';
    observedFailure = false;
  });
  afterEach(() => {
    if (expectedFailure) expect(observedFailure, 'required queue failure observed').to.equal(true);
  });

  for (const fault of ['none', 'provider', 'later DOM', 'strict scan'] as const) {
    it(
      `AC1. should inspect the provider and every actual queue page with ${fault}`,
      { tags: deletionTags(), defaultCommandTimeout: 100 },
      () => {
        const actions = new CheckerReviewActions();
        const seam = actions as unknown as CheckerReviewSeam;
        seam.owned = owned;
        seam.rows = fault === 'provider' ? [{ draft_casefile_id: owned.id }] : [];
        const state = { page: 2 };
        const scans: number[] = [];
        const visits: number[] = [];
        cy.document().then((document) => {
          const render = () => {
            const row = fault === 'later DOM' && state.page === 3 ? owned.id : 999;
            document.body.innerHTML = `<app-cases-draft-table><table><tbody><tr data-draft-id="${row}"><td>Controlled respondent</td></tr></tbody></table></app-cases-draft-table><nav id="cases-draft-pagination">${state.page > 1 ? '<a rel="prev" href="#prev">Previous</a>' : ''}${state.page < 3 ? '<a rel="next" href="#next">Next</a>' : ''}</nav>`;
            visits.push(state.page);
          };
          cy.stub(seam, 'changeQueuePage').callsFake((direction) => {
            cy.then(() => {
              state.page += direction === 'next' ? 1 : -1;
              render();
            });
          });
          render();
        });
        cy.stub(cy, 'wait').callsFake((alias) => {
          expect(alias).to.equal('@checkerQueue');
          return cy.wrap({}, { log: false });
        });
        cy.stub(accessibilityActions, 'checkAccessibilityOnly').callsFake(() => {
          cy.then(() => {
            scans.push(state.page);
            if (fault === 'strict scan') throw new Error('Controlled strict queue scan');
          });
        });
        if (fault !== 'none') {
          expectedFailure = {
            provider: 'owned case left provider To review',
            'later DOM': 'not to exist',
            'strict scan': 'Controlled strict queue scan',
          }[fault];
          cy.once('fail', (error) => {
            if (!error.message.includes(expectedFailure)) throw error;
            observedFailure = true;
            if (fault === 'later DOM') expect(state.page).to.equal(3);
            return false;
          });
        }
        actions.enableAccessibility();
        actions.assertOwnedAbsentFromQueue();
        cy.then(() => {
          expect(visits).to.deep.equal([2, 1, 2, 3]);
          expect(scans).to.deep.equal([1, 1, 2, 3]);
          cy.get(D.row(owned.id)).should('not.exist');
        });
      },
    );
  }
});

describe('Shared casefile review controls', () => {
  it('AC2. should replace a retained reason through the real input', { tags: buildTags() }, () => {
    cy.document().then((document) => {
      document.body.innerHTML = '<textarea id="reason">old</textarea>';
    });
    setCasefileReason('#reason', 'corrected');
    cy.get('#reason').should('have.value', 'corrected');
    setCasefileReason('#reason', '');
    cy.get('#reason').should('have.value', '');
  });

  it('AC2. should activate a focused control through native Enter', { tags: buildTags() }, () => {
    const activated = cy.stub().as('activatedControl');
    cy.document().then((document) => {
      document.body.innerHTML = '<button id="control">Continue</button>';
      document.querySelector('#control')!.addEventListener('click', activated);
    });
    cy.spy(Cypress, 'automation').as('nativeEnter');
    activateCasefileControl('#control', true);
    cy.get('@activatedControl').should('have.been.calledOnce');
    cy.get('@nativeEnter').should('have.been.calledWithMatch', 'remote:debugger:protocol', {
      command: 'Input.dispatchKeyEvent',
      params: { type: 'keyDown', key: 'Enter', text: '\r' },
    });
    cy.get('@nativeEnter').should('have.been.calledWithMatch', 'remote:debugger:protocol', {
      command: 'Input.dispatchKeyEvent',
      params: { type: 'keyUp', key: 'Enter' },
    });
  });
});
