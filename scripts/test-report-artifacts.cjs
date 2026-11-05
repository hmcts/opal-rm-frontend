const fs = require('node:fs');
const path = require('node:path');

function snapshotZephyrReports(sourceRoot, targetRoot) {
  const source = path.resolve(sourceRoot, 'zephyr');
  const target = path.resolve(targetRoot, 'zephyr');
  if (source === target) throw new Error('Source and target snapshots must differ');
  fs.rmSync(target, { recursive: true, force: true });
  const copied = [];
  for (const name of ['cucumber-report.json', 'cypress-report-1.json']) {
    const input = path.join(source, name);
    if (!fs.existsSync(input)) continue;
    fs.mkdirSync(target, { recursive: true });
    fs.copyFileSync(input, path.join(target, name));
    copied.push(name);
  }
  return copied;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function ensureHtmlReport(reportDir, reportFile, title) {
  if (path.basename(reportFile) !== reportFile) throw new Error('Expected one report filename');
  const output = path.join(reportDir, reportFile);
  if (fs.existsSync(output)) return false;
  const hasRaw = [
    reportDir,
    path.dirname(reportDir),
    path.join(path.dirname(reportDir), 'json'),
    path.join(path.dirname(reportDir), 'junit'),
  ].some(
    (dir) =>
      fs.existsSync(dir) &&
      fs
        .readdirSync(dir, { withFileTypes: true })
        .some((entry) => entry.isFile() && /\.(ndjson|xml|json)$/.test(entry.name)),
  );
  if (!hasRaw) return false;
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(
    output,
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${escapeHtml(title)}</title></head><body><h1>${escapeHtml(title)}</h1>
<p>Results are incomplete: the merged HTML report was not generated.</p>
<p>Inspect this build's archived raw results and console log. This page does not indicate a passing test run.</p>
</body></html>\n`,
  );
  return true;
}

module.exports = { snapshotZephyrReports, ensureHtmlReport };
if (require.main === module) {
  const [mode, ...args] = process.argv.slice(2);
  if (mode === 'snapshot' && args.length === 2) snapshotZephyrReports(...args);
  else if (mode === 'fallback' && args.length === 3) ensureHtmlReport(...args);
  else throw new Error('Expected snapshot <sourceRoot> <targetRoot> or fallback <reportDir> <reportFile> <title>');
}
