const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRun, readRun, workerPaths, publishFile, releaseRun } = require('./artifacts.cjs');

function temporary(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'opal-component-artifacts-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
function write(root, relative, content = 'keep bytes\n') {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return file;
}
function start(root, options = {}) {
  return createRun({ root, browser: 'chrome', retainPrevious: false, reports: true, ...options });
}

test('component preparation preserves E2E bytes and excludes old component data', (t) => {
  const root = temporary(t);
  const keep = [
    'smoke-output/keep.txt',
    'functional-output/prod/keep.txt',
    'functional-output/zephyr/cucumber-report.json',
  ];
  keep.forEach((file) => write(root, file));
  write(root, 'functional-output/component/chrome/json/old.json', '{"old":true}');
  write(root, 'functional-output/component/chrome/html/component-report.html');
  write(root, 'functional-output/zephyr/cypress-report-1.json');
  const run = start(root);
  assert.deepEqual(readRun(run.contextFile), run);
  keep.forEach((file) => assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), 'keep bytes\n'));
  assert.equal(fs.existsSync(path.join(run.publishDir, 'json/old.json')), false);
  assert.equal(fs.existsSync(path.join(run.publishDir, 'html/component-report.html')), false);
  assert.equal(fs.existsSync(path.join(root, 'functional-output/zephyr/cypress-report-1.json')), false);
  assert.deepEqual(fs.readdirSync(run.runDir), ['context.json']);
  releaseRun(run);
});

test('retention preserves prior runs while reset removes owned runs only', (t) => {
  const root = temporary(t);
  const first = start(root);
  releaseRun(first);
  const second = start(root, { retainPrevious: true });
  releaseRun(second);
  assert.ok(fs.existsSync(first.runDir));
  const unknown = write(root, 'functional-output/component/chrome/runs/unowned/keep.txt');
  const third = start(root);
  releaseRun(third);
  assert.equal(fs.existsSync(first.runDir), false);
  assert.equal(fs.existsSync(second.runDir), false);
  assert.ok(fs.existsSync(unknown));
});

test('component-wide publication lock refuses a live owner across browsers and verifies release ownership', (t) => {
  const root = temporary(t);
  const first = start(root);
  assert.throws(() => start(root, { browser: 'edge' }), /lock|owner/i);
  assert.throws(() => releaseRun({ ...first, id: '00000000-0000-4000-8000-000000000000' }), /context|owner|path/i);
  assert.throws(() => start(root), /lock|owner/i);
  releaseRun(first);
  const next = start(root, { browser: 'edge' });
  releaseRun(next);
});

test('stale owner recovers only after process absence; corrupt lock fails closed', (t) => {
  const root = temporary(t);
  const first = start(root);
  const lock = path.join(root, 'functional-output/component/.publication.lock');
  fs.writeFileSync(lock, JSON.stringify({ version: 1, pid: 2147483647, id: first.id }));
  const next = start(root);
  releaseRun(next);
  fs.writeFileSync(lock, '{}');
  assert.throws(() => start(root), /lock|owner/i);
});

test('worker IDs cannot escape the run; files publish atomically', (t) => {
  const root = temporary(t);
  const run = start(root);
  for (const id of ['../outside', '', 'a/b', 'a.b']) assert.throws(() => workerPaths(run, id), /worker ID/);
  const paths = workerPaths(run, '1-123');
  for (const directory of Object.values(paths)) {
    assert.ok(directory.startsWith(run.runDir + path.sep));
    assert.ok(fs.statSync(directory).isDirectory());
  }
  const source = write(root, 'source.json', '{"current":true}');
  const destination = write(root, 'published/current.json', 'old');
  publishFile(source, destination);
  assert.equal(fs.readFileSync(destination, 'utf8'), '{"current":true}');
  assert.deepEqual(fs.readdirSync(path.dirname(destination)), ['current.json']);
  releaseRun(run);
});

test('untrusted contexts, traversal, versions, and symlink escapes fail before deletion', (t) => {
  const root = temporary(t);
  const outside = temporary(t);
  const keep = write(outside, 'keep.txt');
  assert.throws(() => start(root, { browser: '../outside' }), /browser/i);
  fs.mkdirSync(path.join(root, 'functional-output'), { recursive: true });
  fs.symlinkSync(outside, path.join(root, 'functional-output/component'));
  assert.throws(() => start(root), /path|contain|symbolic/i);
  assert.ok(fs.existsSync(keep));
  fs.unlinkSync(path.join(root, 'functional-output/component'));
  const run = start(root);
  for (const changes of [
    { version: 2 },
    { root: outside },
    { runDir: outside },
    { reports: 'yes' },
    { contextFile: keep },
  ]) {
    const copy = { ...run, ...changes };
    fs.writeFileSync(run.contextFile, JSON.stringify(copy));
    assert.throws(() => readRun(run.contextFile), /context|version|path|contain/i);
  }
  fs.writeFileSync(run.contextFile, JSON.stringify(run));
  releaseRun(run);
});

test('invalid option types and dangling symlinks cannot mutate outputs', (t) => {
  const root = temporary(t);
  for (const options of [{ root: '.' }, { reports: 'yes' }, { retainPrevious: 1 }]) {
    assert.throws(() => start(root, options), /context options/);
  }
  fs.mkdirSync(path.join(root, 'functional-output'), { recursive: true });
  fs.symlinkSync(path.join(root, 'missing'), path.join(root, 'functional-output/component'));
  assert.throws(() => start(root), /symbolic link/);
  assert.equal(fs.existsSync(path.join(root, 'missing')), false);
});

test('failed context publication releases its lock and a later run can start', (t) => {
  const root = temporary(t);
  const rename = fs.renameSync;
  const stub = t.mock.method(fs, 'renameSync', (source, destination) => {
    if (destination.endsWith('/context.json')) throw new Error('context write fixture');
    return rename(source, destination);
  });
  assert.throws(() => start(root), /context write fixture/);
  assert.equal(fs.existsSync(path.join(root, 'functional-output/component/.publication.lock')), false);
  stub.mock.restore();
  const run = start(root);
  const lock = path.join(root, 'functional-output/component/.publication.lock');
  const owner = fs.readFileSync(lock, 'utf8');
  fs.writeFileSync(lock, JSON.stringify({ version: 1, pid: process.pid, id: '00000000-0000-4000-8000-000000000000' }));
  assert.throws(() => releaseRun(run), /lock owner/);
  fs.writeFileSync(lock, owner);
  releaseRun(run);
});

test('corrupt locks fail closed and publication errors preserve the existing view', (t) => {
  const root = temporary(t);
  const lock = write(root, 'functional-output/component/.publication.lock', '{');
  assert.throws(() => start(root), /Invalid component lock owner/);
  assert.equal(fs.readFileSync(lock, 'utf8'), '{');
  const destination = write(root, 'published/current.json', 'previous');
  assert.throws(() => publishFile(path.join(root, 'missing.json'), destination), /ENOENT/);
  assert.equal(fs.readFileSync(destination, 'utf8'), 'previous');
  assert.deepEqual(fs.readdirSync(path.dirname(destination)), ['current.json']);
  assert.throws(() => readRun('relative.json'), /context path/);
});
