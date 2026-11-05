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
