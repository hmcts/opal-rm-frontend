import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const marker = 'E2E-0123456789abcdef';
const helperPath = new URL('../cypress/support/draftCasefiles.ts', import.meta.url);
const actionsPath = new URL(
  '../cypress/e2e/functional/opal/actions/createDraftCasefile/check-case-details.actions.ts',
  import.meta.url,
);

function loadModule(file, globals, require = () => ({})) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(source, { exports, require, crypto: globalThis.crypto, ...globals });
  return exports;
}

// Exercise the installed hook without a browser or live records, preserving rejected requests.
function setup(outcomes = []) {
  const hooks = [];
  const requests = [];
  const files = new Map();
  const env = new Map();
  class Chain {
    constructor(value) {
      this.promise = Promise.resolve(value);
    }
    then(resolve, reject) {
      return new Chain(this.promise.then(resolve, reject));
    }
    each(callback) {
      return this.then(async (values) => {
        for (const value of values) await callback(value);
        return values;
      });
    }
  }
  const cy = {
    wrap: (value) => new Chain(value),
    writeFile: (path, value) => {
      files.set(path, JSON.parse(JSON.stringify(value)));
      return new Chain(null);
    },
    request: (options) => {
      requests.push(options);
      const outcome = outcomes.shift() ?? { status: 204 };
      return new Chain(outcome instanceof Error ? Promise.reject(outcome) : outcome);
    },
  };
  const globals = {
    cy,
    Cypress: {
      config: () => 'http://localhost:5000',
      env: (...args) => (args.length === 1 ? env.get(args[0]) : env.set(args[0], args[1])),
    },
    afterEach: (hook) => hooks.push(hook),
  };
  const helper = loadModule(helperPath, globals);
  helper.installDraftCasefileCleanup();
  return { helper, cy, globals, hooks, requests, files, cleanup: () => hooks[0]() };
}

function outstanding(files) {
  return [...files.values()].flatMap((file) => file.outstanding);
}

test('generates exact unique markers and rejects unsafe identifiers and markers', () => {
  const { helper } = setup();
  const markers = Array.from({ length: 100 }, () => helper.createDraftCasefileTestRunReference());
  assert.equal(new Set(markers).size, 100);
  markers.forEach((value) => assert.match(value, /^E2E-[0-9a-f]{16}$/));
  for (const id of [0, -1, 1.5, '123', Number.MAX_SAFE_INTEGER + 1, null]) {
    assert.throws(() => helper.recordCreatedId(id, marker), /positive safe-integer/);
  }
  for (const value of ['', 'E2E-0123456789abcdeF', `${marker}0`, 'E2E-0123456789abcde']) {
    assert.throws(() => helper.recordCreatedId(123, value), /exact E2E/);
  }
});

test('installs once and sends no cleanup without an observed live receipt', async () => {
  const state = setup();
  state.helper.installDraftCasefileCleanup();
  assert.equal(state.hooks.length, 1);
  await state.cleanup();
  assert.equal(state.requests.length, 0);
  assert.equal(state.files.size, 0);
});

test('deduplicates receipts, uses the session proxy and exact marker, and removes only 204 receipts', async () => {
  const state = setup();
  state.helper.recordCreatedId(123, marker);
  state.helper.recordCreatedId(123, marker);
  await state.cleanup();
  assert.equal(state.requests.length, 1);
  const request = state.requests[0];
  assert.equal(request.method, 'DELETE');
  assert.equal(request.url, '/opal-maintenance-service/testing-support/draft-casefiles/123');
  assert.equal(request.headers['Test-Run-Reference'], marker);
  assert.equal(request.headers.Accept, undefined);
  assert.equal(request.failOnStatusCode, false);
  assert.equal(request.followRedirect, false);
  assert.equal(request.retryOnNetworkFailure, false);
  assert.equal(request.log, false);
  for (const name of ['body', 'auth', 'qs']) assert.equal(name in request, false);
  assert.deepEqual(outstanding(state.files), []);
  await state.cleanup();
  assert.equal(state.requests.length, 1);
});

for (const status of [400, 401, 403, 404, 409, 500, 503]) {
  test(`HTTP ${status} fails cleanup, retains the receipt and still attempts other targets`, async () => {
    const state = setup([{ status }, { status: 204 }]);
    state.helper.recordCreatedId(123, marker);
    state.helper.recordCreatedId(456, 'E2E-fedcba9876543210');
    await assert.rejects(Promise.resolve(state.cleanup()), new RegExp(`123.*${marker}.*HTTP ${status}`));
    assert.equal(state.requests.length, 2);
    assert.deepEqual(outstanding(state.files), [{ id: 123, testRunReference: marker }]);
    // A separately authorised retry can remove the same retained receipt.
    await state.cleanup();
    assert.equal(state.requests.at(-1).url.endsWith('/123'), true);
    assert.deepEqual(outstanding(state.files), []);
  });
}

test('transport failure fails the hook and leaves the ID and exact marker in the ledger', async () => {
  const state = setup([new Error('connection reset')]);
  state.helper.recordCreatedId(123, marker);
  state.helper.recordCreatedId(456, 'E2E-fedcba9876543210');
  await assert.rejects(Promise.resolve(state.cleanup()), /connection reset/);
  assert.deepEqual(outstanding(state.files), [
    { id: 123, testRunReference: marker },
    { id: 456, testRunReference: 'E2E-fedcba9876543210' },
  ]);
});

test('the real response listener records the ID before any receipt or confirmation assertions', async () => {
  const state = setup();
  let listener;
  state.cy.intercept = (_method, _url, callback) => {
    callback({ on: (_event, responseListener) => (listener = responseListener) });
    return { as() {} };
  };
  const { CheckCaseDetailsActions } = loadModule(actionsPath, state.globals, (name) =>
    // Webpack compiles a separate helper instance in the feature bundle.
    name.endsWith('/draftCasefiles') ? loadModule(helperPath, state.globals) : {},
  );
  new CheckCaseDetailsActions().prepareLiveSubmission();
  listener({ body: { draft_casefile_id: 789, casefile_status: 'SUBMITTED' } });
  // Simulate a scenario ending at a failed assertion before consuming the receipt alias.
  await state.cleanup();
  assert.equal(state.requests[0].url.endsWith('/789'), true);
  assert.match(state.requests[0].headers['Test-Run-Reference'], /^E2E-[0-9a-f]{16}$/);
});
