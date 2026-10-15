const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

/**
 * @typedef {object} RunContext
 * @property {1} version
 * @property {string} id
 * @property {string} browser
 * @property {string} root Canonical absolute repository path.
 * @property {string} runDir
 * @property {string} contextFile
 * @property {string} publishDir
 * @property {boolean} reports
 */

const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const browsers = new Set(['chrome', 'edge', 'firefox']);

// Resolve existing ancestors too: checking only the lexical prefix permits symlink escapes.
function containedPath(root, target) {
  if (!path.isAbsolute(target) || !target.startsWith(root + path.sep)) {
    throw new Error('Component path must remain contained in the repository');
  }
  let ancestor = target;
  const suffix = [];
  while (!fs.existsSync(ancestor)) {
    // A dangling symlink must not become a future escape route.
    if (fs.lstatSync(ancestor, { throwIfNoEntry: false })?.isSymbolicLink()) {
      throw new Error('Component path contains a symbolic link');
    }
    suffix.unshift(path.basename(ancestor));
    ancestor = path.dirname(ancestor);
  }
  if (path.join(fs.realpathSync(ancestor), ...suffix) !== target) {
    throw new Error('Component path contains a symbolic link');
  }
  return target;
}

function publicationLock(root) {
  return containedPath(root, path.join(root, 'functional-output/component/.publication.lock'));
}

function readOwner(lock) {
  let owner;
  try {
    owner = JSON.parse(fs.readFileSync(lock, 'utf8'));
  } catch {
    throw new Error('Invalid component lock owner');
  }
  if (owner.version !== 1 || !Number.isInteger(owner.pid) || owner.pid < 1 || !uuidPattern.test(owner.id)) {
    throw new Error('Invalid component lock owner');
  }
  return owner;
}

function absent(pid) {
  try {
    process.kill(pid, 0);
    return false;
  } catch (error) {
    if (error.code === 'ESRCH') return true;
    // EPERM is evidence of an existing process, not permission to steal its lock.
    if (error.code === 'EPERM') return false;
    throw error;
  }
}

function acquireLock(run) {
  const lock = publicationLock(run.root);
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  const owner = JSON.stringify({ version: 1, pid: process.pid, id: run.id });
  try {
    fs.writeFileSync(lock, owner, { flag: 'wx' });
    return;
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
  // Serialize stale recovery so two parents cannot both remove the replacement lock.
  const recovery = containedPath(run.root, lock + '.recovery');
  let descriptor;
  try {
    descriptor = fs.openSync(recovery, 'wx');
    const previous = readOwner(lock);
    if (!absent(previous.pid)) throw new Error('Component publication lock has a live owner');
    fs.unlinkSync(lock);
    fs.writeFileSync(lock, owner, { flag: 'wx' });
  } finally {
    if (descriptor !== undefined) {
      fs.closeSync(descriptor);
      fs.unlinkSync(recovery);
    }
  }
}

function validateContext(run, contextFile) {
  if (!run || run.version !== 1) throw new Error('Unsupported component run context version');
  if (
    typeof run.root !== 'string' ||
    !path.isAbsolute(run.root) ||
    fs.realpathSync(run.root) !== run.root ||
    !browsers.has(run.browser) ||
    !uuidPattern.test(run.id) ||
    typeof run.reports !== 'boolean'
  ) {
    throw new Error('Invalid component run context');
  }
  const publishDir = path.join(run.root, 'functional-output/component', run.browser);
  const runDir = path.join(publishDir, 'runs', run.id);
  if (
    run.publishDir !== publishDir ||
    run.runDir !== runDir ||
    run.contextFile !== path.join(runDir, 'context.json') ||
    contextFile !== run.contextFile
  )
    throw new Error('Invalid component run context path');
  for (const target of [publishDir, runDir, contextFile]) containedPath(run.root, target);
  return run;
}

function validatedRun(run) {
  const stored = readRun(run.contextFile);
  for (const key of ['version', 'id', 'root', 'browser', 'runDir', 'contextFile', 'publishDir', 'reports']) {
    if (run[key] !== stored[key]) throw new Error('Component run context does not match its owner');
  }
  return stored;
}

function removePreviousRuns(root, browser, runsDir) {
  if (!fs.existsSync(runsDir)) return;
  for (const entry of fs.readdirSync(runsDir)) {
    if (!uuidPattern.test(entry)) continue;
    const previousDir = containedPath(root, path.join(runsDir, entry));
    let previous;
    try {
      previous = readRun(path.join(previousDir, 'context.json'));
    } catch {
      continue;
    }
    if (previous.root === root && previous.browser === browser)
      fs.rmSync(previousDir, { recursive: true, force: true });
  }
}

/** Create a component-only run and acquire the cross-browser publication lock.
 * @param {{root: string, browser: string, retainPrevious: boolean, reports: boolean}} options
 * @returns {RunContext}
 */
function createRun({ root, browser, retainPrevious = false, reports = true }) {
  if (!browsers.has(browser)) throw new Error('Invalid component browser');
  if (
    typeof root !== 'string' ||
    !path.isAbsolute(root) ||
    typeof reports !== 'boolean' ||
    typeof retainPrevious !== 'boolean'
  )
    throw new Error('Invalid component run context options');
  root = fs.realpathSync(root);
  const id = randomUUID();
  const publishDir = containedPath(root, path.join(root, 'functional-output/component', browser));
  const runsDir = containedPath(root, path.join(publishDir, 'runs'));
  const runDir = path.join(runsDir, id);
  const run = {
    version: 1,
    id,
    browser,
    root,
    runDir,
    contextFile: path.join(runDir, 'context.json'),
    publishDir,
    reports,
  };
  const publications = ['html', 'json', 'junit', 'screenshots', 'mochawesome.json', 'mochawesome.html'].map((name) =>
    containedPath(root, path.join(publishDir, name)),
  );
  publications.push(containedPath(root, path.join(root, 'functional-output/zephyr/cypress-report-1.json')));
  acquireLock(run);
  try {
    if (!retainPrevious) removePreviousRuns(root, browser, runsDir);
    for (const publication of publications) fs.rmSync(publication, { recursive: true, force: true });
    fs.mkdirSync(runDir, { recursive: true });
    const temporary = path.join(runDir, '.context.tmp');
    fs.writeFileSync(temporary, JSON.stringify(run, null, 2), { flag: 'wx' });
    fs.renameSync(temporary, run.contextFile);
    return run;
  } catch (error) {
    const owner = readOwner(publicationLock(root));
    if (owner.pid === process.pid && owner.id === id) fs.unlinkSync(publicationLock(root));
    throw error;
  }
}

/** Validate a persisted context before using any environment-supplied paths.
 * @param {string} contextFile
 * @returns {RunContext}
 */
function readRun(contextFile) {
  if (typeof contextFile !== 'string' || !path.isAbsolute(contextFile))
    throw new Error('Invalid component context path');
  return validateContext(JSON.parse(fs.readFileSync(contextFile, 'utf8')), contextFile);
}

/** Allocate all reporter directories below one validated current-run worker ID.
 * @param {RunContext} run
 * @param {string} workerId
 * @returns {{workerDir: string, mochaDir: string, junitDir: string, zephyrDir: string, screenshotsDir: string}}
 */
function workerPaths(run, workerId) {
  if (typeof workerId !== 'string' || !/^[A-Za-z0-9_-]+$/.test(workerId))
    throw new Error('Invalid component worker ID');
  validatedRun(run);
  const workerDir = containedPath(run.root, path.join(run.runDir, 'workers', workerId));
  const paths = {
    workerDir,
    mochaDir: path.join(workerDir, 'mocha'),
    junitDir: path.join(workerDir, 'junit'),
    zephyrDir: path.join(workerDir, 'zephyr'),
    screenshotsDir: path.join(workerDir, 'screenshots'),
  };
  for (const directory of Object.values(paths)) {
    containedPath(run.root, directory);
    fs.mkdirSync(directory, { recursive: true });
  }
  return paths;
}

/** Publish an already verified input by atomic replacement in its destination directory.
 * @param {string} source
 * @param {string} destination
 */
function publishFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const temporary = path.join(path.dirname(destination), `.${path.basename(destination)}.${randomUUID()}.tmp`);
  try {
    fs.copyFileSync(source, temporary, fs.constants.COPYFILE_EXCL);
    fs.renameSync(temporary, destination);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}

/** Release only this parent process's publication lock; retain diagnostic run files.
 * @param {RunContext} run
 */
function releaseRun(run) {
  validatedRun(run);
  const lock = publicationLock(run.root);
  const owner = readOwner(lock);
  if (owner.pid !== process.pid || owner.id !== run.id) throw new Error('Component lock owner does not match this run');
  fs.unlinkSync(lock);
}

module.exports = { createRun, readRun, workerPaths, publishFile, releaseRun };
