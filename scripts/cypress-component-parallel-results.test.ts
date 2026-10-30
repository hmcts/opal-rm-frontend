import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { test } from 'node:test';
import { writeComponentParallelResult } from './cypress-component-parallel-results';

const spec = { relative: 'cypress/component/example.cy.ts' };
const stats = {
  duration: 123,
  endedAt: '2026-10-30T00:00:00.123Z',
  failures: 1,
  passes: 2,
  pending: 1,
  skipped: 1,
  startedAt: '2026-10-30T00:00:00.000Z',
  suites: 1,
  tests: 5,
};

function withProject(assertions: (projectRoot: string) => void): void {
  const projectRoot = mkdtempSync(path.join(tmpdir(), 'opal-component-result-'));
  try {
    assertions(projectRoot);
  } finally {
    rmSync(projectRoot, { recursive: true, force: true });
  }
}

test('retains native failures, pending, skipped and millisecond duration without changing counts', () => {
  withProject((projectRoot) => {
    writeComponentParallelResult(projectRoot, spec, { error: null, stats });
    const output = path.join(projectRoot, 'runner-results/cypress_component_example.cy.ts.json');
    assert.deepEqual(JSON.parse(readFileSync(output, 'utf8')), { ...stats, file: spec.relative });
  });
});

test('rejects native run errors, empty execution, inconsistent counts and missing or invalid durations', () => {
  withProject((projectRoot) => {
    assert.throws(() => writeComponentParallelResult(projectRoot, spec, { error: 'run failed', stats }));
    for (const override of [
      { tests: 0, passes: 0, failures: 0, pending: 0, skipped: 0 },
      { tests: 6 },
      { failures: -1 },
      { pending: 0.5 },
      { duration: undefined },
      { duration: Number.NaN },
      { duration: -1 },
      { tests: 1, passes: 0, failures: 0, pending: 0, skipped: 1 },
    ]) {
      assert.throws(() =>
        writeComponentParallelResult(projectRoot, spec, { error: null, stats: { ...stats, ...override } }),
      );
    }
  });
});

test('rejects missing, absolute or escaping spec identities', () => {
  withProject((projectRoot) => {
    for (const relative of ['', '/cypress/component/example.cy.ts', 'cypress/component/../example.cy.ts']) {
      assert.throws(() => writeComponentParallelResult(projectRoot, { relative }, { error: null, stats }));
    }
  });
});

test('refuses to overwrite an existing result so stale or duplicate evidence fails visibly', () => {
  withProject((projectRoot) => {
    writeComponentParallelResult(projectRoot, spec, { error: null, stats });
    assert.throws(() => writeComponentParallelResult(projectRoot, spec, { error: null, stats }), /EEXIST/);
    const output = path.join(projectRoot, 'runner-results/cypress_component_example.cy.ts.json');
    assert.deepEqual(JSON.parse(readFileSync(output, 'utf8')), { ...stats, file: spec.relative });
  });
});
