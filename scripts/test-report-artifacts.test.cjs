const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { snapshotZephyrReports, ensureHtmlReport } = require('./test-report-artifacts.cjs');

test('snapshots survive removal of the shared Zephyr directory', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-report-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, 'functional-output');
  const stage = path.join(source, 'component/edge');
  fs.mkdirSync(path.join(source, 'zephyr'), { recursive: true });
  fs.writeFileSync(path.join(source, 'zephyr/cypress-report-1.json'), '{"tests":[]}');
  assert.deepEqual(snapshotZephyrReports(source, stage), ['cypress-report-1.json']);
  fs.rmSync(path.join(source, 'zephyr'), { recursive: true });
  assert.equal(fs.readFileSync(path.join(stage, 'zephyr/cypress-report-1.json'), 'utf8'), '{"tests":[]}');
});

test('fallback escapes its title and never replaces real HTML', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-report-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const reportDir = path.join(root, 'cucumber');
  fs.mkdirSync(reportDir);
  fs.writeFileSync(path.join(reportDir, 'OPAL-report-1.ndjson'), '{}\n');
  assert.equal(ensureHtmlReport(reportDir, 'edge-report.html', '<unfinished>'), true);
  const html = fs.readFileSync(path.join(reportDir, 'edge-report.html'), 'utf8');
  assert.match(html, /&lt;unfinished&gt;/);
  assert.match(html, /incomplete/i);
  fs.writeFileSync(path.join(reportDir, 'edge-report.html'), 'REAL REPORT');
  assert.equal(ensureHtmlReport(reportDir, 'edge-report.html', 'replacement'), false);
  assert.equal(fs.readFileSync(path.join(reportDir, 'edge-report.html'), 'utf8'), 'REAL REPORT');
});

function temporary(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-report-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test('missing input clears a stale snapshot; temporary shards are not final reports', (t) => {
  const root = temporary(t);
  const source = path.join(root, 'source');
  const target = path.join(root, 'target');
  fs.mkdirSync(path.join(target, 'zephyr'), { recursive: true });
  fs.writeFileSync(path.join(target, 'zephyr/cucumber-report.json'), 'OLD');
  assert.deepEqual(snapshotZephyrReports(source, target), []);
  assert.equal(fs.existsSync(path.join(target, 'zephyr')), false);
  fs.mkdirSync(path.join(source, 'zephyr/temp'), { recursive: true });
  fs.writeFileSync(path.join(source, 'zephyr/temp/shard.json'), '{}');
  assert.deepEqual(snapshotZephyrReports(source, target), []);
});

test('same-root copy fails without deleting input', (t) => {
  const root = temporary(t);
  fs.mkdirSync(path.join(root, 'zephyr'));
  fs.writeFileSync(path.join(root, 'zephyr/cucumber-report.json'), 'KEEP');
  assert.throws(() => snapshotZephyrReports(root, root), /must differ/);
  assert.equal(fs.readFileSync(path.join(root, 'zephyr/cucumber-report.json'), 'utf8'), 'KEEP');
});

test('stage snapshots retain the results of their own run', (t) => {
  const root = temporary(t);
  fs.mkdirSync(path.join(root, 'zephyr'));
  const report = path.join(root, 'zephyr/cucumber-report.json');
  fs.writeFileSync(report, 'FIRST');
  snapshotZephyrReports(root, path.join(root, 'first'));
  fs.writeFileSync(report, 'SECOND');
  snapshotZephyrReports(root, path.join(root, 'second'));
  assert.equal(fs.readFileSync(path.join(root, 'first/zephyr/cucumber-report.json'), 'utf8'), 'FIRST');
  assert.equal(fs.readFileSync(path.join(root, 'second/zephyr/cucumber-report.json'), 'utf8'), 'SECOND');
});

test('skipped stage produces no fallback', (t) => {
  const root = temporary(t);
  const dir = path.join(root, 'absent/cucumber');
  assert.equal(ensureHtmlReport(dir, 'edge-report.html', 'Skipped'), false);
  assert.equal(fs.existsSync(dir), false);
});

for (const rawPath of ['json/result.json', 'result.xml']) {
  test(`unmerged raw ${rawPath} permits an incomplete report`, (t) => {
    const root = temporary(t);
    const input = path.join(root, rawPath);
    fs.mkdirSync(path.dirname(input), { recursive: true });
    fs.writeFileSync(input, '{}');
    const dir = path.join(root, 'html');
    assert.equal(ensureHtmlReport(dir, 'component-report.html', 'Incomplete'), true);
    assert.match(fs.readFileSync(path.join(dir, 'component-report.html'), 'utf8'), /incomplete/i);
  });
}

test('unknown CLI mode fails', () => {
  const { spawnSync } = require('node:child_process');
  const result = spawnSync(process.execPath, [require.resolve('./test-report-artifacts.cjs'), 'invalid'], {
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
});

test('copies only recognized final reports without exposing their contents', (t) => {
  const root = temporary(t);
  fs.mkdirSync(path.join(root, 'zephyr'));
  for (const name of ['cucumber-report.json', 'cypress-report-1.json', 'unrelated.json']) {
    fs.writeFileSync(path.join(root, 'zephyr', name), '{}');
  }
  assert.deepEqual(snapshotZephyrReports(root, path.join(root, 'stage')), [
    'cucumber-report.json',
    'cypress-report-1.json',
  ]);
  assert.deepEqual(fs.readdirSync(path.join(root, 'stage/zephyr')), ['cucumber-report.json', 'cypress-report-1.json']);
});

test('rejects report paths before writing outside the report directory', (t) => {
  const root = temporary(t);
  assert.throws(() => ensureHtmlReport(root, '../outside.html', 'Invalid'), /one report filename/);
});

test('unrelated files do not create an incomplete report', (t) => {
  const root = temporary(t);
  fs.writeFileSync(path.join(root, 'notes.txt'), 'Notes');
  assert.equal(ensureHtmlReport(path.join(root, 'html'), 'report.html', 'Absent'), false);
});

test('valid CLI snapshot and fallback commands preserve stage evidence', (t) => {
  const { spawnSync } = require('node:child_process');
  const root = temporary(t);
  fs.mkdirSync(path.join(root, 'zephyr'));
  fs.writeFileSync(path.join(root, 'zephyr/cucumber-report.json'), '{}');
  const stage = path.join(root, 'stage');
  const command = require.resolve('./test-report-artifacts.cjs');
  assert.equal(spawnSync(process.execPath, [command, 'snapshot', root, stage]).status, 0);
  const reports = path.join(stage, 'cucumber');
  fs.writeFileSync(path.join(stage, 'result.xml'), '<testsuites/>');
  assert.equal(spawnSync(process.execPath, [command, 'fallback', reports, 'report.html', 'Incomplete']).status, 0);
  assert.match(fs.readFileSync(path.join(reports, 'report.html'), 'utf8'), /incomplete/i);
});

test('component JUnit-only evidence permits an incomplete report', (t) => {
  const root = temporary(t);
  const component = path.join(root, 'component/edge');
  fs.mkdirSync(path.join(component, 'junit'), { recursive: true });
  fs.writeFileSync(path.join(component, 'junit/result.xml'), '<testsuites/>');
  const html = path.join(component, 'html');
  assert.equal(ensureHtmlReport(html, 'component-report.html', 'Incomplete component results'), true);
  assert.match(fs.readFileSync(path.join(html, 'component-report.html'), 'utf8'), /incomplete/i);
});

for (const attempt of ['component', 'functional']) {
  test(`prepare ${attempt} removes only known generated reports and is repeatable`, (t) => {
    const { spawnSync } = require('node:child_process');
    const root = temporary(t);
    const stale =
      attempt === 'component'
        ? [
            'functional-output/component/edge/html/component-report.html',
            'functional-output/component/edge/junit/result.xml',
            'functional-output/component/edge/json/result.json',
            'functional-output/screenshots/edge/old.png',
            'functional-output/zephyr/cypress-report-1.json',
          ]
        : [
            'functional-output/prod/edge/cucumber/edge-report.html',
            'functional-output/prod/edge/cucumber/OPAL-report-1.ndjson',
            'functional-output/prod/edge/result.xml',
            'functional-output/screenshots/edge/old.png',
            'functional-output/zephyr/cucumber-report.json',
            'smoke-output/prod/edge/cucumber/smoke-report.html',
            'smoke-output/prod/edge/result.xml',
            'smoke-output/screenshots/old.png',
            'smoke-output/zephyr/cucumber-report.json',
          ];
    stale.push('cypress/reports/smokeXmlReport.html', 'cypress/reports/functionalXmlReport.html');
    const preserved = [
      'functional-output/account_evidence/created-accounts.json',
      'functional-output/cleanup-receipts.json',
      'functional-output/creation-ledger.json',
      'functional-output/unknown/data.json',
      'smoke-output/component/nonreport.txt',
      'smoke-output/unknown/data.json',
      'archives/previous-stage/report.html',
      'cypress/parallel/weights/weights.json',
      'cypress/reports/unknown.html',
      'node_modules/private-html/index.html',
      'logs/run.log',
    ];
    for (const name of [...stale, ...preserved]) {
      fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
      fs.writeFileSync(path.join(root, name), name);
    }
    for (let repeat = 0; repeat < 2; repeat++) {
      const result = spawnSync(process.execPath, [require.resolve('./test-report-artifacts.cjs'), 'prepare'], {
        cwd: root,
        encoding: 'utf8',
      });
      assert.equal(result.status, 0, result.stderr);
      for (const name of stale) assert.equal(fs.existsSync(path.join(root, name)), false, name);
      for (const name of preserved) assert.equal(fs.readFileSync(path.join(root, name), 'utf8'), name);
    }
  });
}

test('prepare rejects arbitrary paths and filesystem errors fail closed', (t) => {
  const { spawnSync } = require('node:child_process');
  const root = temporary(t);
  const command = require.resolve('./test-report-artifacts.cjs');
  fs.symlinkSync('functional-output', path.join(root, 'functional-output'));
  for (const args of [['prepare', '../outside'], ['prepare', 'component', 'outside'], ['prepare']]) {
    assert.notEqual(spawnSync(process.execPath, [command, ...args], { cwd: root }).status, 0);
  }
  assert.equal(fs.readlinkSync(path.join(root, 'functional-output')), 'functional-output');
});
