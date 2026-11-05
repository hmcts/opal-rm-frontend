const assert = require('node:assert/strict');
const { test } = require('node:test');
const baseline = require('./cypress-test-metadata-baseline.json');
const { applyBaseline, readValidatorResult } = require('./check-cypress-test-metadata.cjs');

const unit = (entry) => ({ ...entry, kind: 'component', line: 1 });
const failures = baseline.map(unit);
const result = (tests = failures, missing = tests) => ({ tests, failures: missing });

test('ordinary mapped units and all seven exact existing exceptions pass', () => {
  const mapped = unit({ filePath: 'cypress/component/mapped.cy.ts', title: 'mapped' });
  assert.equal(baseline.length, 7);
  assert.deepEqual(applyBaseline(result([...failures, mapped], failures), baseline), {
    checked: 8,
    validated: 1,
    exempt: 7,
    failures: [],
  });
});

for (const filePath of ['cypress/e2e/smoke/new.feature', baseline[0].filePath]) {
  test(`new untagged case fails in ${filePath}`, () => {
    const added = unit({ filePath, title: 'new untagged case' });
    assert.deepEqual(applyBaseline(result([...failures, added]), baseline).failures, [added]);
  });
}

test('renamed baseline test fails as stale', () => {
  const renamed = failures.map((entry, i) => (i ? entry : { ...entry, title: 'renamed' }));
  assert.throws(() => applyBaseline(result(renamed), baseline), /Stale baseline/);
});

test('removed or newly mapped baseline test fails as stale', () => {
  assert.throws(() => applyBaseline(result(failures.slice(1)), baseline), /Stale baseline/);
  assert.throws(() => applyBaseline(result(failures, failures.slice(1)), baseline), /Stale baseline/);
});

test('duplicate baseline entries and ambiguous matching tests fail', () => {
  assert.throws(() => applyBaseline(result(), [...baseline, baseline[0]]), /Duplicate baseline/);
  assert.throws(() => applyBaseline(result([...failures, failures[0]]), baseline), /Ambiguous baseline/);
});

test('ordinary mapped units pass without an exception', () => {
  const mapped = unit({ filePath: 'cypress/component/mapped.cy.ts', title: 'mapped' });
  assert.deepEqual(applyBaseline(result([mapped], []), []), {
    checked: 1,
    validated: 1,
    exempt: 0,
    failures: [],
  });
});

test('baseline requires an explicit reason', () => {
  assert.throws(() => applyBaseline(result(), null), /Invalid baseline/);
  assert.throws(() => applyBaseline(result(), [{ ...baseline[0], reason: '' }]), /Invalid baseline/);
});

const invoke = (response) => readValidatorResult({ spawn: () => response });
test('accepts shared CLI success and metadata-failure exit codes', () => {
  for (const [status, value] of [
    [0, result([], [])],
    [1, result()],
  ]) {
    assert.deepEqual(invoke({ status, stdout: JSON.stringify(value) }), value);
  }
});

test('fails closed on CLI launch, signal, operational and JSON errors', () => {
  for (const response of [
    { error: new Error('ENOENT') },
    { status: null, signal: 'SIGTERM' },
    { status: 2, stderr: 'operational error' },
    {
      status: 1,
      stdout: '',
      stderr: "Failed to parse cypress/component/task3-negative.cy.ts: '}' expected.\n",
    },
    { status: 0, stdout: 'not JSON' },
    { status: 0, stdout: '{}' },
    { status: 0, stdout: JSON.stringify(result()) },
    { status: 1, stdout: JSON.stringify(result([], [])) },
    { status: 0, stdout: JSON.stringify({ tests: [{}], failures: [] }) },
    { status: 1, stdout: JSON.stringify({ tests: [], failures }) },
  ])
    assert.throws(() => invoke(response), /validator/i);
});

test('invokes the published CLI for both complete roots without exclusions', () => {
  readValidatorResult({
    cwd: '/fixture',
    spawn(command, args, options) {
      assert.equal(command, process.platform === 'win32' ? 'corepack.cmd' : 'corepack');
      assert.deepEqual(args, [
        'yarn',
        'exec',
        'opal-cypress-check-new-tests-jira-metadata',
        '--component-root',
        'cypress/component',
        '--feature-root',
        'cypress/e2e',
        '--json',
      ]);
      assert.equal(options.cwd, '/fixture');
      return { status: 0, stdout: JSON.stringify(result([], [])) };
    },
  });
});
