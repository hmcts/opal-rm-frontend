import { mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import * as path from 'node:path';

/** Writes Cypress's completed component-spec statistics for the parallel runner. */
export function writeComponentParallelResult(
  projectRoot: string,
  spec: Pick<Cypress.Spec, 'relative'>,
  results: Pick<CypressCommandLine.RunResult, 'error' | 'stats'> & Partial<Pick<CypressCommandLine.RunResult, 'tests'>>,
): void {
  if (!spec?.relative || !results?.stats || results.error !== null) {
    throw new Error('Missing or failed native component-spec result');
  }

  const file = spec.relative.split(path.sep).join('/');
  if (!file.startsWith('cypress/component/') || file.split('/').includes('..')) {
    throw new Error('Invalid native component-spec identity');
  }

  const { stats } = results;
  const counts = [stats.tests, stats.passes, stats.failures, stats.pending, stats.skipped];
  if (
    counts.some((count) => !Number.isInteger(count) || count < 0) ||
    stats.tests === 0 ||
    stats.tests !== stats.passes + stats.failures + stats.pending + stats.skipped ||
    stats.passes + stats.failures + stats.pending === 0 ||
    typeof stats.duration !== 'number' ||
    !Number.isFinite(stats.duration) ||
    stats.duration < 0
  ) {
    throw new Error(
      `Invalid or empty native component-spec statistics: ${JSON.stringify({
        file,
        stats,
        error: results.error,
        tests: results.tests?.map(({ title, state, attempts }) => ({
          title,
          state,
          attempts: attempts.map((attempt) => attempt.state),
        })),
      })}`,
    );
  }

  const directory = path.join(projectRoot, 'runner-results');
  mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, `${file.replace(/\//g, '_')}.json`), JSON.stringify({ ...stats, file }), {
    flag: 'wx',
  });
}

/** Retains native final worker results separately from the parallel runner's per-spec input. */
export function writeComponentParallelRun(
  projectRoot: string,
  thread: string,
  results: CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult,
): void {
  if (!/^[1-9]\d*$/.test(thread)) throw new Error('Invalid component worker identity');
  const evidence =
    'runs' in results
      ? {
          totalTests: results.totalTests,
          totalPassed: results.totalPassed,
          totalFailed: results.totalFailed,
          totalPending: results.totalPending,
          totalSkipped: results.totalSkipped,
          runs: results.runs.map(({ spec, stats, error, tests }) => ({
            file: spec.relative,
            stats,
            error,
            tests: tests.map(({ title, state, attempts }) => ({
              title,
              state,
              attempts: attempts.map((attempt) => attempt.state),
            })),
          })),
        }
      : { failures: results.failures, message: results.message };
  const directory = path.join(projectRoot, 'functional-output/component/native-results');
  mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, `worker-${thread}-${randomUUID()}.json`), JSON.stringify(evidence), {
    flag: 'wx',
  });
}
