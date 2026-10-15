import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import artifacts from './component-reporting/artifacts.cjs';

const require = createRequire(import.meta.url);
const {
  parseOpalRunnerArgs,
  normalizeBrowser,
  requireInstalledBrowser,
  resolveGenericBrowser,
} = require('@hmcts/opal-frontend-common-cypress');

/** Preserve interruption and test failure ahead of any reporting outcome. Null child status is failure. */
export function exitCodeFor(testCode, reportCode, signal) {
  if (signal === 'SIGINT') return 130;
  if (signal === 'SIGTERM') return 143;
  if (signal) return 1;
  if (!Number.isInteger(testCode) || testCode < 0) return 1;
  return testCode || reportCode || 0;
}

/** Execute without a shell, forward parent termination to the entire POSIX child group, and reap the child.
 * @returns {Promise<{code: number, signal: string|null}>}
 */
export async function execute(command, args, { cwd, env }) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env,
      shell: false,
      detached: process.platform !== 'win32',
      stdio: 'inherit',
    });
    let receivedSignal = null;
    let escalation;
    let spawnError = false;
    function signalGroup(signal) {
      if (!child.pid) return;
      try {
        if (process.platform === 'win32') child.kill(signal);
        else process.kill(-child.pid, signal);
      } catch (error) {
        if (error.code !== 'ESRCH') console.error(error.message);
      }
    }
    function forward(signal) {
      receivedSignal ||= signal;
      signalGroup(signal);
      // The shared runner blocks synchronously. A group kill also covers leaves which ignore termination.
      escalation ??= setTimeout(() => signalGroup('SIGKILL'), 500);
    }
    const interrupt = () => forward('SIGINT');
    const terminate = () => forward('SIGTERM');
    process.on('SIGINT', interrupt);
    process.on('SIGTERM', terminate);
    child.once('error', (error) => {
      spawnError = true;
      console.error(error.message);
    });
    child.once('close', (code, signal) => {
      if (receivedSignal || signal) signalGroup('SIGKILL');
      clearTimeout(escalation);
      process.removeListener('SIGINT', interrupt);
      process.removeListener('SIGTERM', terminate);
      resolve({ code: spawnError || code === null ? 1 : code, signal: receivedSignal || signal });
    });
  });
}

function installedRunner() {
  let directory = path.dirname(require.resolve('@hmcts/opal-frontend-common-cypress'));
  while (directory !== path.dirname(directory)) {
    const metadata = path.join(directory, 'package.json');
    if (fs.existsSync(metadata)) {
      const pkg = JSON.parse(fs.readFileSync(metadata, 'utf8'));
      if (pkg.name === '@hmcts/opal-frontend-common-cypress') {
        const bin = pkg.bin?.['opal-cypress-runner'];
        if (typeof bin !== 'string') throw new Error('Shared Cypress runner bin is missing');
        return path.resolve(directory, bin);
      }
    }
    directory = path.dirname(directory);
  }
  throw new Error('Cannot locate shared Cypress runner package root');
}

function validatePathValue(flag, value, cwd) {
  if (!value || value.startsWith('--')) throw new Error(`Missing component path for ${flag}`);
  for (const target of value.split(',')) {
    const resolved = path.resolve(cwd, target);
    if (resolved !== cwd && !resolved.startsWith(cwd + path.sep)) throw new Error(`Invalid component path for ${flag}`);
  }
}

function validateOption(token, next, cwd) {
  if (token.includes('\0')) throw new Error('Invalid component path or option');
  const [flag, inline] = token.split(/=(.*)/s);
  const value = inline ?? next;
  if (['--e2e', '--testing-type', '--output-dir'].includes(flag)) {
    throw new Error('Component runner cannot target a different suite or output directory');
  }
  if (['--spec', '--config-file', '--project', '--screenshots-folder', '--videos-folder'].includes(flag)) {
    validatePathValue(flag, value, cwd);
  }
  // Output placement belongs to this run; CLI overrides bypass worker isolation.
  if (
    flag === '--config' &&
    /(?:^|,)(?:screenshotsFolder|videosFolder|reporterOptions|specPattern|component|e2e)\s*=/.test(value || '')
  ) {
    throw new Error('Component output and suite paths are owned by the run context');
  }
}

function previewCommand(args) {
  return args
    .map((arg, index) => {
      if (args[index - 1] === '--env') return JSON.stringify('<redacted>');
      if (arg.startsWith('--env=')) return JSON.stringify('--env=<redacted>');
      return JSON.stringify(arg);
    })
    .join(' ');
}

/**
 * @typedef {object} Finalisation
 * @property {number} exitCode
 * @property {'complete'|'incomplete'|'no-tests'} state
 * @property {string[]} diagnostics
 */

/** @returns {Promise<Finalisation>} */
async function defaultFinalise(run, outcome) {
  // Task 4 supplies this module. Import only when a reporting-enabled run has actually completed.
  return require('./component-reporting/finalise.cjs').finaliseComponentRun(run, outcome);
}

/** Run one isolated component suite. Inject execution/finalisation for lifecycle tests.
 * @param {string[]} argv
 * @param {{cwd?: string, env?: object, execute?: typeof execute, finalise?: Function}} dependencies
 * @returns {Promise<number>}
 */
export async function runComponentSuite(
  argv,
  { cwd = process.cwd(), env = process.env, execute: executeRun = execute, finalise = defaultFinalise } = {},
) {
  cwd = fs.realpathSync(cwd);
  const options = parseOpalRunnerArgs(['component', ...argv]);
  const normalized = normalizeBrowser(options.browser);
  // Preserve the shared default and its fallback policy; an explicitly supplied empty browser is invalid.
  if (argv.some((arg) => arg === '--browser' || arg.startsWith('--browser=')) && !normalized) {
    throw new Error('Invalid component browser');
  }
  const browser = normalized ? requireInstalledBrowser(normalized) : resolveGenericBrowser(env.BROWSER_TO_RUN);
  options.passthroughArgs.forEach((token, index, args) => validateOption(token, args[index + 1], cwd));
  const args = [installedRunner(), 'component', '--browser', browser, options.parallel ? '--parallel' : '--serial'];
  if (options.mode) args.push('--mode', options.mode);
  if (options.tags) args.push('--tags');
  args.push(...options.passthroughArgs, '--no-reports', '--no-reset');
  if (options.dryRun) {
    console.log(previewCommand([process.execPath, ...args]));
    return 0;
  }
  const run = artifacts.createRun({
    root: cwd,
    browser,
    retainPrevious: options.reset === false,
    reports: !options.noReports,
  });
  let outcome = { code: 1, signal: null };
  let reportCode = 0;
  try {
    try {
      if (options.parallel) fs.mkdirSync(path.join(cwd, 'cypress/parallel/weights'), { recursive: true });
      outcome = await executeRun(process.execPath, args, {
        cwd,
        env: { ...env, OPAL_COMPONENT_RUN_CONTEXT: run.contextFile },
      });
    } catch (error) {
      console.error(error.message);
    }
    if (run.reports) {
      try {
        const result = await finalise(run, { testExitCode: outcome.code, signal: outcome.signal });
        reportCode = Number.isInteger(result.exitCode) && result.exitCode >= 0 ? result.exitCode : 1;
      } catch (error) {
        console.error(error.message);
        reportCode = 1;
      }
    }
  } finally {
    artifacts.releaseRun(run);
  }
  return exitCodeFor(outcome.code, reportCode, outcome.signal);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  runComponentSuite(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
