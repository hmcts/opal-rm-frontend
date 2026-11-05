const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const identity = ({ filePath, title }) => JSON.stringify([filePath, title]);
const isUnit = (unit) => unit && typeof unit.filePath === 'string' && typeof unit.title === 'string';

/** Consume the published JSON CLI so parsing and Jira policy stay in the shared package. */
function readValidatorResult({ cwd = process.cwd(), spawn = spawnSync } = {}) {
  const response = spawn(
    process.platform === 'win32' ? 'corepack.cmd' : 'corepack',
    [
      'yarn',
      'exec',
      'opal-cypress-check-new-tests-jira-metadata',
      '--component-root',
      'cypress/component',
      '--feature-root',
      'cypress/e2e',
      '--json',
    ],
    { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
  );
  if (response.error || response.signal || ![0, 1].includes(response.status)) {
    throw new Error(
      `Shared metadata validator failed: ${response.error?.message || response.signal || response.stderr || response.status}`,
    );
  }
  let result;
  try {
    result = JSON.parse(response.stdout);
  } catch {
    throw new Error(
      `Shared metadata validator returned invalid JSON: ${response.stderr || response.stdout || 'empty output'}`,
    );
  }
  if (
    !Array.isArray(result?.tests) ||
    !Array.isArray(result?.failures) ||
    !result.tests.every(isUnit) ||
    !result.failures.every(isUnit) ||
    response.status !== (result.failures.length ? 1 : 0) ||
    result.failures.some((failure) => !result.tests.some((test) => identity(test) === identity(failure)))
  ) {
    throw new Error('Shared metadata validator returned an inconsistent result');
  }
  return result;
}

/** Exempt only existing failing identities; stale entries must be removed deliberately. */
function applyBaseline(result, baseline) {
  if (!Array.isArray(baseline)) throw new Error('Invalid baseline: expected an array');
  const exempt = new Set();
  for (const entry of baseline) {
    if (!isUnit(entry) || typeof entry.reason !== 'string' || !entry.reason.trim()) {
      throw new Error('Invalid baseline: each identity requires filePath, title and reason');
    }
    const key = identity(entry);
    if (exempt.has(key)) throw new Error(`Duplicate baseline identity: ${key}`);
    const matches = result.tests.filter((test) => identity(test) === key);
    if (matches.length > 1) throw new Error(`Ambiguous baseline identity: ${key}`);
    if (matches.length !== 1 || !result.failures.some((failure) => identity(failure) === key)) {
      throw new Error(`Stale baseline identity: ${key}`);
    }
    exempt.add(key);
  }
  const failures = result.failures.filter((failure) => !exempt.has(identity(failure)));
  return {
    checked: result.tests.length,
    validated: result.tests.length - result.failures.length,
    exempt: exempt.size,
    failures,
  };
}

if (require.main === module) {
  try {
    const baseline = JSON.parse(readFileSync(path.join(__dirname, 'cypress-test-metadata-baseline.json'), 'utf8'));
    const summary = applyBaseline(readValidatorResult(), baseline);
    console.log(
      `Checked ${summary.checked} Cypress metadata units: ${summary.validated} validated, ${summary.exempt} exempt, ${summary.failures.length} failed.`,
    );
    for (const failure of summary.failures) {
      console.error(`${failure.filePath}:${failure.line} ${failure.title} | missing ${failure.missing.join(', ')}`);
    }
    process.exitCode = summary.failures.length ? 1 : 0;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { applyBaseline, readValidatorResult };
