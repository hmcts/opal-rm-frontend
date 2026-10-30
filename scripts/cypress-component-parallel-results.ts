import { mkdirSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';

/** Writes Cypress's completed component-spec statistics for the parallel runner. */
export function writeComponentParallelResult(
  projectRoot: string,
  spec: Pick<Cypress.Spec, 'relative'>,
  results: Pick<CypressCommandLine.RunResult, 'error' | 'stats'>,
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
    throw new Error('Invalid or empty native component-spec statistics');
  }

  const directory = path.join(projectRoot, 'runner-results');
  mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, `${file.replace(/\//g, '_')}.json`), JSON.stringify({ ...stats, file }), {
    flag: 'wx',
  });
}
