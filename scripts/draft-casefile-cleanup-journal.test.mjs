import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm, readFile, writeFile, mkdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  recordCreated,
  recordDeleted,
  recordCleanupFailure,
  readPending,
  installDraftCasefileJournalTasks,
} from '../cypress/support/test-data/draft-casefile-cleanup-journal.ts';

const record = {
  draftCasefileId: 123,
  businessUnitId: 44,
  environment: 'http://localhost:5000',
  runId: 'run-1',
  workerId: 'worker-1',
  scenarioKey: 'CheckCaseDetails.feature/live submission',
  createdAt: '2026-10-19T10:00:00.000Z',
};
async function fixture(run) {
  const directory = await mkdtemp(join(tmpdir(), 'casefile-journal-'));
  try {
    await run(directory, join(directory, 'worker.jsonl'));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
function tasks(directory, baseUrl = record.environment) {
  const config = { projectRoot: directory, baseUrl, env: {} };
  let registered;
  installDraftCasefileJournalTasks((event, handlers) => {
    assert.equal(event, 'task');
    registered = handlers;
  }, config);
  return {
    handlers: registered,
    own: { ...record, runId: config.env.draftCasefileRunId, workerId: config.env.draftCasefileWorkerId },
  };
}

test('failed cleanup remains pending and a successful retry resolves it', () =>
  fixture(async (_, file) => {
    recordCreated(file, record);
    recordCreated(file, record);
    recordCleanupFailure(file, record, 404);
    assert.deepEqual(readPending([file], record.environment), [record]);
    assert.deepEqual(readPending([file], 'https://other.invalid'), []);
    recordDeleted(file, record);
    assert.deepEqual(readPending([file], record.environment), []);
  }));

test('rejects invalid IDs, origins, metadata and status before writing', () =>
  fixture(async (_, file) => {
    for (const key of ['draftCasefileId', 'businessUnitId']) {
      for (const value of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '123']) {
        assert.throws(() => recordCreated(file, { ...record, [key]: value }));
      }
    }
    for (const environment of [
      'http://user:pass@localhost:5000',
      'http://localhost:5000/path',
      'invalid',
      'file:///tmp',
    ]) {
      assert.throws(() => recordCreated(file, { ...record, environment }));
    }
    for (const patch of [
      { runId: '' },
      { workerId: 1 },
      { scenarioKey: '' },
      { createdAt: 'yesterday' },
      { body: 'forbidden' },
    ]) {
      assert.throws(() => recordCreated(file, { ...record, ...patch }));
    }
    for (const status of ['404', 1.5, 99, 600, undefined])
      assert.throws(() => recordCleanupFailure(file, record, status));
    await assert.rejects(readFile(file), { code: 'ENOENT' });
  }));

test('projects business units and workers independently', () =>
  fixture(async (directory, file) => {
    const secondFile = join(directory, 'second.jsonl');
    const other = { ...record, businessUnitId: 45, workerId: 'worker-2' };
    recordCreated(file, record);
    recordCreated(secondFile, other);
    assert.deepEqual(readPending([file, secondFile], record.environment), [record, other]);
    recordCleanupFailure(secondFile, other, null);
    recordDeleted(file, record);
    assert.deepEqual(readPending([file, secondFile], record.environment), [other]);
    const events = (await readFile(secondFile, 'utf8')).trim().split('\n').map(JSON.parse);
    assert.equal(events[1].status, null);
    assert.equal(events[0].version, 1);
    assert.match(events[0].timestamp, /^\d{4}-.*Z$/);
  }));

test('validates every line and every file before returning candidates without leaking contents', () =>
  fixture(async (directory, file) => {
    recordCreated(file, record);
    const corrupt = join(directory, 'later.jsonl');
    const original = await readFile(file, 'utf8');
    for (const bad of [
      '{"secret":"SENSITIVE"',
      JSON.stringify({ ...JSON.parse(original), version: 2 }),
      JSON.stringify({ ...JSON.parse(original), payload: 'SENSITIVE' }),
      JSON.stringify({ ...JSON.parse(original), kind: 'unknown' }),
      JSON.stringify({ ...JSON.parse(original), timestamp: 'invalid' }),
      JSON.stringify({ ...JSON.parse(original), record: { ...record, draftCasefileId: 0 } }),
      JSON.stringify({ ...JSON.parse(original), kind: 'failed', status: '404' }),
    ]) {
      await writeFile(corrupt, original + bad + '\n');
      assert.throws(
        () => readPending([file, corrupt], record.environment),
        (error) => error.message.includes(`${corrupt}:2`) && !error.message.includes('SENSITIVE'),
      );
      assert.equal(await readFile(file, 'utf8'), original);
    }
  }));

test('task registration rejects wrong environments, workers, foreign IDs and forged ownership', () =>
  fixture(async (directory) => {
    const { handlers, own } = tasks(directory);
    assert.deepEqual(Object.keys(handlers).sort(), [
      'draftCasefiles:created',
      'draftCasefiles:deleted',
      'draftCasefiles:failed',
      'draftCasefiles:pending',
    ]);
    assert.throws(() => tasks(directory, null));
    assert.throws(() => tasks(directory, 'http://user:pass@localhost:5000'));
    assert.throws(() => handlers['draftCasefiles:created'](record));
    assert.throws(() => handlers['draftCasefiles:created']({ ...own, environment: 'https://other.invalid' }));
    assert.throws(() => handlers['draftCasefiles:pending']('https://other.invalid'));
    assert.equal(handlers['draftCasefiles:created'](own), null);
    assert.throws(() => handlers['draftCasefiles:deleted']({ ...own, draftCasefileId: 999 }));
    assert.throws(() => handlers['draftCasefiles:deleted']({ ...own, workerId: 'forged' }));
    assert.equal(handlers['draftCasefiles:failed']({ record: own, status: 404 }), null);
    assert.deepEqual(handlers['draftCasefiles:pending'](record.environment), [own]);
    assert.equal(handlers['draftCasefiles:deleted'](own), null);
    assert.deepEqual(handlers['draftCasefiles:pending'](record.environment), []);
  }));

test('recovery resolves the original file and validates later corrupt files before mutation', () =>
  fixture(async (directory) => {
    const first = tasks(directory);
    const second = tasks(directory);
    first.handlers['draftCasefiles:created'](first.own);
    const journalDirectory = join(directory, 'cypress/artifacts/draft-casefile-cleanup');
    const corrupt = join(journalDirectory, 'zz-corrupt.jsonl');
    await writeFile(corrupt, 'truncated');
    assert.throws(() => second.handlers['draftCasefiles:pending'](record.environment));
    assert.throws(() => second.handlers['draftCasefiles:deleted'](first.own));
    assert.throws(() => second.handlers['draftCasefiles:failed']({ record: first.own, status: 404 }));
    await rm(corrupt);
    assert.equal(second.handlers['draftCasefiles:deleted'](first.own), null);
    const originalFile = join(journalDirectory, `${first.own.workerId}.jsonl`);
    assert.equal((await readFile(originalFile, 'utf8')).trim().split('\n').length, 2);
    await assert.rejects(readFile(join(journalDirectory, `${second.own.workerId}.jsonl`)), { code: 'ENOENT' });
  }));

test('rejects symlinks and non-regular journal files during discovery and direct reads', () =>
  fixture(async (directory, file) => {
    recordCreated(file, record);
    const { handlers } = tasks(directory);
    const journalDirectory = join(directory, 'cypress/artifacts/draft-casefile-cleanup');
    await mkdir(journalDirectory, { recursive: true });
    const link = join(journalDirectory, 'link.jsonl');
    await symlink(file, link);
    assert.throws(() => handlers['draftCasefiles:pending'](record.environment));
    assert.throws(() => readPending([link], record.environment));
    await rm(link);
    await mkdir(link);
    assert.throws(() => handlers['draftCasefiles:pending'](record.environment));
  }));

test('journals survive ordinary runner output resets', () =>
  fixture(async (directory) => {
    const { handlers, own } = tasks(directory);
    handlers['draftCasefiles:created'](own);
    for (const name of ['functional-output', 'smoke-output']) {
      await mkdir(join(directory, name));
    }
    const reset = spawnSync(
      process.execPath,
      [fileURLToPath(new URL('../scripts/reset-test-outputs.ts', import.meta.url))],
      { cwd: directory, encoding: 'utf8' },
    );
    assert.equal(reset.status, 0, reset.stderr);
    for (const name of ['functional-output', 'smoke-output'])
      await assert.rejects(readFile(join(directory, name)), { code: 'ENOENT' });
    assert.deepEqual(handlers['draftCasefiles:pending'](record.environment), [own]);
  }));

test('rejects dangling journal links before append and linked journal directories', () =>
  fixture(async (directory, file) => {
    await symlink(join(directory, 'missing'), file);
    assert.throws(() => recordCreated(file, record));
    const journalDirectory = join(directory, 'cypress/artifacts/draft-casefile-cleanup');
    await mkdir(join(directory, 'cypress/artifacts'), { recursive: true });
    await symlink(join(directory, 'missing-directory'), journalDirectory);
    const { handlers } = tasks(directory);
    assert.throws(() => handlers['draftCasefiles:pending'](record.environment));
  }));
