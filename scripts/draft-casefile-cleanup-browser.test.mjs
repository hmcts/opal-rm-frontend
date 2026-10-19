import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  observeCreatedDraft,
  flushCreatedDrafts,
  cleanupCreatedDrafts,
  installDraftCasefileCleanup,
  pathForDraftCasefileCleanup,
} from '../cypress/support/test-data/draft-casefile-cleanup.ts';
import { CheckCaseDetailsActions } from '../cypress/e2e/functional/opal/actions/createDraftCasefile/check-case-details.actions.ts';

const record = {
  draftCasefileId: 123,
  businessUnitId: 44,
  environment: 'http://localhost:5000',
  runId: 'run-1',
  workerId: 'worker-1',
  scenarioKey: 'live submission',
  createdAt: '2026-10-19T10:00:00.000Z',
};
let sequence = 0;
async function fixture(run) {
  const saved = Object.fromEntries(
    ['cy', 'Cypress', 'afterEach', 'expect'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  const queue = [];
  const log = [];
  const aliases = new Map();
  const hooks = [];
  const state = { statuses: [204], taskFailure: false, current: `scenario-${++sequence}` };
  let insertion;
  let subject;
  let listener;
  const chain = {};
  function enqueue(fn) {
    if (insertion === undefined) queue.push(fn);
    else queue.splice(insertion++, 0, fn);
    return chain;
  }
  chain.then = (fn) => enqueue(() => fn(subject));
  chain.as = (name) =>
    enqueue(() => {
      aliases.set(name, subject);
    });
  Object.assign(chain, {
    task: (name, payload, options) =>
      enqueue(async () => {
        log.push({ name, payload, options });
        if (name === 'draftCasefiles:created' && state.taskFailure) throw new Error('persistence unavailable');
        return null;
      }),
    request: (options) =>
      enqueue(() => {
        log.push({ name: 'DELETE', options });
        if (state.transportFailure) throw new Error('transport failed');
        return { status: state.statuses.shift(), body: 'private response body' };
      }),
    get: (name) => enqueue(() => aliases.get(name)),
    click: () =>
      enqueue(() => {
        log.push({ name: 'click' });
        const original = state.current;
        state.current = state.responseIdentity ?? original;
        listener?.({ body: state.receipt });
        state.current = original;
      }),
    wait: (name) =>
      enqueue(() => {
        log.push({ name: 'wait', alias: name });
        return { response: { statusCode: state.httpStatus ?? 201, body: state.receipt } };
      }),
    wrap: (value) => enqueue(() => value),
    intercept: (_method, _url, handler) =>
      enqueue(() => {
        handler({
          body: { business_unit_id: 44 },
          on: (_event, callback) => {
            listener = callback;
          },
        });
      }),
  });
  globalThis.cy = chain;
  globalThis.Cypress = {
    spec: { relative: '' },
    get currentTest() {
      return { titlePath: [state.current] };
    },
    config: () => record.environment,
    env: (key) => (key === 'draftCasefileRunId' ? record.runId : record.workerId),
  };
  globalThis.afterEach = (hook) => hooks.push(hook);
  globalThis.expect = (value) => ({
    to: {
      equal: (expected) => assert.equal(value, expected),
      be: { greaterThan: (minimum) => assert.ok(value > minimum) },
      have: { property: (key, expected) => assert.equal(value?.[key], expected) },
    },
  });
  const own = (id = 123) => ({ ...record, draftCasefileId: id, scenarioKey: '/' + state.current });
  async function drain() {
    try {
      while (queue.length) {
        const command = queue.shift();
        insertion = 0;
        const result = command();
        const value = result === chain ? undefined : await result;
        if (value !== undefined) subject = value;
        insertion = undefined;
      }
    } catch (error) {
      queue.length = 0;
      insertion = undefined;
      throw error;
    }
  }
  try {
    await run({ state, log, hooks, own, drain });
  } finally {
    for (const [key, descriptor] of Object.entries(saved)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}
const names = (log) => log.map(({ name }) => name);

test('builds the assumed route and rejects unsafe IDs', () => {
  assert.equal(
    pathForDraftCasefileCleanup(record),
    '/opal-maintenance-service/testing-support/draft-casefiles/123?business_unit_id=44',
  );
  for (const key of ['draftCasefileId', 'businessUnitId']) {
    for (const value of [0, -1, 1.5, '123', Number.MAX_SAFE_INTEGER + 1]) {
      assert.throws(() => pathForDraftCasefileCleanup({ ...record, [key]: value }));
    }
  }
});

test('observe is synchronous; successful flush persists once before following assertions', () =>
  fixture(async ({ own, drain, log }) => {
    observeCreatedDraft(own());
    assert.deepEqual(log, []);
    flushCreatedDrafts();
    cy.then(() => log.push({ name: 'assertion' }));
    await drain();
    flushCreatedDrafts();
    await drain();
    assert.deepEqual(names(log), ['draftCasefiles:created', 'assertion']);
  }));

test('persistence failure surfaces and afterEach can retry the retained observation', () =>
  fixture(async ({ own, drain, log, state }) => {
    observeCreatedDraft(own());
    state.taskFailure = true;
    flushCreatedDrafts();
    await assert.rejects(drain, /persistence unavailable/);
    state.taskFailure = false;
    cleanupCreatedDrafts();
    await drain();
    assert.deepEqual(names(log), [
      'draftCasefiles:created',
      'draftCasefiles:created',
      'DELETE',
      'draftCasefiles:deleted',
    ]);
  }));

test('204 resolves ownership; duplicate observations produce one deletion with exact request options', () =>
  fixture(async ({ own, drain, log }) => {
    observeCreatedDraft(own());
    observeCreatedDraft(own());
    cleanupCreatedDrafts();
    await drain();
    cleanupCreatedDrafts();
    await drain();
    assert.deepEqual(names(log), ['draftCasefiles:created', 'DELETE', 'draftCasefiles:deleted']);
    assert.deepEqual(log[1].options, {
      method: 'DELETE',
      url: pathForDraftCasefileCleanup(record),
      headers: { Accept: 'application/json' },
      failOnStatusCode: false,
      followRedirect: false,
      retryOnStatusCodeFailure: false,
      retryOnNetworkFailure: false,
      timeout: 15000,
      log: false,
    });
  }));

for (const status of [404, 401, 403, 409, 500, 200, 302]) {
  test(`${status} journals failure, retains ownership and shows dependency without raw body`, () =>
    fixture(async ({ own, drain, log, state }) => {
      state.statuses = [status];
      observeCreatedDraft(own());
      cleanupCreatedDrafts();
      await assert.rejects(
        drain,
        (error) =>
          /test-support deletion/.test(error.message) &&
          error.message.includes(String(status)) &&
          !error.message.includes('private response body'),
      );
      assert.deepEqual(names(log), ['draftCasefiles:created', 'DELETE', 'draftCasefiles:failed']);
      assert.equal(log[2].payload.status, status);
      state.statuses = [204];
      cleanupCreatedDrafts();
      await drain();
      assert.deepEqual(names(log).slice(-2), ['DELETE', 'draftCasefiles:deleted']);
    }));
}

test('collects HTTP failures after attempting all scenario records', () =>
  fixture(async ({ own, drain, log, state }) => {
    state.statuses = [500, 204];
    observeCreatedDraft(own());
    observeCreatedDraft(own(124));
    cleanupCreatedDrafts();
    await assert.rejects(drain, /123.*500/);
    assert.deepEqual(names(log), [
      'draftCasefiles:created',
      'draftCasefiles:created',
      'DELETE',
      'draftCasefiles:failed',
      'DELETE',
      'draftCasefiles:deleted',
    ]);
  }));

test('one hook still cleans after test assertion failure without swallowing original failure', () =>
  fixture(async ({ own, drain, log, hooks }) => {
    installDraftCasefileCleanup();
    installDraftCasefileCleanup();
    assert.equal(hooks.length, 1);
    observeCreatedDraft(own());
    cy.then(() => {
      throw new Error('original assertion');
    });
    await assert.rejects(drain, /original assertion/);
    hooks[0].call({ currentTest: { state: 'failed' } });
    await drain();
    assert.deepEqual(names(log), ['draftCasefiles:created', 'DELETE', 'draftCasefiles:deleted']);
  }));

test('no live observations means no deletion, including previous scenarios and other workers', () =>
  fixture(async ({ own, drain, log, state }) => {
    observeCreatedDraft({ ...own(), workerId: 'other-worker' });
    observeCreatedDraft({ ...own(), scenarioKey: 'previous scenario' });
    cleanupCreatedDrafts();
    await drain();
    assert.deepEqual(log, []);
    state.current = 'controlled scenario';
    cleanupCreatedDrafts();
    await drain();
    assert.deepEqual(log, []);
  }));

for (const id of [undefined, 0, '123', Number.MAX_SAFE_INTEGER + 1]) {
  test(`invalid receipt ID ${id} fails assertion without guessing deletion target`, () =>
    fixture(async ({ state, log, drain }) => {
      state.receipt = { draft_casefile_id: id, casefile_status: 'SUBMITTED' };
      const actions = new CheckCaseDetailsActions();
      actions.prepareLiveSubmission();
      actions.submitLive();
      await assert.rejects(drain);
      cleanupCreatedDrafts();
      await drain();
      assert.deepEqual(names(log), ['click', 'wait']);
    }));
}

for (const unexpected of [{ httpStatus: 200 }, { receiptStatus: 'DRAFT' }]) {
  test(`valid ID persists before receipt failure ${JSON.stringify(unexpected)}`, () =>
    fixture(async ({ state, log, drain }) => {
      state.httpStatus = unexpected.httpStatus;
      state.receipt = { draft_casefile_id: 123, casefile_status: unexpected.receiptStatus ?? 'SUBMITTED' };
      const actions = new CheckCaseDetailsActions();
      actions.prepareLiveSubmission();
      actions.submitLive();
      await assert.rejects(drain);
      assert.deepEqual(names(log), ['click', 'wait', 'draftCasefiles:created']);
      cleanupCreatedDrafts();
      await drain();
      assert.deepEqual(names(log).slice(-2), ['DELETE', 'draftCasefiles:deleted']);
    }));
}

test('live submit stores the receipt ID and confirmation consumes no second wait', () =>
  fixture(async ({ state, log, drain }) => {
    state.receipt = { draft_casefile_id: 123, casefile_status: 'SUBMITTED' };
    const actions = new CheckCaseDetailsActions();
    actions.prepareLiveSubmission();
    actions.submitLive();
    await drain();
    let visibleId;
    actions.assertConfirmationPanel = (id) => {
      visibleId = id;
    };
    actions.assertLiveConfirmation();
    await drain();
    assert.equal(visibleId, 123);
    assert.deepEqual(names(log), ['click', 'wait', 'draftCasefiles:created']);
  }));

test('transport failure preserves durable pending records for replay and aborts later requests', () =>
  fixture(async ({ own, drain, log, state }) => {
    observeCreatedDraft(own());
    observeCreatedDraft(own(124));
    state.transportFailure = true;
    cleanupCreatedDrafts();
    await assert.rejects(drain, /transport failed/);
    assert.deepEqual(names(log), ['draftCasefiles:created', 'draftCasefiles:created', 'DELETE']);
    state.transportFailure = false;
    state.statuses = [204, 204];
    cleanupCreatedDrafts();
    await drain();
    assert.deepEqual(names(log).slice(-4), ['DELETE', 'draftCasefiles:deleted', 'DELETE', 'draftCasefiles:deleted']);
  }));

test('response callback uses the identity captured when its live intercept was registered', () =>
  fixture(async ({ state, log, drain, own }) => {
    state.receipt = { draft_casefile_id: 123, casefile_status: 'SUBMITTED' };
    const capturedScenario = own().scenarioKey;
    const actions = new CheckCaseDetailsActions();
    actions.prepareLiveSubmission();
    await drain();
    state.responseIdentity = 'a later global test identity';
    actions.submitLive();
    await drain();
    const created = log.find(({ name }) => name === 'draftCasefiles:created');
    assert.equal(created.payload.scenarioKey, capturedScenario);
    cleanupCreatedDrafts();
    await drain();
  }));
