import { randomUUID } from 'node:crypto';
import { appendFileSync, lstatSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { DraftCasefileRecord } from './draft-casefile-record.interface';

const recordKeys = [
  'draftCasefileId',
  'businessUnitId',
  'environment',
  'runId',
  'workerId',
  'scenarioKey',
  'createdAt',
];

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function utcTimestamp(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

function assertOrigin(value: unknown): asserts value is string {
  if (typeof value !== 'string') throw new Error('Invalid cleanup environment');
  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.origin !== value) {
    throw new Error('Invalid cleanup environment');
  }
}

function assertRecord(value: unknown): asserts value is DraftCasefileRecord {
  if (!object(value) || !exactKeys(value, recordKeys)) throw new Error('Invalid cleanup record schema');
  for (const key of ['draftCasefileId', 'businessUnitId']) {
    if (!Number.isSafeInteger(value[key]) || Number(value[key]) <= 0) throw new Error('Invalid cleanup identifier');
  }
  assertOrigin(value['environment']);
  for (const key of ['runId', 'workerId', 'scenarioKey']) {
    if (typeof value[key] !== 'string' || !value[key].trim()) throw new Error('Invalid cleanup ownership metadata');
  }
  if (!utcTimestamp(value['createdAt'])) throw new Error('Invalid cleanup creation timestamp');
}

function assertStatus(value: unknown): void {
  if (value !== null && (!Number.isInteger(value) || Number(value) < 100 || Number(value) > 599)) {
    throw new Error('Invalid cleanup HTTP status');
  }
}

function assertRegularFile(file: string): void {
  if (!lstatSync(file).isFile()) throw new Error(`Cleanup journal is not a regular file: ${file}`);
}

function ownershipKey(record: DraftCasefileRecord): string {
  return JSON.stringify([record.environment, record.businessUnitId, record.draftCasefileId]);
}

function appendEvent(
  file: string,
  record: DraftCasefileRecord,
  kind: 'created' | 'deleted' | 'failed',
  status?: number | null,
): void {
  assertRecord(record);
  if (kind === 'failed') assertStatus(status);
  mkdirSync(dirname(file), { recursive: true });
  if (lstatSync(file, { throwIfNoEntry: false })) assertRegularFile(file);
  const event = { version: 1, kind, record, timestamp: new Date().toISOString() };
  const entry = kind === 'failed' ? { ...event, status } : event;
  appendFileSync(file, JSON.stringify(entry) + '\n', { encoding: 'utf8' });
}

/** Persist observed creation before subsequent assertions; each worker owns its writable file. */
export function recordCreated(file: string, record: DraftCasefileRecord): void {
  appendEvent(file, record, 'created');
}

/** Append successful deletion to the original owning journal. */
export function recordDeleted(file: string, record: DraftCasefileRecord): void {
  appendEvent(file, record, 'deleted');
}

/** Retain pending ownership on failure without storing response bodies. */
export function recordCleanupFailure(file: string, record: DraftCasefileRecord, status: number | null): void {
  appendEvent(file, record, 'failed', status);
}

function parseEvent(line: string): { kind: string; record: DraftCasefileRecord } {
  const event: unknown = JSON.parse(line);
  if (!object(event) || event['version'] !== 1 || !['created', 'deleted', 'failed'].includes(String(event['kind']))) {
    throw new Error('Invalid cleanup event schema');
  }
  const keys = ['version', 'kind', 'record', 'timestamp'];
  if (event['kind'] === 'failed') {
    keys.push('status');
    assertStatus(event['status']);
  }
  if (!exactKeys(event, keys) || !utcTimestamp(event['timestamp'])) throw new Error('Invalid cleanup event metadata');
  assertRecord(event['record']);
  return { kind: String(event['kind']), record: event['record'] };
}

function projectFile(file: string): DraftCasefileRecord[] {
  assertRegularFile(file);
  const lines = readFileSync(file, 'utf8').split('\n');
  if (lines.at(-1) === '') lines.pop();
  const pending = new Map<string, DraftCasefileRecord>();
  lines.forEach((line, index) => {
    try {
      const event = parseEvent(line);
      const key = ownershipKey(event.record);
      if (event.kind === 'created') pending.set(key, event.record);
      if (event.kind === 'deleted') pending.delete(key);
    } catch {
      // Report location only: malformed content can contain sensitive data.
      throw new Error(`Invalid cleanup journal at ${file}:${index + 1}`);
    }
  });
  return [...pending.values()];
}

function projectFiles(files: string[]): { file: string; records: DraftCasefileRecord[] }[] {
  // Finish validation of every journal before exposing any deletion candidates.
  return files.map((file) => ({ file, records: projectFile(file) }));
}

/** Validate all files, then project pending ownership for the exact environment. */
export function readPending(files: string[], environment: string): DraftCasefileRecord[] {
  assertOrigin(environment);
  const pending = new Map<string, DraftCasefileRecord>();
  for (const { records } of projectFiles(files)) {
    for (const record of records) {
      if (record.environment === environment) pending.set(ownershipKey(record), record);
    }
  }
  return [...pending.values()];
}

/** Register Node-only persistence tasks. Recovery must run exclusively, without active suite writers. */
export function installDraftCasefileJournalTasks(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions): void {
  if (!config.baseUrl) throw new Error('Draft Casefile cleanup requires baseUrl');
  const parsedBase = new URL(config.baseUrl);
  if (parsedBase.username || parsedBase.password) throw new Error('Credential-bearing baseUrl is forbidden');
  const environment = parsedBase.origin;
  assertOrigin(environment);
  const runId = randomUUID();
  const workerId = randomUUID();
  const directory = resolve(config.projectRoot, 'cypress/artifacts/draft-casefile-cleanup');
  const workerFile = join(directory, `${workerId}.jsonl`);
  const files = (): string[] => {
    const directoryStat = lstatSync(directory, { throwIfNoEntry: false });
    if (!directoryStat) return [];
    if (!directoryStat.isDirectory()) {
      throw new Error('Cleanup journal directory must be a regular directory');
    }
    return readdirSync(directory)
      .filter((name) => name.endsWith('.jsonl'))
      .sort()
      .map((name) => {
        const file = join(directory, name);
        assertRegularFile(file);
        return file;
      });
  };
  const assertEnvironment = (value: string): void => {
    if (value !== environment) throw new Error('Cleanup environment does not match configured baseUrl');
  };
  const ownerFile = (record: DraftCasefileRecord): string => {
    assertRecord(record);
    assertEnvironment(record.environment);
    const journals = projectFiles(files());
    const owner = journals.find(({ records }) =>
      records.some((pending) => recordKeys.every((key) => Reflect.get(pending, key) === Reflect.get(record, key))),
    );
    if (!owner) throw new Error('No pending ownership record exists for this casefile');
    return owner.file;
  };
  config.env['draftCasefileRunId'] = runId;
  config.env['draftCasefileWorkerId'] = workerId;
  on('task', {
    'draftCasefiles:created': (record: DraftCasefileRecord) => {
      assertEnvironment(record.environment);
      if (record.runId !== runId || record.workerId !== workerId) throw new Error('Creation is from another worker');
      recordCreated(workerFile, record);
      return null;
    },
    'draftCasefiles:deleted': (record: DraftCasefileRecord) => {
      recordDeleted(ownerFile(record), record);
      return null;
    },
    'draftCasefiles:failed': (value: { record: DraftCasefileRecord; status: number | null }) => {
      recordCleanupFailure(ownerFile(value.record), value.record, value.status);
      return null;
    },
    'draftCasefiles:pending': (requestedEnvironment: string) => {
      assertEnvironment(requestedEnvironment);
      return readPending(files(), environment);
    },
  });
}
