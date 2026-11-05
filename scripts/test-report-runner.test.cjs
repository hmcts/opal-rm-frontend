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

function loadComponentConfig(env = {}) {
  const calls = [];
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync('cypress.config.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, {
    exports: module.exports,
    module,
    __dirname: process.cwd(),
    process: { env },
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
  return { config: module.exports.default, calls };
}

function componentHooks(managed) {
  const events = {};
  const { config, calls } = loadComponentConfig({ OPAL_COMPONENT_REPORTS_MANAGED: managed });
  config.component.setupNodeEvents(
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

test('component HTML retains the source path outside a valid managed worker', () => {
  const sourcePath = 'cypress/support/component-index.html';
  for (const env of [
    {},
    { CYPRESS_THREAD: '1' },
    { OPAL_COMPONENT_REPORTS_MANAGED: 'false', CYPRESS_THREAD: '1' },
    ...[
      undefined,
      '',
      '0',
      '-1',
      '1.5',
      '01',
      '1e0',
      'Infinity',
      '9007199254740992',
      '../1',
      '1/../../escape',
      ' 1',
      '1\n',
    ].map((thread) => ({
      OPAL_COMPONENT_REPORTS_MANAGED: 'true',
      CYPRESS_THREAD: thread,
    })),
  ]) {
    assert.equal(loadComponentConfig(env).config.component.indexHtmlFile, sourcePath, JSON.stringify(env));
  }
});

test('managed workers own byte-identical private HTML inputs across threads and repeated runs', (t) => {
  const sourcePath = path.resolve('cypress/support/component-index.html');
  const originalBytes = fs.readFileSync(sourcePath);
  const sourceStat = fs.statSync(sourcePath, { bigint: true });
  const copies = [];
  t.after(() => {
    for (const copy of copies) fs.rmSync(path.dirname(copy), { recursive: true, force: true });
  });
  for (const thread of ['1', '2', '3', '1']) {
    const { config } = loadComponentConfig({ OPAL_COMPONENT_REPORTS_MANAGED: 'true', CYPRESS_THREAD: thread });
    const copy = config.component.indexHtmlFile;
    assert.equal(path.isAbsolute(copy), true);
    assert.notEqual(copy, sourcePath);
    copies.push(copy);
    assert.deepEqual(fs.readFileSync(copy), originalBytes);
  }
  assert.equal(new Set(copies).size, 4);
  assert.equal(new Set(copies.map((copy) => path.dirname(copy))).size, 4);
  const siblingStat = fs.statSync(copies[1], { bigint: true });
  const changedTime = new Date(Number(fs.statSync(copies[0]).mtimeMs) + 10000);
  fs.utimesSync(copies[0], changedTime, changedTime);
  assert.notEqual(fs.statSync(copies[0], { bigint: true }).mtimeNs, siblingStat.mtimeNs);
  assert.equal(fs.statSync(copies[1], { bigint: true }).mtimeNs, siblingStat.mtimeNs);
  assert.equal(fs.statSync(sourcePath, { bigint: true }).mtimeNs, sourceStat.mtimeNs);
  assert.deepEqual(fs.readFileSync(sourcePath), originalBytes);
});

test('managed HTML isolation preserves component build, cache, retry and port configuration', (t) => {
  const direct = loadComponentConfig({ CYPRESS_THREAD: '2' }).config;
  const managed = loadComponentConfig({ OPAL_COMPONENT_REPORTS_MANAGED: 'true', CYPRESS_THREAD: '2' }).config;
  if (path.isAbsolute(managed.component.indexHtmlFile)) {
    t.after(() => fs.rmSync(path.dirname(managed.component.indexHtmlFile), { recursive: true, force: true }));
  }
  // JSON normalizes VM realm prototypes while retaining the effective webpack/build settings.
  const normalized = (value) => JSON.parse(JSON.stringify(value));
  assert.deepEqual(normalized(managed.component.devServer), normalized(direct.component.devServer));
  assert.equal(managed.component.devServer.webpackConfig.devServer.port, 8092);
  assert.equal(managed.component.devServer.webpackConfig.optimization.moduleIds, 'named');
  assert.equal(Object.hasOwn(managed.component.devServer.webpackConfig, 'cache'), false);
  assert.equal(Object.hasOwn(managed.component, 'justInTimeCompile'), false);
  assert.equal(Object.hasOwn(managed.component, 'retries'), false);
  assert.equal(Object.hasOwn(managed, 'retries'), false);
  assert.deepEqual(normalized(managed.e2e.retries), { runMode: 1, openMode: 0 });
});

for (const [testCode, hasFailures, htmlCode, expectedCode] of [
  [0, true, 0, 1],
  [2, true, 0, 2],
  [0, false, 0, 0],
  [0, true, 7, 7],
]) {
  test(`parallel parent merges complete outcomes: dispatcher=${testCode}, failures=${hasFailures}, html=${htmlCode}`, () => {
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
        writeShard('2', [record('second worker', hasFailures ? 'failed' : 'passed'), record('first', 'passed')]);
        writeShard('3', [record('last worker', hasFailures ? 'pending' : 'passed')]);
        return { status: testCode };
      }
      if (args.some((arg) => String(arg).endsWith('build-component-report.js'))) return { status: htmlCode };
      return originalSpawn(command, args, options);
    };
    try {
      const exitCode = runOpalSuite(['component', '--parallel', '--no-reset', '--browser=edge'], cwd, process.env);
      assert.equal(workerRan, true);
      const merged = JSON.parse(fs.readFileSync(finalPath));
      assert.deepEqual(merged.tests.map((value) => value.fullTitle).sort(), ['first', 'last worker', 'second worker']);
      assert.deepEqual(merged.tests.map(({ fullTitle, status }) => [fullTitle, status]).sort(), [
        ['first', 'passed'],
        ['last worker', hasFailures ? 'pending' : 'passed'],
        ['second worker', hasFailures ? 'failed' : 'passed'],
      ]);
      assert.deepEqual(merged.stats, {
        tests: 3,
        passes: hasFailures ? 1 : 3,
        failures: hasFailures ? 1 : 0,
        pending: hasFailures ? 1 : 0,
        durationMs: 3,
      });
      assert.equal(exitCode, expectedCode);
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
  [0, 0, 0, true, 0],
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

for (const [label, mutation] of [
  ['invalid JSON', "fs.writeFileSync(reportPath, '{broken')"],
  ['missing failure total', 'delete report.stats.failures'],
  ['invalid failure total', "report.stats.failures = '0'"],
  ['negative failure total', 'report.stats.failures = -1'],
  ['failed record with zero failure total', "report.tests[0].status = 'failed'"],
  ['inconsistent test total', 'report.stats.tests = 2'],
]) {
  test(`native final result validation fails closed: ${label}`, () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'opal-zephyr-invalid-'));
    fs.symlinkSync(path.join(process.cwd(), 'node_modules'), path.join(cwd, 'node_modules'));
    const originalSpawn = childProcess.spawnSync;
    let finalizerRan = false;
    childProcess.spawnSync = (command, args, options) => {
      if (path.basename(command) === 'cypress-parallel') {
        const staging = path.join(cwd, 'functional-output/zephyr/temp');
        fs.mkdirSync(staging, { recursive: true });
        fs.writeFileSync(
          path.join(staging, 'cypress-report-1.json'),
          JSON.stringify({
            meta: { reporter: 'zephyr-json' },
            stats: {},
            tests: [{ fullTitle: 'passed', status: 'passed' }],
          }),
        );
        return { status: 0 };
      }
      if (args[0] !== '-e') return { status: 0 };
      if (args[1].includes('zephyr.mergeZephyrReports(')) {
        finalizerRan = true;
        const injected = `
const fs = require('node:fs');
const reportPath = 'functional-output/zephyr/cypress-report-1.json';
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
${mutation};
${label === 'invalid JSON' ? '' : 'fs.writeFileSync(reportPath, JSON.stringify(report));'}
`;
        const script = args[1].replace(
          "zephyr.mergeZephyrReports({ rootDir: 'functional-output', dedupe: true });",
          "zephyr.mergeZephyrReports({ rootDir: 'functional-output', dedupe: true });\n{ " + injected + ' }',
        );
        assert.notEqual(script, args[1]);
        const result = originalSpawn(command, ['-e', script], { ...options, stdio: 'pipe', encoding: 'utf8' });
        assert.match(
          result.stderr,
          label === 'invalid JSON' ? /SyntaxError/ : /invalid or inconsistent failure totals/,
        );
        return result;
      }
      return originalSpawn(command, args, { ...options, stdio: 'pipe' });
    };
    try {
      assert.equal(runOpalSuite(['component', '--parallel', '--no-reset', '--browser=edge'], cwd, process.env), 1);
      assert.equal(finalizerRan, true);
    } finally {
      childProcess.spawnSync = originalSpawn;
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });
}
