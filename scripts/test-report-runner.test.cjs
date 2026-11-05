const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const childProcess = require('node:child_process');
const {
  runOpalSuite,
} = require('../node_modules/@hmcts/opal-frontend-common-cypress/dist/runner/opal-suite-runner.js');

for (const [testCode, reportCode, noReports, expectedCode, expectedBuilds] of [
  [0, 0, false, 0, 1],
  [1, 0, false, 1, 1],
  [2, 0, false, 2, 1],
  [0, 7, false, 7, 1],
  [2, 7, false, 2, 1],
  [1, 0, true, 1, 0],
]) {
  test(`component: test=${testCode}, report=${reportCode}, noReports=${noReports}`, () => {
    const originalSpawn = childProcess.spawnSync;
    const calls = [];
    childProcess.spawnSync = (command, args) => {
      calls.push([command, args]);
      if (path.basename(command) === 'cypress') return { status: testCode };
      if (args.some((arg) => String(arg).endsWith('build-component-report.js'))) {
        return { status: reportCode };
      }
      return { status: 0 };
    };
    try {
      const args = ['component', '--serial', '--no-reset', '--browser=edge'];
      if (noReports) args.push('--no-reports');
      assert.equal(runOpalSuite(args, process.cwd(), {}), expectedCode);
      assert.equal(
        calls.filter(([, values]) => values.some((value) => String(value).endsWith('build-component-report.js')))
          .length,
        expectedBuilds,
      );
    } finally {
      childProcess.spawnSync = originalSpawn;
    }
  });
}

const fs = require('node:fs');
const os = require('node:os');
const vm = require('node:vm');
const ts = require('typescript');
const zephyr = require(
  path.join(path.dirname(require.resolve('@hmcts/zephyr-automation-nodejs')), 'cypress/zephyr-automation.js'),
);

function componentHooks(managed) {
  const events = {};
  const calls = [];
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync('cypress.config.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, {
    exports: module.exports,
    module,
    __dirname: process.cwd(),
    process: { env: { OPAL_COMPONENT_REPORTS_MANAGED: managed } },
    require(name) {
      if (name === 'cypress') return { defineConfig: (config) => config };
      if (name === 'tsconfig-paths-webpack-plugin') return class {};
      if (name === '@hmcts/zephyr-automation-nodejs') {
        return {
          cleanZephyrReports: () => calls.push('clean'),
          mergeZephyrReports: () => calls.push('merge'),
        };
      }
      if (name === '@cypress/grep/plugin') return { plugin: () => {} };
      if (name === 'cypress-mochawesome-reporter/plugin') return () => {};
      return require(name);
    },
  });
  module.exports.default.component.setupNodeEvents(
    (name, handler) => {
      events[name] = handler;
    },
    { env: {} },
  );
  events['before:run']();
  events['after:run']();
  return calls;
}

test('component worker hooks defer shared cleanup and merge to parent; direct hooks retain lifecycle', () => {
  assert.deepEqual(componentHooks('true'), []);
  assert.deepEqual(componentHooks(undefined), ['clean', 'merge']);
  assert.deepEqual(componentHooks('false'), ['clean', 'merge']);
});

for (const testCode of [0, 2]) {
  test(`parallel parent merges all late-worker records after exit ${testCode} and removes stale run`, () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'opal-zephyr-race-'));
    fs.symlinkSync(path.join(process.cwd(), 'node_modules'), path.join(cwd, 'node_modules'));
    const rootDir = path.join(cwd, 'functional-output');
    const staging = path.join(rootDir, 'zephyr/temp');
    const finalPath = path.join(rootDir, 'zephyr/cypress-report-1.json');
    const record = (fullTitle, status) => ({
      fullTitle,
      status,
      file: 'component.cy.ts',
      parents: ['suite'],
      durationMs: 1,
    });
    const writeShard = (worker, tests) => {
      fs.mkdirSync(staging, { recursive: true });
      fs.writeFileSync(
        path.join(staging, `cypress-report-${worker}.json`),
        JSON.stringify({
          meta: { reporter: 'zephyr-json' },
          stats: {},
          tests,
        }),
      );
    };
    writeShard('stale', [record('previous run', 'passed')]);
    fs.writeFileSync(finalPath, '{"stale":true}');
    const originalSpawn = childProcess.spawnSync;
    let workerRan = false;
    let workerEnv;
    let cleanStaging;
    let cleanFinal;
    let earlyCount;
    childProcess.spawnSync = (command, args, options) => {
      if (path.basename(command) === 'cypress-parallel') {
        workerRan = true;
        workerEnv = options.env.OPAL_COMPONENT_REPORTS_MANAGED;
        cleanStaging = !fs.existsSync(staging);
        cleanFinal = !fs.existsSync(finalPath);
        writeShard('1', [record('first', 'passed')]);
        zephyr.mergeZephyrReports({ rootDir, dedupe: true });
        earlyCount = JSON.parse(fs.readFileSync(finalPath)).tests.length;
        writeShard('2', [record('failed worker', 'failed'), record('first', 'passed')]);
        writeShard('3', [record('last worker', 'pending')]);
        return { status: testCode };
      }
      if (args.some((arg) => String(arg).endsWith('build-component-report.js'))) return { status: 0 };
      return originalSpawn(command, args, options);
    };
    try {
      assert.equal(
        runOpalSuite(['component', '--parallel', '--no-reset', '--browser=edge'], cwd, process.env),
        testCode,
      );
      assert.equal(workerRan, true);
      const merged = JSON.parse(fs.readFileSync(finalPath));
      assert.deepEqual(merged.tests.map((value) => value.fullTitle).sort(), ['failed worker', 'first', 'last worker']);
      assert.deepEqual(merged.stats, { tests: 3, passes: 1, failures: 1, pending: 1, durationMs: 3 });
      assert.equal(workerEnv, 'true');
      assert.equal(cleanStaging, true, 'parent cleans stale shards before workers start');
      assert.equal(cleanFinal, true, 'parent removes stale final output');
      assert.equal(earlyCount, 1, 'early merge is incomplete');
    } finally {
      childProcess.spawnSync = originalSpawn;
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });
}

for (const [testCode, reportCode, mergeCode, noReports, expectedCode] of [
  [0, 0, 0, false, 0],
  [1, 0, 0, false, 1],
  [2, 0, 0, false, 2],
  [0, 7, 0, false, 7],
  [2, 7, 5, false, 2],
  [0, 0, 5, false, 5],
  [0, 7, 5, false, 7],
  [1, 0, 0, true, 1],
]) {
  test(`parallel statuses: test=${testCode}, html=${reportCode}, zephyr=${mergeCode}, noReports=${noReports}`, () => {
    const originalSpawn = childProcess.spawnSync;
    const actions = [];
    childProcess.spawnSync = (command, args, options) => {
      if (path.basename(command) === 'cypress-parallel') {
        actions.push('workers');
        assert.equal(options.env.OPAL_COMPONENT_REPORTS_MANAGED, 'true');
        return { status: testCode };
      }
      if (args.some((arg) => String(arg).endsWith('build-component-report.js'))) {
        actions.push('html');
        return { status: reportCode };
      }
      if (args[0] !== '-e') return { status: 0 };
      const merging = args[1].includes('zephyr.mergeZephyrReports(');
      actions.push(merging ? 'merge' : 'clean');
      assert.equal(options.env.CYPRESS_THREAD, '1');
      return { status: merging ? mergeCode : 0 };
    };
    try {
      const args = ['component', '--parallel', '--no-reset', '--browser=edge'];
      if (noReports) args.push('--no-reports');
      assert.equal(runOpalSuite(args, process.cwd(), { CYPRESS_THREAD: '3' }), expectedCode);
      assert.deepEqual(actions, noReports ? ['clean', 'workers'] : ['clean', 'workers', 'html', 'merge']);
    } finally {
      childProcess.spawnSync = originalSpawn;
    }
  });
}

test('parallel staging-clean failure aborts workers and reports failure', () => {
  const originalSpawn = childProcess.spawnSync;
  let calls = 0;
  childProcess.spawnSync = (command, args) => {
    if (args[0] !== '-e') {
      assert.notEqual(path.basename(command), 'cypress-parallel');
      return { status: 0 };
    }
    calls += 1;
    return { status: 9 };
  };
  try {
    assert.equal(runOpalSuite(['component', '--parallel', '--no-reset', '--browser=edge'], process.cwd(), {}), 9);
    assert.equal(calls, 1);
  } finally {
    childProcess.spawnSync = originalSpawn;
  }
});

test('managed serial leaf does not clean or finalize shared staging', () => {
  const originalSpawn = childProcess.spawnSync;
  let workerCalls = 0;
  childProcess.spawnSync = (command, args, options) => {
    assert.notEqual(args[0], '-e');
    assert.equal(
      args.some((arg) => String(arg).endsWith('build-component-report.js')),
      false,
    );
    if (path.basename(command) === 'cypress') {
      workerCalls += 1;
      assert.equal(options.env.OPAL_COMPONENT_REPORTS_MANAGED, 'true');
    }
    return { status: 0 };
  };
  try {
    assert.equal(
      runOpalSuite(['component', '--serial', '--no-reset', '--no-reports', '--browser=edge'], process.cwd(), {
        OPAL_COMPONENT_REPORTS_MANAGED: 'true',
      }),
      0,
    );
    assert.equal(workerCalls, 1);
  } finally {
    childProcess.spawnSync = originalSpawn;
  }
});

test('native merge with no valid shards fails the parent command instead of reporting success', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'opal-zephyr-missing-'));
  fs.symlinkSync(path.join(process.cwd(), 'node_modules'), path.join(cwd, 'node_modules'));
  const originalSpawn = childProcess.spawnSync;
  let mergeError = '';
  childProcess.spawnSync = (command, args, options) => {
    if (args[0] === '-e') {
      const result = originalSpawn(command, args, { ...options, stdio: 'pipe', encoding: 'utf8' });
      mergeError += result.stderr;
      return result;
    }
    return { status: 0 };
  };
  try {
    assert.equal(runOpalSuite(['component', '--parallel', '--no-reset', '--browser=edge'], cwd, process.env), 1);
    assert.match(mergeError, /Component Zephyr merge did not produce cypress-report-1.json/);
  } finally {
    childProcess.spawnSync = originalSpawn;
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});
